import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsNotEmpty, IsBase64 } from 'class-validator'

/**
 * Login Data Transfer Object
 * Objeto de Transferencia de Datos para Login
 *
 * Validates user login credentials
 * Valida credenciales de login del usuario
 */
export class LoginDto {
  /**
   * User email address
   * Dirección de email del usuario
   */
  @ApiProperty({
    description: 'User email address / Dirección de email del usuario',
    example: 'superadmin@example.com',
  })
  @IsEmail({}, { message: 'Must be a valid email address' })
  @IsNotEmpty({ message: 'Email is required ' })
  email: string

  /**
   * User password
   * Contraseña del usuario
   */
  @ApiProperty({
    description: 'User password / Contraseña del usuario',
    example: Buffer.from('password123').toString('base64'),
  })
  @IsBase64()
  @IsNotEmpty({ message: 'Password is required' })
  password: string
}
