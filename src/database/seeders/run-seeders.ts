import { Logger } from '@nestjs/common'
import { UserSeeder } from './user.seeder'
import { SeederDataSource } from './seeder-datasource'

const logger = new Logger('RunSeeders')

/**
 * Script to run seeders / Script para ejecutar seeders
 */
async function runSeeders() {
  logger.log('🌱 Starting seeders...')

  try {
    // Obtener DataSource inicializado
    const dataSource = await SeederDataSource.getInstance()

    logger.log('📊 Database connection established')

    // Ejecutar seeders
    const userSeeder = new UserSeeder(dataSource)
    await userSeeder.run()

    logger.log('✅ All seeders executed successfully')

    // Cerrar conexión
    await SeederDataSource.close()
    process.exit(0)
  } catch (error) {
    logger.error('❌ Error executing seeders:', error)
    process.exit(1)
  }
}

/**
 * Script to clean data / Script para limpiar datos
 */
async function dropData() {
  logger.log('🗑️  Starting data cleanup...')

  try {
    // Obtener DataSource inicializado
    const dataSource = await SeederDataSource.getInstance()

    // Limpiar datos
    const userSeeder = new UserSeeder(dataSource)
    await userSeeder.drop()

    logger.log('✅ Data cleaned successfully')

    // Cerrar conexión
    await SeederDataSource.close()
    process.exit(0)
  } catch (error) {
    logger.error('❌ Error cleaning data:', error)
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
    logger.log('Usage: npm run seed [run|drop]')
    logger.log('  run  - Execute seeders')
    logger.log('  drop - Clean data')
    process.exit(1)
}
