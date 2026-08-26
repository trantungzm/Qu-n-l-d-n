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
│   │   ├── projects/             # Project CRUD endpoints
│   │   │   ├── route.ts          # GET (list), POST (create)
│   │   │   └── [id]/             # Dynamic routes
│   │   │       ├── route.ts      # DELETE (delete)
│   │   │       └── tasks/        # Task endpoints for project
│   │   │           └── route.ts  # GET (list), POST (create)
│   │   └── tasks/                # Task CRUD endpoints
│   │       └── [id]/             # Dynamic routes
│   │           └── route.ts      # PATCH (update), DELETE (delete)
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page (project list)
│   └── projects/                 # Project pages
│       └── [id]/                 # Dynamic project detail page
│           └── page.tsx          # Project detail with task list
├── components/                   # React components
│   ├── create-project-dialog.tsx # Project creation modal
│   ├── create-task-dialog.tsx    # Task creation modal
│   └── ui/                       # UI components (shadcn/ui style)
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       └── input.tsx
├── __tests__/                    # Test files
│   └── api/                      # API tests
│       └── tasks.test.ts         # Task API tests
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
├── jest.config.js                # Jest configuration
├── jest.setup.js                 # Jest setup file
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
  tasks       Task[]
}
```

### Task Model
```prisma
model Task {
  id        String   @id @default(uuid())
  title     String
  done      Boolean  @default(false)
  projectId String
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
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

### GET /api/projects/[id]/tasks
- Returns all tasks for a specific project ordered by creation date (newest first)
- Response: `Task[]`

### POST /api/projects/[id]/tasks
- Creates a new task for a specific project
- Body: `{ title: string }`
- Response: `Task` (201 status)

### PATCH /api/tasks/[id]
- Updates a task (done status)
- Body: `{ done: boolean }`
- Response: `Task`

### DELETE /api/tasks/[id]
- Deletes a task by ID
- Response: `{ success: true }`

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm test             # Run Jest tests
npm run test:watch   # Run Jest tests in watch mode
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
- Testing with Jest and React Testing Library
- Tests located in `__tests__/` directory following project structure

## Testing

### Test Structure
- API tests: `__tests__/api/*.test.ts`
- Component tests: `__tests__/components/*.test.tsx`
- Utility tests: `__tests__/lib/*.test.ts`

### Running Tests
```bash
npm test              # Run all tests once
npm run test:watch    # Run tests in watch mode
```

### Test Conventions
- Mock external dependencies (Prisma, API calls)
- Test files should end with `.test.ts` or `.test.tsx`
- Use descriptive test names
- Group related tests with `describe` blocks
- Mock Prisma client for database operations

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
