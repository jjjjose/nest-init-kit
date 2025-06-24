import { Global, Module } from '@nestjs/common'
import { UserRepository } from './repositories/users.repository'
import { AllowedClientRepository } from './repositories/allowed-clients.repository'

/**
 * Global repositories module / Módulo global de repositorios
 * Registers and exports all repositories for use throughout the application / Registra y exporta todos los repositorios para uso en toda la aplicación
 */
@Global()
@Module({
  imports: [],
  providers: [UserRepository, AllowedClientRepository],
  exports: [UserRepository, AllowedClientRepository],
})
export class RepositoriesModule {}
