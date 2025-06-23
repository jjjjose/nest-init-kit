import { DataSource } from 'typeorm'
import * as bcrypt from 'bcryptjs'
import { UserEntity } from '../entities/user.entity'
import { Role } from '../../shared/enums/role.enum'

/**
 * User seeder / Seeder de usuarios
 * Creates initial system users / Crea usuarios iniciales del sistema
 */
export class UserSeeder {
  constructor(private dataSource: DataSource) {}

  /**
   * Run seeder / Ejecutar seeder
   */
  async run(): Promise<void> {
    const userRepository = this.dataSource.getRepository(UserEntity)

    // Verificar si ya existen usuarios
    const existingUsersCount = await userRepository.count()
    if (existingUsersCount > 0) {
      console.log('👥 Users already exist, skipping seeder')
      return
    }

    console.log('👥 Creating initial users...')

    // Contraseña por defecto hasheada
    const defaultPassword = await bcrypt.hash('password123', 10)

    // Crear super administrador
    const superAdmin = userRepository.create({
      email: 'superadmin@example.com',
      password: defaultPassword,
      name: 'Super Administrator',
      role: Role.SUPERADMIN,
      isActive: true,
      emailVerifiedAt: new Date(),
    })

    // Crear administrador
    const admin = userRepository.create({
      email: 'admin@example.com',
      password: defaultPassword,
      name: 'Administrator',
      role: Role.ADMIN,
      isActive: true,
      emailVerifiedAt: new Date(),
    })

    // Crear usuario regular
    const user = userRepository.create({
      email: 'user@example.com',
      password: defaultPassword,
      name: 'Regular User',
      role: Role.USER,
      isActive: true,
      emailVerifiedAt: new Date(),
    })

    // Crear usuario de prueba inactivo
    const inactiveUser = userRepository.create({
      email: 'inactive@example.com',
      password: defaultPassword,
      name: 'Inactive User',
      role: Role.USER,
      isActive: false,
    })

    // Guardar usuarios
    await userRepository.save([superAdmin, admin, user, inactiveUser])

    console.log('✅ Users created successfully:')
    console.log('  - superadmin@example.com (Super Admin)')
    console.log('  - admin@example.com (Admin)')
    console.log('  - user@example.com (User)')
    console.log('  - inactive@example.com (Inactive User)')
    console.log('  Password for all: password123')
  }

  /**
   * Clean data / Limpiar datos
   */
  async drop(): Promise<void> {
    const userRepository = this.dataSource.getRepository(UserEntity)
    await userRepository.clear()
    console.log('🗑️  Users deleted')
  }
}
