import { Inject } from '@nestjs/common'
import { DATA_SOURCE_DEFAULT } from '../constants/app.constants'

/**
 * Simple DataSource injection decorator
 * Decorador simple para inyección de DataSource
 *
 * @param token - DataSource provider token / Token del proveedor DataSource
 * @returns Inject decorator / Decorador Inject
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class UserService {
 *   constructor(
 *     @InjectDB('DATA_SOURCE_DEFAULT') private dataSource: DataSource,
 *   ) {}
 * }
 * ```
 */
export function InjectDB(token: string) {
  return Inject(token)
}

/**
 * Default DataSource injection decorator (shorthand)
 * Decorador para inyección del DataSource por defecto (atajo)
 *
 * @returns Inject decorator for default DataSource / Decorador Inject para DataSource por defecto
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class UserService {
 *   constructor(
 *     @InjectDefaultDB() private dataSource: DataSource,
 *   ) {}
 * }
 * ```
 */
export function InjectDefaultDB() {
  return Inject(DATA_SOURCE_DEFAULT)
}
