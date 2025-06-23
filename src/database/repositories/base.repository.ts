import { Repository, FindOptionsWhere, FindManyOptions, FindOneOptions, DeepPartial } from 'typeorm'
import { BaseEntity } from '../entities/base.entity'

/**
 * Base repository with common CRUD operations / Repositorio base con operaciones CRUD comunes
 * Provides reusable basic functionality / Proporciona funcionalidad básica reutilizable
 */
export abstract class BaseRepository<T extends BaseEntity> extends Repository<T> {
  /**
   * Find all records with pagination / Buscar todos los registros con paginación
   */
  async findAllPaginated(options?: FindManyOptions<T>): Promise<{
    data: T[]
    total: number
    page: number
    limit: number
    totalPages: number
  }> {
    const { skip = 0, take = 10, ...findOptions } = options || {}
    const page = Math.floor(skip / take) + 1
    const limit = take

    const [data, total] = await this.findAndCount({
      ...findOptions,
      skip,
      take: limit,
    })

    const totalPages = Math.ceil(total / limit)

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    }
  }

  /**
   * Find by ID or throw exception / Buscar por ID o lanzar excepción
   */
  async findByIdOrFail(id: number, options?: FindOneOptions<T>): Promise<T> {
    const entity = await this.findOne({
      where: { id } as FindOptionsWhere<T>,
      ...options,
    })

    if (!entity) {
      throw new Error(`Entity with ID ${id} not found`)
    }

    return entity
  }

  /**
   * Create and save new entity / Crear y guardar nueva entidad
   */
  async createAndSave(data: DeepPartial<T>): Promise<T> {
    const entity = this.create(data)
    return await this.save(entity)
  }

  /**
   * Update entity by ID / Actualizar entidad por ID
   */
  async updateById(id: number, data: DeepPartial<T>): Promise<T> {
    await this.update(id, data as Parameters<typeof this.update>[1])
    return await this.findByIdOrFail(id)
  }

  /**
   * Soft delete by ID / Eliminar suavemente por ID
   */
  async softDeleteById(id: number): Promise<void> {
    const entity = await this.findByIdOrFail(id)
    await this.softRemove(entity)
  }

  /**
   * Check if record exists / Verificar si existe un registro
   */
  async existsById(id: number): Promise<boolean> {
    const count = await this.count({
      where: { id } as FindOptionsWhere<T>,
    })
    return count > 0
  }

  /**
   * Count records matching criteria / Contar registros que coincidan con criterios
   */
  async countBy(criteria: FindOptionsWhere<T>): Promise<number> {
    return await this.count({ where: criteria })
  }

  /**
   * Find one or create / Buscar uno o crear
   */
  async findOneOrCreate(
    criteria: FindOptionsWhere<T>,
    defaults: DeepPartial<T>,
  ): Promise<{ entity: T; created: boolean }> {
    let entity = await this.findOne({ where: criteria })
    let created = false

    if (!entity) {
      entity = await this.createAndSave({ ...defaults, ...criteria } as DeepPartial<T>)
      created = true
    }

    return { entity, created }
  }
}
