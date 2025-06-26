import { Injectable, Logger } from '@nestjs/common'
import { appendFileSync, existsSync, mkdirSync, writeFileSync, readdirSync } from 'fs'
import { readFile } from 'fs/promises'
import { join } from 'path'
import type { RequestLog } from './request-log.service'

/**
 * CSV Logger Service
 * Servicio de Logger CSV
 *
 * ARCHITECTURE ROLE / ROL EN LA ARQUITECTURA:
 * File persistence layer for request logs with dual CSV structure
 * Capa de persistencia de archivos para logs de requests con estructura CSV dual
 *
 * INTEGRATION / INTEGRACIÓN:
 * - Used by: RequestLogService for final persistence / Usado por: RequestLogService para persistencia final
 * - File Structure: Separate success/error directories with daily rotation / Estructura de Archivos: Directorios separados éxito/error con rotación diaria
 * - Search Capability: Cross-file request ID lookup / Capacidad de Búsqueda: Búsqueda de ID de request entre archivos
 *
 * FILE ORGANIZATION / ORGANIZACIÓN DE ARCHIVOS:
 * ```
 * logs/
 * ├── success/success_YYYY-MM-DD.csv (requestId, method, url, statusCode, duration, ...)
 * └── errors/errors_YYYY-MM-DD.csv   (requestId, method, url, statusCode, errorMessage, stack, ...)
 * ```
 *
 * FEATURES / CARACTERÍSTICAS:
 * - Daily log file rotation / Rotación diaria de archivos de log
 * - Automatic directory creation / Creación automática de directorios
 * - CSV format with proper escaping / Formato CSV con escapado apropiado
 * - Configurable body saving based on LOGGING_CONFIG / Guardado configurable de cuerpo basado en LOGGING_CONFIG
 * - Historical file parsing for memory loading / Análisis de archivos históricos para carga en memoria
 * - Cross-file search capabilities / Capacidades de búsqueda entre archivos
 *
 * CSV STRUCTURE DIFFERENCES / DIFERENCIAS EN ESTRUCTURA CSV:
 * - Success files: Include responseBody and requestBody / Archivos exitosos: Incluyen responseBody y requestBody
 * - Error files: Include errorMessage, errorStack, requestHeaders / Archivos error: Incluyen errorMessage, errorStack, requestHeaders
 */
@Injectable()
export class CsvLoggerService {
  private readonly logger = new Logger(CsvLoggerService.name)
  private readonly logsDir = join(process.cwd(), 'logs')
  private readonly successDir = join(this.logsDir, 'success')
  private readonly errorDir = join(this.logsDir, 'errors')

  constructor() {
    this.ensureDirectoriesExist()
  }

  /**
   * Log successful request to CSV
   * Registrar request exitoso en CSV
   *
   * @param data - Success log data / Datos de log exitoso
   */
  logSuccess(data: {
    requestId: string
    timestamp: Date
    method: string
    url: string
    statusCode: number
    duration: number
    ip: string
    userAgent: string
    responseSize?: number
    requestBody?: unknown
    responseBody?: unknown
  }): void {
    try {
      const date = this.formatDate(data.timestamp)
      const filename = `success_${date}.csv`
      const filepath = join(this.successDir, filename)

      // Create header if file doesn't exist / Crear header si el archivo no existe
      if (!existsSync(filepath)) {
        const header =
          'requestId,timestamp,method,url,statusCode,duration,ip,userAgent,responseSize,requestBody,responseBody\n'
        writeFileSync(filepath, header, 'utf8')
      }

      // Prepare CSV row / Preparar fila CSV
      const row =
        [
          data.requestId,
          data.timestamp.toISOString(),
          data.method,
          `"${data.url}"`, // Quoted to handle URLs with commas / Entrecomillado para manejar URLs con comas
          data.statusCode,
          data.duration,
          `"${data.ip}"`,
          `"${this.sanitizeForCsv(data.userAgent)}"`,
          data.responseSize || 0,
          `"${this.sanitizeForCsv(JSON.stringify(data.requestBody || {}))}"`,
          `"${this.sanitizeForCsv(JSON.stringify(data.responseBody || {}))}"`,
        ].join(',') + '\n'

      appendFileSync(filepath, row, 'utf8')
      this.logger.debug(`Success log saved: ${data.requestId}`)
    } catch (error) {
      this.logger.error(`Failed to log success to CSV: ${error}`)
    }
  }

  /**
   * Log error request to CSV with full error details
   * Registrar request con error en CSV con detalles completos del error
   *
   * @param data - Error log data / Datos de log de error
   */
  logError(data: {
    requestId: string
    timestamp: Date
    method: string
    url: string
    statusCode: number
    duration: number
    ip: string
    userAgent: string
    errorMessage: string
    errorStack?: string
    errorName: string
    requestHeaders: Record<string, unknown>
    requestBody?: unknown
    responseBody?: unknown
  }): void {
    try {
      const date = this.formatDate(data.timestamp)
      const filename = `errors_${date}.csv`
      const filepath = join(this.errorDir, filename)

      // Create header if file doesn't exist / Crear header si el archivo no existe
      if (!existsSync(filepath)) {
        const header =
          'requestId,timestamp,method,url,statusCode,duration,ip,userAgent,errorMessage,errorName,errorStack,requestHeaders,requestBody,responseBody\n'
        writeFileSync(filepath, header, 'utf8')
      }

      // Prepare CSV row with full error details / Preparar fila CSV con detalles completos del error
      const row =
        [
          data.requestId,
          data.timestamp.toISOString(),
          data.method,
          `"${data.url}"`,
          data.statusCode,
          data.duration,
          `"${data.ip}"`,
          `"${this.sanitizeForCsv(data.userAgent)}"`,
          `"${this.sanitizeForCsv(data.errorMessage)}"`,
          `"${data.errorName}"`,
          `"${this.sanitizeForCsv(data.errorStack || '')}"`,
          `"${this.sanitizeForCsv(JSON.stringify(data.requestHeaders))}"`,
          `"${this.sanitizeForCsv(JSON.stringify(data.requestBody || {}))}"`,
          `"${this.sanitizeForCsv(JSON.stringify(data.responseBody || {}))}"`,
        ].join(',') + '\n'

      appendFileSync(filepath, row, 'utf8')
      this.logger.debug(`Error log saved: ${data.requestId}`)
    } catch (error) {
      this.logger.error(`Failed to log error to CSV: ${error}`)
    }
  }

  /**
   * Search for request by ID in CSV files
   * Buscar request por ID en archivos CSV
   *
   * @param requestId - Request ID to search / ID de request a buscar
   * @returns Log data if found / Datos de log si se encuentra
   */
  async searchByRequestId(requestId: string): Promise<{
    found: boolean
    type?: 'success' | 'error'
    data?: string
    filepath?: string
  }> {
    try {
      // Search in success logs / Buscar en logs exitosos
      const successResult = await this.searchInDirectory(this.successDir, requestId)
      if (successResult.found) {
        return { ...successResult, type: 'success' }
      }

      // Search in error logs / Buscar en logs de error
      const errorResult = await this.searchInDirectory(this.errorDir, requestId)
      if (errorResult.found) {
        return { ...errorResult, type: 'error' }
      }

      return { found: false }
    } catch (error) {
      this.logger.error(`Failed to search request ID ${requestId}: ${error}`)
      return { found: false }
    }
  }

  /**
   * Get statistics from CSV files
   * Obtener estadísticas de archivos CSV
   *
   * @returns CSV log statistics / Estadísticas de logs CSV
   */
  getFileStatistics(): {
    successFiles: string[]
    errorFiles: string[]
    totalFiles: number
  } {
    try {
      const successFiles = this.getFilesInDirectory(this.successDir)
      const errorFiles = this.getFilesInDirectory(this.errorDir)

      return {
        successFiles,
        errorFiles,
        totalFiles: successFiles.length + errorFiles.length,
      }
    } catch (error) {
      this.logger.error(`Failed to get file statistics: ${error}`)
      return { successFiles: [], errorFiles: [], totalFiles: 0 }
    }
  }

  /**
   * Ensure log directories exist
   * Asegurar que los directorios de logs existan
   */
  private ensureDirectoriesExist(): void {
    try {
      if (!existsSync(this.logsDir)) {
        mkdirSync(this.logsDir, { recursive: true })
      }
      if (!existsSync(this.successDir)) {
        mkdirSync(this.successDir, { recursive: true })
      }
      if (!existsSync(this.errorDir)) {
        mkdirSync(this.errorDir, { recursive: true })
      }
      this.logger.debug('Log directories ensured')
    } catch (error) {
      this.logger.error(`Failed to create log directories: ${error}`)
    }
  }

  /**
   * Format date for filename
   * Formatear fecha para nombre de archivo
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0] // YYYY-MM-DD
  }

  /**
   * Sanitize string for CSV format
   * Sanear string para formato CSV
   */
  private sanitizeForCsv(str: string): string {
    return str
      .replace(/"/g, '""') // Escape quotes / Escapar comillas
      .replace(/\r?\n/g, ' ') // Replace newlines / Reemplazar saltos de línea
      .replace(/\t/g, ' ') // Replace tabs / Reemplazar tabulaciones
  }

  /**
   * Search for request ID in a specific directory
   * Buscar ID de request en un directorio específico
   */
  private async searchInDirectory(
    directory: string,
    requestId: string,
  ): Promise<{ found: boolean; data?: string; filepath?: string }> {
    const files = this.getFilesInDirectory(directory)

    for (const file of files) {
      const filepath = join(directory, file)
      try {
        const content = await readFile(filepath, 'utf8')
        const lines = content.split('\n')

        for (const line of lines) {
          if (line.includes(requestId)) {
            return {
              found: true,
              data: line,
              filepath,
            }
          }
        }
      } catch (error) {
        this.logger.warn(`Failed to read file ${filepath}: ${error}`)
      }
    }

    return { found: false }
  }

  /**
   * Parse historical CSV file and convert to RequestLog objects
   * Parsear archivo CSV histórico y convertir a objetos RequestLog
   */
  async parseHistoricalFile(filePath: string): Promise<RequestLog[]> {
    try {
      const content = await readFile(filePath, 'utf8')
      const lines = content.split('\n').filter((line) => line.trim() && !line.startsWith('requestId,'))

      return lines
        .map((line) => {
          const fields = this.parseCsvLine(line)
          if (fields.length < 2) return null

          const requestId = fields[0]
          const timestamp = new Date(fields[1])
          const method = fields[2] || 'UNKNOWN'
          const url = fields[3]?.replace(/"/g, '') || '/'

          // Basic log structure / Estructura básica de log
          return {
            requestId,
            timestamp,
            method,
            url,
            userAgent: fields[7]?.replace(/"/g, '') || 'unknown',
            ip: fields[6]?.replace(/"/g, '') || 'unknown',
            headers: {},
            statusCode: parseInt(fields[4]) || 200,
            duration: parseInt(fields[5]) || 0,
            success: filePath.includes('success'),
            completedAt: timestamp,
          }
        })
        .filter(Boolean) as RequestLog[]
    } catch (error) {
      this.logger.error(`Failed to parse historical file ${filePath}:`, error)
      return []
    }
  }

  /**
   * Parse CSV line handling quoted fields
   * Parsear línea CSV manejando campos entrecomillados
   */
  private parseCsvLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current)
        current = ''
      } else {
        current += char
      }
    }

    result.push(current)
    return result
  }

  /**
   * Get list of files in directory
   * Obtener lista de archivos en directorio
   */
  private getFilesInDirectory(directory: string): string[] {
    try {
      if (!existsSync(directory)) {
        return []
      }
      return readdirSync(directory).filter((file: string) => file.endsWith('.csv'))
    } catch (error) {
      this.logger.warn(`Failed to read directory ${directory}: ${error}`)
      return []
    }
  }
}
