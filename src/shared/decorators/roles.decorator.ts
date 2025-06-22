import { SetMetadata } from '@nestjs/common'

/**
 * Roles decorator key for metadata
 * Clave del decorador Roles para metadatos
 */
export const ROLES_KEY = 'roles'

/**
 * Decorator to specify which roles are allowed to access a route
 * Decorador para especificar qué roles pueden acceder a una ruta
 *
 * @param roles Array of role names that are allowed to access the route
 *              Array de nombres de roles que pueden acceder a la ruta
 *
 * @example
 * ```typescript
 * @Roles(['admin', 'moderator'])
 * @Get('admin/users')
 * getUsers() {
 *   return { users: [] };
 * }
 *
 * @Roles(['user'])
 * @Get('profile')
 * getProfile() {
 *   return { profile: {} };
 * }
 *
 * @Roles(['admin', 'user', 'guest'])
 * @Get('public-data')
 * getPublicData() {
 *   return { data: [] };
 * }
 * ```
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles)
