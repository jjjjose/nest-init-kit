import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import { AppModule } from './../src/app.module'
import { App } from 'supertest/types'

describe('AppController (e2e)', () => {
  let app: INestApplication<App>

  beforeAll(async () => {
    // Set test environment variables
    // process.env.NODE_ENV = 'test'
    // process.env.JWT_PRIVATE_KEY_PATH = './.certs/jwt-private.pem'
    // process.env.JWT_PUBLIC_KEY_PATH = './.certs/jwt-public.pem'
    // process.env.JWT_EXPIRATION = '15m'
    // process.env.JWT_REFRESH_EXPIRATION = '7d'
    // process.env.JWT_ISSUER = 'nestjs-api'
    // process.env.JWT_AUDIENCE = 'nestjs-client'

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()
  }, 120000) // 2 minutes timeout for module setup

  afterAll(async () => {
    await app.close()
  })

  it('/ (GET)', async () => {
    const response = await request(app.getHttpServer()).get('/').expect(200)

    expect(response.body).toEqual({ message: 'Hello World' })
  }, 10000) // 10 seconds timeout for the test
})
