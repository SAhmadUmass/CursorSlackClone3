# ChatGenius

A modern chat application built with Next.js, Supabase, and shadcn/ui.

## Tech Stack

- **Frontend**: Next.js 14 with App Router
- **Styling**: TailwindCSS + shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod

## Getting Started

### Prerequisites

- Node.js (v18.17 or later)
- pnpm (recommended) or npm
- Git

### Installation

1. Clone the repository:

   ```bash
   git clone [repository-url]
   cd chat-genius
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Set up environment variables:

   ```bash
   cp .env.example .env.local
   ```

   Update the `.env.local` file with your Supabase credentials.

4. Start the development server:
   ```bash
   pnpm dev
   ```

## Project Structure

```
src/
├── app/              # Next.js app router pages
├── components/       # React components
│   ├── ui/          # Base UI components
│   ├── auth/        # Authentication components
│   └── chat/        # Chat interface components
├── lib/             # Utility functions and configurations
│   ├── supabase/    # Supabase client and helpers
│   └── utils/       # General utilities
└── types/           # TypeScript type definitions
```

## Development Guidelines

### Code Style

The project uses ESLint and Prettier for code formatting. Configuration files are included in the repository.

- Run linter:

  ```bash
  pnpm lint
  ```

- Format code:
  ```bash
  pnpm format
  ```

### UI Components

The project uses shadcn/ui components built on top of TailwindCSS and RadixUI. Key features include:

- Consistent theming using CSS variables
- Dark mode support
- Accessible components
- Type-safe props

### Contributing

1. Create a new branch for your feature
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

[Add your license here]
