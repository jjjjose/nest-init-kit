import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  validateSync,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator'
import { Transform, plainToClass } from 'class-transformer'
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'

// Custom decorator to validate certificate files
function IsFileExists(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isFileExists',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          if (!value) return true // If optional and not defined, it's valid
          if (typeof value !== 'string') return false
          const filePath = resolve(value)
          return existsSync(filePath)
        },
        defaultMessage(args: ValidationArguments) {
          return `File not found: ${args.value}`
        },
      },
    })
  }
}

// Decorator to validate certificate content (PEM format)
function IsPemCertificate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isPemCertificate',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          if (!value) return true
          if (typeof value !== 'string') return false

          let content = value
          // If it's a file path, read the content
          if (!value.includes('-----')) {
            try {
              const filePath = resolve(value)
              if (!existsSync(filePath)) return false
              content = readFileSync(filePath, 'utf8')
            } catch {
              return false
            }
          }

          // Validate PEM format
          const pemRegex = /-----BEGIN [A-Z\s]+-----[\s\S]*-----END [A-Z\s]+-----/
          return pemRegex.test(content)
        },
        defaultMessage() {
          return 'Must be a valid certificate in PEM format'
        },
      },
    })
  }
}

export class EnvironmentVariables {
  // === SERVER ===
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  @IsNumber()
  @IsOptional()
  SERVER_PORT: number = 3000

  // === DATABASE ===
  @IsString()
  DB_HOST: string

  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  @IsNumber()
  DB_PORT: number

  @IsString()
  DB_USERNAME: string

  @IsString()
  DB_PASSWORD: string

  @IsString()
  DB_DATABASE: string

  @Transform(({ value }: { value: string }) => value === 'true')
  @IsBoolean()
  @IsOptional()
  DATABASE_SSL_DISABLE_REJECT_UNAUTHORIZED: boolean = false

  // === JWT CONFIGURATION (RS256 with certificates) ===
  @IsString()
  @IsFileExists({ message: 'JWT private key file not found' })
  @IsPemCertificate({ message: 'JWT private key must be in PEM format' })
  JWT_PRIVATE_KEY_PATH: string

  @IsString()
  @IsFileExists({ message: 'JWT public key file not found' })
  @IsPemCertificate({ message: 'JWT public key must be in PEM format' })
  JWT_PUBLIC_KEY_PATH: string

  @IsString()
  @IsOptional()
  JWT_EXPIRATION: string = '15m'

  @IsString()
  @IsOptional()
  JWT_REFRESH_EXPIRATION: string = '7d'

  @IsString()
  @IsOptional()
  JWT_ISSUER: string = 'nestjs-api'

  @IsString()
  @IsOptional()
  JWT_AUDIENCE: string = 'nestjs-client'

  // === EMAIL/MAIL ===
  @IsString()
  @IsOptional()
  MAIL_USER?: string

  @IsString()
  @IsOptional()
  MAIL_PASSWORD?: string

  @IsString()
  @IsOptional()
  MAIL_SERVICE: string = 'gmail'

  // === KAFKA ===
  @IsString()
  @IsOptional()
  KAFKA_BROKERS?: string
}

/**
 * Main environment variables validation function
 * Used in ConfigModule.forRoot({ validate })
 */
export function validate(config: Record<string, unknown>): EnvironmentVariables {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  })

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  })

  if (errors.length > 0) {
    const errorMessages = errors
      .map((error) => {
        const constraints = Object.values(error.constraints || {})
        return `${error.property}: ${constraints.join(', ')}`
      })
      .join('\n')

    throw new Error(`❌ Invalid environment variables:\n${errorMessages}`)
  }

  return validatedConfig
}

/**
 * Production-specific validation
 * Verifies that all critical variables are defined
 */
export function validateProductionEnv(config: EnvironmentVariables) {
  const requiredInProduction = [
    'DB_HOST',
    'DB_USERNAME',
    'DB_PASSWORD',
    'DB_DATABASE',
    'JWT_PRIVATE_KEY_PATH',
    'JWT_PUBLIC_KEY_PATH',
  ]

  for (const field of requiredInProduction) {
    if (!config[field as keyof EnvironmentVariables]) {
      throw new Error(`❌ Environment variable required in production: ${field}`)
    }
  }

  // Validate that JWT certificates exist
  if (!existsSync(resolve(config.JWT_PRIVATE_KEY_PATH))) {
    throw new Error(`❌ JWT private key file not found: ${config.JWT_PRIVATE_KEY_PATH}`)
  }

  if (!existsSync(resolve(config.JWT_PUBLIC_KEY_PATH))) {
    throw new Error(`❌ JWT public key file not found: ${config.JWT_PUBLIC_KEY_PATH}`)
  }

  // Validate KAFKA_BROKERS JSON format (if present)
  if (config.KAFKA_BROKERS) {
    try {
      JSON.parse(config.KAFKA_BROKERS)
    } catch {
      throw new Error('❌ KAFKA_BROKERS must be a valid JSON with array of brokers')
    }
  }
}

/**
 * Helper to get typed configuration
 */
export function getTypedConfig(): EnvironmentVariables {
  return validate(process.env)
}

/**
 * Helper to check if we are in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * Helper to check if we are in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development' || !process.env.NODE_ENV
}

/**
 * Helper to get parsed Kafka brokers
 */
export function getKafkaBrokers(config: EnvironmentVariables): string[] {
  if (!config.KAFKA_BROKERS) {
    return []
  }

  try {
    const parsed = JSON.parse(config.KAFKA_BROKERS) as string[]
    if (!Array.isArray(parsed) || !parsed.every((item) => typeof item === 'string')) {
      throw new Error('KAFKA_BROKERS must be an array of strings')
    }
    return parsed
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error parsing KAFKA_BROKERS: ${error.message}`)
    }
    throw new Error('Error parsing KAFKA_BROKERS - must be a valid JSON')
  }
}
