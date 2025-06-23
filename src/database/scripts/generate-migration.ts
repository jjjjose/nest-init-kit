#!/usr/bin/env ts-node

import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

/**
 * Generate migration script / Script para generar migraciones
 * Usage: npm run migration:generate -- CreateUserTable
 * Uso: npm run migration:generate -- CreateUserTable
 */
async function generateMigration() {
  const migrationName = process.argv[2]

  if (!migrationName) {
    console.error('❌ Migration name is required')
    console.error('Usage: npm run migration:generate -- CreateUserTable')
    console.error('Uso: npm run migration:generate -- CreateUserTable')
    process.exit(1)
  }

  try {
    console.log(`🔄 Generating migration: ${migrationName}`)

    const { stdout, stderr } = await execAsync(
      `pnpm typeorm-ts-node-commonjs -d ormconfig.ts migration:generate src/database/migrations/${migrationName}`,
    )

    if (stderr) {
      console.error('⚠️  Warning:', stderr)
    }

    console.log(stdout)
    console.log(`✅ Migration ${migrationName} generated successfully`)
  } catch (error) {
    console.error('❌ Error generating migration:', error)
    process.exit(1)
  }
}

void generateMigration()
