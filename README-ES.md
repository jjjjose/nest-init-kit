# Nest Init Kit 🚀

> 🌐 **Language / Idioma**: [English](README.md) | [Español](README-ES.md)  
> 📋 **Información de Versión**: [Changelog y Notas de Lanzamiento](CHANGELOG-ES.md)

Un boilerplate de NestJS listo para producción con autenticación JWT, integración de base de datos TypeORM, pruebas comprensivas y características empresariales avanzadas.

## 🌟 Características

### Características Principales
- **🔐 Sistema de Autenticación JWT** - Autenticación completa con tokens de acceso/refresco, firmado RSA256
- **👤 Gestión de Usuarios** - Entidad de usuario completa con roles, verificación de email, reset de contraseña, bloqueo de cuenta
- **🛡️ Control de Acceso Basado en Roles (RBAC)** - Roles USER, ADMIN, SUPERADMIN con decoradores
- **🗄️ Integración de Base de Datos** - PostgreSQL con TypeORM, migraciones y seeders
- **📚 Documentación de API** - Documentación Swagger/OpenAPI auto-generada
- **🧪 Suite de Pruebas** - Pruebas unitarias y E2E con fixtures y cobertura comprensiva

### Seguridad y Monitoreo
- **🔒 Guards de Seguridad** - Guard de autenticación JWT, validación de cliente, validación de roles
- **📊 Monitoreo de Peticiones** - Middleware e interceptores de logging de peticiones
- **🚫 Manejo de Excepciones** - Filtros globales de excepciones con respuestas de error estandarizadas
- **✅ Validación de Entrada** - Class-validator con validación y transformación de DTO
- **🌐 Configuración CORS** - Configuración CORS flexible para diferentes entornos

### Experiencia del Desarrollador
- **📝 TypeScript** - Soporte completo de TypeScript con tipado estricto
- **🎯 ESLint y Prettier** - Configuración de formateo y linting de código
- **🔧 Validación de Entorno** - Validación estricta de variables de entorno con decoradores personalizados
- **🏗️ Arquitectura Modular** - Separación limpia de responsabilidades con módulos de características
- **📦 Gestión de Paquetes** - Configuración de workspace PNPM
- **🔄 Herramientas de Migración** - Scripts de migración y seeding de base de datos

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js 18+ 
- PNPM 8+
- PostgreSQL 13+
- OpenSSL (para generación de certificados JWT)

### Instalación

1. **Clonar el repositorio**
```bash
git clone <url-del-repositorio>
cd nest-init-kit
```

2. **Instalar dependencias**
```bash
pnpm install
```

3. **Generar certificados JWT**
```bash
# Crear directorio de certificados
mkdir -p .certs

# Generar clave privada
openssl genrsa -out .certs/jwt-private.pem 2048

# Generar clave pública
openssl rsa -in .certs/jwt-private.pem -pubout -out .certs/jwt-public.pem
```

4. **Configurar variables de entorno**
```bash
# Copiar archivo de ejemplo de entorno
cp .env.example .env

# Configurar las variables de entorno (ver sección de Configuración)
```

5. **Configurar base de datos**
```bash
# Ejecutar migraciones
pnpm run migration:run

# Ejecutar seeders (opcional)
pnpm run seed:run
```

6. **Iniciar la aplicación**
```bash
# Modo desarrollo
pnpm run start:dev

# Modo producción
pnpm run build
pnpm run start:prod
```

## ⚙️ Configuración

### Variables de Entorno

Crear un archivo `.env` con las siguientes variables:

```env
# Configuración del Servidor
SERVER_PORT=3000

# Configuración de Base de Datos
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=tu_contraseña
DB_DATABASE=nest_init_kit
DATABASE_SSL_DISABLE_REJECT_UNAUTHORIZED=false

# Configuración JWT (RSA256)
JWT_PRIVATE_KEY_PATH=./.certs/jwt-private.pem
JWT_PUBLIC_KEY_PATH=./.certs/jwt-public.pem
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
JWT_ISSUER=nestjs-api
JWT_AUDIENCE=nestjs-client

# Configuración de Email (Opcional)
MAIL_USER=tu-email@gmail.com
MAIL_PASSWORD=tu-contraseña-de-app
MAIL_SERVICE=gmail

# Configuración de Kafka (Opcional)
KAFKA_BROKERS=localhost:9092
```

## 🏗️ Estructura del Proyecto

```
src/
├── config/                 # Archivos de configuración
│   ├── database.config.ts   # Configuración de base de datos
│   ├── env.validation.ts    # Validación de entorno
│   ├── jwt.config.ts        # Configuración JWT
│   └── swagger.config.ts    # Configuración de documentación API
├── database/               # Capa de base de datos
│   ├── entities/           # Entidades TypeORM
│   ├── migrations/         # Migraciones de base de datos
│   ├── repositories/       # Repositorios personalizados
│   ├── seeders/           # Seeders de base de datos
│   └── scripts/           # Utilidades de migración
├── features/              # Módulos de características
│   ├── auth/              # Módulo de autenticación
│   └── users/             # Módulo de gestión de usuarios
├── shared/                # Utilidades compartidas
│   ├── constants/         # Constantes de aplicación
│   ├── decorators/        # Decoradores personalizados
│   ├── enums/            # Enumeraciones
│   ├── filters/          # Filtros de excepciones
│   ├── guards/           # Guards de autenticación
│   ├── interceptors/     # Interceptores de peticiones
│   ├── jwt/              # Utilidades JWT
│   ├── middleware/       # Middleware personalizado
│   └── services/         # Servicios compartidos
└── main.ts               # Punto de entrada de la aplicación
```

## 🧪 Pruebas

### Ejecutar Pruebas

```bash
# Pruebas unitarias
pnpm run test:unit

# Pruebas E2E
pnpm run test:e2e

# Cobertura de pruebas
pnpm run test:cov

# Modo watch
pnpm run test:watch

# Pruebas específicas de autenticación
pnpm run test:auth
pnpm run test:auth:e2e
```

### Estructura de Pruebas
- **Pruebas Unitarias**: Ubicadas en `test/unit/`
- **Pruebas E2E**: Ubicadas en `test/e2e/`
- **Fixtures**: Helpers de datos de prueba en `test/fixtures/`
- **Reportes de Cobertura**: Generados en el directorio `coverage/`

## 📚 Documentación de API

Cuando se ejecuta en modo desarrollo, la documentación Swagger está disponible en:
- **URL**: `http://localhost:3000/docs`
- **Características**: Autenticación JWT Bearer, pruebas interactivas de API, ejemplos de petición/respuesta

## 🔐 Autenticación

### Endpoints

- `POST /auth/login` - Login de usuario con email/contraseña
- `GET /auth/test` - Endpoint de prueba protegido
- `GET /auth/public` - Endpoint público (no requiere autenticación)
- `POST /auth/register-client` - Registrar nuevo cliente para acceso a API
- `POST /auth/refresh` - Refrescar token de acceso

### Implementación JWT
- **Algoritmo**: RS256 (RSA con SHA-256)
- **Token de Acceso**: 15 minutos de expiración
- **Token de Refresco**: 7 días de expiración
- **Headers**: Authorization: `Bearer <token>`

### Roles y Permisos
- **USER**: Acceso básico de usuario
- **ADMIN**: Privilegios administrativos
- **SUPERADMIN**: Acceso completo al sistema

## 🗄️ Base de Datos

### Comandos de Migración

```bash
# Generar nueva migración
pnpm run migration:generate

# Crear migración vacía
pnpm run migration:create

# Ejecutar migraciones
pnpm run migration:run

# Revertir última migración
pnpm run migration:revert

# Mostrar estado de migraciones
pnpm run migration:show
```

### Comandos de Seeder

```bash
# Ejecutar seeders
pnpm run seed:run

# Eliminar todos los datos
pnpm run seed:drop
```

## 🚀 Despliegue

### Despliegue con Docker

```bash
# Construir imagen Docker
docker build -t nest-init-kit .

# Ejecutar contenedor
docker run -p 3000:3000 nest-init-kit
```

### Builds Específicos por Entorno

```bash
# Build de producción
pnpm run build
pnpm run start:prod

# Modo desarrollo
pnpm run start:dev
```

## 🛠️ Desarrollo

### Calidad de Código

```bash
# Linting
pnpm run lint

# Formateo de código
pnpm run format

# Verificación de tipos
pnpm run build
```

### Depuración

```bash
# Modo debug
pnpm run start:debug

# Modo watch con debug
pnpm run start:debug
```

## 📦 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `start` | Iniciar servidor de producción |
| `start:dev` | Iniciar servidor de desarrollo con modo watch |
| `start:debug` | Iniciar servidor en modo debug |
| `build` | Construir aplicación para producción |
| `test` | Ejecutar todas las pruebas |
| `test:unit` | Ejecutar solo pruebas unitarias |
| `test:e2e` | Ejecutar solo pruebas E2E |
| `test:cov` | Ejecutar pruebas con cobertura |
| `lint` | Ejecutar ESLint |
| `format` | Formatear código con Prettier |
| `migration:*` | Comandos de migración de base de datos |
| `seed:*` | Comandos de seeding de base de datos |

## 🤝 Contribución

1. Haz fork del repositorio
2. Crea tu rama de características (`git checkout -b feature/caracteristica-increible`)
3. Commitea tus cambios (`git commit -m 'Agregar característica increíble'`)
4. Push a la rama (`git push origin feature/caracteristica-increible`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🆘 Soporte

- 📧 Email: jjjjoseignacio@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/jjjjose/nest-init-kit/issues)
- 📖 Documentación: [Project Wiki](https://github.com/jjjjose/nest-init-kit/wiki)
- 👨‍💻 Autor: [José Ignacio (@jjjjose)](https://github.com/jjjjose)

## 🙏 Agradecimientos

- [NestJS](https://nestjs.com/) - Framework progresivo de Node.js
- [TypeORM](https://typeorm.io/) - ORM para TypeScript
- [Passport](http://www.passportjs.org/) - Middleware de autenticación
- [Swagger](https://swagger.io/) - Herramientas de documentación de API 