import { ApiProperty } from '@nestjs/swagger'

/**
 * Register Client Response DTO / DTO de Respuesta de Registro de Cliente
 * Response structure for client registration / Estructura de respuesta para registro de cliente
 */
export class RegisterClientResponseDto {
  /**
   * Generated client UUID / UUID del cliente generado
   */
  @ApiProperty({
    description: 'Unique client UUID generated automatically',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  clientUuid: string

  /**
   * Client type / Tipo de cliente
   */
  @ApiProperty({
    description: 'Type of client application',
    example: 'mobile_app',
    enum: ['web_browser', 'mobile_app', 'desktop_app', 'api_client'],
  })
  clientType: string

  /**
   * Client active status / Estado activo del cliente
   */
  @ApiProperty({
    description: 'Indicates if the client is active',
    example: true,
  })
  isActive: boolean

  /**
   * Success message / Mensaje de éxito
   */
  @ApiProperty({
    description: 'Success message with instructions',
    example: 'Client registered successfully. Use this UUID in x-client-uuid header for authentication.',
  })
  message: string
}
