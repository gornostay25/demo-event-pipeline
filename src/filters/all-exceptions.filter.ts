import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Determine if this is an HTTP or RPC context
    const isHttpException = exception instanceof HttpException;
    const isRpcException = exception instanceof RpcException;

    let status: number;
    let message: string;
    let errorDetails: any;

    if (isHttpException) {
      // Handle HTTP exceptions
      const httpException = exception;
      status = httpException.getStatus();
      const exceptionResponse = httpException.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || 'HTTP Error';
        errorDetails = exceptionResponse;
      } else {
        message = 'HTTP Error';
      }
    } else if (isRpcException) {
      // Handle RPC exceptions (NATS message processing)
      const rpcException = exception;
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = rpcException.message || 'RPC Error';
      errorDetails = { error: rpcException.stack };
    } else if (exception instanceof Error) {
      // Handle generic errors
      const error = exception;
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = error.message || 'Internal Server Error';
      errorDetails = { stack: error.stack };
    } else {
      // Handle unknown error types
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Unknown Error';
      errorDetails = { error: exception };
    }

    // Log the error with context
    const timestamp = new Date().toISOString();
    const errorLog = {
      timestamp,
      method: request?.method,
      url: request?.url,
      status,
      message,
      error:
        exception instanceof Error
          ? exception.stack
          : JSON.stringify(exception),
    };

    this.logger.error(`Exception caught: ${message}`, JSON.stringify(errorLog));

    // For HTTP requests, send JSON response
    if (response) {
      response.status(status).json({
        statusCode: status,
        message,
        timestamp,
        path: request?.url,
        ...(process.env.NODE_ENV === 'development' && {
          stack: exception instanceof Error ? exception.stack : undefined,
        }),
      });
    }

    // For RPC errors, let NATS handle redelivery by not swallowing the error
    // The error will be propagated to the NATS client
    throw exception;
  }
}
