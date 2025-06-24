import { Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { BaseRepository } from './base.repository'
import { AllowedClientEntity } from '../entities'
import { InjectDefaultDB } from 'src/shared'

/**
 * Allowed Clients Repository / Repositorio de Clientes Permitidos
 * Handles database operations for allowed clients / Maneja operaciones de base de datos para clientes permitidos
 */
@Injectable()
export class AllowedClientRepository extends BaseRepository<AllowedClientEntity> {
  constructor(
    @InjectDefaultDB()
    private dataSource: DataSource,
  ) {
    super(AllowedClientEntity, dataSource.createEntityManager())
  }

  /**
   * Find client by UUID / Buscar cliente por UUID
   */
  async findByUuid(clientUuid: string): Promise<AllowedClientEntity | null> {
    return await this.findOne({
      where: { clientUuid },
    })
  }

  /**
   * Find active clients / Buscar clientes activos
   */
  async findActiveClients(): Promise<AllowedClientEntity[]> {
    return await this.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    })
  }

  /**
   * Find clients by type / Buscar clientes por tipo
   */
  async findByType(clientType: string): Promise<AllowedClientEntity[]> {
    return await this.find({
      where: { clientType },
      order: { createdAt: 'DESC' },
    })
  }

  /**
   * Check if client UUID exists / Verificar si existe el UUID del cliente
   */
  async existsByUuid(clientUuid: string): Promise<boolean> {
    const count = await this.count({
      where: { clientUuid },
    })
    return count > 0
  }

  /**
   * Update last seen for client / Actualizar última conexión del cliente
   */
  async updateLastSeen(clientUuid: string): Promise<void> {
    await this.update({ clientUuid }, { lastSeenAt: new Date() })
  }

  /**
   * Activate client / Activar cliente
   */
  async activateClient(clientUuid: string): Promise<void> {
    await this.update({ clientUuid }, { isActive: true })
  }

  /**
   * Deactivate client / Desactivar cliente
   */
  async deactivateClient(clientUuid: string): Promise<void> {
    await this.update({ clientUuid }, { isActive: false })
  }
}
