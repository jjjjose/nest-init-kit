import { Global, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { EnvService } from './services/env.service'

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
  providers: [EnvService],
  exports: [EnvService],
})
export class SharedModule {}
