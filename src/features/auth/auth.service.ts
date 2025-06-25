import { Injectable, UnauthorizedException } from '@nestjs/common'
import { MyJwtService } from 'src/shared/jwt/my-jwt.service'
import { JwtPayloadInput, UserRole } from 'src/shared'
import { UserEntity } from 'src/database/entities'
import { UserRepository, AllowedClientRepository } from 'src/database/repositories'
import { RegisterClientDto } from './dto/register-client.dto'
import { RegisterClientResponseDto } from './dto/register-client-response.dto'
import { LoginResponseDto } from './dto/login-response.dto'

/**
 * User interface for authentication
 * Interfaz de usuario para autenticación
 */
export interface User {
  id: number
  email: string
  password?: string
  name?: string
}

/**
 * Login response interface
 * Interfaz de respuesta de login
 */
export interface LoginResponse {
  accessToken: string
  refreshToken: string
  accessTokenExpiresAt: string
  refreshTokenExpiresAt: string
  user: Omit<User, 'password'>
}

/**
 * Authentication Service
 * Servicio de Autenticación
 *
 * Handles user authentication, token generation and validation
 * Maneja autenticación de usuarios, generación y validación de tokens
 */
@Injectable()
export class AuthService {
  constructor(
    private myJwtService: MyJwtService,
    private userRepository: UserRepository,
    private allowedClientRepository: AllowedClientRepository,
  ) {}

  /**
   * Validates user credentials (mock implementation)
   * Valida credenciales de usuario (implementación simulada)
   *
   * @param email - User email / Email del usuario
   * @param password - User password / Contraseña del usuario
   * @returns User object or throws exception / Objeto de usuario o lanza excepción
   */
  async validateUser(email: string, password: string): Promise<UserEntity> {
    const user = await this.userRepository.findByEmailAndPassword(email, password)

    if (!user) throw new UnauthorizedException('Invalid credentials.')

    return user
  }

  /**
   * Generates JWT access token for authenticated user
   * Genera token de acceso JWT para usuario autenticado
   *
   * @param email - User email / Email del usuario
   * @param password - User password / Contraseña del usuario
   * @returns Login response with token / Respuesta de login con token
   */
  async login(email: string, password: string): Promise<LoginResponseDto> {
    const user = await this.validateUser(email, password)

    const payload: JwtPayloadInput = {
      sub: user.id,
      email: user.email,
      userId: user.id,
      // Default role for authenticated users / Rol por defecto para usuarios autenticados
      roles: [UserRole.USER],
    }

    const tokens = this.myJwtService.generateTokenPair(payload)

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    }
  }

  /**
   * Verifies JWT token and returns user data
   * Verifica token JWT y retorna datos del usuario
   *
   * @param token - JWT token / Token JWT
   * @returns User data or throws exception / Datos del usuario o lanza excepción
   */
  verifyToken(token: string): User {
    const payload = this.myJwtService.verifyJwtToken(token)

    // In a real application, you would fetch the user from database
    // En una aplicación real, buscarías el usuario en la base de datos
    return {
      id: payload.sub as number,
      email: payload.email,
    }
  }

  /**
   * Register new client and generate UUID
   * Registrar nuevo cliente y generar UUID
   *
   * @param registerClientDto - Client registration data / Datos de registro del cliente
   * @param clientIp - Client IP address / Dirección IP del cliente
   * @returns Registered client info / Información del cliente registrado
   */
  async registerClient(registerClientDto: RegisterClientDto, clientIp?: string): Promise<RegisterClientResponseDto> {
    const clientData = {
      clientType: registerClientDto.clientType,
      clientDescription: registerClientDto.clientDescription,
      ip: clientIp,
      isActive: true,
    }

    const newClient = await this.allowedClientRepository.createAndSave(clientData)

    return {
      clientUuid: newClient.clientUuid,
      clientType: newClient.clientType,
      isActive: newClient.isActive,
      message: 'Client registered successfully. Use this UUID in x-client-uuid header for authentication.',
    }
  }
}
