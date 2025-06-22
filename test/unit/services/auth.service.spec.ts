/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { UnauthorizedException } from '@nestjs/common'
import { AuthService } from 'src/features/auth/auth.service'
import { MyJwtService } from 'src/shared/jwt/my-jwt.service'
import { UserRole } from 'src/shared'
import { createUserFixture, invalidCredentialsFixture } from '../../fixtures/auth.fixture'

/**
 * AuthService Unit Tests
 * Tests Unitarios del AuthService
 *
 * Tests all authentication service methods with mocked dependencies
 * Prueba todos los métodos del servicio de autenticación con dependencias mockeadas
 */
describe('AuthService', () => {
  let service: AuthService
  let mockJwtService: jest.Mocked<MyJwtService>

  /**
   * Mock implementations for dependencies
   * Implementaciones mock para las dependencias
   */
  const mockJwtServiceFactory = () => ({
    generateTokenPair: jest.fn(),
    verifyJwtToken: jest.fn(),
    generateAccessToken: jest.fn(),
    generateRefreshToken: jest.fn(),
    decodeJwtToken: jest.fn(),
    safeVerifyJwtToken: jest.fn(),
  })

  const mockConfigServiceFactory = () => ({
    get: jest.fn(),
  })

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: MyJwtService,
          useFactory: mockJwtServiceFactory,
        },
        {
          provide: ConfigService,
          useFactory: mockConfigServiceFactory,
        },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
    mockJwtService = module.get<jest.Mocked<MyJwtService>>(MyJwtService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('validateUser', () => {
    const validUser = createUserFixture()

    it('should return user when credentials are valid / debería retornar usuario cuando las credenciales son válidas', () => {
      // Act
      const result = service.validateUser(validUser.email, validUser.password!)

      // Assert
      expect(result).toBeDefined()
      expect(result.id).toBe(validUser.id)
      expect(result.email).toBe(validUser.email)
      expect(result.name).toBe(validUser.name)
      expect(result.password).toBeUndefined() // Password should be omitted / La contraseña debería ser omitida
    })

    it('should throw UnauthorizedException when email is invalid / debería lanzar UnauthorizedException cuando el email es inválido', () => {
      // Act & Assert
      expect(() => {
        service.validateUser(invalidCredentialsFixture.email, validUser.password!)
      }).toThrow(UnauthorizedException)
    })

    it('should throw UnauthorizedException when password is invalid / debería lanzar UnauthorizedException cuando la contraseña es inválida', () => {
      // Act & Assert
      expect(() => {
        service.validateUser(validUser.email, invalidCredentialsFixture.password)
      }).toThrow(UnauthorizedException)
    })

    it('should throw UnauthorizedException with correct message / debería lanzar UnauthorizedException con mensaje correcto', () => {
      // Act & Assert
      expect(() => {
        service.validateUser(invalidCredentialsFixture.email, invalidCredentialsFixture.password)
      }).toThrow('Invalid credentials.')
    })
  })

  describe('login', () => {
    const validUser = createUserFixture()
    const mockTokenPair = {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      accessTokenExpiresAt: '2024-12-31T23:59:59.999Z',
      refreshTokenExpiresAt: '2025-01-07T23:59:59.999Z',
    }

    beforeEach(() => {
      mockJwtService.generateTokenPair.mockReturnValue(mockTokenPair)
    })

    it('should return login response with tokens when credentials are valid / debería retornar respuesta de login con tokens cuando las credenciales son válidas', () => {
      // Act
      const result = service.login(validUser.email, validUser.password!)

      // Assert
      expect(result).toBeDefined()
      expect(result.accessToken).toBe(mockTokenPair.accessToken)
      expect(result.refreshToken).toBe(mockTokenPair.refreshToken)
      expect(result.accessTokenExpiresAt).toBe(mockTokenPair.accessTokenExpiresAt)
      expect(result.refreshTokenExpiresAt).toBe(mockTokenPair.refreshTokenExpiresAt)
      expect(result.user).toEqual({
        id: validUser.id,
        email: validUser.email,
        name: validUser.name,
      })
    })

    it('should call generateTokenPair with correct payload / debería llamar generateTokenPair con payload correcto', () => {
      // Act
      service.login(validUser.email, validUser.password!)

      // Assert
      expect(mockJwtService.generateTokenPair).toHaveBeenCalledWith({
        sub: validUser.id,
        email: validUser.email,
        userId: validUser.id,
        roles: [UserRole.USER],
      })
      expect(mockJwtService.generateTokenPair).toHaveBeenCalledTimes(1)
    })

    it('should throw UnauthorizedException when credentials are invalid / debería lanzar UnauthorizedException cuando las credenciales son inválidas', () => {
      // Act & Assert
      expect(() => {
        service.login(invalidCredentialsFixture.email, invalidCredentialsFixture.password)
      }).toThrow(UnauthorizedException)
    })

    it('should not call generateTokenPair when validation fails / no debería llamar generateTokenPair cuando la validación falla', () => {
      // Act & Assert
      try {
        service.login(invalidCredentialsFixture.email, invalidCredentialsFixture.password)
      } catch {
        // Expected error
      }

      expect(mockJwtService.generateTokenPair).not.toHaveBeenCalled()
    })
  })

  describe('verifyToken', () => {
    const mockToken = 'mock-jwt-token'
    const mockDecodedPayload = {
      sub: 1,
      email: 'test@example.com',
      userId: 1,
      roles: [UserRole.USER],
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900, // 15 minutes
    }

    beforeEach(() => {
      mockJwtService.verifyJwtToken.mockReturnValue(mockDecodedPayload)
    })

    it('should return user data when token is valid / debería retornar datos del usuario cuando el token es válido', () => {
      // Act
      const result = service.verifyToken(mockToken)

      // Assert
      expect(result).toBeDefined()
      expect(result.id).toBe(mockDecodedPayload.sub)
      expect(result.email).toBe(mockDecodedPayload.email)
      expect(mockJwtService.verifyJwtToken).toHaveBeenCalledWith(mockToken)
      expect(mockJwtService.verifyJwtToken).toHaveBeenCalledTimes(1)
    })

    it('should throw UnauthorizedException when token is invalid / debería lanzar UnauthorizedException cuando el token es inválido', () => {
      // Arrange
      mockJwtService.verifyJwtToken.mockImplementation(() => {
        throw new UnauthorizedException('Invalid token')
      })

      // Act & Assert
      expect(() => {
        service.verifyToken('invalid-token')
      }).toThrow(UnauthorizedException)
    })

    it('should call verifyJwtToken with correct token / debería llamar verifyJwtToken con token correcto', () => {
      // Act
      service.verifyToken(mockToken)

      // Assert
      expect(mockJwtService.verifyJwtToken).toHaveBeenCalledWith(mockToken)
    })
  })

  describe('Integration scenarios / Escenarios de integración', () => {
    it('should handle complete authentication flow / debería manejar flujo completo de autenticación', () => {
      // Arrange
      const user = createUserFixture()
      const mockTokenPair = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        accessTokenExpiresAt: '2024-12-31T23:59:59.999Z',
        refreshTokenExpiresAt: '2025-01-07T23:59:59.999Z',
      }
      mockJwtService.generateTokenPair.mockReturnValue(mockTokenPair)

      // Act - Login
      const loginResult = service.login(user.email, user.password!)

      // Assert - Login successful
      expect(loginResult).toBeDefined()
      expect(loginResult.accessToken).toBe(mockTokenPair.accessToken)
      expect(loginResult.user.email).toBe(user.email)

      // Setup for token verification
      const mockDecodedPayload = {
        sub: user.id,
        email: user.email,
        userId: user.id,
        roles: [UserRole.USER],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
      }
      mockJwtService.verifyJwtToken.mockReturnValue(mockDecodedPayload)

      // Act - Verify token
      const verifyResult = service.verifyToken(loginResult.accessToken)

      // Assert - Token verification successful
      expect(verifyResult).toBeDefined()
      expect(verifyResult.id).toBe(user.id)
      expect(verifyResult.email).toBe(user.email)
    })

    it('should handle authentication failure scenarios / debería manejar escenarios de fallo de autenticación', () => {
      // Test multiple invalid scenarios / Probar múltiples escenarios inválidos
      const invalidScenarios = [
        { email: '', password: 'validpassword' },
        { email: 'valid@email.com', password: '' },
        { email: 'invalid@email.com', password: 'invalidpassword' },
        { email: 'test@example.com', password: 'wrongpassword' },
      ]

      invalidScenarios.forEach((scenario) => {
        expect(() => {
          service.validateUser(scenario.email, scenario.password)
        }).toThrow(UnauthorizedException)
      })
    })
  })
})
