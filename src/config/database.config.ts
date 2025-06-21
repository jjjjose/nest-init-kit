import { DataSourceOptions } from 'typeorm'
import { EnvService } from 'src/shared'

/**
 * Database configuration factory for TypeORM module
 * Configuración de la base de datos usando TypeORM para el módulo
 *
 * @param configService - NestJS configuration service / Servicio de configuración de NestJS
 * @returns TypeORM configuration options / Opciones de configuración de TypeORM
 */
export const databaseConfig = (env: EnvService): DataSourceOptions => {
  const sslEnabled = env.databaseSsl

  return {
    type: 'postgres',
    schema: 'public',
    host: env.dbHost,
    port: env.dbPort,
    username: env.dbUsername,
    password: env.dbPassword,
    database: env.dbDatabase,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
    migrationsTableName: 'migrations',
    ssl: sslEnabled ? { rejectUnauthorized: false } : undefined,
  }
}

// /**
//  * Alternative using EnvService - more readable and type-safe
//  * Alternativa usando EnvService - más legible y con seguridad de tipos
//  *
//  * Example of how to use EnvService in database configuration:
//  * Ejemplo de cómo usar EnvService en la configuración de base de datos:
//  *
//  * export const databaseConfigWithEnvService = (envService: EnvService): TypeOrmModuleOptions => {
//  *   const isDev = envService.isDevelopment
//  *
//  *   return {
//  *     type: 'postgres',
//  *     host: envService.dbHost,
//  *     port: envService.dbPort,
//  *     username: envService.dbUsername,
//  *     password: envService.dbPassword,
//  *     database: envService.dbDatabase,
//  *
//  *     // Or use the convenience method / O usar el método de conveniencia
//  *     url: envService.getDatabaseUrl(),
//  *
//  *     ssl: envService.isProduction ? { rejectUnauthorized: false } : false,
//  *     synchronize: isDev,
//  *     logging: isDev ? ['query', 'error'] : ['error'],
//  *
//  *     entities: [__dirname + '/../**/*.entity{.ts,.js}'],
//  *     migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
//  *     migrationsTableName: 'migrations',
//  *   } as TypeOrmModuleOptions
//  * }
//  */

// /**
//  * Multiple database configurations factory
//  * Factory de configuraciones para múltiples bases de datos
//  *
//  * @param configService - NestJS configuration service / Servicio de configuración de NestJS
//  * @returns Map with database configurations / Mapa con configuraciones de base de datos
//  */
// export const getMultipleDatabaseConfigs = (
//   configService: ConfigService<EnvironmentVariables>,
// ): Map<string, DataSourceOptions> => {
//   const baseConfig = getBaseConfig(configService)
//   const configs = new Map<string, DataSourceOptions>()

//   // Default/Main database configuration / Configuración de base de datos principal
//   configs.set(DatabaseConnection.DEFAULT, {
//     ...baseConfig,
//     name: DatabaseConnection.DEFAULT,
//     database: configService.get('DB_DATABASE'),
//     entities: [__dirname + '/../**/*.entity{.ts,.js}'],
//     migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
//     migrationsTableName: 'migrations',
//     extra: {
//       ...baseConfig.extra,
//       connectionLimit: 15, // More connections for main DB
//     },
//   } as DataSourceOptions)

//   // Users database configuration / Configuración de base de datos de usuarios
//   configs.set(DatabaseConnection.USERS, {
//     ...baseConfig,
//     name: DatabaseConnection.USERS,
//     database: `${configService.get('DB_DATABASE')}_users`,
//     entities: [__dirname + '/../users/**/*.entity{.ts,.js}'],
//     extra: {
//       ...baseConfig.extra,
//       connectionLimit: 8,
//     },
//   } as DataSourceOptions)

//   // Logs database configuration / Configuración de base de datos de logs
//   configs.set(DatabaseConnection.LOGS, {
//     ...baseConfig,
//     name: DatabaseConnection.LOGS,
//     database: `${configService.get('DB_DATABASE')}_logs`,
//     entities: [__dirname + '/../logs/**/*.entity{.ts,.js}'],
//     logging: false, // Disable logging for logs DB to avoid recursion
//     extra: {
//       ...baseConfig.extra,
//       connectionLimit: 5,
//     },
//   } as DataSourceOptions)

//   // Analytics database configuration / Configuración de base de datos de analytics
//   configs.set(DatabaseConnection.ANALYTICS, {
//     ...baseConfig,
//     name: DatabaseConnection.ANALYTICS,
//     database: `${configService.get('DB_DATABASE')}_analytics`,
//     entities: [__dirname + '/../analytics/**/*.entity{.ts,.js}'],
//     logging: false,
//     extra: {
//       ...baseConfig.extra,
//       connectionLimit: 5,
//     },
//   } as DataSourceOptions)

//   // Cache database configuration / Configuración de base de datos de cache
//   configs.set(DatabaseConnection.CACHE, {
//     ...baseConfig,
//     name: DatabaseConnection.CACHE,
//     database: `${configService.get('DB_DATABASE')}_cache`,
//     entities: [__dirname + '/../cache/**/*.entity{.ts,.js}'],
//     logging: false,
//     synchronize: true, // Cache DB can be recreated
//     extra: {
//       ...baseConfig.extra,
//       connectionLimit: 3,
//     },
//   } as DataSourceOptions)

//   return configs
// }
