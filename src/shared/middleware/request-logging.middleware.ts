import { Injectable, NestMiddleware, Logger } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { randomUUID } from 'crypto'

/**
 * Request Logging Middleware
 * Middleware de Logging de Requests
 *
 * PURPOSE / PROPÓSITO:
 * First component in the logging chain - generates UUID and basic metadata
 * Primer componente en la cadena de logging - genera UUID y metadata básica
 *
 * EXECUTION ORDER / ORDEN DE EJECUCIÓN:
 * 1. Middleware (this) → 2. Interceptor → 3. Filter (fallback)
 * 1. Middleware (este) → 2. Interceptor → 3. Filter (respaldo)
 *
 * RESPONSIBILITIES / RESPONSABILIDADES:
 * - Generate unique request UUID / Generar UUID único de request
 * - Store start time for duration calculation / Almacenar tiempo de inicio para cálculo de duración
 * - Basic request logging / Logging básico de request
 * - Set response headers / Establecer headers de respuesta
 *
 * NOTE / NOTA:
 * This middleware captures ALL requests, including 404s that bypass routing
 * Este middleware captura TODAS las peticiones, incluidos 404s que evitan el routing
 */
@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestLoggingMiddleware.name)

  /**
   * Main middleware execution - UUID generation and basic setup
   * Ejecución principal del middleware - generación de UUID y configuración básica
   *
   * @param req - Express request object / Objeto request de Express
   * @param res - Express response object / Objeto response de Express
   * @param next - Next function / Función next
   *
   * PROCESS / PROCESO:
   * 1. Generate unique request ID / Generar ID único de request
   * 2. Store metadata for interceptor use / Almacenar metadata para uso del interceptor
   * 3. Set response headers / Establecer headers de respuesta
   * 4. Log request initiation / Registrar inicio de request
   */
  use(req: Request, res: Response, next: NextFunction): void {
    // Generate unique request ID for tracking throughout the request lifecycle
    // Generar ID único de request para seguimiento durante todo el ciclo de vida del request
    const requestId = randomUUID()

    // Store request metadata for later use by interceptor and filter
    // Almacenar metadata del request para uso posterior por interceptor y filtro
    ;(req as unknown as { requestId: string }).requestId = requestId
    ;(req as unknown as { startTime: number }).startTime = Date.now()

    // Add request ID to response headers for client tracking
    // Agregar ID de request a headers de respuesta para seguimiento del cliente
    res.setHeader('X-Request-ID', requestId)

    // Log request initiation with basic information
    // Registrar inicio de request con información básica
    this.logger.log(`[${requestId}] → ${req.method} ${req.url} | IP: ${req.ip || 'unknown'}`)

    next()
  }
}
