import { NestFactory } from '@nestjs/core'
import { DataSource } from 'typeorm'
import { AppModule } from '../../app.module'
import { UserSeeder } from './user.seeder'

/**
 * Script to run seeders / Script para ejecutar seeders
 */
async function runSeeders() {
  console.log('🌱 Starting seeders...')

  try {
    // Crear aplicación NestJS
    const app = await NestFactory.createApplicationContext(AppModule)

    // Obtener DataSource
    const dataSource = app.get(DataSource)

    // Verificar conexión
    if (!dataSource.isInitialized) {
      await dataSource.initialize()
    }

    console.log('📊 Database connection established')

    // Ejecutar seeders
    const userSeeder = new UserSeeder(dataSource)
    await userSeeder.run()

    console.log('✅ All seeders executed successfully')

    // Cerrar aplicación
    await app.close()
    process.exit(0)
  } catch (error) {
    console.error('❌ Error executing seeders:', error)
    process.exit(1)
  }
}

/**
 * Script to clean data / Script para limpiar datos
 */
async function dropData() {
  console.log('🗑️  Starting data cleanup...')

  try {
    const app = await NestFactory.createApplicationContext(AppModule)
    const dataSource = app.get(DataSource)

    if (!dataSource.isInitialized) {
      await dataSource.initialize()
    }

    // Limpiar datos
    const userSeeder = new UserSeeder(dataSource)
    await userSeeder.drop()

    console.log('✅ Data cleaned successfully')

    await app.close()
    process.exit(0)
  } catch (error) {
    console.error('❌ Error cleaning data:', error)
    process.exit(1)
  }
}

// Ejecutar según argumentos de línea de comandos
const command = process.argv[2]

switch (command) {
  case 'run':
    void runSeeders()
    break
  case 'drop':
    void dropData()
    break
  default:
    console.log('Usage: npm run seed [run|drop]')
    console.log('  run  - Execute seeders')
    console.log('  drop - Clean data')
    process.exit(1)
}
