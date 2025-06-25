import { Controller, Post, Get, Body, HttpStatus, HttpCode, Req, UnauthorizedException } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiBody, ApiCreatedResponse } from '@nestjs/swagger'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'
import { RegisterClientDto } from './dto/register-client.dto'
import { RegisterClientResponseDto } from './dto/register-client-response.dto'
import { LoginResponseDto } from './dto/login-response.dto'
import { RefreshResponseDto } from './dto/refresh-response.dto'
import { Public, ApiAuthTag, ApiJwtAuth } from '../../shared/decorators'
import { Request } from 'express'
import { JwtPayload } from 'src/shared'

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
    summary: 'User login',
    description: 'Authenticate user with email and password',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
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
    summary: 'Get user profile',
    description: 'Get current authenticated user profile',
  })
  @ApiJwtAuth()
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @Get('profile')
  getProfile(@Req() req: Request) {
    return {
      message: 'User profile retrieved successfully',
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
      message: 'Authentication is working',
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
    summary: 'Register new client',
    description: 'Register a new client and receive UUID for authentication',
  })
  @ApiBody({ type: RegisterClientDto })
  @ApiCreatedResponse({
    description: 'Client registered successfully',
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
      message: 'This is a public endpoint',
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Refresh JWT tokens using a valid refresh token
   * Actualizar tokens JWT usando un token de actualización válido
   *
   * @param req - Request object with refresh token / Objeto de petición con token de actualización
   * @returns New token pair / Nuevo par de tokens
   */
  @ApiOperation({
    summary: 'Refresh JWT tokens',
    description: 'Generate new access and refresh tokens using a valid refresh token',
  })
  @ApiResponse({
    status: 200,
    description: 'Tokens refreshed successfully',
    type: RefreshResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token',
  })
  @ApiJwtAuth()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request & { user: JwtPayload }): Promise<RefreshResponseDto> {
    if (req.user.tokenType !== 'refresh') throw new UnauthorizedException('Invalid token type')
    return await this.authService.refreshTokens(req.user.sub)
  }
}
