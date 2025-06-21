import { Injectable } from '@nestjs/common'

@Injectable()
export class AppService {
  constructor() {}

  /**
   * Get application info with environment details
   * Obtener información de la aplicación con detalles del entorno
   */
  getHello(): object {
    return {
      message: 'Hello World',
    }
  }
}
