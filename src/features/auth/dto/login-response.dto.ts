import { ApiProperty } from '@nestjs/swagger'

/**
 * User data in login response / Datos del usuario en respuesta de login
 */
export class UserResponseDto {
  /**
   * User ID / ID del usuario
   */
  @ApiProperty({
    description: 'Unique user identifier / Identificador único del usuario',
    example: 1,
  })
  id: number

  /**
   * User email / Email del usuario
   */
  @ApiProperty({
    description: 'User email address / Dirección de email del usuario',
    example: 'user@example.com',
    format: 'email',
  })
  email: string

  /**
   * User name / Nombre del usuario
   */
  @ApiProperty({
    description: 'User full name / Nombre completo del usuario',
    example: 'John Doe',
  })
  name: string
}

/**
 * Login Response DTO / DTO de Respuesta de Login
 * Response structure for user login / Estructura de respuesta para login de usuario
 */
export class LoginResponseDto {
  /**
   * JWT Access Token / Token de Acceso JWT
   */
  @ApiProperty({
    description: 'JWT access token for authentication / Token de acceso JWT para autenticación',
    example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string

  /**
   * JWT Refresh Token / Token de Actualización JWT
   */
  @ApiProperty({
    description: 'JWT refresh token for token renewal / Token de actualización JWT para renovación de tokens',
    example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string

  /**
   * Access token expiration / Expiración del token de acceso
   */
  @ApiProperty({
    description: 'Access token expiration date / Fecha de expiración del token de acceso',
    example: '2024-12-31T23:59:59.000Z',
    format: 'date-time',
  })
  accessTokenExpiresAt: string

  /**
   * Refresh token expiration / Expiración del token de actualización
   */
  @ApiProperty({
    description: 'Refresh token expiration date / Fecha de expiración del token de actualización',
    example: '2025-01-30T23:59:59.000Z',
    format: 'date-time',
  })
  refreshTokenExpiresAt: string

  /**
   * User information / Información del usuario
   */
  @ApiProperty({
    description: 'User information / Información del usuario',
    type: UserResponseDto,
  })
  user: UserResponseDto
}
