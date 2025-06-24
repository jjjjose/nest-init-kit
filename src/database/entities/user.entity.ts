import { Entity, Column, Index, BeforeInsert, BeforeUpdate } from 'typeorm'
import { BaseEntity } from './base.entity'
import { Role } from '../../shared/enums/role.enum'
import { randomBytes } from 'crypto'
import { compare, hash } from 'bcryptjs'

/**
 * User Entity / Entidad Usuario
 * Represents system users / Representa los usuarios del sistema
 */
@Entity('users')
@Index(['email'], { unique: true })
export class UserEntity extends BaseEntity {
  /**
   * User email (unique) / Email del usuario (único)
   */
  @Column({
    type: 'varchar',
    length: 255,
    unique: true,
    nullable: false,
    comment: 'Unique user email',
  })
  email: string

  /**
   * Hashed password / Contraseña hasheada
   */
  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    select: false,
    comment: 'User hashed password',
  })
  password: string

  /**
   * User full name / Nombre completo del usuario
   */
  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
    comment: 'User full name',
  })
  name: string

  /**
   * User active status / Estado activo del usuario
   */
  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
    comment: 'Indicates if the user is active',
  })
  isActive: boolean

  /**
   * User role / Rol del usuario
   */
  @Column({
    type: 'enum',
    enum: Role,
    default: Role.USER,
    comment: 'User role in the system',
  })
  role: Role

  /**
   * Email verification token / Token de verificación de email
   */
  @Column({
    name: 'email_verification_token',
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Token for email verification',
  })
  emailVerificationToken?: string

  /**
   * Email verification date / Fecha de verificación de email
   */
  @Column({
    name: 'email_verified_at',
    type: 'timestamp',
    nullable: true,
    comment: 'Email verification date',
  })
  emailVerifiedAt?: Date

  /**
   * Password reset token / Token de reseteo de contraseña
   */
  @Column({
    name: 'password_reset_token',
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Token for password reset',
  })
  passwordResetToken?: string

  /**
   * Password reset token expiry / Fecha de expiración del token de reseteo
   */
  @Column({
    name: 'password_reset_expires_at',
    type: 'timestamp',
    nullable: true,
    comment: 'Password reset token expiry date',
  })
  passwordResetExpiresAt?: Date

  /**
   * Last login date / Fecha de último login
   */
  @Column({
    name: 'last_login_at',
    type: 'timestamp',
    nullable: true,
    comment: 'User last login date',
  })
  lastLoginAt?: Date

  /**
   * Login attempts count / Contador de intentos de login
   */
  @Column({
    name: 'login_attempts',
    type: 'int',
    default: 0,
    comment: 'Failed login attempts count',
  })
  loginAttempts: number

  /**
   * Account locked until / Cuenta bloqueada hasta
   */
  @Column({
    name: 'locked_until',
    type: 'timestamp',
    nullable: true,
    comment: 'Account locked until this date',
  })
  lockedUntil?: Date

  // Hooks for password encryption / Hooks para encriptación de contraseña

  /**
   * Hash password before insert / Hashear contraseña antes de insertar
   */
  @BeforeInsert()
  async hashPasswordBeforeInsert(): Promise<void> {
    if (this.password && !this.isPasswordHashed(this.password)) {
      this.password = await this.hashPassword(this.password)
    }

    // Generate email verification token if not verified / Generar token de verificación si no está verificado
    if (!this.emailVerifiedAt && !this.emailVerificationToken) {
      this.emailVerificationToken = this.generateToken()
    }
  }

  /**
   * Hash password before update / Hashear contraseña antes de actualizar
   */
  @BeforeUpdate()
  async hashPasswordBeforeUpdate(): Promise<void> {
    if (this.password && !this.isPasswordHashed(this.password)) {
      this.password = await this.hashPassword(this.password)
    }
  }

  // Utility methods / Métodos utilitarios

  /**
   * Hash password / Hashear contraseña
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 12
    return await hash(password, saltRounds)
  }

  /**
   * Check if password is already hashed / Verificar si la contraseña ya está hasheada
   */
  private isPasswordHashed(password: string): boolean {
    // bcrypt hashes start with $2a$, $2b$, or $2y$ and have 60 characters
    return /^\$2[aby]\$\d{2}\$.{53}$/.test(password)
  }

  /**
   * Verify password / Verificar contraseña
   */
  async verifyPassword(plainPassword: string): Promise<boolean> {
    return await compare(plainPassword, this.password)
  }

  /**
   * Generate random token / Generar token aleatorio
   */
  generateToken(length: number = 32): string {
    return randomBytes(length).toString('hex')
  }

  /**
   * Set email verification token / Establecer token de verificación de email
   */
  setEmailVerificationToken(): void {
    this.emailVerificationToken = this.generateToken()
  }

  /**
   * Verify email / Verificar email
   */
  verifyEmail(): void {
    this.emailVerifiedAt = new Date()
    this.emailVerificationToken = undefined
  }

  /**
   * Set password reset token / Establecer token de reseteo de contraseña
   */
  setPasswordResetToken(expiresInMinutes: number = 60): void {
    this.passwordResetToken = this.generateToken()
    this.passwordResetExpiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000)
  }

  /**
   * Clear password reset token / Limpiar token de reseteo de contraseña
   */
  clearPasswordResetToken(): void {
    this.passwordResetToken = undefined
    this.passwordResetExpiresAt = undefined
  }

  /**
   * Check if password reset token is valid / Verificar si el token de reseteo es válido
   */
  isPasswordResetTokenValid(): boolean {
    return !!(this.passwordResetToken && this.passwordResetExpiresAt && this.passwordResetExpiresAt > new Date())
  }

  /**
   * Update last login / Actualizar último login
   */
  updateLastLogin(): void {
    this.lastLoginAt = new Date()
    this.loginAttempts = 0
    this.lockedUntil = undefined
  }

  /**
   * Increment login attempts / Incrementar intentos de login
   */
  incrementLoginAttempts(maxAttempts: number = 5, lockDurationMinutes: number = 30): void {
    this.loginAttempts += 1

    if (this.loginAttempts >= maxAttempts) {
      this.lockedUntil = new Date(Date.now() + lockDurationMinutes * 60 * 1000)
    }
  }

  /**
   * Check if account is locked / Verificar si la cuenta está bloqueada
   */
  isAccountLocked(): boolean {
    return !!(this.lockedUntil && this.lockedUntil > new Date())
  }

  /**
   * Unlock account / Desbloquear cuenta
   */
  unlockAccount(): void {
    this.loginAttempts = 0
    this.lockedUntil = undefined
  }

  /**
   * Check if email is verified / Verificar si el email está verificado
   */
  isEmailVerified(): boolean {
    return !!this.emailVerifiedAt
  }

  /**
   * Check if user has role / Verificar si el usuario tiene un rol específico
   */
  hasRole(role: Role): boolean {
    return this.role === role
  }

  /**
   * Check if user is admin / Verificar si el usuario es administrador
   */
  isAdmin(): boolean {
    return this.role === Role.ADMIN || this.role === Role.SUPERADMIN
  }

  /**
   * Check if user is super admin / Verificar si el usuario es super administrador
   */
  isSuperAdmin(): boolean {
    return this.role === Role.SUPERADMIN
  }

  /**
   * Activate user / Activar usuario
   */
  activate(): void {
    this.isActive = true
  }

  /**
   * Deactivate user / Desactivar usuario
   */
  deactivate(): void {
    this.isActive = false
  }

  /**
   * Change password / Cambiar contraseña
   */
  async changePassword(newPassword: string): Promise<void> {
    this.password = await this.hashPassword(newPassword)
    this.clearPasswordResetToken()
  }

  /**
   * Get user display info / Obtener información de visualización del usuario
   */
  getDisplayInfo(): { id: number; email: string; name: string; role: Role; isActive: boolean } {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      role: this.role,
      isActive: this.isActive,
    }
  }
}
