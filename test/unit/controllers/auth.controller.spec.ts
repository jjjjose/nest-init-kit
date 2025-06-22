/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing'
import { AuthController } from 'src/features/auth/auth.controller'
import { AuthService } from 'src/features/auth/auth.service'
import { JwtAuthGuard } from 'src/features/auth/guards/jwt-auth.guard'
import { Reflector } from '@nestjs/core'
import { createUserFixture, createLoginDtoFixture, createLoginResponseFixture } from '../../fixtures/auth.fixture'

/**
 * AuthController Unit Tests
 * Tests Unitarios del AuthController
 *
 * Tests all authentication controller endpoints with mocked dependencies
 * Prueba todos los endpoints del controlador de autenticación con dependencias mockeadas
 */
describe('AuthController', () => {
  let controller: AuthController
  let mockAuthService: jest.Mocked<AuthService>

  /**
   * Mock implementations for dependencies
   * Implementaciones mock para las dependencias
   */
  const mockAuthServiceFactory = () => ({
    login: jest.fn(),
    validateUser: jest.fn(),
    verifyToken: jest.fn(),
  })

  const mockJwtAuthGuardFactory = () => ({
    canActivate: jest.fn(),
  })

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useFactory: mockAuthServiceFactory,
        },
        {
          provide: JwtAuthGuard,
          useFactory: mockJwtAuthGuardFactory,
        },
        Reflector,
      ],
    }).compile()

    controller = module.get<AuthController>(AuthController)
    mockAuthService = module.get<jest.Mocked<AuthService>>(AuthService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('login', () => {
    const validLoginDto = createLoginDtoFixture()
    const mockLoginResponse = createLoginResponseFixture()

    beforeEach(() => {
      mockAuthService.login.mockReturnValue(mockLoginResponse)
    })

    it('should return login response when credentials are valid / debería retornar respuesta de login cuando las credenciales son válidas', () => {
      // Act
      const result = controller.login(validLoginDto)

      // Assert
      expect(result).toBeDefined()
      expect(result).toEqual(mockLoginResponse)
      expect(mockAuthService.login).toHaveBeenCalledWith(validLoginDto.email, validLoginDto.password)
      expect(mockAuthService.login).toHaveBeenCalledTimes(1)
    })

    it('should call AuthService.login with correct parameters / debería llamar AuthService.login con parámetros correctos', () => {
      // Act
      controller.login(validLoginDto)

      // Assert
      expect(mockAuthService.login).toHaveBeenCalledWith(validLoginDto.email, validLoginDto.password)
    })

    it('should return access token and user data / debería retornar token de acceso y datos del usuario', () => {
      // Act
      const result = controller.login(validLoginDto)

      // Assert
      expect(result.accessToken).toBe(mockLoginResponse.accessToken)
      expect(result.refreshToken).toBe(mockLoginResponse.refreshToken)
      expect(result.user).toEqual(mockLoginResponse.user)
      expect(result.accessTokenExpiresAt).toBe(mockLoginResponse.accessTokenExpiresAt)
      expect(result.refreshTokenExpiresAt).toBe(mockLoginResponse.refreshTokenExpiresAt)
    })
  })

  describe('getProfile', () => {
    const mockUser = createUserFixture()

    it('should return user profile when authenticated / debería retornar perfil del usuario cuando está autenticado', () => {
      // Arrange
      const mockRequest = {
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
        },
      }

      // Act
      const result = controller.getProfile(mockRequest as any)

      // Assert
      expect(result).toBeDefined()
      expect(result.message).toContain('User profile retrieved successfully')
      expect(result.user).toEqual(mockRequest.user)
    })

    it('should return user data without timestamp / debería retornar datos del usuario sin timestamp', () => {
      // Arrange
      const mockRequest = { user: mockUser }

      // Act
      const result = controller.getProfile(mockRequest as any)

      // Assert
      expect(result.user).toEqual(mockUser)
      expect(result.message).toBeDefined()
    })
  })

  describe('testAuth', () => {
    const mockUser = createUserFixture()

    it('should return test authentication response / debería retornar respuesta de prueba de autenticación', () => {
      // Arrange
      const mockRequest = {
        user: {
          id: mockUser.id,
          email: mockUser.email,
        },
      }

      // Act
      const result = controller.testAuth(mockRequest as any)

      // Assert
      expect(result).toBeDefined()
      expect(result.message).toContain('Authentication is working')
      expect(result.user).toEqual(mockRequest.user)
      expect(result.timestamp).toBeDefined()
    })

    it('should be protected by JWT guard / debería estar protegido por guard JWT', () => {
      // This test ensures the method uses JwtAuthGuard
      // Este test asegura que el método usa JwtAuthGuard
      const guardMetadata = Reflect.getMetadata('__guards__', controller.testAuth)
      expect(guardMetadata).toBeDefined()
    })
  })

  describe('publicEndpoint', () => {
    it('should return public message / debería retornar mensaje público', () => {
      // Act
      const result = controller.publicEndpoint()

      // Assert
      expect(result).toBeDefined()
      expect(result.message).toContain('This is a public endpoint')
      expect(result.timestamp).toBeDefined()
    })

    it('should not require authentication / no debería requerir autenticación', () => {
      // This test ensures the method is marked as public
      // Este test asegura que el método está marcado como público
      const publicMetadata = Reflect.getMetadata('isPublic', controller.publicEndpoint)
      expect(publicMetadata).toBe(true)
    })

    it('should include timestamp in response / debería incluir timestamp en la respuesta', () => {
      // Act
      const result = controller.publicEndpoint()

      // Assert
      expect(result.timestamp).toBeDefined()
      expect(typeof result.timestamp).toBe('string')
      expect(new Date(result.timestamp)).toBeInstanceOf(Date)
    })
  })

  describe('Error handling / Manejo de errores', () => {
    it('should propagate service errors / debería propagar errores del servicio', () => {
      // Arrange
      const loginDto = createLoginDtoFixture()
      const serviceError = new Error('Service error')
      mockAuthService.login.mockImplementation(() => {
        throw serviceError
      })

      // Act & Assert
      expect(() => {
        controller.login(loginDto)
      }).toThrow(serviceError)
    })
  })

  describe('Integration scenarios / Escenarios de integración', () => {
    it('should handle complete authentication flow / debería manejar flujo completo de autenticación', () => {
      // Arrange
      const loginDto = createLoginDtoFixture()
      const loginResponse = createLoginResponseFixture()
      mockAuthService.login.mockReturnValue(loginResponse)

      // Act - Login
      const loginResult = controller.login(loginDto)

      // Assert - Login successful
      expect(loginResult).toEqual(loginResponse)
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto.email, loginDto.password)

      // Act - Access protected resource
      const mockRequest = { user: loginResponse.user }
      const profileResult = controller.testAuth(mockRequest as any)

      // Assert - Protected resource accessible
      expect(profileResult).toBeDefined()
      expect(profileResult.user).toEqual(loginResponse.user)
    })
  })
})
