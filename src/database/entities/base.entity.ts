import { PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, BaseEntity as TypeOrmBaseEntity } from 'typeorm'

/**
 * Base entity with common fields / Entidad base con campos comunes
 * Includes standard audit fields / Incluye campos de auditoría estándar
 */
export abstract class BaseEntity extends TypeOrmBaseEntity {
  /**
   * Unique record ID / ID único del registro
   */
  @PrimaryGeneratedColumn('increment')
  id: number

  /**
   * Creation date / Fecha de creación
   */
  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    comment: 'Record creation date',
  })
  createdAt: Date

  /**
   * Last update date / Fecha de última actualización
   */
  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
    comment: 'Record last update date',
  })
  updatedAt: Date
}
