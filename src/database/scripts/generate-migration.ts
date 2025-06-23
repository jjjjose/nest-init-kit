#!/usr/bin/env ts-node

import { exec } from 'child_process'
import { promisify } from 'util'
import { Logger } from '@nestjs/common'

const execAsync = promisify(exec)
const logger = new Logger('GenerateMigrationScript')

/**
 * Generate migration script / Script para generar migraciones
 * Usage: npm run migration:generate -- CreateUserTable
 * Uso: npm run migration:generate -- CreateUserTable
 */
async function generateMigration() {
  const migrationName = process.argv[2]

  if (!migrationName) {
    logger.error('❌ Migration name is required')
    logger.error('Usage: npm run migration:generate -- CreateUserTable')
    logger.error('Uso: npm run migration:generate -- CreateUserTable')
    process.exit(1)
  }

  try {
    logger.log(`🔄 Generating migration: ${migrationName}`)

    const { stdout, stderr } = await execAsync(
      `pnpm typeorm-ts-node-commonjs -d ormconfig.ts migration:generate src/database/migrations/${migrationName}`,
    )

    if (stderr) {
      logger.warn('⚠️  Warning:', stderr)
    }

    logger.log(stdout)
    logger.log(`✅ Migration ${migrationName} generated successfully`)
  } catch (error) {
    logger.error('❌ Error generating migration:', error)
    process.exit(1)
  }
}

void generateMigration()
