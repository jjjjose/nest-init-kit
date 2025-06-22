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

    const finalException = this.processException(exception, isProd)
    const status = finalException.getStatus()
    const message = finalException.getResponse()

    // Log error
    this.logger.error(
      `[${request.method}] ${request.url} | Status: ${status}`,
      finalException.stack || String(exception),
    )

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error: message,
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
