#!/usr/bin/env ts-node

import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

/**
 * Create empty migration script / Script para crear migraciones vacías
 * Usage: npm run migration:create -- CreateIndexes
 * Uso: npm run migration:create -- CreateIndexes
 */
async function createMigration() {
  const migrationName = process.argv[2]

  if (!migrationName) {
    console.error('❌ Migration name is required')
    console.error('Usage: npm run migration:create -- CreateIndexes')
    console.error('Uso: npm run migration:create -- CreateIndexes')
    process.exit(1)
  }

  try {
    console.log(`🔄 Creating blank migration: ${migrationName}`)

    const { stdout, stderr } = await execAsync(
      `pnpm typeorm-ts-node-commonjs migration:create src/database/migrations/${migrationName}`,
    )

    if (stderr) {
      console.error('⚠️  Warning:', stderr)
    }

    console.log(stdout)
    console.log(`✅ Blank migration ${migrationName} created successfully`)
  } catch (error) {
    console.error('❌ Error creating migration:', error)
    process.exit(1)
  }
}

void createMigration()
