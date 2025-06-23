import { Injectable } from '@nestjs/common'

@Injectable()
export class AppService {
  constructor() {}

  /**
   * Get application info with environment details / Obtener información de la aplicación con detalles del entorno
   */
  getHello(): object {
    return {
      message: 'NestJS API is running',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    }
  }
}
