# Quản lý dự án cá nhân - Project Documentation

## Tech Stack

- **Framework**: Next.js 14.2.35 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Database**: SQLite with Prisma ORM
- **UI Components**: shadcn/ui (custom implementation)
- **Icons**: Lucide React

## Project Structure

```
Quan_ly_du_an/
├── app/                          # Next.js App Router directory
│   ├── api/                      # API routes
│   │   └── projects/             # Project CRUD endpoints
│   │       ├── route.ts          # GET (list), POST (create)
│   │       └── [id]/             # Dynamic routes
│   │           └── route.ts      # DELETE (delete)
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page (project list)
├── components/                   # React components
│   ├── create-project-dialog.tsx # Project creation modal
│   └── ui/                       # UI components (shadcn/ui style)
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       └── input.tsx
├── lib/                          # Utility libraries
│   ├── prisma.ts                 # Prisma client singleton
│   └── utils.ts                  # Utility functions (cn helper)
├── prisma/                       # Prisma ORM configuration
│   ├── schema.prisma             # Database schema
│   ├── migrations/               # Database migrations
│   └── dev.db                    # SQLite database file
├── public/                       # Static assets
├── .env                          # Environment variables
├── .gitignore                    # Git ignore rules
├── AGENTS.md                     # This file
├── next.config.js                # Next.js configuration
├── package.json                  # Dependencies and scripts
├── postcss.config.js             # PostCSS configuration
├── tailwind.config.ts            # TailwindCSS configuration
└── tsconfig.json                 # TypeScript configuration
```

## Database Schema

### Project Model
```prisma
model Project {
  id          String   @id @default(uuid())
  name        String
  description String?
  createdAt   DateTime @default(now())
}
```

## Naming Conventions

### Files and Directories
- **Components**: kebab-case (e.g., `create-project-dialog.tsx`)
- **UI Components**: kebab-case in `components/ui/` (e.g., `button.tsx`, `card.tsx`)
- **API Routes**: kebab-case (e.g., `route.ts`, `[id]/route.ts`)
- **Utilities**: kebab-case (e.g., `prisma.ts`, `utils.ts`)
- **Pages**: kebab-case (e.g., `page.tsx`, `layout.tsx`)

### Code Conventions
- **Components**: PascalCase (e.g., `CreateProjectDialog`, `Button`, `Card`)
- **Functions/Variables**: camelCase (e.g., `fetchProjects`, `handleDelete`)
- **Types/Interfaces**: PascalCase (e.g., `Project`, `CreateProjectDialogProps`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `DATABASE_URL`)

### Component Structure
- Functional components with TypeScript interfaces for props
- Hooks at the top of components
- Event handlers prefixed with `handle` (e.g., `handleSubmit`, `handleDelete`)
- State variables using `useState` hooks
- Async functions with proper error handling

## API Routes

### GET /api/projects
- Returns all projects ordered by creation date (newest first)
- Response: `Project[]`

### POST /api/projects
- Creates a new project
- Body: `{ name: string, description?: string }`
- Response: `Project` (201 status)

### DELETE /api/projects/[id]
- Deletes a project by ID
- Response: `{ success: true }`

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## Prisma Commands

```bash
npx prisma generate  # Generate Prisma Client
npx prisma migrate dev --name <name>  # Create and apply migration
npx prisma studio    # Open Prisma Studio
```

## Development Notes

- Prisma Client uses `@prisma/adapter-better-sqlite3` for SQLite connection
- Database URL configured in `.env` file
- Global Prisma client instance to prevent connection pool exhaustion
- TailwindCSS configured with custom color scheme
- Custom shadcn/ui components implemented without external CLI
- Responsive design with mobile-first approach
- Vietnamese language interface

## Environment Variables

- `DATABASE_URL`: SQLite database connection string (default: `file:./prisma/dev.db`)

## Git Ignore

The following files/directories are excluded from version control:
- `node_modules/`
- `.next/`
- `prisma/dev.db` (database file)
- `.env.local`
- `.env.production`
- Build artifacts
- Cache files
