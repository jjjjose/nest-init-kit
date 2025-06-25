# Nest Init Kit 🚀

> 🌐 **Language / Idioma**: [English](README.md) | [Español](README-ES.md)

A production-ready NestJS boilerplate with JWT authentication, TypeORM database integration, comprehensive testing, and advanced enterprise features.

## 🌟 Features

### Core Features
- **🔐 JWT Authentication System** - Complete authentication with access/refresh tokens, RSA256 signing
- **👤 User Management** - Full user entity with roles, email verification, password reset, account locking
- **🛡️ Role-Based Access Control (RBAC)** - USER, ADMIN, SUPERADMIN roles with decorators
- **🗄️ Database Integration** - PostgreSQL with TypeORM, migrations, and seeders
- **📚 API Documentation** - Auto-generated Swagger/OpenAPI documentation
- **🧪 Testing Suite** - Unit and E2E tests with fixtures and comprehensive coverage

### Security & Monitoring
- **🔒 Security Guards** - JWT authentication guard, client validation, role validation
- **📊 Request Monitoring** - Request logging middleware and interceptors
- **🚫 Exception Handling** - Global exception filters with standardized error responses
- **✅ Input Validation** - Class-validator with DTO validation and transformation
- **🌐 CORS Configuration** - Flexible CORS setup for different environments

### Developer Experience
- **📝 TypeScript** - Full TypeScript support with strict typing
- **🎯 ESLint & Prettier** - Code formatting and linting setup
- **🔧 Environment Validation** - Strict environment variable validation with custom decorators
- **🏗️ Modular Architecture** - Clean separation of concerns with feature modules
- **📦 Package Management** - PNPM workspace configuration
- **🔄 Migration Tools** - Database migration and seeding scripts

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PNPM 8+
- PostgreSQL 13+
- OpenSSL (for JWT certificate generation)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd nest-init-kit
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Generate JWT certificates**
```bash
# Create certificates directory
mkdir -p .certs

# Generate private key
openssl genrsa -out .certs/jwt-private.pem 2048

# Generate public key
openssl rsa -in .certs/jwt-private.pem -pubout -out .certs/jwt-public.pem
```

4. **Setup environment variables**
```bash
# Copy example environment file
cp .env.example .env

# Configure your environment variables (see Configuration section)
```

5. **Setup database**
```bash
# Run migrations
pnpm run migration:run

# Run seeders (optional)
pnpm run seed:run
```

6. **Start the application**
```bash
# Development mode
pnpm run start:dev

# Production mode
pnpm run build
pnpm run start:prod
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
SERVER_PORT=3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=nest_init_kit
DATABASE_SSL_DISABLE_REJECT_UNAUTHORIZED=false

# JWT Configuration (RSA256)
JWT_PRIVATE_KEY_PATH=./.certs/jwt-private.pem
JWT_PUBLIC_KEY_PATH=./.certs/jwt-public.pem
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
JWT_ISSUER=nestjs-api
JWT_AUDIENCE=nestjs-client

# Email Configuration (Optional)
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_SERVICE=gmail

# Kafka Configuration (Optional)
KAFKA_BROKERS=localhost:9092
```

## 🏗️ Project Structure

```
src/
├── config/                 # Configuration files
│   ├── database.config.ts   # Database configuration
│   ├── env.validation.ts    # Environment validation
│   ├── jwt.config.ts        # JWT configuration
│   └── swagger.config.ts    # API documentation setup
├── database/               # Database layer
│   ├── entities/           # TypeORM entities
│   ├── migrations/         # Database migrations
│   ├── repositories/       # Custom repositories
│   ├── seeders/           # Database seeders
│   └── scripts/           # Migration utilities
├── features/              # Feature modules
│   ├── auth/              # Authentication module
│   └── users/             # User management module
├── shared/                # Shared utilities
│   ├── constants/         # Application constants
│   ├── decorators/        # Custom decorators
│   ├── enums/            # Enumerations
│   ├── filters/          # Exception filters
│   ├── guards/           # Authentication guards
│   ├── interceptors/     # Request interceptors
│   ├── jwt/              # JWT utilities
│   ├── middleware/       # Custom middleware
│   └── services/         # Shared services
└── main.ts               # Application entry point
```

## 🧪 Testing

### Running Tests

```bash
# Unit tests
pnpm run test:unit

# E2E tests
pnpm run test:e2e

# Test coverage
pnpm run test:cov

# Watch mode
pnpm run test:watch

# Authentication-specific tests
pnpm run test:auth
pnpm run test:auth:e2e
```

### Test Structure
- **Unit Tests**: Located in `test/unit/`
- **E2E Tests**: Located in `test/e2e/`
- **Fixtures**: Test data helpers in `test/fixtures/`
- **Coverage Reports**: Generated in `coverage/` directory

## 📚 API Documentation

When running in development mode, Swagger documentation is available at:
- **URL**: `http://localhost:3000/docs`
- **Features**: JWT Bearer authentication, interactive API testing, request/response examples

## 🔐 Authentication

### Endpoints

- `POST /auth/login` - User login with email/password
- `GET /auth/test` - Test protected endpoint
- `GET /auth/public` - Public endpoint (no auth required)
- `POST /auth/register-client` - Register new client for API access
- `POST /auth/refresh` - Refresh access token

### JWT Implementation
- **Algorithm**: RS256 (RSA with SHA-256)
- **Access Token**: 15 minutes expiration
- **Refresh Token**: 7 days expiration
- **Headers**: Authorization: `Bearer <token>`

### Roles & Permissions
- **USER**: Basic user access
- **ADMIN**: Administrative privileges
- **SUPERADMIN**: Full system access

## 🗄️ Database

### Migration Commands

```bash
# Generate new migration
pnpm run migration:generate

# Create empty migration
pnpm run migration:create

# Run migrations
pnpm run migration:run

# Revert last migration
pnpm run migration:revert

# Show migration status
pnpm run migration:show
```

### Seeder Commands

```bash
# Run seeders
pnpm run seed:run

# Drop all data
pnpm run seed:drop
```

## 🚀 Deployment

### Docker Deployment

```bash
# Build Docker image
docker build -t nest-init-kit .

# Run container
docker run -p 3000:3000 nest-init-kit
```

### Environment-Specific Builds

```bash
# Production build
pnpm run build
pnpm run start:prod

# Development mode
pnpm run start:dev
```

## 🛠️ Development

### Code Quality

```bash
# Linting
pnpm run lint

# Code formatting
pnpm run format

# Type checking
pnpm run build
```

### Debugging

```bash
# Debug mode
pnpm run start:debug

# Watch mode with debug
pnpm run start:debug
```

## 📦 Available Scripts

| Script | Description |
|--------|-------------|
| `start` | Start production server |
| `start:dev` | Start development server with watch mode |
| `start:debug` | Start server in debug mode |
| `build` | Build application for production |
| `test` | Run all tests |
| `test:unit` | Run unit tests only |
| `test:e2e` | Run E2E tests only |
| `test:cov` | Run tests with coverage |
| `lint` | Run ESLint |
| `format` | Format code with Prettier |
| `migration:*` | Database migration commands |
| `seed:*` | Database seeding commands |

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📧 Email: jjjjoseignacio@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/jjjjose/nest-init-kit/issues)
- 📖 Documentation: [Project Wiki](https://github.com/jjjjose/nest-init-kit/wiki)
- 👨‍💻 Author: [José Ignacio (@jjjjose)](https://github.com/jjjjose)

## 🙏 Acknowledgments

- [NestJS](https://nestjs.com/) - Progressive Node.js framework
- [TypeORM](https://typeorm.io/) - ORM for TypeScript
- [Passport](http://www.passportjs.org/) - Authentication middleware
- [Swagger](https://swagger.io/) - API documentation tools
