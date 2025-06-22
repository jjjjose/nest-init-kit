import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common'
import { Observable, throwError } from 'rxjs'
import { tap, catchError } from 'rxjs/operators'
import { Request, Response } from 'express'
import { randomUUID } from 'crypto'
import { RequestLogService } from '../services'

/**
 * Request Logging Interceptor
 * Interceptor de Logging de Requests
 *
 * Captures all HTTP requests and responses with unique ID tracking
 * Captura todas las peticiones y respuestas HTTP con seguimiento de ID único
 *
 * Features / Características:
 * - Unique request ID generation / Generación de ID único de request
 * - Request/Response timing / Temporización de Request/Response
 * - Success/Error status tracking / Seguimiento de estado exitoso/error
 * - Optional database persistence / Persistencia opcional en base de datos
 */
@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestLoggingInterceptor.name)

  constructor(private readonly requestLogService: RequestLogService) {}

  /**
   * Intercepts HTTP requests and logs them with unique tracking
   * Intercepta peticiones HTTP y las registra con seguimiento único
   *
   * @param context - Execution context / Contexto de ejecución
   * @param next - Call handler for next interceptor / Manejador de llamada para siguiente interceptor
   * @returns Observable with request logging / Observable con logging de request
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const now = Date.now()

    const ctx = context.switchToHttp()
    const request = ctx.getRequest<Request>()
    const response = ctx.getResponse<Response>()

    // Get or create request ID / Obtener o crear ID de request
    let requestId = (request as unknown as { requestId?: string }).requestId
    if (!requestId) {
      requestId = randomUUID()
      ;(request as unknown as { requestId: string }).requestId = requestId
    }

    // Add request ID to response headers / Agregar ID de request a headers de respuesta
    response.setHeader('X-Request-ID', requestId)

    // Log incoming request / Registrar request entrante
    this.logger.log(`[${requestId}] → ${request.method} ${request.url} | IP: ${request.ip || 'unknown'}`)

    // Save initial request log / Guardar log inicial del request
    this.requestLogService.logRequest({
      requestId,
      method: request.method,
      url: request.url,
      userAgent: request.get('user-agent') || 'unknown',
      ip: request.ip || 'unknown',
      timestamp: new Date(),
      headers: this.sanitizeHeaders(request.headers),
      body: this.sanitizeBody(request.body),
    })

    return next.handle().pipe(
      tap((responseData) => {
        const duration = Date.now() - now
        const statusCode = response.statusCode

        // Log successful response / Registrar respuesta exitosa
        this.logger.log(
          `[${requestId}] ← ${request.method} ${request.url} | Status: ${statusCode} | Duration: ${duration}ms`,
        )

        // Mark request as handled by interceptor / Marcar request como manejado por interceptor
        ;(request as unknown as { wasHandledByInterceptor: boolean }).wasHandledByInterceptor = true

        // Update request log with success data / Actualizar log de request con datos de éxito
        this.requestLogService.updateRequestLog(requestId, {
          statusCode,
          duration,
          success: true,
          responseSize: this.calculateResponseSize(responseData),
          responseBody: responseData,
          completedAt: new Date(),
        })
      }),
      catchError((error: unknown) => {
        const duration = Date.now() - now

        // Type guard to safely access error properties / Guarda de tipo para acceder de forma segura a propiedades del error
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        const statusCode =
          (error as { status?: number; statusCode?: number }).status ||
          (error as { status?: number; statusCode?: number }).statusCode ||
          500

        // Set response status code if not already set / Establecer código de estado de respuesta si no está ya establecido
        if (response.statusCode === 200) {
          response.status(statusCode)
        }

        // Log error response / Registrar respuesta de error
        this.logger.error(
          `[${requestId}] ✖ ${request.method} ${request.url} | Status: ${statusCode} | Duration: ${duration}ms | Error: ${errorMessage}`,
        )

        // Mark request as handled by interceptor / Marcar request como manejado por interceptor
        ;(request as unknown as { wasHandledByInterceptor: boolean }).wasHandledByInterceptor = true

        // Build response body that will be sent to client / Construir cuerpo de respuesta que se enviará al cliente
        const responseBody = {
          statusCode,
          timestamp: new Date().toISOString(),
          path: request.url,
          error: error instanceof Error ? error.message : 'Unknown error',
          requestId,
        }

        // Update request log with error data / Actualizar log de request con datos de error
        this.requestLogService.updateRequestLog(requestId, {
          statusCode,
          duration,
          success: false,
          responseBody,
          error: {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            name: error instanceof Error ? error.name : 'Unknown',
          },
          completedAt: new Date(),
        })

        // Re-throw error using RxJS throwError to maintain reactive stream / Re-lanzar error usando throwError de RxJS para mantener el flujo reactivo
        return throwError(() => error)
      }),
    )
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

  /**
   * Calculate approximate response size
   * Calcular tamaño aproximado de respuesta
   *
   * @param responseData - Response data / Datos de respuesta
   * @returns Response size in bytes / Tamaño de respuesta en bytes
   */
  private calculateResponseSize(responseData: unknown): number {
    try {
      return JSON.stringify(responseData).length
    } catch {
      return 0
    }
  }
}
