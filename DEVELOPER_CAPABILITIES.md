# Better Marketing - Developer Capabilities

## CLI Development Tools

### Project Setup & Configuration

- **`npx better-marketing-cli init`** - Initialize better-marketing in your project with interactive setup
- **`npx better-marketing-cli secret`** - Generate secure secret keys for authentication
- **`npx better-marketing-cli info`** - Display system information, dependencies, and project configuration

### Database Management

- **`npx better-marketing-cli generate`** - Generate database schemas for your ORM (Prisma, Drizzle, Kysely)
- **`npx better-marketing-cli migrate`** - Apply database migrations directly (Kysely adapter only)
- **Schema Generation Support** - Automatically create tables for users, events, campaigns, segments, emails

### Configuration Detection

- **Auto-detect package managers** (npm, yarn, pnpm, bun)
- **TypeScript configuration analysis** - Parse and validate tsconfig.json
- **Dependency installation** - Automatically install required packages
- **Multi-database support** - Generate schemas for SQLite, MySQL, PostgreSQL, MSSQL, MongoDB

## Framework Integrations

### Web Frameworks

- **Next.js Integration** - `toNextJsHandler()` for API routes with GET/POST/PUT/DELETE/PATCH/OPTIONS support
- **Express.js Integration** - Middleware for handling marketing requests
- **Fastify Integration** - Plugin-based integration
- **Hono Integration** - Lightweight framework support
- **NestJS Integration** - Decorator-based integration
- **SvelteKit Integration** - Server-side request handling

### Frontend Clients

- **React Client** - `createMarketingClient()` with hooks and store management
- **Vanilla JS Client** - Framework-agnostic client library
- **React Store Management** - `useStore()` hook for state management

## Database Adapters & Testing

### Database Adapters

- **Memory Adapter** - `memoryAdapter()` for development and testing
- **Kysely Adapter** - `kyselyAdapter()` with SQLite, MySQL, PostgreSQL, MSSQL support
- **Prisma Adapter** - `prismaAdapter()` integration
- **MongoDB Adapter** - NoSQL database support

### Testing Utilities

- **Test Helpers** - `createTestUser()`, `createTestEvent()` for unit tests
- **Memory Database Testing** - In-memory database for fast test execution
- **Jest Configuration** - Pre-configured test setup
- **Vitest Support** - Modern testing framework integration
- **Test Setup** - Crypto mocking and environment configuration

## Development APIs

### Core Development APIs

- **Configuration Validation** - `validateConfig()` for setup validation
- **ID Generation** - `generateId()` for unique identifiers
- **Email/Phone Validation** - Built-in validation utilities
- **String Sanitization** - Database-safe string processing
- **Deep Object Merging** - Configuration merging utilities
- **Retry Logic** - Exponential backoff for network operations

### Plugin Development

- **Plugin Architecture** - Extensible plugin system with schema support
- **Campaign Plugin** - Marketing campaign management
- **Core Plugin System** - Base plugin functionality
- **Custom Plugin Creation** - Build your own marketing plugins
- **Database Schema Extension** - Add fields to existing tables (user, campaign, event, etc.)
- **New Table Creation** - Create entirely new database tables through plugins
- **Type-Safe Field Definitions** - Full TypeScript support for custom fields
- **Auto-Migration Support** - CLI automatically generates migrations for plugin schemas
- **Field Attribute Control** - Configure required, input, default values, and more

### Database Schema Management

- **Schema Generation** - Automatic table creation for all supported ORMs
- **Migration Support** - Database version management
- **Table Utilities** - `getMarketingTables()` for schema inspection
- **Field Definitions** - Type-safe database field configurations

## Build & Development Tools

### Build Configuration

- **TypeScript Builds** - Multiple output formats (CJS, ESM)
- **Source Maps** - Debugging support in development
- **Declaration Files** - Full TypeScript type definitions
- **Tree Shaking** - Optimized bundle sizes
- **External Dependencies** - Framework-specific externals

### Package Structure

- **Modular Exports** - Import only what you need
- **Entry Points**:
  - `better-marketing` - Core functionality
  - `better-marketing/client` - Client-side SDK
  - `better-marketing/adapters/memory` - Memory adapter
  - `better-marketing/adapters/kysely` - Kysely adapter
  - `better-marketing/test` - Testing utilities
  - `better-marketing/crypto` - Cryptographic functions

### Development Environment

- **Hot Reload Support** - Development server integration
- **Environment Configuration** - `.env` file management
- **Debug Logging** - Built-in logger with levels
- **Error Handling** - Comprehensive error management

## API Development

### Request Handling

- **HTTP Method Support** - GET, POST, PUT, DELETE, PATCH, OPTIONS
- **Request Parsing** - Automatic JSON/form data parsing
- **Response Formatting** - Standardized API responses
- **CORS Handling** - Cross-origin request support

### Authentication & Security

- **Secret Key Management** - Secure key generation and validation
- **Session Management** - User session handling
- **Rate Limiting** - Built-in rate limiting capabilities
- **Origin Validation** - Trusted origins configuration

### Data Models

- **User Management** - Create, read, update, delete users
- **Event Tracking** - Custom event logging and analytics
- **Campaign Management** - Marketing campaign CRUD operations
- **Email Operations** - Transactional and marketing email handling
- **Segmentation** - User segment creation and management

## Monitoring & Analytics

### Built-in Analytics

- **Event Tracking** - Custom event properties and metadata
- **User Behavior** - Page views, clicks, conversions
- **Campaign Analytics** - Email open rates, click tracking
- **Custom Properties** - Flexible data collection

### Third-party Integrations

- **Google Analytics** - Integration templates
- **Mixpanel** - Event tracking integration
- **Custom Analytics** - Build your own analytics provider

## Development Workflow

### Local Development

- **Demo Applications** - Ready-to-run examples
- **Development Database** - SQLite for quick prototyping
- **Hot Module Replacement** - Fast development iteration
- **TypeScript Strict Mode** - Type safety enforcement

### Production Deployment

- **Environment Variables** - Production configuration management
- **Database Migrations** - Version-controlled schema changes
- **Error Monitoring** - Production error handling
- **Performance Optimization** - Built-in caching and optimization

### Code Quality

- **ESLint Configuration** - Linting rules for better-marketing projects
- **TypeScript Configuration** - Strict type checking
- **Test Coverage** - Comprehensive test suites
- **Code Formatting** - Prettier integration

This comprehensive list covers all the development tools, utilities, and capabilities available in the better-marketing framework and its CLI for developers building marketing-focused applications.
