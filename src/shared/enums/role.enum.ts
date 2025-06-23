/**
 * Enumeración de roles de usuario / User roles enumeration
 */
export enum Role {
  USER = 'user', // Usuario estándar / Standard user
  ADMIN = 'admin', // Administrador / Administrator
  SUPERADMIN = 'superadmin', // Super administrador / Super administrator
}

/**
 * Array con todos los roles disponibles / Array with all available roles
 */
export const ALL_ROLES = Object.values(Role)

/**
 * Roles administrativos / Administrative roles
 */
export const ADMIN_ROLES = [Role.ADMIN, Role.SUPERADMIN]
