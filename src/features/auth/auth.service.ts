import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { MyJwtService } from 'src/shared/jwt/my-jwt.service'
import { JwtPayloadInput, UserRole } from 'src/shared'

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
    private configService: ConfigService,
  ) {}

  /**
   * Validates user credentials (mock implementation)
   * Valida credenciales de usuario (implementación simulada)
   *
   * @param email - User email / Email del usuario
   * @param password - User password / Contraseña del usuario
   * @returns User object or throws exception / Objeto de usuario o lanza excepción
   */
  validateUser(email: string, password: string): User {
    // TODO: Replace with actual user validation from database
    // TODO: Reemplazar con validación real de usuario desde base de datos

    // Mock user for testing - replace with database query
    // Usuario simulado para pruebas - reemplazar con consulta a base de datos
    const mockUser: User = {
      id: 1,
      email: 'test@example.com',
      password: 'password123', // In real app, this should be hashed / En app real, esto debería estar hasheado
      name: 'Test User',
    }

    if (email === mockUser.email && password === mockUser.password) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _pass, ...result } = mockUser
      return result
    }

    throw new UnauthorizedException('Invalid credentials.')
  }

  /**
   * Generates JWT access token for authenticated user
   * Genera token de acceso JWT para usuario autenticado
   *
   * @param email - User email / Email del usuario
   * @param password - User password / Contraseña del usuario
   * @returns Login response with token / Respuesta de login con token
   */
  login(email: string, password: string): LoginResponse {
    const user = this.validateUser(email, password)

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
}
