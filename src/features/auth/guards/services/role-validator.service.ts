import { Injectable, ForbiddenException, ExecutionContext, Logger } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { IS_ADMIN_KEY, IS_SUPERADMIN_KEY, ROLES_KEY } from '../../../../shared/decorators'
import { RoleValidationError } from '../interfaces/auth-guard.interfaces'

/**
 * Role Validator Service
 * Servicio de Validación de Roles
 *
 * Handles role-based access control validation
 * Maneja validación de control de acceso basado en roles
 */
@Injectable()
export class RoleValidatorService {
  private readonly logger = new Logger(RoleValidatorService.name)

  constructor(private readonly reflector: Reflector) {}

  /**
   * Validates role-based permissions for the current route
   * Valida permisos basados en roles para la ruta actual
   */
  validateRolePermissions(context: ExecutionContext, userRole: string): void {
    // SuperAdmin route validation / Validación de ruta SuperAdmin
    if (this.isSuperAdminRoute(context)) {
      this.validateSuperAdminAccess(userRole)
      return
    }

    // Admin route validation / Validación de ruta Admin
    if (this.isAdminRoute(context)) {
      this.validateAdminAccess(userRole)
      return
    }

    // Dynamic roles validation / Validación de roles dinámicos
    const requiredRoles = this.getRequiredRoles(context)
    if (requiredRoles && requiredRoles.length > 0) {
      this.validateDynamicRoleAccess(userRole, requiredRoles)
      return
    }

    // No specific role requirements - authenticated access only
    // Sin requerimientos específicos de rol - solo acceso autenticado
    this.logger.debug(`Route allows authenticated access for role: ${userRole}`)
  }

  /**
   * Checks if route requires SuperAdmin access
   * Verifica si la ruta requiere acceso SuperAdmin
   */
  private isSuperAdminRoute(context: ExecutionContext): boolean {
    return (
      this.reflector.getAllAndOverride<boolean>(IS_SUPERADMIN_KEY, [context.getHandler(), context.getClass()]) || false
    )
  }

  /**
   * Checks if route requires Admin access
   * Verifica si la ruta requiere acceso Admin
   */
  private isAdminRoute(context: ExecutionContext): boolean {
    return this.reflector.getAllAndOverride<boolean>(IS_ADMIN_KEY, [context.getHandler(), context.getClass()]) || false
  }

  /**
   * Gets required roles for dynamic role validation
   * Obtiene roles requeridos para validación de roles dinámicos
   */
  private getRequiredRoles(context: ExecutionContext): string[] | null {
    return this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [context.getHandler(), context.getClass()]) || null
  }

  /**
   * Validates SuperAdmin access
   * Valida acceso SuperAdmin
   */
  private validateSuperAdminAccess(userRole: string): void {
    if (userRole !== 'superadmin') {
      const error: RoleValidationError = {
        code: 'SUPERADMIN_ACCESS_REQUIRED',
        message: 'SuperAdmin access required',
        action: 'CONTACT_SUPERADMIN',
        statusCode: 403,
        requiredRole: 'superadmin',
        userRole,
      }

      this.logger.warn(`SuperAdmin access denied for user role: ${userRole}`)
      throw new ForbiddenException(error)
    }
  }

  /**
   * Validates Admin access
   * Valida acceso Admin
   */
  private validateAdminAccess(userRole: string): void {
    const allowedRoles = ['admin', 'superadmin']

    if (!allowedRoles.includes(userRole)) {
      const error: RoleValidationError = {
        code: 'ADMIN_ACCESS_REQUIRED',
        message: 'Admin access required / Acceso Admin requerido',
        action: 'CONTACT_ADMIN',
        statusCode: 403,
        allowedRoles,
        userRole,
      }

      this.logger.warn(`Admin access denied for user role: ${userRole}`)
      throw new ForbiddenException(error)
    }
  }

  /**
   * Validates dynamic role access
   * Valida acceso de roles dinámicos
   */
  private validateDynamicRoleAccess(userRole: string, requiredRoles: string[]): void {
    if (!requiredRoles.includes(userRole)) {
      const error: RoleValidationError = {
        code: 'INSUFFICIENT_ROLE_PERMISSIONS',
        message: `Access denied. Required roles: ${requiredRoles.join(', ')}`,
        action: 'CONTACT_ADMIN',
        statusCode: 403,
        requiredRoles,
        userRole,
      }

      this.logger.warn(`Role access denied. User role: ${userRole}, Required roles: ${requiredRoles.join(', ')}`)
      throw new ForbiddenException(error)
    }
  }
}
