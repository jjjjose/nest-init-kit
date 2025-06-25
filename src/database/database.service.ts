import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { DataSource, DataSourceOptions } from 'typeorm'
import { databaseConfig } from 'src/config/database.config'
import { DEFAULT_CONNECTION_ALIAS, EnvService } from 'src/shared'

/**
 * Database Service
 * Servicio de base de datos que maneja múltiples conexiones
 *
 * This service manages multiple database connections using configuration from database.config.ts
 * Este servicio maneja múltiples conexiones usando configuración desde database.config.ts
 */
@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name)
  private readonly dataSources = new Map<string, DataSource>()

  constructor(private readonly env: EnvService) {}

  /**
   * Module initialization - establish database connections
   * Inicialización del módulo - establecer conexiones de base de datos
   */
  async onModuleInit(): Promise<void> {
    await this.connectToAllDatabases()
  }

  /**
   * Module destruction - close all database connections
   * Destrucción del módulo - cerrar todas las conexiones de base de datos
   */
  async onModuleDestroy(): Promise<void> {
    await this.disconnectFromAllDatabases()
  }

  /**
   * Connect to all configured databases
   * Conectar a todas las bases de datos configuradas
   */
  private async connectToAllDatabases(): Promise<void> {
    // const connectionConfigs = getMultipleDatabaseConfigs(this.configService)
    const connectionPromises: Promise<void>[] = []

    // for (const [name, config] of connectionConfigs.entries()) {
    //   connectionPromises.push(this.connectToDatabase(name, config))
    // }
    const defaultConnection = this.dataSources.get(DEFAULT_CONNECTION_ALIAS)
    if (!defaultConnection) {
      connectionPromises.push(this.connectToDatabase(DEFAULT_CONNECTION_ALIAS, databaseConfig(this.env)))
    }

    await Promise.allSettled(connectionPromises)
  }

  /**
   * Connect to a specific database
   * Conectar a una base de datos específica
   */
  private async connectToDatabase(name: string, config: DataSourceOptions): Promise<void> {
    try {
      const dataSource = new DataSource(config)
      await dataSource.initialize()

      this.dataSources.set(name, dataSource)
      this.logger.debug(`✅ Connected to database: ${config.database?.toString()}, alias: ${name}`)
    } catch (error) {
      this.logger.error(`❌ Failed to connect to database: ${name}`, error)
      // In development, continue without this connection
      // En desarrollo, continuar sin esta conexión
      if (process.env.NODE_ENV !== 'production') {
        this.logger.warn(`⚠️  Continuing without ${name} database connection`)
      } else {
        throw error
      }
    }
  }

  /**
   * Disconnect from all databases
   * Desconectar de todas las bases de datos
   */
  private async disconnectFromAllDatabases(): Promise<void> {
    const disconnectionPromises: Promise<void>[] = []

    for (const [name, dataSource] of this.dataSources.entries()) {
      if (dataSource.isInitialized) {
        disconnectionPromises.push(
          dataSource.destroy().then(() => {
            this.logger.log(`🔌 Disconnected from database: ${name}`)
          }),
        )
      }
    }

    await Promise.allSettled(disconnectionPromises)
    this.dataSources.clear()
  }

  /**
   * Get a specific database connection
   * Obtener una conexión de base de datos específica
   */
  async getDataSource(connectionAlias: string = DEFAULT_CONNECTION_ALIAS): Promise<DataSource> {
    let dataSource = this.dataSources.get(connectionAlias)

    if (!dataSource) {
      await this.connectToAllDatabases()
      dataSource = this.dataSources.get(connectionAlias)

      if (!dataSource) {
        throw new Error(`Database connection '${connectionAlias}' not found or not initialized`)
      }
    }

    if (!dataSource.isInitialized) {
      throw new Error(`Database connection '${connectionAlias}' is not initialized`)
    }

    return dataSource
  }

  /**
   * Get all available database connections
   * Obtener todas las conexiones de base de datos disponibles
   */
  getAllDataSources(): Map<string, DataSource> {
    return new Map(this.dataSources)
  }

  /**
   * Check if a specific database connection is available
   * Verificar si una conexión de base de datos específica está disponible
   */
  isConnectionAvailable(connectionAlias: string): boolean {
    const dataSource = this.dataSources.get(connectionAlias)
    return dataSource?.isInitialized ?? false
  }

  /**
   * Get connection status for all databases
   * Obtener estado de conexión para todas las bases de datos
   */
  getConnectionStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {}

    for (const [name, dataSource] of this.dataSources.entries()) {
      status[name] = dataSource.isInitialized
    }

    return status
  }
}
