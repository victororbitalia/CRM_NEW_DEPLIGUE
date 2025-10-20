# Project Context

## Purpose
REBOTLUTION is a comprehensive restaurant reservation management system designed to streamline the booking process for restaurants. The system provides real-time reservation tracking, table management, restaurant configuration, and analytics through a modern web interface. It includes a complete REST API for integrations with external systems.

## Tech Stack
- **Frontend**: Next.js 14 with App Router, React 18, TypeScript
- **Styling**: Tailwind CSS with utility-first approach
- **Database**: PostgreSQL with Prisma ORM
- **State Management**: React Context API
- **API**: Next.js API Routes (RESTful)
- **Deployment**: Docker support with standalone output
- **Date Handling**: Luxon for date/time operations

## Project Conventions

### Code Style
- TypeScript with strict mode enabled
- ESLint configuration extending Next.js core-web-vitals
- Component-based architecture with reusable UI components
- Spanish language for UI text and comments
- PascalCase for components, camelCase for variables and functions
- Type definitions organized in `/types` directory
- API routes following RESTful conventions

### Architecture Patterns
- **App Router**: Next.js 14 App Router for routing and layouts
- **Component Architecture**: Separation of concerns with dedicated components
- **API Structure**: RESTful endpoints organized by resource type
- **Database Design**: Prisma schema with relational models
- **State Management**: React Context for global state
- **File Organization**: Feature-based structure with clear separation

### Testing Strategy
- Currently no formal testing framework implemented
- Manual testing through development environment
- API testing through direct endpoint calls
- Database testing through Prisma Studio

### Git Workflow
- Standard Git workflow with feature branches
- Commit messages in Spanish matching project language
- Repository initialized for deployment to Easypanel

## Domain Context

### Restaurant Operations
- **Reservations**: Complete lifecycle from pending to completed
- **Table Management**: Location-based table organization (interior, exterior, terraza, privado)
- **Settings**: Comprehensive restaurant configuration with weekday-specific rules
- **Analytics**: Real-time statistics and occupancy metrics

### Business Rules
- Table availability based on location and capacity
- Reservation status flow: pending → confirmed → seated → completed/cancelled
- Configurable reservation policies (advance booking, cancellation, deposits)
- Day-specific capacity and table allocation rules
- Walk-in table reservations (always reserved tables)

## Important Constraints

### Technical Constraints
- PostgreSQL database required (no SQLite support)
- Next.js 14 with App Router (not Pages Router)
- TypeScript strict mode enforced
- Spanish language interface (not configurable)

### Business Constraints
- Single restaurant management (not multi-tenant)
- No authentication system implemented
- No payment processing integration
- Email/SMS notifications configured but not implemented

## External Dependencies

### Required Services
- **PostgreSQL**: Database server (version 12+)
- **Node.js**: Runtime environment (version 18+)

### Optional Integrations
- **Easypanel**: Recommended deployment platform
- **Docker**: Containerized deployment option
- **Email Service**: Configuration available but not implemented
- **SMS Service**: Configuration available but not implemented

### Development Tools
- **Prisma**: Database ORM and migration tool
- **Tailwind CSS**: Utility-first CSS framework
- **Luxon**: Date/time manipulation library
