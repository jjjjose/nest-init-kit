#!/usr/bin/env ts-node

import { exec } from 'child_process'
import { promisify } from 'util'
import { Logger } from '@nestjs/common'

const execAsync = promisify(exec)
const logger = new Logger('CreateMigrationScript')

/**
 * Create empty migration script / Script para crear migraciones vacías
 * Usage: npm run migration:create -- CreateIndexes
 * Uso: npm run migration:create -- CreateIndexes
 */
async function createMigration() {
  const migrationName = process.argv[2]

  if (!migrationName) {
    logger.error('❌ Migration name is required')
    logger.error('Usage: npm run migration:create -- CreateIndexes')
    logger.error('Uso: npm run migration:create -- CreateIndexes')
    process.exit(1)
  }

  try {
    logger.log(`🔄 Creating blank migration: ${migrationName}`)

    const { stdout, stderr } = await execAsync(
      `pnpm typeorm-ts-node-commonjs migration:create src/database/migrations/${migrationName}`,
    )

    if (stderr) {
      logger.warn('⚠️  Warning:', stderr)
    }

    logger.log(stdout)
    logger.log(`✅ Blank migration ${migrationName} created successfully`)
  } catch (error) {
    logger.error('❌ Error creating migration:', error)
    process.exit(1)
  }
}

void createMigration()
