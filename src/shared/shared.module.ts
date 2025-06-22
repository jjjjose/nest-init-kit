import { Global, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { EnvService } from './services/env.service'
import { RequestLogService } from './services/request-log.service'
import { CsvLoggerService } from './services/csv-logger.service'
import { RequestMonitoringController } from './controllers/request-monitoring.controller'

/**
 * Global shared module
 * Módulo compartido global
 *
 * Contains all shared services, utilities, and providers
 * Contiene todos los servicios compartidos, utilidades y proveedores
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [EnvService, CsvLoggerService, RequestLogService],
  controllers: [RequestMonitoringController],
  exports: [EnvService, RequestLogService, CsvLoggerService],
})
export class SharedModule {}
