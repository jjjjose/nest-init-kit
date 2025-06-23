import { NestFactory } from '@nestjs/core'
import { ValidationPipe, Logger } from '@nestjs/common'
import { AppModule } from './app.module'
import { AllExceptionsFilter } from './shared/filters/all-exceptions.filter'
import { EnvService } from './shared'

// Set timezone to UTC / Establecer zona horaria a UTC
process.env.TZ = 'UTC'
async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Enable CORS with basic settings / Habilitar CORS con configuraciones básicas
  // app.enableCors({
  //   origin: true, // Allow all origins in development / Permitir todos los orígenes en desarrollo
  //   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Allowed HTTP methods / Métodos HTTP permitidos
  //   allowedHeaders: ['Content-Type', 'Authorization', 'Accept'], // Allowed headers / Headers permitidos
  //   credentials: true, // Allow credentials / Permitir credenciales
  // })

  // Alternative: Enable CORS with full permissive settings (accept everything)
  // Alternativa: Habilitar CORS con configuraciones totalmente permisivas (acepta todo)

  app.enableCors({
    origin: '*', // Allow all origins / Permitir todos los orígenes
    //   methods: '*', // Allow all HTTP methods / Permitir todos los métodos HTTP
    //   allowedHeaders: '*', // Allow all headers / Permitir todos los headers
    credentials: true, // Allow credentials / Permitir credenciales
    //   credentials: false, // Disable credentials for wildcard origin / Deshabilitar credenciales para origen comodín
    //   optionsSuccessStatus: 200, // Some legacy browsers choke on 204 / Algunos navegadores antiguos fallan con 204
    //   preflightContinue: false, // Pass control to next handler / Pasar control al siguiente manejador
    //   exposedHeaders: ['X-Total-Count', 'X-Page-Count'], // Headers exposed to client / Headers expuestos al cliente
  })

  // Apply global validation pipe / Aplicar pipe de validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove properties not in DTO / Remover propiedades no en DTO
      forbidNonWhitelisted: true, // Throw error for unknown properties / Error para propiedades desconocidas
      transform: true, // Transform payload to DTO instance / Transformar payload a instancia DTO
      disableErrorMessages: false, // Keep validation error messages / Mantener mensajes de error de validación
    }),
  )

  // Apply global exception filter / Aplicar filtro global de excepciones
  app.useGlobalFilters(new AllExceptionsFilter())

  const env = app.get(EnvService)
  const port = env.serverPort ?? 3000
  await app.listen(port)

  // Log server running URL / Registrar URL del servidor en ejecución
  const logger = new Logger('Bootstrap')
  let serverUrl = await app.getUrl()
  if (serverUrl.includes('[::1]')) serverUrl = serverUrl.replace('[::1]', 'localhost')

  // Get current time and timezone info / Obtener hora actual e información de zona horaria
  const currentTime = new Date().toISOString()

  const stipulatedTimezone = process.env.TZ || 'UTC'

  logger.verbose(`🚀 Server is running on: ${serverUrl}`)
  logger.verbose(`🚀 Servidor ejecutándose en: ${serverUrl}`)
  logger.verbose(`🕐 Stipulated timezone: ${stipulatedTimezone}`)
  logger.verbose(`🕐 Zona horaria estipulada: ${stipulatedTimezone}`)
  logger.verbose(`⏰ Current time (ISO): ${currentTime}`)
  logger.verbose(`⏰ Hora actual (ISO): ${currentTime}`)
}

void bootstrap()
