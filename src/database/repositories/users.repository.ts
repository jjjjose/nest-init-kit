import { Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { BaseRepository } from './base.repository'
import { UserEntity } from '../entities/user.entity'
import { Role } from '../../shared/enums/role.enum'
import { InjectDefaultDB } from 'src/shared'

/**
 * Users repository / Repositorio de usuarios
 * Extends base repository with user-specific operations / Extiende el repositorio base con operaciones específicas de usuarios
 */
@Injectable()
export class UserRepository extends BaseRepository<UserEntity> {
  constructor(
    @InjectDefaultDB()
    private dataSource: DataSource,
  ) {
    super(UserEntity, dataSource.createEntityManager())
  }

  /**
   * Find user by email / Buscar usuario por email
   */
  async findByEmail(email: string): Promise<UserEntity | null> {
    return await this.findOne({
      where: { email },
    })
  }

  /**
   * Find user by email and password / Buscar usuario por email y contraseña
   * Validates password against stored hash / Valida contraseña contra hash almacenado
   */
  async findByEmailAndPassword(email: string, password: string): Promise<UserEntity | null> {
    const user = await this.createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne()

    if (!user) return null

    const isPasswordValid = await user.verifyPassword(password)

    if (!isPasswordValid) return null

    // Remove password from returned object for security / Remover contraseña del objeto retornado por seguridad
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...userWithoutPassword } = user

    return userWithoutPassword as UserEntity
  }

  /**
   * Find user by email or fail / Buscar usuario por email con validación
   */
  async findByEmailOrFail(email: string): Promise<UserEntity> {
    const user = await this.findByEmail(email)
    if (!user) {
      throw new Error(`User with email ${email} not found`)
    }
    return user
  }

  /**
   * Check if email exists / Verificar si existe un email
   */
  async emailExists(email: string, excludeId?: number): Promise<boolean> {
    const query = this.createQueryBuilder('user').where('user.email = :email', { email })

    if (excludeId) {
      query.andWhere('user.id != :excludeId', { excludeId })
    }

    const count = await query.getCount()
    return count > 0
  }

  /**
   * Find users by role / Buscar usuarios por rol
   */
  async findByRole(role: Role): Promise<UserEntity[]> {
    return await this.find({
      where: { role },
      order: { createdAt: 'DESC' },
    })
  }

  /**
   * Find active users / Buscar usuarios activos
   */
  async findActiveUsers(): Promise<UserEntity[]> {
    return await this.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    })
  }

  /**
   * Find inactive users / Buscar usuarios inactivos
   */
  async findInactiveUsers(): Promise<UserEntity[]> {
    return await this.find({
      where: { isActive: false },
      order: { updatedAt: 'DESC' },
    })
  }

  /**
   * Find user by verification token / Buscar usuarios por token de verificación
   */
  async findByEmailVerificationToken(token: string): Promise<UserEntity | null> {
    return await this.findOne({
      where: { emailVerificationToken: token },
    })
  }

  /**
   * Find user by password reset token / Buscar usuarios por token de reseteo
   */
  async findByPasswordResetToken(token: string): Promise<UserEntity | null> {
    return await this.createQueryBuilder('user')
      .where('user.passwordResetToken = :token', { token })
      .andWhere('user.passwordResetExpiresAt > :now', { now: new Date() })
      .getOne()
  }

  /**
   * Activate user / Activar usuario
   */
  async activateUser(id: number): Promise<UserEntity> {
    await this.update(id, { isActive: true })
    return await this.findByIdOrFail(id)
  }

  /**
   * Deactivate user / Desactivar usuario
   */
  async deactivateUser(id: number): Promise<UserEntity> {
    await this.update(id, { isActive: false })
    return await this.findByIdOrFail(id)
  }

  /**
   * Update password / Actualizar contraseña
   */
  async updatePassword(id: number, hashedPassword: string): Promise<UserEntity> {
    await this.createQueryBuilder()
      .update(UserEntity)
      .set({
        password: hashedPassword,
        passwordResetToken: () => 'NULL',
        passwordResetExpiresAt: () => 'NULL',
      })
      .where('id = :id', { id })
      .execute()
    return await this.findByIdOrFail(id)
  }

  /**
   * Verify email / Verificar email
   */
  async verifyEmail(id: number): Promise<UserEntity> {
    await this.createQueryBuilder()
      .update(UserEntity)
      .set({
        emailVerifiedAt: new Date(),
        emailVerificationToken: () => 'NULL',
      })
      .where('id = :id', { id })
      .execute()
    return await this.findByIdOrFail(id)
  }

  /**
   * Set verification token / Establecer token de verificación
   */
  async setEmailVerificationToken(id: number, token: string): Promise<UserEntity> {
    await this.update(id, { emailVerificationToken: token })
    return await this.findByIdOrFail(id)
  }

  /**
   * Set password reset token / Establecer token de reseteo de contraseña
   */
  async setPasswordResetToken(id: number, token: string, expiresAt: Date): Promise<UserEntity> {
    await this.update(id, {
      passwordResetToken: token,
      passwordResetExpiresAt: expiresAt,
    })
    return await this.findByIdOrFail(id)
  }

  /**
   * Count users by role / Contar usuarios por rol
   */
  async countByRole(role: Role): Promise<number> {
    return await this.count({ where: { role } })
  }

  /**
   * Find admin users / Buscar usuarios administradores
   */
  async findAdminUsers(): Promise<UserEntity[]> {
    return await this.createQueryBuilder('user')
      .where('user.role IN (:...roles)', { roles: [Role.ADMIN, Role.SUPERADMIN] })
      .andWhere('user.isActive = :isActive', { isActive: true })
      .orderBy('user.role', 'DESC')
      .addOrderBy('user.name', 'ASC')
      .getMany()
  }

  /**
   * Find users with advanced filters / Buscar usuarios con filtros avanzados
   */
  async findWithFilters(filters: {
    search?: string
    role?: Role
    isActive?: boolean
    emailVerified?: boolean
    page?: number
    limit?: number
  }): Promise<{
    data: UserEntity[]
    total: number
    page: number
    limit: number
    totalPages: number
  }> {
    const { search, role, isActive, emailVerified, page = 1, limit = 10 } = filters
    const skip = (page - 1) * limit

    const query = this.createQueryBuilder('user')

    if (search) {
      query.andWhere('(user.name ILIKE :search OR user.email ILIKE :search)', { search: `%${search}%` })
    }

    if (role !== undefined) {
      query.andWhere('user.role = :role', { role })
    }

    if (isActive !== undefined) {
      query.andWhere('user.isActive = :isActive', { isActive })
    }

    if (emailVerified !== undefined) {
      if (emailVerified) {
        query.andWhere('user.emailVerifiedAt IS NOT NULL')
      } else {
        query.andWhere('user.emailVerifiedAt IS NULL')
      }
    }

    query.orderBy('user.createdAt', 'DESC').skip(skip).take(limit)

    const [data, total] = await query.getManyAndCount()
    const totalPages = Math.ceil(total / limit)

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    }
  }
}
