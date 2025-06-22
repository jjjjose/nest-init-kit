import { SetMetadata } from '@nestjs/common'

/**
 * Public decorator key for metadata
 * Clave del decorador Public para metadatos
 */
export const IS_PUBLIC_KEY = 'isPublic'

/**
 * Decorator to mark routes as publicly accessible (no authentication required)
 * Decorador para marcar rutas como públicamente accesibles (sin autenticación requerida)
 *
 * @example
 * ```typescript
 * @Public()
 * @Get('public-endpoint')
 * getPublicData() {
 *   return { message: 'This is public' };
 * }
 * ```
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)
