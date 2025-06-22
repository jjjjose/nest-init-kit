/**
 * Global test setup configuration
 * Configuración global de configuración de tests
 */

// Configuración global para tests
global.beforeAll(() => {
  // Configuración de entorno de prueba
  process.env.NODE_ENV = 'test'
  process.env.JWT_SECRET = 'test-secret-key'
  process.env.JWT_EXPIRATION = '15m'
  process.env.JWT_REFRESH_EXPIRATION = '7d'
  process.env.JWT_ISSUER = 'nestjs-test-app'
  process.env.JWT_AUDIENCE = 'nestjs-test-users'
})

// Limpiar mocks después de cada test
global.afterEach(() => {
  jest.clearAllMocks()
  jest.resetAllMocks()
})

// Configuraciones adicionales para los tests
global.beforeEach(() => {
  // Reset de timers si se usan en los tests
  jest.useFakeTimers()
})

global.afterEach(() => {
  // Restaurar timers reales
  jest.useRealTimers()
})
