import { INestApplication, Logger } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { SWAGGER_AUTH } from '../shared/constants'

/**
 * Setup Swagger documentation for the application
 * Configurar documentación Swagger para la aplicación
 * @param app - The NestJS application instance / La instancia de la aplicación NestJS
 * @param globalPrefix - The global API prefix / El prefijo global de la API
 * @param port - The server port / El puerto del servidor
 */
export function setupSwagger(app: INestApplication, globalPrefix = 'api', port = 3000): void {
  // Create Swagger document configuration / Crear configuración del documento Swagger
  const config = new DocumentBuilder()
    .setTitle('Nest Init Kit API')
    .setDescription(
      'A comprehensive NestJS starter kit with authentication, database integration, and more. ' +
        'Un kit de inicio completo de NestJS con autenticación, integración de base de datos y más.',
    )
    .setVersion('1.0.0')
    .setContact(
      'API Support', // Contact name / Nombre de contacto
      'https://github.com/your-org/nest-init-kit', // Contact URL / URL de contacto
      'support@yourapp.com', // Contact email / Email de contacto
    )
    .setLicense(
      'MIT License', // License name / Nombre de licencia
      'https://opensource.org/licenses/MIT', // License URL / URL de licencia
    )
    .addServer(`http://localhost:${port}/`, 'Development Server / Servidor de Desarrollo')
    .addServer(`https://api.yourapp.com/`, 'Production Server / Servidor de Producción')
    // Add JWT Bearer authentication / Añadir autenticación JWT Bearer
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token / Ingrese el token JWT',
        in: 'header',
      },
      SWAGGER_AUTH.JWT_BEARER, // This name here is important for matching up with @ApiBearerAuth() in your controller!
    )
    // Add API Key authentication option / Añadir opción de autenticación por API Key
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-API-KEY',
        in: 'header',
        description: 'API Key for service-to-service communication / Clave API para comunicación entre servicios',
      },
      SWAGGER_AUTH.API_KEY,
    )
    // Add global tags / Añadir etiquetas globales
    // .addTag(SWAGGER_TAGS.AUTH, 'Authentication endpoints / Endpoints de autenticación')
    // .addTag(SWAGGER_TAGS.USERS, 'User management endpoints / Endpoints de gestión de usuarios')
    // .addTag(SWAGGER_TAGS.HEALTH, 'Health check endpoints / Endpoints de verificación de salud')
    .build()

  // Create Swagger document / Crear documento Swagger
  const document = SwaggerModule.createDocument(app, config, {
    // Include only modules with @ApiTags / Incluir solo módulos con @ApiTags
    ignoreGlobalPrefix: false,
    // Exclude paths that don't need documentation / Excluir rutas que no necesitan documentación
    // exclude: ['/health/live', '/health/ready'],
  })

  // Setup Swagger UI / Configurar interfaz Swagger
  SwaggerModule.setup(`/docs`, app, document, {
    // Swagger UI configuration / Configuración de la interfaz Swagger
    swaggerOptions: {
      // Enable request duration display / Habilitar visualización de duración de solicitudes
      displayRequestDuration: true,
      // Set default models expand depth / Establecer profundidad de expansión de modelos por defecto
      defaultModelsExpandDepth: 2,
      // Set default model expand depth / Establecer profundidad de expansión de modelo por defecto
      defaultModelExpandDepth: 2,
      // Enable filter / Habilitar filtro
      filter: true,
      // Show extensions / Mostrar extensiones
      showExtensions: true,
      // Show common extensions / Mostrar extensiones comunes
      showCommonExtensions: true,
      // Persist authorization / Persistir autorización
      persistAuthorization: true,
      // Display operation id / Mostrar ID de operación
      displayOperationId: false,
      // Try it out enabled / Habilitar "Probar"
      tryItOutEnabled: true,
      // Request snippets enabled / Habilitar fragmentos de solicitud
      requestSnippetsEnabled: true,
      // Supported submit methods / Métodos de envío soportados
      supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
      // Validator URL / URL del validador
      validatorUrl: null,
    },
    // Custom CSS for branding / CSS personalizado para marca
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #e53e3e; }
      .swagger-ui .scheme-container { background: #f7fafc; padding: 15px; border-radius: 4px; }
    `,
    // Custom site title / Título personalizado del sitio
    customSiteTitle: 'Nest Init Kit API Documentation',
    // Custom favicon / Favicon personalizado
    customfavIcon: '/favicon.ico',
    // URLs for exploring / URLs para explorar
    urls: [
      {
        name: 'Current API / API Actual',
        url: `/docs-json`,
      },
    ],
  })

  const logger = new Logger('SwaggerConfig')
  logger.debug(`📚 Swagger documentation available at: http://localhost:${port}/${globalPrefix}/docs`)
  logger.debug(`📚 Documentación Swagger disponible en: http://localhost:${port}/${globalPrefix}/docs`)
}
