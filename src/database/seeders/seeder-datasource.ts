import { Logger } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { datasource } from '../../../ormconfig'

const logger = new Logger('SeederDataSource')

/**
 * DataSource configuration for seeders / Configuración de DataSource para seeders
 * Reuses the ormconfig configuration / Reutiliza la configuración del ormconfig
 */
class SeederDataSource {
  private static instance: DataSource | null = null

  /**
   * Get singleton DataSource instance / Obtener instancia singleton de DataSource
   */
  public static async getInstance(): Promise<DataSource> {
    if (!SeederDataSource.instance) {
      SeederDataSource.instance = datasource

      if (!SeederDataSource.instance.isInitialized) {
        logger.log('🔌 Initializing DataSource for seeders...')
        await SeederDataSource.instance.initialize()
        logger.log('✅ DataSource initialized successfully')
      }
    }

    return SeederDataSource.instance
  }

  /**
   * Close DataSource connection / Cerrar conexión del DataSource
   */
  public static async close(): Promise<void> {
    if (SeederDataSource.instance && SeederDataSource.instance.isInitialized) {
      logger.log('🔌 Closing DataSource connection...')
      await SeederDataSource.instance.destroy()
      SeederDataSource.instance = null
      logger.log('✅ DataSource connection closed')
    }
  }

  /**
   * Get current DataSource instance / Obtener instancia actual del DataSource
   */
  public static getCurrentInstance(): DataSource | null {
    return SeederDataSource.instance
  }

  /**
   * Check if DataSource is initialized / Verificar si el DataSource está inicializado
   */
  public static isInitialized(): boolean {
    return SeederDataSource.instance?.isInitialized ?? false
  }
}

export { SeederDataSource }
