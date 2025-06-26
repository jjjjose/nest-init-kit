import { Controller, Get, Param, Query } from '@nestjs/common'
import { RequestLogService } from '../services/request-log.service'
import { ApiJwtAuth } from '../decorators'

/**
 * Request Monitoring Controller
 * Controlador de Monitoreo de Requests
 *
 * ARCHITECTURE ROLE / ROL EN LA ARQUITECTURA:
 * REST API interface for accessing and managing the logging system
 * Interfaz API REST para acceder y gestionar el sistema de logging
 *
 * SECURITY / SEGURIDAD:
 * Protected with JWT authentication - admin/monitoring access only
 * Protegido con autenticación JWT - solo acceso admin/monitoreo
 *
 * DATA SOURCES / FUENTES DE DATOS:
 * - Memory: Recent requests (up to 5000) / Memoria: Requests recientes (hasta 5000)
 * - CSV Files: Historical data with search capability / Archivos CSV: Datos históricos con capacidad de búsqueda
 *
 * ENDPOINT CATEGORIES / CATEGORÍAS DE ENDPOINTS:
 * 1. Statistics: Overall system health and metrics / Estadísticas: Salud general del sistema y métricas
 * 2. Search: Find specific requests across memory/CSV / Búsqueda: Encontrar requests específicos en memoria/CSV
 * 3. Management: Memory operations and CSV info / Gestión: Operaciones de memoria e info CSV
 *
 * MONITORING WORKFLOW / FLUJO DE MONITOREO:
 * 1. Check /stats for system overview / Verificar /stats para vista general del sistema
 * 2. Use /search/:requestId for specific request investigation / Usar /search/:requestId para investigación de request específico
 * 3. Monitor /memory for capacity management / Monitorear /memory para gestión de capacidad
 * 4. Use /clear for memory cleanup if needed / Usar /clear para limpieza de memoria si es necesario
 */

@ApiJwtAuth()
@Controller('monitoring')
export class RequestMonitoringController {
  constructor(private readonly requestLogService: RequestLogService) {}

  /**
   * Get comprehensive system statistics including memory and CSV data
   * Obtener estadísticas comprehensivas del sistema incluyendo datos de memoria y CSV
   *
   * @returns System-wide request statistics / Estadísticas de requests a nivel de sistema
   *
   * USAGE / USO:
   * - Health checks and monitoring dashboards / Verificaciones de salud y dashboards de monitoreo
   * - Performance analysis and capacity planning / Análisis de rendimiento y planificación de capacidad
   * - Understanding request patterns and success rates / Entender patrones de requests y tasas de éxito
   */
  @Get('stats')
  getStatistics() {
    return this.requestLogService.getStatistics()
  }

  /**
   * Get memory status and health information
   * Obtener estado de memoria e información de salud
   *
   * @returns Memory usage, capacity, and cleanup status / Uso de memoria, capacidad y estado de limpieza
   *
   * USAGE / USO:
   * - Monitor memory consumption / Monitorear consumo de memoria
   * - Detect when cleanup is needed / Detectar cuándo se necesita limpieza
   * - Capacity planning and alerts / Planificación de capacidad y alertas
   */
  @Get('memory')
  getMemoryStatus() {
    return this.requestLogService.getMemoryStatus()
  }

  /**
   * Search for specific request log by ID across memory and CSV files
   * Buscar log específico de request por ID en memoria y archivos CSV
   *
   * @param requestId - Unique request identifier from X-Request-ID header / Identificador único de request del header X-Request-ID
   * @returns Complete request log data or not found message / Datos completos de log de request o mensaje de no encontrado
   *
   * USAGE / USO:
   * - Debugging specific request issues / Debugging de problemas específicos de request
   * - Audit trail investigation / Investigación de rastro de auditoría
   * - Customer support and error analysis / Soporte al cliente y análisis de errores
   *
   * SEARCH SCOPE / ALCANCE DE BÚSQUEDA:
   * 1. Memory (recent requests) / Memoria (requests recientes)
   * 2. CSV files (historical data) / Archivos CSV (datos históricos)
   */
  @Get('search/:requestId')
  async searchRequestLog(@Param('requestId') requestId: string) {
    return this.requestLogService.searchRequestById(requestId)
  }

  /**
   * Get specific request log by ID from memory only
   * Obtener log específico de request por ID solo de memoria
   *
   * @param requestId - Unique request identifier / Identificador único de request
   * @returns Request log from memory or not found message / Log de request de memoria o mensaje de no encontrado
   *
   * USAGE / USO:
   * - Quick lookup for recent requests / Búsqueda rápida para requests recientes
   * - Real-time monitoring / Monitoreo en tiempo real
   *
   * NOTE / NOTA:
   * For historical data, use /search/:requestId endpoint
   * Para datos históricos, usar endpoint /search/:requestId
   */
  @Get('request/:requestId')
  getRequestLog(@Param('requestId') requestId: string) {
    return this.requestLogService.getRequestLog(requestId)
  }

  /**
   * Get paginated list of request logs from memory
   * Obtener lista paginada de logs de requests de memoria
   *
   * @param limit - Maximum number of logs to return (default: 50) / Número máximo de logs a retornar (por defecto: 50)
   * @param offset - Number of logs to skip (default: 0) / Número de logs a omitir (por defecto: 0)
   * @returns Paginated request logs from memory / Logs de requests paginados de memoria
   *
   * USAGE / USO:
   * - Browse recent request activity / Navegar actividad reciente de requests
   * - Real-time monitoring dashboards / Dashboards de monitoreo en tiempo real
   * - System activity overview / Vista general de actividad del sistema
   *
   * LIMITATIONS / LIMITACIONES:
   * Only shows memory data (up to 5000 requests)
   * Solo muestra datos de memoria (hasta 5000 requests)
   */
  @Get('requests')
  getAllRequestLogs(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 50
    const parsedOffset = offset ? parseInt(offset, 10) : 0
    return this.requestLogService.getAllRequestLogs(parsedLimit, parsedOffset)
  }

  /**
   * Clear all request logs from memory (CSV files preserved)
   * Limpiar todos los logs de requests de memoria (archivos CSV preservados)
   *
   * @returns Confirmation message / Mensaje de confirmación
   *
   * USAGE / USO:
   * - Emergency memory cleanup / Limpieza de emergencia de memoria
   * - Reset monitoring state / Resetear estado de monitoreo
   * - Performance troubleshooting / Resolución de problemas de rendimiento
   *
   * WARNING / ADVERTENCIA:
   * This action cannot be undone, but CSV files remain intact
   * Esta acción no se puede deshacer, pero los archivos CSV permanecen intactos
   */
  @Get('clear')
  clearLogs() {
    return this.requestLogService.clearLogs()
  }

  /**
   * Get information about CSV log files and structure
   * Obtener información sobre archivos de log CSV y estructura
   *
   * @returns CSV file locations, structure, and statistics / Ubicaciones de archivos CSV, estructura y estadísticas
   *
   * USAGE / USO:
   * - Understanding log file organization / Entender organización de archivos de log
   * - Backup and archival planning / Planificación de respaldo y archivo
   * - External log analysis setup / Configuración de análisis de logs externos
   */
  @Get('csv/info')
  getCsvInfo() {
    return this.requestLogService.getCsvInfo()
  }
}
