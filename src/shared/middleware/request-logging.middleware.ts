import { Injectable, NestMiddleware, Logger } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { randomUUID } from 'crypto'
import { RequestLogService } from '../services'

/**
 * Request Logging Middleware
 * Middleware de Logging de Requests
 *
 * Captures ALL HTTP requests at the Express level, before routing
 * Captura TODAS las peticiones HTTP a nivel de Express, antes del routing
 *
 * This middleware runs BEFORE interceptors and catches 404 errors
 * Este middleware se ejecuta ANTES que los interceptors y captura errores 404
 */
@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestLoggingMiddleware.name)

  constructor(private readonly requestLogService: RequestLogService) {}

  /**
   * Middleware function that logs all incoming requests
   * Función middleware que registra todas las peticiones entrantes
   *
   * @param req - Express request object / Objeto request de Express
   * @param res - Express response object / Objeto response de Express
   * @param next - Next function / Función next
   */
  use(req: Request, res: Response, next: NextFunction): void {
    const now = Date.now()
    const requestId = randomUUID()

    // Add request ID to request for later use / Agregar ID de request para uso posterior
    ;(req as unknown as { requestId: string }).requestId = requestId

    // Add request ID to response headers / Agregar ID de request a headers de respuesta
    res.setHeader('X-Request-ID', requestId)

    // Log incoming request / Registrar request entrante
    this.logger.log(`[${requestId}] → ${req.method} ${req.url} | IP: ${req.ip || 'unknown'}`)

    // Save initial request log / Guardar log inicial del request
    this.requestLogService.logRequest({
      requestId,
      method: req.method,
      url: req.url,
      userAgent: req.get('user-agent') || 'unknown',
      ip: req.ip || 'unknown',
      timestamp: new Date(),
      headers: this.sanitizeHeaders(req.headers),
      body: this.sanitizeBody(req.body),
    })

    // Store original end function / Almacenar función end original
    const originalEnd = res.end.bind(res) as typeof res.end

    // Override res.end to capture response / Sobrescribir res.end para capturar respuesta
    res.end = (chunk?: unknown, encoding?: BufferEncoding | (() => void), cb?: () => void): Response => {
      const duration = Date.now() - now
      const statusCode = res.statusCode

      // Check if this error was already handled by interceptor / Verificar si el error ya fue manejado por interceptor
      const wasHandledByInterceptor = (req as unknown as { wasHandledByInterceptor?: boolean }).wasHandledByInterceptor

      if (statusCode >= 400 && !wasHandledByInterceptor) {
        // Log error response / Registrar respuesta de error
        this.logger.error(
          `[${requestId}] ✖ ${req.method} ${req.url} | Status: ${statusCode} | Duration: ${duration}ms`,
        )

        // Build response body for 404/routing errors / Construir cuerpo de respuesta para errores 404/routing
        const responseBody = {
          statusCode,
          timestamp: new Date().toISOString(),
          path: req.url,
          error: statusCode === 404 ? `Cannot ${req.method} ${req.url}` : `HTTP ${statusCode} Error`,
          requestId,
        }

        // Update request log with error data / Actualizar log de request con datos de error
        this.requestLogService.updateRequestLog(requestId, {
          statusCode,
          duration,
          success: false,
          responseBody,
          error: {
            message: `HTTP ${statusCode} Error`,
            name: 'HttpError',
          },
          completedAt: new Date(),
        })
      } else if (statusCode < 400 && !wasHandledByInterceptor) {
        // Log successful response / Registrar respuesta exitosa
        this.logger.log(`[${requestId}] ← ${req.method} ${req.url} | Status: ${statusCode} | Duration: ${duration}ms`)

        // Update request log with success data / Actualizar log de request con datos de éxito
        this.requestLogService.updateRequestLog(requestId, {
          statusCode,
          duration,
          success: true,
          responseSize: chunk ? JSON.stringify(chunk).length : 0,
          responseBody: chunk,
          completedAt: new Date(),
        })
      }

      // Call original end function / Llamar función end original
      return originalEnd(chunk, encoding as BufferEncoding, cb)
    }

    next()
  }

  /**
   * Sanitize headers to remove sensitive information
   * Sanear headers para remover información sensible
   *
   * @param headers - Request headers / Headers del request
   * @returns Sanitized headers / Headers saneados
   */
  private sanitizeHeaders(headers: Record<string, unknown>): Record<string, unknown> {
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token']
    const sanitized = { ...headers }

    sensitiveHeaders.forEach((header) => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]'
      }
    })

    return sanitized
  }

  /**
   * Sanitize request body to remove sensitive information
   * Sanear cuerpo del request para remover información sensible
   *
   * @param body - Request body / Cuerpo del request
   * @returns Sanitized body / Cuerpo saneado
   */
  private sanitizeBody(body: unknown): unknown {
    if (!body || typeof body !== 'object') {
      return body
    }

    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth']
    const sanitized = { ...body } as Record<string, unknown>

    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]'
      }
    })

    return sanitized
  }
}
