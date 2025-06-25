import { IsNotEmpty, IsString, IsOptional, IsIn, MaxLength } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

/**
 * Register Client DTO / DTO para Registro de Cliente
 * Data required to register a new client / Datos requeridos para registrar un nuevo cliente
 */
export class RegisterClientDto {
  /**
   * Client type / Tipo de cliente
   */
  @ApiProperty({
    description: 'Type of client application',
    example: 'mobile_app',
    enum: ['web_browser', 'mobile_app', 'desktop_app', 'api_client'],
  })
  @IsNotEmpty()
  @IsString()
  @IsIn(['web_browser', 'mobile_app', 'desktop_app', 'api_client'])
  clientType: string

  /**
   * Client description / Descripción del cliente
   */
  @ApiPropertyOptional({
    description: 'Optional description of the client',
    example: 'My mobile application for iOS',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  clientDescription?: string
}
