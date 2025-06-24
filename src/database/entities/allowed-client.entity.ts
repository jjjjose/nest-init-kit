import { Entity, Column, Index, BeforeInsert } from 'typeorm'
import { BaseEntity } from './base.entity'
import { randomUUID } from 'crypto'

/**
 * Allowed Client Entity / Entidad Cliente Permitido
 * Represents allowed clients (browsers, apps, etc.) / Representa clientes permitidos (navegadores, apps, etc.)
 */
@Entity('allowed_clients')
@Index(['clientUuid'], { unique: true })
export class AllowedClientEntity extends BaseEntity {
  /**
   * Client UUID (unique) / UUID del cliente (único)
   */
  @Column({
    name: 'client_uuid',
    type: 'uuid',
    unique: true,
    nullable: false,
    comment: 'Unique client UUID identifier',
  })
  clientUuid: string

  /**
   * Client type / Tipo de cliente
   */
  @Column({
    name: 'client_type',
    type: 'varchar',
    length: 50,
    nullable: false,
    comment: 'Type of client (browser, mobile_app, desktop_app, etc.)',
  })
  clientType: string

  /**
   * Client description / Descripción del cliente
   */
  @Column({
    name: 'client_description',
    type: 'text',
    nullable: true,
    comment: 'Optional description of the client',
  })
  clientDescription?: string

  /**
   * Client active status / Estado activo del cliente
   */
  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
    comment: 'Indicates if the client is active and allowed',
  })
  isActive: boolean

  /**
   * Client IP / IP del cliente
   */
  @Column({
    name: 'ip',
    type: 'varchar',
    nullable: true,
    comment: 'IP address of the client',
  })
  ip: string

  /**
   * Last seen date / Fecha de última conexión
   */
  @Column({
    name: 'last_seen_at',
    type: 'timestamp',
    nullable: true,
    comment: 'Last time this client was seen active',
  })
  lastSeenAt?: Date

  // Hooks / Hooks

  /**
   * Generate UUID before insert / Generar UUID antes de insertar
   */
  @BeforeInsert()
  generateUuidBeforeInsert(): void {
    if (!this.clientUuid) {
      this.clientUuid = randomUUID()
    }
  }

  // Utility methods / Métodos utilitarios

  /**
   * Generate new UUID / Generar nuevo UUID
   */
  generateNewUuid(): string {
    return randomUUID()
  }

  /**
   * Set new UUID / Establecer nuevo UUID
   */
  setNewUuid(): void {
    this.clientUuid = this.generateNewUuid()
  }

  /**
   * Activate client / Activar cliente
   */
  activate(): void {
    this.isActive = true
  }

  /**
   * Deactivate client / Desactivar cliente
   */
  deactivate(): void {
    this.isActive = false
  }

  /**
   * Update last seen / Actualizar última conexión
   */
  updateLastSeen(): void {
    this.lastSeenAt = new Date()
  }

  /**
   * Check if client is active / Verificar si el cliente está activo
   */
  isClientActive(): boolean {
    return this.isActive
  }
}
