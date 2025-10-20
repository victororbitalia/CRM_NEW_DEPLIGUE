import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { logger } from '@/lib/logging';

export function withLogging(request: NextRequest) {
  const requestId = randomUUID();
  const start = Date.now();
  
  // Create a logger with request context
  const requestLogger = logger.withRequest(requestId);
  
  // Log request
  requestLogger.info('Incoming request', {
    method: request.method,
    url: request.url,
    userAgent: request.headers.get('user-agent'),
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
  });
  
  // Return a wrapper for NextResponse.json to log responses
  const logResponse = (body: any, init?: ResponseInit) => {
    const duration = Date.now() - start;
    const status = init?.status || 200;
    
    // Log response
    if (status >= 400) {
      requestLogger.error('Request failed', {
        status,
        duration,
        response: body,
      });
    } else {
      requestLogger.info('Request completed', {
        status,
        duration,
      });
    }
    
    return NextResponse.json(body, init);
  };
  
  return { requestId, requestLogger, logResponse };
}