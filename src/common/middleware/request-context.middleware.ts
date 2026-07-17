import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

const SAFE_REQUEST_ID = /^[A-Za-z0-9._:-]{1,128}$/;

/** Adds a safe correlation identifier to every request and response. */
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(request: Request, response: Response, next: NextFunction): void {
    const suppliedId = request.header('x-request-id');
    request.requestId = suppliedId && SAFE_REQUEST_ID.test(suppliedId) ? suppliedId : randomUUID();
    response.setHeader('X-Request-Id', request.requestId);
    next();
  }
}
