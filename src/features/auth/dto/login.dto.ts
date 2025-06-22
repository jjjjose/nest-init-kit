import { IsEmail, IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator'

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
  @IsEmail({}, { message: 'Must be a valid email address' })
  @IsNotEmpty({ message: 'Email is required ' })
  email: string

  /**
   * User password
   * Contraseña del usuario
   */
  @IsString({ message: 'Password must be a string ' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters ' })
  @MaxLength(50, { message: 'Password must not exceed 50 characters ' })
  password: string
}
