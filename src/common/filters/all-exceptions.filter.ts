import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    if (status >= 500) {
      const error = exception instanceof Error ? exception : new Error('Unknown non-Error exception');
      this.logger.error(
        `${request.method} ${request.originalUrl} failed [requestId=${request.requestId ?? 'missing'}]`,
        error.stack,
      );
    }

    response.status(status).json({
      success: false,
      message: this.getPublicMessage(exception, status),
      statusCode: status,
      requestId: request.requestId,
      timestamp: new Date().toISOString(),
    });
  }

  private getPublicMessage(exception: unknown, status: number): string {
    if (!(exception instanceof HttpException)) return 'Error interno del servidor.';
    const payload = exception.getResponse();
    if (typeof payload === 'string') return payload;
    if (!payload || typeof payload !== 'object' || !('message' in payload)) {
      return status >= 500 ? 'Error interno del servidor.' : 'La solicitud no pudo ser procesada.';
    }
    const message = (payload as { message?: string | string[] }).message;
    return Array.isArray(message) ? message.join(', ') : message || 'La solicitud no pudo ser procesada.';
  }
}
