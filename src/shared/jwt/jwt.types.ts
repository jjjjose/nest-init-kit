/**
 * User roles enum for authorization
 * Enum de roles de usuario para autorización
 */
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator',
  GUEST = 'guest',
}

/**
 * JWT payload input interface for token generation
 * Interfaz de entrada del payload JWT para generación de tokens
 */
export interface JwtPayloadInput {
  /** User ID / ID del usuario */
  userId: number
  /** User email / Email del usuario */
  email: string
  /** Username / Nombre de usuario */
  username?: string
  /** User first name / Nombre del usuario */
  firstName?: string
  /** User last name / Apellido del usuario */
  lastName?: string
  /** User roles / Roles del usuario */
  roles: UserRole[]
  /** User permissions / Permisos del usuario */
  permissions?: string[]
  /** Additional metadata / Metadatos adicionales */
  metadata?: Record<string, unknown>
  /** Issuer / Emisor */
  iss?: string
  /** Audience / Audiencia */
  aud?: string
  /** Subject (user ID) - JWT standard / Sujeto (ID usuario) - estándar JWT */
  sub: number
}

/**
 * Official JWT payload interface (what gets stored in the token)
 * Interfaz oficial del payload JWT (lo que se almacena en el token)
 */
export interface JwtPayload extends JwtPayloadInput {
  /** Issued at timestamp / Timestamp de emisión */
  iat?: number
  /** Expiration timestamp / Timestamp de expiración */
  exp?: number
  /** JWT ID / ID del JWT */
  jti?: string
  /** Token type / Tipo de token */
  tokenType?: 'access' | 'refresh'
  /** Session ID / ID de sesión */
  sessionId?: string
}

/**
 * JWT token generation options
 * Opciones de generación de token JWT
 */
export interface JwtTokenOptions {
  /** Token expiration time / Tiempo de expiración del token */
  expiresIn: string
  /** Token issuer / Emisor del token */
  issuer?: string
  /** Token audience / Audiencia del token */
  audience?: string
  /** Token type / Tipo de token */
  tokenType?: 'access' | 'refresh'
  /** Session ID / ID de sesión */
  sessionId?: string
}

/**
 * JWT token pair for authentication
 * Par de tokens JWT para autenticación
 */
export interface JwtTokenPair {
  /** Access token / Token de acceso */
  accessToken: string
  /** Refresh token / Token de actualización */
  refreshToken: string
  /** Access token expiration time / Tiempo de expiración del token de acceso */
  accessTokenExpiresAt: string
  /** Refresh token expiration time / Tiempo de expiración del token de actualización */
  refreshTokenExpiresAt: string
}

/**
 * JWT verification result
 * Resultado de verificación JWT
 */
export interface JwtVerificationResult {
  /** Whether token is valid / Si el token es válido */
  valid: boolean
  /** Decoded payload if valid / Payload decodificado si es válido */
  payload?: JwtPayload
  /** Error message if invalid / Mensaje de error si es inválido */
  error?: string
}
