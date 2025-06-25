import { Request } from 'express'

/**
 * Interface for extended request with user and client information
 * Interfaz para request extendido con información de usuario y cliente
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id?: number
    email?: string
    role?: string
    clientUuid?: string
    clientType?: string
    [key: string]: unknown
  }
}

/**
 * Interface for detailed error responses
 * Interfaz para respuestas de error detalladas
 */
export interface ClientValidationError {
  code: string
  message: string
  action: string
  statusCode: number
}

/**
 * Interface for role validation error responses
 * Interfaz para respuestas de error de validación de roles
 */
export interface RoleValidationError extends ClientValidationError {
  requiredRole?: string
  allowedRoles?: string[]
  requiredRoles?: string[]
  userRole?: string
}
