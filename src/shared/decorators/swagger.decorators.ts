import { applyDecorators } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { SWAGGER_AUTH, SWAGGER_TAGS } from '../constants'

/**
 * Apply JWT Bearer authentication to endpoint
 * Aplicar autenticación JWT Bearer al endpoint
 */
export const ApiJwtAuth = () => ApiBearerAuth(SWAGGER_AUTH.JWT_BEARER)

/**
 * Apply API Key authentication to endpoint
 * Aplicar autenticación API Key al endpoint
 */
export const ApiKeyAuth = () => ApiBearerAuth(SWAGGER_AUTH.API_KEY)

/**
 * Tag endpoints as Authentication related
 * Etiquetar endpoints como relacionados con Autenticación
 */
export const ApiAuthTag = () => ApiTags(SWAGGER_TAGS.AUTH)

/**
 * Tag endpoints as Users related
 * Etiquetar endpoints como relacionados con Usuarios
 */
export const ApiUsersTag = () => ApiTags(SWAGGER_TAGS.USERS)

/**
 * Tag endpoints as Health related
 * Etiquetar endpoints como relacionados con Salud
 */
export const ApiHealthTag = () => ApiTags(SWAGGER_TAGS.HEALTH)

/**
 * Combine multiple Swagger decorators for authenticated endpoints
 * Combinar múltiples decoradores Swagger para endpoints autenticados
 */
export const ApiAuthenticatedEndpoint = (tag?: keyof typeof SWAGGER_TAGS) => {
  const decorators = [ApiJwtAuth()]

  if (tag) {
    decorators.push(ApiTags(SWAGGER_TAGS[tag]))
  }

  return applyDecorators(...decorators)
}
