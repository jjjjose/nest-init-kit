/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import { ValidationPipe } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AuthModule } from 'src/features/auth/auth.module'
import { SharedModule } from 'src/shared/shared.module'
import { MyJwtModule } from 'src/shared/jwt/my-jwt.module'
import {
  createLoginDtoFixture,
  createInvalidLoginDtoFixture,
  invalidCredentialsFixture,
} from '../fixtures/auth.fixture'
import { App } from 'supertest/types'

/**
 * Authentication E2E Tests
 * Tests E2E de Autenticación
 *
 * Tests authentication flow from HTTP requests to responses
 * Prueba el flujo de autenticación desde peticiones HTTP hasta respuestas
 */
describe('AuthController (e2e)', () => {
  let app: INestApplication<App>

  beforeAll(async () => {
    // Set test environment variables using RSA certificates
    process.env.NODE_ENV = 'test'
    process.env.JWT_PRIVATE_KEY_PATH = './.certs/jwt-private.pem'
    process.env.JWT_PUBLIC_KEY_PATH = './.certs/jwt-public.pem'
    process.env.JWT_EXPIRATION = '15m'
    process.env.JWT_REFRESH_EXPIRATION = '7d'
    process.env.JWT_ISSUER = 'nestjs-api'
    process.env.JWT_AUDIENCE = 'nestjs-client'

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true, // Don't load .env file for tests
        }),
        SharedModule,
        MyJwtModule,
        AuthModule,
      ],
    }).compile()

    app = moduleFixture.createNestApplication()

    // Apply global pipes for validation
    // Aplicar pipes globales para validación
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    )

    await app.init()
  }, 60000) // Aumentar timeout para beforeAll

  afterAll(async () => {
    await app.close()
  })

  describe('/auth/login (POST)', () => {
    const loginEndpoint = '/auth/login'

    it('should return JWT token on valid credentials / debería retornar token JWT con credenciales válidas', async () => {
      const validLoginDto = createLoginDtoFixture()

      const response = await request(app.getHttpServer()).post(loginEndpoint).send(validLoginDto).expect(200)

      // Assert response structure / Verificar estructura de respuesta
      expect(response.body).toHaveProperty('accessToken')
      expect(response.body).toHaveProperty('refreshToken')
      expect(response.body).toHaveProperty('accessTokenExpiresAt')
      expect(response.body).toHaveProperty('refreshTokenExpiresAt')
      expect(response.body).toHaveProperty('user')

      // Assert user data / Verificar datos del usuario
      expect(response.body.user).toHaveProperty('id')
      expect(response.body.user).toHaveProperty('email')
      expect(response.body.user).toHaveProperty('name')
      expect(response.body.user).not.toHaveProperty('password') // Password should not be included / La contraseña no debe estar incluida

      // Assert token format / Verificar formato del token
      expect(typeof response.body.accessToken).toBe('string')
      expect(typeof response.body.refreshToken).toBe('string')
      expect(response.body.accessToken.length).toBeGreaterThan(0)
      expect(response.body.refreshToken.length).toBeGreaterThan(0)
    }, 10000)

    it('should return 401 on invalid credentials / debería retornar 401 con credenciales inválidas', async () => {
      const response = await request(app.getHttpServer())
        .post(loginEndpoint)
        .send(invalidCredentialsFixture)
        .expect(401)

      expect(response.body).toHaveProperty('statusCode', 401)
      expect(response.body).toHaveProperty('message')
    }, 5000)

    it('should return 400 on invalid email format / debería retornar 400 con formato de email inválido', async () => {
      const invalidLoginDto = createInvalidLoginDtoFixture()

      const response = await request(app.getHttpServer()).post(loginEndpoint).send(invalidLoginDto).expect(400)

      expect(response.body).toHaveProperty('statusCode', 400)
      expect(response.body).toHaveProperty('message')
    }, 5000)

    it('should return 400 on missing fields / debería retornar 400 con campos faltantes', async () => {
      const incompleteData = { email: 'test@example.com' } // Missing password

      const response = await request(app.getHttpServer()).post(loginEndpoint).send(incompleteData).expect(400)

      expect(response.body).toHaveProperty('statusCode', 400)
      expect(response.body).toHaveProperty('message')
    }, 5000)

    it('should return 400 on empty request body / debería retornar 400 con cuerpo de petición vacío', async () => {
      const response = await request(app.getHttpServer()).post(loginEndpoint).send({}).expect(400)

      expect(response.body).toHaveProperty('statusCode', 400)
    }, 5000)
  })

  describe('/auth/test (GET)', () => {
    const testEndpoint = '/auth/test'
    let authToken: string

    beforeEach(async () => {
      // Get valid token for protected route tests
      // Obtener token válido para tests de rutas protegidas
      const validLoginDto = createLoginDtoFixture()
      const loginResponse = await request(app.getHttpServer()).post('/auth/login').send(validLoginDto).expect(200)

      authToken = loginResponse.body.accessToken
    }, 10000)

    it('should return user data when authenticated / debería retornar datos del usuario cuando está autenticado', async () => {
      const response = await request(app.getHttpServer())
        .get(testEndpoint)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toHaveProperty('message')
      expect(response.body).toHaveProperty('user')
      expect(response.body).toHaveProperty('timestamp')
      expect(response.body.message).toContain('Authentication is working')
    }, 5000)

    it('should return 401 without token / debería retornar 401 sin token', async () => {
      const response = await request(app.getHttpServer()).get(testEndpoint).expect(401)

      expect(response.body).toHaveProperty('statusCode', 401)
      expect(response.body).toHaveProperty('message')
    }, 5000)

    it('should return 401 with invalid token / debería retornar 401 con token inválido', async () => {
      const response = await request(app.getHttpServer())
        .get(testEndpoint)
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)

      expect(response.body).toHaveProperty('statusCode', 401)
    }, 5000)

    it('should return 401 with malformed authorization header / debería retornar 401 con header de autorización malformado', async () => {
      const response = await request(app.getHttpServer())
        .get(testEndpoint)
        .set('Authorization', 'Invalid format')
        .expect(401)

      expect(response.body).toHaveProperty('statusCode', 401)
    }, 5000)
  })

  describe('/auth/public (GET)', () => {
    const publicEndpoint = '/auth/public'

    it('should return public message without authentication / debería retornar mensaje público sin autenticación', async () => {
      const response = await request(app.getHttpServer()).get(publicEndpoint).expect(200)

      expect(response.body).toHaveProperty('message')
      expect(response.body).toHaveProperty('timestamp')
      expect(response.body.message).toContain('This is a public endpoint')
    }, 5000)

    it('should work with authentication token / debería funcionar con token de autenticación', async () => {
      // Login first to get token
      const validLoginDto = createLoginDtoFixture()
      const loginResponse = await request(app.getHttpServer()).post('/auth/login').send(validLoginDto).expect(200)

      const authToken = loginResponse.body.accessToken

      // Test public endpoint with token
      const response = await request(app.getHttpServer())
        .get(publicEndpoint)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toHaveProperty('message')
      expect(response.body.message).toContain('This is a public endpoint')
    }, 10000)
  })

  describe('Authentication flow integration / Integración de flujo de autenticación', () => {
    it('should handle complete authentication flow / debería manejar flujo completo de autenticación', async () => {
      const validLoginDto = createLoginDtoFixture()

      // Step 1: Login and get token
      const loginResponse = await request(app.getHttpServer()).post('/auth/login').send(validLoginDto).expect(200)

      const { accessToken } = loginResponse.body

      // Step 2: Use token to access protected route
      const protectedResponse = await request(app.getHttpServer())
        .get('/auth/test')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      expect(protectedResponse.body).toHaveProperty('user')
      expect(protectedResponse.body.user.email).toBe(validLoginDto.email)

      // Step 3: Verify public route still works
      await request(app.getHttpServer()).get('/auth/public').expect(200)
    }, 15000)

    it('should maintain security on protected routes / debería mantener seguridad en rutas protegidas', async () => {
      // Test without authentication
      await request(app.getHttpServer()).get('/auth/test').expect(401)

      // Test with invalid token
      await request(app.getHttpServer()).get('/auth/test').set('Authorization', 'Bearer invalid-token').expect(401)
    }, 5000)
  })

  describe('Error handling and edge cases / Manejo de errores y casos extremos', () => {
    it('should handle concurrent login requests / debería manejar peticiones de login concurrentes', async () => {
      const validLoginDto = createLoginDtoFixture()

      // Send multiple concurrent requests
      const requests = Array(3)
        .fill(null)
        .map(() => request(app.getHttpServer()).post('/auth/login').send(validLoginDto).expect(200))

      const responses = await Promise.all(requests)

      // All should succeed and return valid tokens
      responses.forEach((response) => {
        expect(response.body).toHaveProperty('accessToken')
        expect(response.body).toHaveProperty('user')
      })
    }, 10000)

    it('should reject requests with extra fields / debería rechazar peticiones con campos extra', async () => {
      const invalidPayload = {
        ...createLoginDtoFixture(),
        extraField: 'should not be allowed',
        anotherField: 'also invalid',
      }

      const response = await request(app.getHttpServer()).post('/auth/login').send(invalidPayload).expect(400)

      expect(response.body).toHaveProperty('statusCode', 400)
      expect(response.body.message).toEqual(
        expect.arrayContaining([
          expect.stringContaining('extraField should not exist'),
          expect.stringContaining('anotherField should not exist'),
        ]),
      )
    }, 5000)
  })
})
