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

/**
 * Global exception filter that catches all unhandled exceptions
 * Filtro global de excepciones que captura todas las excepciones no manejadas
 *
 * Features / Características:
 * - Standardized error responses / Respuestas de error estandarizadas
 * - Database error detection / Detección de errores de base de datos
 * - Development/Production mode handling / Manejo de modo desarrollo/producción
 * - Comprehensive logging / Logging completo
 *
 * @decorator @Catch() - Catches all exceptions / Captura todas las excepciones
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name)

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

    // Get request ID if available / Obtener ID de request si está disponible
    const requestId = (request as unknown as { requestId?: string }).requestId || 'unknown'

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
}
