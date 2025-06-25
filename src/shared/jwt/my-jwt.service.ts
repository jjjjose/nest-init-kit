import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { EnvService } from '../services'
import { JwtPayloadInput, JwtPayload, JwtTokenOptions, JwtTokenPair, JwtVerificationResult } from './jwt.types'

@Injectable()
export class MyJwtService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly env: EnvService,
  ) {}

  /**
   * Generates JWT token with comprehensive payload and options
   * Genera token JWT con payload integral y opciones
   *
   * @param payloadInput - JWT payload input data / Datos de entrada del payload JWT
   * @param options - Token generation options / Opciones de generación del token
   * @returns JWT token string / Cadena del token JWT
   */
  generateJwtToken(payloadInput: JwtPayloadInput, options: JwtTokenOptions): string {
    const payload: JwtPayload = {
      ...payloadInput,
      sub: payloadInput.userId,
      tokenType: options.tokenType || 'access',
      sessionId: options.sessionId,
    }

    const jwtOptions = {
      expiresIn: options.expiresIn,
      issuer: options.issuer,
      audience: options.audience,
    }

    return this.jwtService.sign(payload, jwtOptions)
  }

  /**
   * Verifies and decodes JWT token
   * Verifica y decodifica el token JWT
   *
   * @param token - JWT token string / Cadena del token JWT
   * @returns Decoded JWT payload / Payload JWT decodificado
   */
  verifyJwtToken(token: string): JwtPayload {
    try {
      return this.jwtService.verify<JwtPayload>(token)
    } catch (error) {
      throw new UnauthorizedException(error)
    }
  }

  /**
   * Safely verifies JWT token with error handling
   * Verifica token JWT de forma segura con manejo de errores
   *
   * @param token - JWT token string / Cadena del token JWT
   * @returns Verification result with payload or error / Resultado de verificación con payload o error
   */
  safeVerifyJwtToken(token: string): JwtVerificationResult {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token)
      return {
        valid: true,
        payload,
      }
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Invalid token',
      }
    }
  }

  /**
   * Decodes JWT token without verification (use carefully)
   * Decodifica token JWT sin verificación (usar con cuidado)
   *
   * @param token - JWT token string / Cadena del token JWT
   * @returns Decoded JWT payload / Payload JWT decodificado
   */
  decodeJwtToken(token: string): JwtPayload | null {
    try {
      return this.jwtService.decode(token)
    } catch (error) {
      throw new UnauthorizedException(error)
    }
  }

  /**
   * Generates access token with default settings
   * Genera token de acceso con configuración por defecto
   *
   * @param payloadInput - JWT payload input data / Datos de entrada del payload JWT
   * @returns JWT access token string / Cadena del token de acceso JWT
   */
  generateAccessToken(payloadInput: JwtPayloadInput): string {
    return this.generateJwtToken(payloadInput, {
      expiresIn: this.env.jwtExpiration,
      tokenType: 'access',
      issuer: this.env.jwtIssuer,
      audience: this.env.jwtAudience,
    })
  }

  /**
   * Generates refresh token with extended expiration
   * Genera token de actualización con expiración extendida
   *
   * @param payloadInput - JWT payload input data / Datos de entrada del payload JWT
   * @returns JWT refresh token string / Cadena del token de actualización JWT
   */
  generateRefreshToken(payloadInput: JwtPayloadInput): string {
    return this.generateJwtToken(payloadInput, {
      expiresIn: this.env.jwtRefreshExpiration,
      tokenType: 'refresh',
      issuer: this.env.jwtIssuer,
      audience: this.env.jwtAudience,
    })
  }

  /**
   * Generates both access and refresh tokens
   * Genera tokens de acceso y actualización
   *
   * @param payloadInput - JWT payload input data / Datos de entrada del payload JWT
   * @returns Token pair with access and refresh tokens / Par de tokens de acceso y actualización
   */
  generateTokenPair(payloadInput: JwtPayloadInput): JwtTokenPair {
    const accessToken = this.generateAccessToken(payloadInput),
      refreshToken = this.generateRefreshToken(payloadInput),
      accessTokenExpiresAt = this.calculateTokenExpiration(accessToken),
      refreshTokenExpiresAt = this.calculateTokenExpiration(refreshToken)

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
    }
  }

  private calculateTokenExpiration(token: string): string {
    const decodedToken = this.decodeJwtToken(token)
    return decodedToken?.exp ? new Date(decodedToken.exp * 1000).toISOString() : ''
  }

  generateAccessTokenFromRefreshToken(payloadInput: JwtPayloadInput): {
    accessToken: string
    accessTokenExpiresAt: string
  } {
    const accessToken = this.generateAccessToken(payloadInput),
      accessTokenExpiresAt = this.calculateTokenExpiration(accessToken)
    return {
      accessToken,
      accessTokenExpiresAt,
    }
  }
}
