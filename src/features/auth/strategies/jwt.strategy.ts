import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { EnvService, JwtPayload } from 'src/shared'

/**
 * JWT Strategy for Passport authentication
 * Estrategia JWT para autenticación con Passport
 *
 * This strategy validates JWT tokens and extracts user information
 * Esta estrategia valida tokens JWT y extrae información del usuario
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private env: EnvService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: env.certPublicKey,
      algorithms: ['RS256'],
    })
  }

  /**
   * Validates JWT payload and returns user information
   * Valida el payload JWT y retorna información del usuario, puede ser async
   *
   * @param payload - JWT payload / Payload del JWT
   * @returns User information / Información del usuario
   * @throws UnauthorizedException if user is invalid / Si el usuario es inválido
   */
  validate(payload: JwtPayload): JwtPayload {
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Invalid token payload')
    }

    // Here you can add additional user validation from database
    // Aquí puedes agregar validación adicional del usuario desde la base de datos
    // verificar si el usuario existe y está activo o tiene modo premium etc
    // const user = await this.usersService.findById(payload.sub)
    // if (!user || !user.isActive) {
    //   throw new UnauthorizedException('User not found or inactive / Usuario no encontrado o inactivo')
    // }

    return payload
  }
}
