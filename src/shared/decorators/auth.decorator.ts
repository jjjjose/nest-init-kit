import { UseGuards, applyDecorators } from '@nestjs/common'
import { JwtAuthGuard } from '../../features/auth/guards/jwt-auth.guard'

/**
 * Decorator to apply JWT authentication guard to routes
 * Decorador para aplicar el guard de autenticación JWT a las rutas
 *
 * This decorator automatically applies @UseGuards(JwtAuthGuard) to the route
 * Este decorador aplica automáticamente @UseGuards(JwtAuthGuard) a la ruta
 *
 * @example
 * ```typescript
 * @Auth()
 * @Get('profile')
 * getProfile() {
 *   return { user: 'data' };
 * }
 * ```
 */
export const Auth = () => applyDecorators(UseGuards(JwtAuthGuard))
