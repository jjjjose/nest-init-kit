import { User, LoginResponse } from 'src/features/auth/auth.service'
import { LoginDto } from 'src/features/auth/dto/login.dto'
import { JwtPayloadInput, UserRole } from 'src/shared'

/**
 * Authentication fixtures for testing
 * Fixtures de autenticación para pruebas
 */

/**
 * Creates a mock user for testing
 * Crea un usuario mock para pruebas
 */
export const createUserFixture = (overrides: Partial<User> = {}): User => ({
  id: 1,
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User',
  ...overrides,
})

/**
 * Creates multiple mock users for testing
 * Crea múltiples usuarios mock para pruebas
 */
export const createMultipleUsersFixture = (count: number): User[] => {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    email: `user${index + 1}@example.com`,
    password: 'password123',
    name: `User ${index + 1}`,
  }))
}

/**
 * Creates a valid login DTO for testing
 * Crea un DTO de login válido para pruebas
 */
export const createLoginDtoFixture = (overrides: Partial<LoginDto> = {}): LoginDto => ({
  email: 'test@example.com',
  password: 'password123',
  ...overrides,
})

/**
 * Creates an invalid login DTO for testing
 * Crea un DTO de login inválido para pruebas
 */
export const createInvalidLoginDtoFixture = (): LoginDto => ({
  email: 'invalid-email',
  password: '123', // Too short
})

/**
 * Creates a JWT payload for testing
 * Crea un payload JWT para pruebas
 */
export const createJwtPayloadFixture = (overrides: Partial<JwtPayloadInput> = {}): JwtPayloadInput => ({
  sub: 1,
  email: 'test@example.com',
  userId: 1,
  roles: [UserRole.USER],
  ...overrides,
})

/**
 * Creates a login response for testing
 * Crea una respuesta de login para pruebas
 */
export const createLoginResponseFixture = (overrides: Partial<LoginResponse> = {}): LoginResponse => ({
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  accessTokenExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
  refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
  user: {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
  },
  ...overrides,
})

/**
 * Admin user fixture for role-based testing
 * Fixture de usuario admin para pruebas basadas en roles
 */
export const adminUserFixture: User = {
  id: 999,
  email: 'admin@example.com',
  password: 'adminPassword123',
  name: 'Admin User',
}

/**
 * Invalid credentials for testing authentication failures
 * Credenciales inválidas para probar fallos de autenticación
 */
export const invalidCredentialsFixture = {
  email: 'wrong@example.com',
  password: 'wrongpassword',
}

/**
 * Expired JWT payload for testing token expiration
 * Payload JWT expirado para probar expiración de tokens
 */
export const expiredJwtPayloadFixture = {
  sub: 1,
  email: 'test@example.com',
  iat: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
  exp: Math.floor(Date.now() / 1000) - 1800, // 30 minutes ago
}
