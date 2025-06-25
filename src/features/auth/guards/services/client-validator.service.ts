import { Injectable, UnauthorizedException, ForbiddenException, Logger } from '@nestjs/common'
import { AllowedClientRepository } from '../../../../database/repositories'
import { AllowedClientEntity } from '../../../../database/entities'
import { AuthenticatedRequest, ClientValidationError } from '../interfaces/auth-guard.interfaces'

/**
 * Client Validator Service
 * Servicio de Validación de Clientes
 *
 * Handles client UUID validation and management
 * Maneja validación y gestión de UUID de clientes
 */
@Injectable()
export class ClientValidatorService {
  private readonly logger = new Logger(ClientValidatorService.name)
  private readonly CLIENT_UUID_HEADER = 'x-client-uuid'

  constructor(private readonly allowedClientRepository: AllowedClientRepository) {}

  /**
   * Validates client UUID from request header and updates client information
   * Valida UUID del cliente desde header de petición y actualiza información del cliente
   */
  async validateClientUuid(request: AuthenticatedRequest): Promise<void> {
    const clientUuid = this.extractClientUuid(request)

    const allowedClient = await this.findAllowedClient(clientUuid)

    this.validateClientStatus(allowedClient)

    await this.updateClientLastSeen(clientUuid)

    this.attachClientInfoToRequest(request, allowedClient)
  }

  /**
   * Extracts client UUID from request header
   * Extrae UUID del cliente desde header de petición
   */
  private extractClientUuid(request: AuthenticatedRequest): string {
    const clientUuid = request.headers[this.CLIENT_UUID_HEADER] as string

    if (!clientUuid || typeof clientUuid !== 'string' || clientUuid.trim() === '') {
      const error: ClientValidationError = {
        code: 'MISSING_CLIENT_UUID_HEADER',
        message: `Client UUID header '${this.CLIENT_UUID_HEADER}' is required`,
        action: 'ADD_HEADER',
        statusCode: 401,
      }

      this.logger.warn(`Missing client UUID header for ${request.method} ${request.url}`)
      throw new UnauthorizedException(error)
    }

    return clientUuid.trim()
  }

  /**
   * Finds allowed client by UUID
   * Busca cliente permitido por UUID
   */
  private async findAllowedClient(clientUuid: string): Promise<AllowedClientEntity> {
    try {
      const allowedClient = await this.allowedClientRepository.findByUuid(clientUuid)

      if (!allowedClient) {
        const error: ClientValidationError = {
          code: 'CLIENT_UUID_NOT_FOUND',
          message: `Client UUID '${clientUuid}' not found in allowed clients`,
          action: 'REGISTER_CLIENT',
          statusCode: 401,
        }

        this.logger.warn(`Client UUID not found: ${clientUuid}`)
        throw new UnauthorizedException(error)
      }

      return allowedClient
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error
      }

      this.logger.error(`Error validating client UUID: ${clientUuid}`, error)

      throw new UnauthorizedException({
        code: 'CLIENT_VALIDATION_ERROR',
        message: 'Error validating client UUID',
        action: 'RETRY_OR_CONTACT_ADMIN',
        statusCode: 500,
      })
    }
  }

  /**
   * Validates client active status
   * Valida estado activo del cliente
   */
  private validateClientStatus(allowedClient: AllowedClientEntity): void {
    if (!allowedClient.isClientActive()) {
      const error: ClientValidationError = {
        code: 'CLIENT_INACTIVE',
        message: `Client is not active`,
        action: 'CONTACT_ADMIN',
        statusCode: 403,
      }

      this.logger.warn(`Inactive client attempted access: ${allowedClient.clientUuid}`)
      throw new ForbiddenException(error)
    }
  }

  /**
   * Updates client last seen timestamp
   * Actualiza timestamp de última conexión del cliente
   */
  private async updateClientLastSeen(clientUuid: string): Promise<void> {
    try {
      await this.allowedClientRepository.updateLastSeen(clientUuid)
      this.logger.debug(`Updated last seen for client: ${clientUuid}`)
    } catch (error) {
      // Non-critical error - log but don't block request
      // Error no crítico - registrar pero no bloquear petición
      this.logger.error(`Failed to update client last seen: ${clientUuid}`, error)
    }
  }

  /**
   * Attaches client information to request object
   * Adjunta información del cliente al objeto de petición
   */
  private attachClientInfoToRequest(request: AuthenticatedRequest, allowedClient: AllowedClientEntity): void {
    request.user = {
      ...request.user,
      clientUuid: allowedClient.clientUuid,
      clientType: allowedClient.clientType,
    }
  }
}
