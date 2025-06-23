import { Controller, Post, Get, Body, HttpStatus, HttpCode, Req } from '@nestjs/common'
import { AuthService, LoginResponse } from './auth.service'
import { LoginDto } from './dto/login.dto'
import { Public } from '../../shared/decorators'
import { Request } from 'express'

/**
 * Authentication Controller
 * Controlador de Autenticación
 *
 * Handles authentication endpoints like login and user profile
 * Maneja endpoints de autenticación como login y perfil de usuario
 */
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * User login endpoint
   * Endpoint de login de usuario
   *
   * @param loginDto - Login credentials / Credenciales de login
   * @returns JWT token and user data / Token JWT y datos del usuario
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() { email, password }: LoginDto): LoginResponse {
    return this.authService.login(email, password)
  }

  /**
   * Get current user profile (protected endpoint)
   * Obtener perfil del usuario actual (endpoint protegido)
   *
   * @param req - Request object with user data / Objeto de petición con datos del usuario
   * @returns Current user profile / Perfil del usuario actual
   */
  @Get('profile')
  getProfile(@Req() req: Request) {
    return {
      message: 'User profile retrieved successfully / Perfil de usuario obtenido exitosamente',
      user: req.user,
    }
  }

  /**
   * Test endpoint to verify authentication is working
   * Endpoint de prueba para verificar que la autenticación funciona
   *
   * @returns Success message / Mensaje de éxito
   */
  @Get('test')
  testAuth(@Req() req: Request) {
    return {
      message: 'Authentication is working / La autenticación está funcionando',
      user: req.user,
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Public endpoint to test that public routes work
   * Endpoint público para probar que las rutas públicas funcionan
   *
   * @returns Public message / Mensaje público
   */
  @Public()
  @Get('public')
  publicEndpoint() {
    return {
      message: 'This is a public endpoint / Este es un endpoint público',
      timestamp: new Date().toISOString(),
    }
  }
}
