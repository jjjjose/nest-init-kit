import { Module } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { JwtStrategy } from './strategies/jwt.strategy'
import { JwtAuthGuard } from './guards/jwt-auth.guard'

/**
 * Authentication module for the application
 * Módulo de autenticación para la aplicación
 *
 * This module handles JWT-based authentication using Passport.js strategy.
 * It provides login functionality, token validation, and route protection.
 *
 * Este módulo maneja la autenticación basada en JWT usando la estrategia de Passport.js.
 * Proporciona funcionalidad de login, validación de tokens y protección de rutas.
 *
 * @exports JwtAuthGuard - Guard for protecting routes / Guard para proteger rutas
 * @exports PassportModule - Passport authentication module / Módulo de autenticación Passport
 */
@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard],
  exports: [JwtAuthGuard, PassportModule],
})
export class AuthModule {}
