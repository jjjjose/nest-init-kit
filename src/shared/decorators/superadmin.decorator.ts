import { SetMetadata } from '@nestjs/common'

/**
 * SuperAdmin decorator key for metadata
 * Clave del decorador SuperAdmin para metadatos
 */
export const IS_SUPERADMIN_KEY = 'isSuperAdmin'

/**
 * Decorator to mark routes as super admin only (requires super admin role)
 * Decorador para marcar rutas solo para super administradores (requiere rol de super admin)
 *
 * @example
 * ```typescript
 * @SuperAdmin()
 * @Delete('admin/delete-all')
 * deleteAllData() {
 *   return { message: 'All data deleted' };
 * }
 * ```
 */
export const SuperAdmin = () => SetMetadata(IS_SUPERADMIN_KEY, true)
