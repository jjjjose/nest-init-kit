import { Controller, Get, Req } from '@nestjs/common'
import { AppService } from './app.service'
import { Public } from './shared/decorators/public.decorator'
import { Request } from 'express'

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Public route - accessible without authentication
   * Ruta pública - accesible sin autenticación
   */
  @Public()
  @Get()
  getHello(): object {
    return this.appService.getHello()
  }

  /**
   * Protected route - requires authentication
   * Ruta protegida - requiere autenticación
   */
  @Get('protected')
  getProtected(@Req() req: Request): object {
    return {
      message: 'This is a protected route / Esta es una ruta protegida',
      user: req.user,
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Another public route for testing
   * Otra ruta pública para pruebas
   */
  @Public()
  @Get('info')
  getInfo(): object {
    return {
      message: 'NestJS Authentication System / Sistema de Autenticación NestJS',
      version: '1.0.0',
      features: [
        'JWT Authentication / Autenticación JWT',
        'Public Routes / Rutas Públicas',
        'Protected Routes / Rutas Protegidas',
        'Global Auth Guard / Guard de Autenticación Global',
      ],
    }
  }
}
