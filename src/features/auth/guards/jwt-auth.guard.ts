import { Injectable, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { Reflector } from '@nestjs/core'
import { IS_PUBLIC_KEY } from '../../../shared/decorators'
import { ClientValidatorService, RoleValidatorService } from './services'
import { AllowedClientRepository } from 'src/database/repositories'
import { AuthenticatedRequest } from './interfaces'

/**
 * JWT Authentication Guard
 * Guard de Autenticación JWT
 *
 * This guard protects routes by validating JWT tokens, client UUID headers, and checking role permissions
 * Unless the route is marked with decorators like @Public(), @Admin(), @SuperAdmin(), or @Roles()
 *
 * Este guard protege rutas validando tokens JWT, headers UUID del cliente, y verificando permisos de roles
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
  private readonly logger = new Logger(JwtAuthGuard.name)
  private readonly CLIENT_UUID_HEADER = 'x-client-uuid'

  constructor(
    private readonly reflector: Reflector,
    private readonly allowedClientRepository: AllowedClientRepository,
    private readonly clientValidator: ClientValidatorService,
    private readonly roleValidator: RoleValidatorService,
  ) {
    super()
  }

  /**
   * Main guard method - determines if the current request can be activated
   * Método principal del guard - determina si la petición actual puede ser activada
   *
   * @param context - Execution context / Contexto de ejecución
   * @returns Boolean indicating if request is allowed / Booleano indicando si la petición está permitida
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest<AuthenticatedRequest>()

      this.validateDependencies()

      // 1. Check if route is public / Verificar si la ruta es pública
      if (this.isPublicRoute(context)) {
        this.logAccess('Public route - access granted', request)
        return true
      }

      this.logAccess('Protected route - validating authentication', request)

      // 2. Validate client UUID header / Validar header UUID del cliente
      await this.clientValidator.validateClientUuid(request)

      // 3. Validate JWT token / Validar token JWT
      const isValidJWT = await this.validateJwtToken(context)
      if (!isValidJWT) return false

      // 4. Check role-based permissions / Verificar permisos basados en roles
      const userRole = request.user?.role || ''
      this.roleValidator.validateRolePermissions(context, userRole)

      this.logAccess('Authentication successful', request)
      return true
    } catch (error) {
      this.logError('Authentication failed', error)
      throw error
    }
  }

  /**
   * Validates that required dependencies are properly injected
   * Valida que las dependencias requeridas estén correctamente inyectadas
   */
  private validateDependencies(): void {
    if (!this.reflector) throw new Error('Reflector is not properly injected')

    if (!this.allowedClientRepository) throw new Error('AllowedClientRepository is not properly injected ')

    if (!this.clientValidator) throw new Error('ClientValidatorService is not properly injected ')

    if (!this.roleValidator) throw new Error('RoleValidatorService is not properly injected ')
  }

  /**
   * Checks if the current route is marked as public
   * Verifica si la ruta actual está marcada como pública
   */
  private isPublicRoute(context: ExecutionContext): boolean {
    return this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]) || false
  }

  /**
   * Validates JWT token using parent AuthGuard
   * Valida token JWT usando el AuthGuard padre
   */
  private async validateJwtToken(context: ExecutionContext): Promise<boolean> {
    try {
      const isValid = await super.canActivate(context)
      return Boolean(isValid)
    } catch (error) {
      this.logger.warn('JWT validation failed', error)

      throw new UnauthorizedException({
        code: 'INVALID_JWT_TOKEN',
        message: 'Invalid or expired JWT token',
        action: 'LOGIN_REQUIRED',
      })
    }
  }

  /**
   * Logs access attempts with contextual information
   * Registra intentos de acceso con información contextual
   */
  private logAccess(message: string, request: AuthenticatedRequest): void {
    const logData = {
      method: request.method,
      url: request.url,
      userAgent: request.headers['user-agent'],
      clientUuid: request.user?.clientUuid,
      userRole: request.user?.role,
      timestamp: new Date().toISOString(),
    }

    this.logger.log(`${message} - ${JSON.stringify(logData)}`)
  }

  /**
   * Logs errors with contextual information
   * Registra errores con información contextual
   */
  private logError(message: string, error: unknown): void {
    const errorData = {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    }

    this.logger.error(`${message} - ${JSON.stringify(errorData)}`)
  }
}
