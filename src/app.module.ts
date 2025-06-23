import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common'
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { ConfigModule } from '@nestjs/config'
import { validate } from './config/env.validation'
import { DatabaseModule } from './database/database.module'
import { SharedModule } from './shared/shared.module'
import { AuthModule } from './features/auth/auth.module'
import { JwtAuthGuard } from './features/auth/guards/jwt-auth.guard'
import { MyJwtModule } from './shared/jwt/my-jwt.module'
import { RequestLoggingInterceptor } from './shared/interceptors/request-logging.interceptor'
import { RequestLoggingMiddleware } from './shared/middleware/request-logging.middleware'
import { RepositoriesModule } from './database/repositories.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    DatabaseModule,
    RepositoriesModule,
    SharedModule,
    AuthModule,
    MyJwtModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Configure JWT Auth Guard globally / Configurar Guard de autenticación JWT globalmente
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Configure Request Logging Interceptor globally / Configurar Interceptor de logging de requests globalmente
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestLoggingInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  /**
   * Configure middleware to run on all routes
   * Configurar middleware para ejecutarse en todas las rutas
   */
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggingMiddleware).forRoutes('*')
  }
}
