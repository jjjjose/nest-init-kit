import { Module } from '@nestjs/common'
import { RepositoriesModule } from '../../../database/repositories.module'
import { ClientValidatorService, RoleValidatorService } from './services'
import { JwtAuthGuard } from './jwt-auth.guard'

/**
 * Guards Module
 * Módulo de Guards
 *
 * Provides authentication and authorization guards and their dependencies
 * Proporciona guards de autenticación y autorización y sus dependencias
 */
@Module({
  imports: [RepositoriesModule],
  providers: [ClientValidatorService, RoleValidatorService, JwtAuthGuard],
  exports: [JwtAuthGuard, ClientValidatorService, RoleValidatorService],
})
export class GuardsModule {}
