import { Logger } from '@nestjs/common'
import { EnvService } from './src/shared/services/env.service'
import { DataSource, DataSourceOptions } from 'typeorm'

const logger = new Logger('ormconfig.ts')

const env = new EnvService()

/**
 * TypeORM DataSource configuration for migrations / Configuración de DataSource de TypeORM para migraciones
 * This file is used by TypeORM CLI for running migrations / Este archivo es usado por la CLI de TypeORM para ejecutar migraciones
 */
const data: DataSourceOptions = {
  type: 'postgres',
  host: env.dbHost,
  port: env.dbPort,
  username: env.dbUsername,
  password: env.dbPassword,
  database: env.dbDatabase,
  schema: 'public',

  // Entity and migration paths / Rutas de entidades y migraciones
  entities: ['src/**/*.entity.{ts,js}'],
  migrations: ['src/database/migrations/*.{ts,js}'],

  // Migration settings / Configuraciones de migraciones
  migrationsTableName: 'migrations_typeorm',
  migrationsRun: false,

  // SSL configuration / Configuración SSL
  ssl: env.databaseSsl ? { rejectUnauthorized: false } : false,

  // Synchronize should be false in production / Synchronize debe ser false en producción
  synchronize: false,

  // Logging configuration / Configuración de logging
  // logging: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],

  // Connection pool settings / Configuraciones del pool de conexiones
  // extra: {
  //   connectionLimit: 10,
  //   acquireTimeout: 60000,
  //   timeout: 60000,
  // },
}

logger.log('datasource', JSON.stringify(data, null, 2))
export const datasource = new DataSource(data)
