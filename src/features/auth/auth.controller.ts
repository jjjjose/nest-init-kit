import { Controller, Post, Get, Body, HttpStatus, HttpCode, Req } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiBody, ApiCreatedResponse } from '@nestjs/swagger'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'
import { RegisterClientDto } from './dto/register-client.dto'
import { RegisterClientResponseDto } from './dto/register-client-response.dto'
import { LoginResponseDto } from './dto/login-response.dto'
import { Public, ApiAuthTag, ApiJwtAuth } from '../../shared/decorators'
import { Request } from 'express'

/**
 * Authentication Controller
 * Controlador de Autenticación
 *
 * Handles authentication endpoints like login and user profile
 * Maneja endpoints de autenticación como login y perfil de usuario
 */
@ApiAuthTag()
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
  @ApiOperation({
    summary: 'User login / Login de usuario',
    description: 'Authenticate user with email and password / Autenticar usuario con email y contraseña',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful / Login exitoso',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials / Credenciales inválidas',
  })
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() { email, password }: LoginDto): Promise<LoginResponseDto> {
    return await this.authService.login(email, password)
  }

  /**
   * Get current user profile (protected endpoint)
   * Obtener perfil del usuario actual (endpoint protegido)
   *
   * @param req - Request object with user data / Objeto de petición con datos del usuario
   * @returns Current user profile / Perfil del usuario actual
   */
  @ApiOperation({
    summary: 'Get user profile / Obtener perfil de usuario',
    description: 'Get current authenticated user profile / Obtener perfil del usuario autenticado actual',
  })
  @ApiJwtAuth()
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully / Perfil obtenido exitosamente',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized / No autorizado',
  })
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
  @Public()
  @Get('test')
  testAuth(@Req() req: Request) {
    return {
      message: 'Authentication is working / La autenticación está funcionando',
      user: req.user,
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Register new client and get UUID
   * Registrar nuevo cliente y obtener UUID
   *
   * @param registerClientDto - Client registration data / Datos de registro del cliente
   * @param clientIp - Client IP address / Dirección IP del cliente
   * @returns Client UUID and information / UUID del cliente e información
   */
  @ApiOperation({
    summary: 'Register new client / Registrar nuevo cliente',
    description:
      'Register a new client and receive UUID for authentication / Registrar un nuevo cliente y recibir UUID para autenticación',
  })
  @ApiBody({ type: RegisterClientDto })
  @ApiCreatedResponse({
    description: 'Client registered successfully / Cliente registrado exitosamente',
    type: RegisterClientResponseDto,
  })
  @Public()
  @Post('register-client')
  async registerClient(@Body() registerClientDto: RegisterClientDto, @Req() req: Request) {
    // Extract client IP from request / Extraer IP del cliente desde el request
    const clientIp = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown'

    return await this.authService.registerClient(registerClientDto, clientIp)
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
