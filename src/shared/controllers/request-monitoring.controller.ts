import { Controller, Get, Param, Query } from '@nestjs/common'
import { RequestLogService } from '../services/request-log.service'
import { ApiJwtAuth } from '../decorators'

/**
 * Request Monitoring Controller
 * Controlador de Monitoreo de Requests
 *
 * Provides endpoints to monitor and view request logs with CSV search capabilities
 * Proporciona endpoints para monitorear y ver logs de requests con capacidades de búsqueda CSV
 *
 * Features / Características:
 * - Request statistics / Estadísticas de requests
 * - Individual request lookup in memory and CSV / Búsqueda de requests individuales en memoria y CSV
 * - All requests view (limited) / Vista de todos los requests (limitada)
 * - CSV file search by request ID / Búsqueda en archivos CSV por ID de request
 */

@ApiJwtAuth()
@Controller('monitoring')
export class RequestMonitoringController {
  constructor(private readonly requestLogService: RequestLogService) {}

  /**
   * Get comprehensive request statistics including CSV files
   * Obtener estadísticas comprehensivas de requests incluyendo archivos CSV
   */
  @Get('stats')
  getStatistics() {
    return this.requestLogService.getStatistics()
  }

  /**
   * Get memory status and health information
   * Obtener estado de memoria e información de salud
   */
  @Get('memory')
  getMemoryStatus() {
    return this.requestLogService.getMemoryStatus()
  }

  /**
   * Search for specific request log by ID in memory and CSV files
   * Buscar log específico de request por ID en memoria y archivos CSV
   */
  @Get('search/:requestId')
  async searchRequestLog(@Param('requestId') requestId: string) {
    return this.requestLogService.searchRequestById(requestId)
  }

  /**
   * Get specific request log by ID (memory only)
   * Obtener log específico de request por ID (solo memoria)
   */

  @Get('request/:requestId')
  getRequestLog(@Param('requestId') requestId: string) {
    return this.requestLogService.getRequestLog(requestId)
  }

  /**
   * Get all request logs from memory with pagination
   * Obtener todos los logs de requests de memoria con paginación
   */

  @Get('requests')
  getAllRequestLogs(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 50
    const parsedOffset = offset ? parseInt(offset, 10) : 0
    return this.requestLogService.getAllRequestLogs(parsedLimit, parsedOffset)
  }

  /**
   * Clear all request logs from memory
   * Limpiar todos los logs de requests de memoria
   */
  @Get('clear')
  clearLogs() {
    return this.requestLogService.clearLogs()
  }

  /**
   * Get information about CSV log files
   * Obtener información sobre archivos de log CSV
   */
  @Get('csv/info')
  getCsvInfo() {
    return this.requestLogService.getCsvInfo()
  }
}
