import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common'
import { Observable, throwError } from 'rxjs'
import { tap, catchError } from 'rxjs/operators'
import { Request, Response } from 'express'
import { randomUUID } from 'crypto'
import { RequestLogService } from '../services'
import { LOGGING_CONFIG } from '../constants'

/**
 * Request Logging Interceptor
 * Interceptor de Logging de Requests
 *
 * ARCHITECTURE ROLE / ROL EN LA ARQUITECTURA:
 * Core logging component that handles 99% of request/response cycles
 * Componente central de logging que maneja el 99% de ciclos request/response
 *
 * EXECUTION FLOW / FLUJO DE EJECUCIÓN:
 * Middleware → Interceptor (this) → Controller → Response → Interceptor → Filter (fallback)
 * Middleware → Interceptor (este) → Controller → Response → Interceptor → Filter (respaldo)
 *
 * RESPONSIBILITIES / RESPONSABILIDADES:
 * - Complete request/response lifecycle tracking / Seguimiento completo del ciclo de vida request/response
 * - Success/Error differentiation and logging / Diferenciación y logging de éxito/error
 * - Integration with configurable body saving / Integración con guardado configurable de cuerpo
 * - Single point of truth for completed requests / Punto único de verdad para requests completados
 *
 * CONFIGURATION INTEGRATION / INTEGRACIÓN DE CONFIGURACIÓN:
 * Uses LOGGING_CONFIG constants for conditional body saving based on success/error status
 * Usa constantes LOGGING_CONFIG para guardado condicional de cuerpo basado en estado éxito/error
 *
 * ERROR HANDLING / MANEJO DE ERRORES:
 * - Catches and logs application errors (400-499) / Captura y registra errores de aplicación (400-499)
 * - Gracefully handles unexpected errors / Maneja graciosamente errores inesperados
 * - Marks requests as handled to prevent duplicate logging / Marca requests como manejados para prevenir logging duplicado
 */
@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestLoggingInterceptor.name)

  constructor(private readonly requestLogService: RequestLogService) {}

  /**
   * Main interception logic - handles complete request/response logging cycle
   * Lógica principal de intercepción - maneja el ciclo completo de logging request/response
   *
   * @param context - Execution context with access to request/response / Contexto de ejecución con acceso a request/response
   * @param next - Call handler for next interceptor / Manejador de llamada para siguiente interceptor
   * @returns Observable with complete request logging / Observable con logging completo de request
   *
   * PROCESS / PROCESO:
   * 1. Extract metadata from middleware / Extraer metadata del middleware
   * 2. Execute request and wait for completion / Ejecutar request y esperar completación
   * 3. Handle success case with configurable logging / Manejar caso exitoso con logging configurable
   * 4. Handle error case with comprehensive logging / Manejar caso error con logging comprehensivo
   * 5. Mark request as handled to prevent filter duplication / Marcar request como manejado para prevenir duplicación de filtro
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp()
    const request = ctx.getRequest<Request>()
    const response = ctx.getResponse<Response>()

    // Get request metadata from middleware / Obtener metadata del request desde middleware
    const requestId = (request as unknown as { requestId: string }).requestId
    const startTime = (request as unknown as { startTime: number }).startTime || Date.now()

    // Ensure request ID is set (fallback safety) / Asegurar que el ID de request esté establecido (seguridad de respaldo)
    if (!requestId) {
      const fallbackId = randomUUID()
      ;(request as unknown as { requestId: string }).requestId = fallbackId
      response.setHeader('X-Request-ID', fallbackId)
      this.logger.warn(`Request ID not found, generated fallback: ${fallbackId}`)
    }

    return next.handle().pipe(
      tap((responseData) => {
        // Calculate final metrics / Calcular métricas finales
        const duration = Date.now() - startTime
        const statusCode = response.statusCode

        // Log successful completion / Registrar finalización exitosa
        this.logger.log(
          `[${requestId}] ← ${request.method} ${request.url} | Status: ${statusCode} | Duration: ${duration}ms`,
        )

        // Mark as handled by interceptor to prevent filter duplication / Marcar como manejado por interceptor para prevenir duplicación de filtro
        ;(request as unknown as { wasHandledByInterceptor: boolean }).wasHandledByInterceptor = true

        // SINGLE POINT OF SUCCESS LOGGING - Complete request/response cycle
        // PUNTO ÚNICO DE LOGGING EXITOSO - Ciclo completo de request/response
        this.saveCompleteRequestLog(request, {
          requestId,
          statusCode,
          duration,
          success: true,
          responseSize: this.calculateResponseSize(responseData),
          responseBody: responseData,
        })
      }),
      catchError((error: unknown) => {
        // Calculate error metrics / Calcular métricas de error
        const duration = Date.now() - startTime
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        const statusCode =
          (error as { status?: number; statusCode?: number }).status ||
          (error as { status?: number; statusCode?: number }).statusCode ||
          500

        // Set response status code if not already set / Establecer código de estado de respuesta si no está ya establecido
        if (response.statusCode === 200) {
          response.status(statusCode)
        }

        // Log error completion / Registrar finalización con error
        this.logger.error(
          `[${requestId}] ✖ ${request.method} ${request.url} | Status: ${statusCode} | Duration: ${duration}ms | Error: ${errorMessage}`,
        )

        // Mark as handled by interceptor to prevent filter duplication / Marcar como manejado por interceptor para prevenir duplicación de filtro
        ;(request as unknown as { wasHandledByInterceptor: boolean }).wasHandledByInterceptor = true

        // Build standardized error response body / Construir cuerpo de respuesta de error estandarizado
        const responseBody = {
          statusCode,
          timestamp: new Date().toISOString(),
          path: request.url,
          error: errorMessage,
          requestId,
        }

        // SINGLE POINT OF ERROR LOGGING - Complete request/error cycle
        // PUNTO ÚNICO DE LOGGING DE ERROR - Ciclo completo de request/error
        this.saveCompleteRequestLog(request, {
          requestId,
          statusCode,
          duration,
          success: false,
          responseBody,
          error: {
            message: errorMessage,
            stack: error instanceof Error ? error.stack : undefined,
            name: error instanceof Error ? error.name : 'Unknown',
          },
        })

        // Re-throw error to maintain reactive stream / Re-lanzar error para mantener flujo reactivo
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
   *
   * SECURITY / SEGURIDAD:
   * Removes authentication tokens, API keys, and session cookies
   * Remueve tokens de autenticación, claves API y cookies de sesión
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
   *
   * SECURITY / SEGURIDAD:
   * Replaces sensitive fields (passwords, tokens, secrets) with [REDACTED]
   * Reemplaza campos sensibles (contraseñas, tokens, secretos) con [REDACTED]
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
   * CORE LOGGING METHOD - Orchestrates complete request logging with configuration
   * MÉTODO CENTRAL DE LOGGING - Orquesta logging completo de request con configuración
   *
   * @param request - Express request object / Objeto request de Express
   * @param logData - Complete log data with success/error information / Datos completos de log con información éxito/error
   *
   * CONFIGURATION LOGIC / LÓGICA DE CONFIGURACIÓN:
   * - Success requests: Uses SAVE_SUCCESS_REQUEST_BODY + SAVE_SUCCESS_RESPONSE_BODY
   * - Error requests: Uses SAVE_ERROR_REQUEST_BODY + SAVE_ERROR_RESPONSE_BODY
   * - Requests exitosos: Usa SAVE_SUCCESS_REQUEST_BODY + SAVE_SUCCESS_RESPONSE_BODY
   * - Requests error: Usa SAVE_ERROR_REQUEST_BODY + SAVE_ERROR_RESPONSE_BODY
   */
  private saveCompleteRequestLog(
    request: Request,
    logData: {
      requestId: string
      statusCode: number
      duration: number
      success: boolean
      responseSize?: number
      responseBody?: unknown
      error?: {
        message: string
        stack?: string
        name: string
      }
    },
  ): void {
    try {
      // Determine what to save based on configuration and success status
      // Determinar qué guardar basado en configuración y estado de éxito
      const saveRequestBody = logData.success
        ? LOGGING_CONFIG.SAVE_SUCCESS_REQUEST_BODY
        : LOGGING_CONFIG.SAVE_ERROR_REQUEST_BODY

      const saveResponseBody = logData.success
        ? LOGGING_CONFIG.SAVE_SUCCESS_RESPONSE_BODY
        : LOGGING_CONFIG.SAVE_ERROR_RESPONSE_BODY

      // Create initial log entry with sanitized data / Crear entrada inicial de log con datos saneados
      this.requestLogService.logRequest({
        requestId: logData.requestId,
        method: request.method,
        url: request.url,
        userAgent: request.get('user-agent') || 'unknown',
        ip: request.ip || 'unknown',
        timestamp: new Date(),
        headers: this.sanitizeHeaders(request.headers as Record<string, unknown>),
        body: saveRequestBody ? this.sanitizeBody(request.body) : undefined,
      })

      // Update with final response data / Actualizar con datos finales de respuesta
      this.requestLogService.updateRequestLog(logData.requestId, {
        statusCode: logData.statusCode,
        duration: logData.duration,
        success: logData.success,
        responseSize: logData.responseSize || 0,
        responseBody: saveResponseBody ? logData.responseBody : undefined,
        error: logData.error,
        completedAt: new Date(),
      })
    } catch (error) {
      // Avoid logging errors that could cause infinite loops / Evitar errores de logging que podrían causar bucles infinitos
      this.logger.warn(`Failed to save request log: ${String(error)}`)
    }
  }

  /**
   * Calculate approximate response size for metrics
   * Calcular tamaño aproximado de respuesta para métricas
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
