/**
 * Logging Configuration Constants
 * Constantes de Configuración de Logging
 *
 * ARCHITECTURE INTEGRATION / INTEGRACIÓN DE ARQUITECTURA:
 * These constants control body persistence throughout the entire logging pipeline
 * Estas constantes controlan la persistencia de cuerpo en toda la pipeline de logging
 *
 * PIPELINE INTEGRATION / INTEGRACIÓN DE PIPELINE:
 * Middleware → Interceptor (uses these configs) → RequestLogService → CsvLoggerService
 * Middleware → Interceptor (usa estas configs) → RequestLogService → CsvLoggerService
 *
 * CONFIGURATION LOGIC / LÓGICA DE CONFIGURACIÓN:
 * - SUCCESS scenarios: Uses SAVE_SUCCESS_* constants / Escenarios EXITOSOS: Usa constantes SAVE_SUCCESS_*
 * - ERROR scenarios: Uses SAVE_ERROR_* constants / Escenarios ERROR: Usa constantes SAVE_ERROR_*
 *
 * PERFORMANCE IMPACT / IMPACTO EN RENDIMIENTO:
 * - Setting to false reduces disk I/O and file size / Establecer en false reduce I/O de disco y tamaño de archivo
 * - Setting to true provides complete audit trail / Establecer en true proporciona rastro de auditoría completo
 *
 * SECURITY CONSIDERATIONS / CONSIDERACIONES DE SEGURIDAD:
 * - Request bodies are sanitized (passwords → [REDACTED]) / Cuerpos de request son saneados (contraseñas → [REDACTED])
 * - Response bodies may contain sensitive data / Cuerpos de response pueden contener datos sensibles
 * - Consider compliance requirements when enabling / Considerar requisitos de cumplimiento al habilitar
 *
 * USAGE EXAMPLES / EJEMPLOS DE USO:
 * - Development: All true for debugging / Desarrollo: Todo true para debugging
 * - Production: Minimal true for performance / Producción: Mínimo true para rendimiento
 * - Audit: All true for compliance / Auditoría: Todo true para cumplimiento
 */

export const LOGGING_CONFIG = {
  /**
   * Save request body for successful requests (200-299 status codes)
   * Guardar cuerpo de request para requests exitosos (códigos de estado 200-299)
   *
   * Impact / Impacto:
   * - Useful for API usage analysis / Útil para análisis de uso de API
   * - May contain form data, JSON payloads / Puede contener datos de formulario, payloads JSON
   */
  SAVE_SUCCESS_REQUEST_BODY: true,

  /**
   * Save response body for successful requests (200-299 status codes)
   * Guardar cuerpo de response para requests exitosos (códigos de estado 200-299)
   *
   * Impact / Impacto:
   * - Large impact on disk usage / Gran impacto en uso de disco
   * - Contains actual API response data / Contiene datos reales de respuesta API
   */
  SAVE_SUCCESS_RESPONSE_BODY: false,

  /**
   * Save request body for error requests (400+ status codes)
   * Guardar cuerpo de request para requests con error (códigos de estado 400+)
   *
   * Impact / Impacto:
   * - Critical for debugging failed requests / Crítico para debugging de requests fallidos
   * - Helps identify malformed input / Ayuda a identificar entrada mal formada
   */
  SAVE_ERROR_REQUEST_BODY: true,

  /**
   * Save response body for error requests (400+ status codes)
   * Guardar cuerpo de response para requests con error (códigos de estado 400+)
   *
   * Impact / Impacto:
   * - Contains error details and stack traces / Contiene detalles de error y stack traces
   * - Essential for production error analysis / Esencial para análisis de errores en producción
   */
  SAVE_ERROR_RESPONSE_BODY: true,
} as const

/**
 * Type for logging configuration
 * Tipo para configuración de logging
 */
export type LoggingConfig = typeof LOGGING_CONFIG
