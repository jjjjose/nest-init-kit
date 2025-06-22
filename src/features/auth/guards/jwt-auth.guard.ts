import { Injectable, ExecutionContext, ForbiddenException } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { Reflector } from '@nestjs/core'
import { IS_PUBLIC_KEY, IS_ADMIN_KEY, IS_SUPERADMIN_KEY, ROLES_KEY } from '../../../shared/decorators'
// import { UserService } from '../../../services/user.service'
import { Request } from 'express'

/**
 * JWT Authentication Guard
 * Guard de Autenticación JWT
 *
 * This guard protects routes by validating JWT tokens and checking role permissions
 * Unless the route is marked with decorators like @Public(), @Admin(), @SuperAdmin(), or @Roles()
 *
 * Este guard protege rutas validando tokens JWT y verificando permisos de roles
 * A menos que la ruta esté marcada con decoradores como @Public(), @Admin(), @SuperAdmin(), o @Roles()
 *
 * @example Usage examples / Ejemplos de uso:
 *
 * // Public route - no authentication required
 * // Ruta pública - no requiere autenticación
 * @Public()
 * @Get('public-info')
 * getPublicInfo() { return { info: 'public' }; }
 *
 * // Admin only route
 * // Ruta solo para administradores
 * @Admin()
 * @Get('admin/users')
 * getUsers() { return { users: [] }; }
 *
 * // SuperAdmin only route
 * // Ruta solo para super administradores
 * @SuperAdmin()
 * @Delete('admin/delete-all')
 * deleteAll() { return { deleted: true }; }
 *
 * // Dynamic roles - single role
 * // Roles dinámicos - un solo rol
 * @Roles('moderator')
 * @Get('moderate/posts')
 * getPosts() { return { posts: [] }; }
 *
 * // Dynamic roles - multiple roles
 * // Roles dinámicos - múltiples roles
 * @Roles('admin', 'moderator', 'editor')
 * @Post('content/create')
 * createContent() { return { created: true }; }
 *
 * // Protected route (default JWT validation)
 * // Ruta protegida (validación JWT por defecto)
 * @Get('profile')
 * getProfile() { return { profile: {} }; }
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    // private userService: UserService, // 👈 Para consultar DB
  ) {
    super()
  }

  /**
   * Determines if the current request can be activated
   * Determina si la petición actual puede ser activada
   *
   * @param context - Execution context / Contexto de ejecución
   * @returns Boolean or Observable<boolean> / Booleano u Observable<boolean>
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Verificar si es ruta pública
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (isPublic) return true

    // 2. Validar JWT (autenticación)
    const isValidJWT = await super.canActivate(context)
    if (!isValidJWT) return false

    // 3. Obtener usuario actual de la DB (con rol fresco)
    const request = context.switchToHttp().getRequest<Request>()
    // const userId = request.user.id

    const user = request.user as { role: string }

    // const user = await this.userService.findById(userId)
    // if (!user || user.status === 'suspended') {
    //   throw new ForbiddenException('User not found or suspended')
    // }

    // 4. Verificar autorización por roles
    return this.checkRolePermissions(context, user.role)
  }

  private checkRolePermissions(context: ExecutionContext, userRole: string): boolean {
    // SuperAdmin check
    const isSuperAdminRoute = this.reflector.getAllAndOverride<boolean>(IS_SUPERADMIN_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (isSuperAdminRoute) {
      if (userRole !== 'superadmin') {
        throw new ForbiddenException('SuperAdmin access required')
      }
      return true
    }

    // Admin check
    const isAdminRoute = this.reflector.getAllAndOverride<boolean>(IS_ADMIN_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (isAdminRoute) {
      if (!['admin', 'superadmin'].includes(userRole)) {
        throw new ForbiddenException('Admin access required')
      }
      return true
    }

    // Dynamic roles check
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (requiredRoles) {
      if (!requiredRoles.includes(userRole)) {
        throw new ForbiddenException(`Access denied. Required roles: ${requiredRoles.join(', ')}`)
      }
      return true
    }

    // Si no hay decoradores de rol, solo requiere autenticación
    return true
  }
}
