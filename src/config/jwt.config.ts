import { JwtModuleOptions } from '@nestjs/jwt'
import { EnvService } from 'src/shared'

/**
 * JWT configuration factory for NestJS JWT module
 * Configuración JWT para el módulo JWT de NestJS
 *
 * @param configService - ConfigService instance / Instancia de ConfigService
 * @returns JWT module options / Opciones del módulo JWT
 */
export const getJwtConfig = (env: EnvService): JwtModuleOptions => ({
  privateKey: env.certPrivateKey,
  publicKey: env.certPublicKey,
  signOptions: { algorithm: 'RS256' },
  verifyOptions: { algorithms: ['RS256'] },
})
