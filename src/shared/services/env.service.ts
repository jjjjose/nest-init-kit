import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  EnvironmentVariables,
  isProduction,
  isDevelopment,
  getKafkaBrokers,
} from '../../config/env.validation'

/**
 * Global environment variables service
 * Servicio global para variables de entorno
 *
 * Simplified wrapper around ConfigService with type safety
 * Wrapper simplificado alrededor de ConfigService con seguridad de tipos
 */
@Injectable()
export class EnvService {
  constructor(
    private readonly configService: ConfigService<EnvironmentVariables>,
  ) {}

  /**
   * Get environment variable with type safety
   * Obtener variable de entorno con seguridad de tipos
   */
  get<K extends keyof EnvironmentVariables>(
    key: K,
  ): EnvironmentVariables[K] | undefined {
    return this.configService.get<EnvironmentVariables[K]>(key)
  }

  /**
   * Get environment variable with default value
   * Obtener variable de entorno con valor por defecto
   */
  getWithDefault<K extends keyof EnvironmentVariables>(
    key: K,
    defaultValue: EnvironmentVariables[K],
  ): EnvironmentVariables[K] {
    return this.configService.get<EnvironmentVariables[K]>(key, defaultValue)
  }

  /**
   * Get environment variable or throw if not found
   * Obtener variable de entorno o lanzar error si no existe
   */
  getOrThrow<K extends keyof EnvironmentVariables>(
    key: K,
  ): EnvironmentVariables[K] {
    return this.configService.getOrThrow<EnvironmentVariables[K]>(key)
  }

  /**
   * Check if running in production environment
   * Verificar si se está ejecutando en entorno de producción
   */
  get isProduction(): boolean {
    return isProduction()
  }

  /**
   * Check if running in development environment
   * Verificar si se está ejecutando en entorno de desarrollo
   */
  get isDevelopment(): boolean {
    return isDevelopment()
  }

  /**
   * Check if running in test environment
   * Verificar si se está ejecutando en entorno de pruebas
   */
  get isTest(): boolean {
    return process.env.NODE_ENV === 'test'
  }

  /**
   * Get the current environment name
   * Obtener el nombre del entorno actual
   */
  get environment(): string {
    return process.env.NODE_ENV || 'development'
  }

  /**
   * Get Kafka brokers as array (using validation helper)
   * Obtener brokers de Kafka como array (usando helper de validación)
   */
  getKafkaBrokers(): string[] {
    try {
      const kafkaBrokers = this.get('KAFKA_BROKERS')
      if (!kafkaBrokers) return []

      const mockConfig = { KAFKA_BROKERS: kafkaBrokers } as EnvironmentVariables
      return getKafkaBrokers(mockConfig)
    } catch {
      return []
    }
  }

  /**
   * Get database connection URL
   * Obtener URL de conexión a la base de datos
   */
  getDatabaseUrl(): string {
    const host = this.getWithDefault('DB_HOST', 'localhost')
    const port = this.getWithDefault('DB_PORT', 5432)
    const username = this.getWithDefault('DB_USERNAME', 'postgres')
    const password = this.getWithDefault('DB_PASSWORD', 'postgres')
    const database = this.getWithDefault('DB_DATABASE', 'api_master')

    return `postgresql://${username}:${password}@${host}:${port}/${database}`
  }

  // Convenience getters for commonly used values
  // Getters de conveniencia para valores comúnmente usados

  get serverPort(): number {
    return this.getWithDefault('SERVER_PORT', 3000)
  }

  get dbHost(): string {
    return this.getWithDefault('DB_HOST', 'localhost')
  }

  get dbPort(): number {
    return this.getWithDefault('DB_PORT', 5432)
  }

  get dbUsername(): string {
    return this.getWithDefault('DB_USERNAME', 'postgres')
  }

  get dbPassword(): string {
    return this.getWithDefault('DB_PASSWORD', 'postgres')
  }

  get dbDatabase(): string {
    return this.getWithDefault('DB_DATABASE', 'api_master')
  }

  get jwtExpiration(): string {
    return this.getWithDefault('JWT_EXPIRATION', '15m')
  }

  get jwtRefreshExpiration(): string {
    return this.getWithDefault('JWT_REFRESH_EXPIRATION', '7d')
  }

  get databaseSsl(): boolean {
    return this.getWithDefault(
      'DATABASE_SSL_DISABLE_REJECT_UNAUTHORIZED',
      false,
    )
  }
}
