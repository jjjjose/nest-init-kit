import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'
import { AllExceptionsFilter } from './shared/filters/all-exceptions.filter'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

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

  await app.listen(process.env.PORT ?? 3000)
}

void bootstrap()
