import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
  BadRequestException,
  ConflictException,
  ServiceUnavailableException,
  InternalServerErrorException,
} from '@nestjs/common'
import { Response, Request } from 'express'
import { randomUUID } from 'crypto'
import { RequestLogService } from '../services/request-log.service'
import { LOGGING_CONFIG } from '../constants'

/**
 * Global Exception Filter
 * Filtro Global de Excepciones
 *
 * ARCHITECTURE ROLE / ROL EN LA ARQUITECTURA:
 * Fallback logging component for requests not handled by interceptor (mainly 404s and routing errors)
 * Componente de logging de respaldo para requests no manejados por interceptor (principalmente 404s y errores de routing)
 *
 * EXECUTION FLOW / FLUJO DE EJECUCIÓN:
 * Middleware → Interceptor → Controller → [Exception occurs] → Filter (this)
 * Middleware → Interceptor → Controller → [Excepción ocurre] → Filter (este)
 *
 * RESPONSIBILITIES / RESPONSABILIDADES:
 * - Handle routing errors (404 Not Found) / Manejar errores de routing (404 No Encontrado)
 * - Catch unhandled exceptions not processed by interceptor / Capturar excepciones no manejadas no procesadas por interceptor
 * - Standardize error response format / Estandarizar formato de respuesta de error
 * - Database error categorization / Categorización de errores de base de datos
 * - Production vs Development error exposure / Exposición de errores en Producción vs Desarrollo
 *
 * DUPLICATE PREVENTION / PREVENCIÓN DE DUPLICADOS:
 * Checks 'wasHandledByInterceptor' flag to prevent logging requests already processed
 * Verifica flag 'wasHandledByInterceptor' para prevenir logging de requests ya procesados
 *
 * IGNORED PATHS / RUTAS IGNORADAS:
 * Skips logging for common browser requests (favicon.ico, robots.txt, etc.)
 * Omite logging para requests comunes del navegador (favicon.ico, robots.txt, etc.)
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name)

  constructor(private readonly requestLogService: RequestLogService) {}

  // Paths to ignore in logging for common browser/dev tool requests
  // Rutas a ignorar en el logging para requests comunes del navegador/herramientas dev
  private readonly ignoredPaths = [
    '/favicon.ico',
    '/.well-known/appspecific/com.chrome.devtools.json',
    '/apple-touch-icon.png',
    '/robots.txt',
  ]

  /**
   * Main exception handling method / Método principal de manejo de excepciones
   *
   * @param exception - The thrown exception / La excepción lanzada
   * @param host - Execution context host / Host del contexto de ejecución
   *
   * Response format / Formato de respuesta:
   * ```json
   * {
   *   "statusCode": number,
   *   "timestamp": string,
   *   "path": string,
   *   "error": string | object
   * }
   * ```
   */
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()
    const isProd = process.env.NODE_ENV === 'production'

    // Get request ID if available, generate one if not / Obtener ID de request si está disponible, generar uno si no
    let requestId =
      (request as unknown as { requestId?: string }).requestId ||
      (request.headers['x-request-id'] as string) ||
      (request.headers['X-Request-ID'] as string)

    // If no requestId found, generate a new one / Si no se encuentra requestId, generar uno nuevo
    if (!requestId) {
      requestId = randomUUID()
      // Store it in the request for consistency / Almacenarlo en el request para consistencia
      ;(request as unknown as { requestId: string }).requestId = requestId
    }

    const finalException = this.processException(exception, isProd)
    const status = finalException.getStatus()
    const exceptionResponse = finalException.getResponse()

    // Extract error message, avoiding duplication / Extraer mensaje de error, evitando duplicación
    const errorMessage =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as Record<string, unknown>).message || exceptionResponse

    // Log error with request ID, but skip common browser requests
    // Registrar error con ID de request, pero omitir requests comunes del navegador
    const shouldLogError = !this.shouldIgnorePath(request.url, status)

    if (shouldLogError) {
      this.logger.error(
        `[${requestId}] ${request.method} ${request.url} | Status: ${status}`,
        finalException.stack || String(exception),
      )
    }

    // Add request ID to response headers / Agregar ID de request a headers de respuesta
    response.setHeader('X-Request-ID', requestId)

    // Check if interceptor handled the logging / Verificar si el interceptor manejó el logging
    const wasHandledByInterceptor = (request as unknown as { wasHandledByInterceptor?: boolean })
      .wasHandledByInterceptor

    // Handle ALL errors not captured by interceptor (401, 403, 404, 500, etc.)
    // Manejar TODOS los errores no capturados por interceptor (401, 403, 404, 500, etc.)
    if (!wasHandledByInterceptor && shouldLogError) {
      try {
        // Log any error that was not captured by interceptor
        // Registrar cualquier error que no fue capturado por interceptor
        this.logger.error(
          `[${requestId}] ✖ ${request.method} ${request.url} | Status: ${status} | Error not handled by interceptor`,
        )

        // FALLBACK LOGGING - For ALL errors not handled by interceptor (401, 403, 404, 500, etc.)
        // LOGGING DE RESPALDO - Para TODOS los errores no manejados por interceptor (401, 403, 404, 500, etc.)
        this.requestLogService.logRequest({
          requestId,
          method: request.method,
          url: request.url,
          userAgent: request.get('user-agent') || 'unknown',
          ip: request.ip || 'unknown',
          timestamp: new Date(),
          headers: this.sanitizeHeaders(request.headers as Record<string, unknown>),
          body: LOGGING_CONFIG.SAVE_ERROR_REQUEST_BODY ? this.sanitizeBody(request.body) : undefined,
        })

        // Prepare response body based on configuration / Preparar response body basado en configuración
        const responseBodyToSave = LOGGING_CONFIG.SAVE_ERROR_RESPONSE_BODY
          ? {
              statusCode: status,
              timestamp: new Date().toISOString(),
              path: request.url,
              error: errorMessage,
              requestId,
            }
          : undefined

        // Update with error information / Actualizar con información de error
        this.requestLogService.updateRequestLog(requestId, {
          statusCode: status,
          duration: 0, // We don't have duration info in filter / No tenemos info de duración en filtro
          success: false,
          responseBody: responseBodyToSave,
          error: {
            message: typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage),
            stack: finalException.stack,
            name: finalException.name,
          },
          completedAt: new Date(),
        })
      } catch (logError) {
        // Ignore logging errors to avoid infinite loops / Ignorar errores de logging para evitar bucles infinitos
        this.logger.warn(`Failed to log error ${requestId}: ${String(logError)}`)
      }
    } else if (wasHandledByInterceptor) {
      // Log for debugging: interceptor already handled it
      // Log para debugging: interceptor ya lo manejó
      this.logger.debug(`Request ${requestId} handled by interceptor, filter only provides response`)
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error: errorMessage,
      requestId,
    })
  }

  /**
   * Process and categorize exceptions into appropriate HTTP exceptions
   * Procesar y categorizar excepciones en excepciones HTTP apropiadas
   *
   * @param error - The exception to process / La excepción a procesar
   * @param isProd - Production environment flag / Bandera de entorno de producción
   * @returns Processed HttpException / HttpException procesada
   *
   * Processing order / Orden de procesamiento:
   * 1. HttpException (pass-through) / HttpException (paso directo)
   * 2. String errors → InternalServerErrorException
   * 3. Error instances → Database/Common error handling
   * 4. Unknown types → ServiceUnavailableException
   */
  private processException(error: unknown, isProd: boolean): HttpException {
    // If already HttpException, return it directly / Si ya es HttpException, devolverla directamente
    if (error instanceof HttpException) {
      return error
    }

    // Handle string errors / Manejar errores de string
    if (typeof error === 'string') {
      return new InternalServerErrorException(error)
    }

    // Handle common errors (Error) / Manejar errores comunes (Error)
    if (error instanceof Error) {
      return this.handleCommonError(error, isProd)
    }

    // Fallback for any other type / Fallback para cualquier otro tipo
    const errorMessage = this.getErrorMessage(error)
    return new ServiceUnavailableException(`Unexpected error: ${errorMessage}`)
  }

  /**
   * Handle common Error instances, including database errors
   * Manejar instancias de Error comunes, incluyendo errores de base de datos
   *
   * @param error - Error instance to handle / Instancia de Error a manejar
   * @param isProd - Production environment flag / Bandera de entorno de producción
   * @returns Appropriate HttpException / HttpException apropiada
   *
   * Database error detection / Detección de errores de base de datos:
   * - "duplicate"/"unique" → ConflictException (409)
   * - "foreign key" → BadRequestException (400)
   * - Other errors → InternalServerErrorException (500)
   */
  private handleCommonError(error: Error, isProd: boolean): HttpException {
    const message = error.message.toLowerCase()

    // Errores de base de datos
    if (message.includes('duplicate') || message.includes('unique')) {
      return new ConflictException('Duplicate record')
    }

    if (message.includes('foreign key')) {
      return new BadRequestException('Invalid relation')
    }

    // Errores inesperados
    if (isProd) {
      return new InternalServerErrorException('Internal server error')
    }

    return new InternalServerErrorException({
      message: error.message,
      stack: error.stack,
    })
  }

  /**
   * Check if a path should be ignored from error logging
   * Verificar si una ruta debe ser ignorada del logging de errores
   *
   * @param path - Request path to check / Ruta de request a verificar
   * @param status - HTTP status code / Código de estado HTTP
   * @returns true if should ignore, false otherwise / true si debe ignorar, false en caso contrario
   */
  private shouldIgnorePath(path: string, status: number): boolean {
    // Only ignore 404 errors for specific paths / Solo ignorar errores 404 para rutas específicas
    if (status !== 404) return false

    return this.ignoredPaths.some((ignoredPath) => path === ignoredPath)
  }

  /**
   * Safely extract error message from unknown error types
   * Extraer de forma segura el mensaje de error de tipos de error desconocidos
   *
   * @param error - Unknown error to extract message from / Error desconocido del cual extraer mensaje
   * @returns Error message string / Cadena del mensaje de error
   *
   * Extraction priority / Prioridad de extracción:
   * 1. String type (direct return) / Tipo string (retorno directo)
   * 2. Error instance message / Mensaje de instancia Error
   * 3. JSON.stringify attempt / Intento de JSON.stringify
   * 4. String conversion fallback / Conversión a string como respaldo
   */
  private getErrorMessage(error: unknown): string {
    if (typeof error === 'string') return error
    if (error instanceof Error) return error.message

    try {
      return JSON.stringify(error)
    } catch {
      return String(error)
    }
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
