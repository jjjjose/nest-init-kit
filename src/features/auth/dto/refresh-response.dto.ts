import { ApiProperty } from '@nestjs/swagger'

/**
 * Refresh Token Response DTO / DTO de Respuesta de Actualización de Token
 * Response structure for token refresh / Estructura de respuesta para actualización de token
 */
export class RefreshResponseDto {
  /**
   * New JWT Access Token / Nuevo Token de Acceso JWT
   */
  @ApiProperty({
    description: 'New JWT access token',
    example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string

  /**
   * Access token expiration / Expiración del token de acceso
   */
  @ApiProperty({
    description: 'Access token expiration date',
    example: '2024-12-31T23:59:59.000Z',
    format: 'date-time',
  })
  accessTokenExpiresAt: string

  /**
   * Success message / Mensaje de éxito
   */
  @ApiProperty({
    description: 'Success message',
    example: 'Access token refreshed successfully',
  })
  message: string
}
