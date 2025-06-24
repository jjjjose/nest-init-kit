/**
 * Exportación centralizada de repositorios / Centralized repository exports
 */
export { BaseRepository } from './base.repository'
export { UserRepository } from './users.repository'
export { AllowedClientRepository } from './allowed-clients.repository'

// Re-exportar desde el módulo padre / Re-export from parent module
export { RepositoriesModule } from '../repositories.module'
