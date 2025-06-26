import { Injectable, Logger } from '@nestjs/common'
import { CsvLoggerService } from './csv-logger.service'

/**
 * Request Log Data Interface
 * Interfaz de datos de log de request
 */
export interface RequestLogData {
  requestId: string
  method: string
  url: string
  userAgent: string
  ip: string
  timestamp: Date
  headers: Record<string, unknown>
  body?: unknown
}

/**
 * Request Log Update Interface
 * Interfaz de actualización de log de request
 */
export interface RequestLogUpdate {
  statusCode: number
  duration: number
  success: boolean
  responseSize?: number
  responseBody?: unknown
  completedAt: Date
  error?: {
    message: string
    stack?: string
    name: string
  }
}

/**
 * Complete Request Log Interface
 * Interfaz completa de log de request
 */
export interface RequestLog extends RequestLogData, Partial<RequestLogUpdate> {}

/**
 * Request Log Service
 * Servicio de Log de Requests
 *
 * ARCHITECTURE / ARQUITECTURA:
 * Central logging orchestrator that manages request lifecycle tracking
 * Orquestador central de logging que maneja el seguimiento del ciclo de vida de requests
 *
 * COMPONENTS INTEGRATION / INTEGRACIÓN DE COMPONENTES:
 * - Used by: Interceptor (99% of requests) + Filter (404 fallbacks)
 * - Usado por: Interceptor (99% de requests) + Filter (respaldo 404)
 * - Uses: CsvLoggerService for file persistence / Usa: CsvLoggerService para persistencia de archivos
 * - Monitoring: RequestMonitoringController for API access / Monitoreo: RequestMonitoringController para acceso API
 *
 * FEATURES / CARACTERÍSTICAS:
 * - In-memory request tracking with automatic cleanup / Seguimiento de requests en memoria con limpieza automática
 * - Dual CSV persistence (success/error files) / Persistencia dual CSV (archivos éxito/error)
 * - Historical data loading on startup / Carga de datos históricos al arrancar
 * - Memory management with configurable limits / Gestión de memoria con límites configurables
 * - Comprehensive search capabilities / Capacidades de búsqueda comprehensivas
 *
 * MEMORY MANAGEMENT / GESTIÓN DE MEMORIA:
 * - Automatic cleanup at 5000+ logs / Limpieza automática con 5000+ logs
 * - LRU-style removal (keeps newest) / Eliminación estilo LRU (mantiene los más nuevos)
 * - Historical loading from CSV files / Carga histórica desde archivos CSV
 */
@Injectable()
export class RequestLogService {
  private readonly logger = new Logger(RequestLogService.name)
  private readonly requestLogs = new Map<string, RequestLog>()
  private readonly maxStoredLogs = 5000 // Maximum number of request logs stored in memory / Número máximo de logs de requests almacenados en memoria

  constructor(private readonly csvLogger: CsvLoggerService) {
    // Load historical logs on startup / Cargar logs históricos al arrancar
    void this.loadHistoricalLogs()
  }

  /**
   * Log initial request data
   * Registrar datos iniciales del request
   *
   * @param data - Request log data / Datos de log del request
   */
  logRequest(data: RequestLogData): void {
    // Store in memory / Almacenar en memoria
    this.requestLogs.set(data.requestId, { ...data })

    // Clean up old logs if limit exceeded / Limpiar logs antiguos si se excede el límite
    if (this.requestLogs.size > this.maxStoredLogs) {
      this.cleanupOldLogs()
    }

    // Log basic request info / Registrar información básica del request
    this.logger.debug(`Request logged: ${data.method} ${data.url} [${data.requestId}]`)
  }

  /**
   * Update request log with completion data and persist to CSV
   * Actualizar log de request con datos de completación y persistir en CSV
   *
   * @param requestId - Request ID / ID del request
   * @param updateData - Update data / Datos de actualización
   */
  updateRequestLog(requestId: string, updateData: RequestLogUpdate): void {
    const existingLog = this.requestLogs.get(requestId)

    if (!existingLog) {
      this.logger.warn(`Request log not found for ID: ${requestId}`)
      return
    }

    // Update the log / Actualizar el log
    const updatedLog: RequestLog = {
      ...existingLog,
      ...updateData,
    }

    this.requestLogs.set(requestId, updatedLog)

    // Check if cleanup is needed periodically / Verificar si se necesita limpieza periódicamente
    if (this.requestLogs.size > this.maxStoredLogs * 1.1) {
      // 10% buffer before cleanup
      this.cleanupOldLogs()
    }

    // Log completion / Registrar completación
    const status = updateData.success ? 'SUCCESS' : 'ERROR'
    this.logger.debug(
      `Request completed: ${existingLog.method} ${existingLog.url} [${requestId}] - ${status} (${updateData.duration}ms)`,
    )

    // Persist to CSV based on success/error / Persistir en CSV basado en éxito/error
    if (updateData.success) {
      this.csvLogger.logSuccess({
        requestId,
        timestamp: existingLog.timestamp,
        method: existingLog.method,
        url: existingLog.url,
        statusCode: updateData.statusCode,
        duration: updateData.duration,
        ip: existingLog.ip,
        userAgent: existingLog.userAgent,
        responseSize: updateData.responseSize,
        requestBody: existingLog.body,
        responseBody: updateData.responseBody,
      })
    } else {
      // For errors, save COMPLETE details / Para errores, guardar detalles COMPLETOS
      this.csvLogger.logError({
        requestId,
        timestamp: existingLog.timestamp,
        method: existingLog.method,
        url: existingLog.url,
        statusCode: updateData.statusCode,
        duration: updateData.duration,
        ip: existingLog.ip,
        userAgent: existingLog.userAgent,
        errorMessage: updateData.error?.message || 'Unknown error',
        errorStack: updateData.error?.stack,
        errorName: updateData.error?.name || 'Unknown',
        requestHeaders: existingLog.headers,
        requestBody: existingLog.body,
        responseBody: updateData.responseBody,
      })
    }
  }

  /**
   * Search request by ID with formatted response
   * Buscar request por ID con respuesta formateada
   *
   * @param requestId - Request ID / ID del request
   * @returns Formatted search response / Respuesta de búsqueda formateada
   */
  async searchRequestById(requestId: string) {
    // First check in memory / Primero verificar en memoria
    const memoryLog = this.requestLogs.get(requestId)
    if (memoryLog) {
      return {
        message: `Request log found in memory`,
        data: {
          requestId,
          source: 'memory',
          type: memoryLog.success === true ? 'success' : memoryLog.success === false ? 'error' : undefined,
          logData: memoryLog,
        },
        timestamp: new Date().toISOString(),
      }
    }

    // If not in memory, search in CSV files / Si no está en memoria, buscar en archivos CSV
    const csvResult = await this.csvLogger.searchByRequestId(requestId)
    if (csvResult.found) {
      return {
        message: `Request log found in csv`,
        data: {
          requestId,
          source: 'csv',
          type: csvResult.type,
          logData: csvResult.data,
          filepath: csvResult.filepath,
        },
        timestamp: new Date().toISOString(),
      }
    }

    return {
      message: 'Request log not found in memory or CSV files',
      requestId,
      searched: ['memory', 'csv'],
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Get request log by ID with formatted response (memory only)
   * Obtener log de request por ID con respuesta formateada (solo memoria)
   *
   * @param requestId - Request ID / ID del request
   * @returns Formatted response / Respuesta formateada
   */
  getRequestLog(requestId: string) {
    const requestLog = this.requestLogs.get(requestId)

    if (!requestLog) {
      return {
        message: 'Request log not found in memory',
        note: 'Use /monitoring/search/:requestId to search in CSV files',
        requestId,
        timestamp: new Date().toISOString(),
      }
    }

    return {
      message: 'Request log retrieved successfully from memory',
      data: requestLog,
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Get all request logs with pagination and formatted response
   * Obtener todos los logs de requests con paginación y respuesta formateada
   *
   * @param limit - Maximum number of logs to return / Número máximo de logs a retornar
   * @param offset - Number of logs to skip / Número de logs a omitir
   * @returns Formatted response with paginated logs / Respuesta formateada con logs paginados
   */
  getAllRequestLogs(limit = 50, offset = 0) {
    const allLogs = Array.from(this.requestLogs.values())
    const paginatedLogs = allLogs.slice(offset, offset + limit)

    return {
      message: 'Request logs retrieved successfully from memory',
      note: 'This shows only memory logs. For historical data, check CSV files',
      data: paginatedLogs,
      pagination: {
        total: allLogs.length,
        limit,
        offset,
        hasMore: offset + limit < allLogs.length,
      },
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Get raw request logs array (for internal use)
   * Obtener array de logs de requests (para uso interno)
   *
   * @returns Array of request logs / Array de logs de requests
   */
  private getRawRequestLogs(): RequestLog[] {
    return Array.from(this.requestLogs.values())
  }

  /**
   * Get comprehensive statistics including CSV files
   * Obtener estadísticas comprehensivas incluyendo archivos CSV
   *
   * @returns Request statistics / Estadísticas de requests
   */
  getStatistics() {
    const stats = this.getRawStatistics()

    return {
      message: 'Request statistics retrieved successfully',
      data: stats,
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Clean up old logs to prevent memory leaks and maintain size limit
   * Limpiar logs antiguos para prevenir memory leaks y mantener límite de tamaño
   */
  private cleanupOldLogs(): void {
    const currentSize = this.requestLogs.size

    if (currentSize <= this.maxStoredLogs) {
      return // No cleanup needed / No se necesita limpieza
    }

    this.logger.debug(`Cleaning up request logs. Current: ${currentSize}, Max: ${this.maxStoredLogs}`)

    const logs = Array.from(this.requestLogs.entries())

    // Sort by timestamp and keep only the most recent / Ordenar por timestamp y mantener solo los más recientes
    logs.sort((a, b) => b[1].timestamp.getTime() - a[1].timestamp.getTime())

    // Keep only the most recent logs / Mantener solo los logs más recientes
    const logsToKeep = logs.slice(0, this.maxStoredLogs)

    // Clear and repopulate the map / Limpiar y repoblar el mapa
    this.requestLogs.clear()
    logsToKeep.forEach(([id, log]) => {
      this.requestLogs.set(id, log)
    })

    const deletedCount = currentSize - this.requestLogs.size
    this.logger.debug(`Cleanup completed. Deleted ${deletedCount} old logs. Current count: ${this.requestLogs.size}`)
  }

  /**
   * Clear all logs with formatted response
   * Limpiar todos los logs con respuesta formateada
   */
  clearLogs() {
    this.requestLogs.clear()
    this.logger.debug('All request logs cleared from memory')

    return {
      message: 'All request logs cleared successfully from memory',
      note: 'CSV files are preserved',
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Get CSV information with formatted response
   * Obtener información de CSV con respuesta formateada
   */
  getCsvInfo() {
    const stats = this.getRawStatistics()

    return {
      message: 'CSV log files information',
      data: {
        location: 'logs/ directory in project root',
        structure: {
          success: 'logs/success/success_YYYY-MM-DD.csv',
          errors: 'logs/errors/errors_YYYY-MM-DD.csv',
        },
        files: stats.csv,
        note: 'Use /monitoring/search/:requestId to find specific request logs',
      },
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Get memory status and health information
   * Obtener estado de memoria e información de salud
   */
  getMemoryStatus() {
    const memoryStats = this.getMemoryStatusRaw()

    return {
      message: 'Memory status retrieved successfully',
      data: memoryStats,
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Get raw memory status (for internal use)
   * Obtener estado raw de memoria (para uso interno)
   */
  private getMemoryStatusRaw() {
    const currentSize = this.requestLogs.size
    const memoryUsagePercent = Math.round((currentSize / this.maxStoredLogs) * 100)
    const oldestLog = this.findOldestLog()
    const newestLog = this.findNewestLog()

    return {
      maxCapacity: this.maxStoredLogs,
      currentCount: currentSize,
      memoryUsagePercent,
      isNearLimit: memoryUsagePercent >= 90,
      needsCleanup: currentSize > this.maxStoredLogs,
      oldestLogTimestamp: oldestLog ? oldestLog.timestamp.toISOString() : null,
      newestLogTimestamp: newestLog ? newestLog.timestamp.toISOString() : null,
      timeRange:
        oldestLog && newestLog
          ? Math.round((newestLog.timestamp.getTime() - oldestLog.timestamp.getTime()) / 1000 / 60) + ' minutes'
          : null,
    }
  }

  /**
   * Find oldest log in memory
   * Encontrar log más antiguo en memoria
   */
  private findOldestLog(): RequestLog | null {
    const logs = Array.from(this.requestLogs.values())
    if (logs.length === 0) return null

    return logs.reduce((oldest, current) => (current.timestamp < oldest.timestamp ? current : oldest))
  }

  /**
   * Find newest log in memory
   * Encontrar log más nuevo en memoria
   */
  private findNewestLog(): RequestLog | null {
    const logs = Array.from(this.requestLogs.values())
    if (logs.length === 0) return null

    return logs.reduce((newest, current) => (current.timestamp > newest.timestamp ? current : newest))
  }

  /**
   * Get raw statistics (for internal use)
   * Obtener estadísticas raw (para uso interno)
   */
  private getRawStatistics() {
    const logs = this.getRawRequestLogs()
    const completedLogs = logs.filter((log) => log.success !== undefined)
    const successfulLogs = completedLogs.filter((log) => log.success === true)
    const failedLogs = completedLogs.filter((log) => log.success === false)
    const pendingLogs = logs.filter((log) => log.success === undefined)

    const totalDuration = completedLogs.reduce((sum, log) => sum + (log.duration || 0), 0)
    const averageResponseTime = completedLogs.length > 0 ? totalDuration / completedLogs.length : 0

    const csvStats = this.csvLogger.getFileStatistics()
    const memoryStatus = this.getMemoryStatusRaw()

    return {
      memory: {
        totalRequests: logs.length,
        successfulRequests: successfulLogs.length,
        failedRequests: failedLogs.length,
        pendingRequests: pendingLogs.length,
        averageResponseTime: Math.round(averageResponseTime),
        memoryStatus,
      },
      csv: csvStats,
    }
  }

  /**
   * Load historical logs from CSV files into memory on startup
   * Cargar logs históricos de archivos CSV a memoria al arrancar
   */
  private async loadHistoricalLogs(): Promise<void> {
    try {
      this.logger.log('Loading historical logs from CSV files...')
      const startTime = Date.now()

      const csvStats = this.csvLogger.getFileStatistics()
      const allFiles = [...csvStats.successFiles, ...csvStats.errorFiles]

      let loadedCount = 0

      for (const fileName of allFiles) {
        const filePath = fileName.includes('success') ? `logs/success/${fileName}` : `logs/errors/${fileName}`

        try {
          const logs = await this.csvLogger.parseHistoricalFile(filePath)
          for (const log of logs) {
            this.requestLogs.set(log.requestId, log)
            loadedCount++
          }
        } catch (error) {
          this.logger.warn(`Failed to load file ${fileName}:`, error)
        }
      }

      // Clean up if we exceeded the limit / Limpiar si excedimos el límite
      if (this.requestLogs.size > this.maxStoredLogs) {
        this.cleanupOldLogs()
      }

      const duration = Date.now() - startTime

      this.logger.log(
        `Historical logs loaded successfully: ${loadedCount} logs from ${allFiles.length} files in ${duration}ms`,
      )
    } catch (error) {
      this.logger.error('Failed to load historical logs:', error)
    }
  }
}
