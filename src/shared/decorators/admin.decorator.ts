import { SetMetadata } from '@nestjs/common'

/**
 * Admin decorator key for metadata
 * Clave del decorador Admin para metadatos
 */
export const IS_ADMIN_KEY = 'isAdmin'

/**
 * Decorator to mark routes as admin only (requires admin role)
 * Decorador para marcar rutas solo para administradores (requiere rol de administrador)
 *
 * @example
 * ```typescript
 * @Admin()
 * @Get('admin/users')
 * getUsers() {
 *   return { users: [] };
 * }
 * ```
 */
export const Admin = () => SetMetadata(IS_ADMIN_KEY, true)
