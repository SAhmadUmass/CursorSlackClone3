# Contributing to ChatGenius

Thank you for your interest in contributing to ChatGenius! This document provides guidelines and instructions for setting up your development environment and making contributions.

## Development Setup

### Prerequisites

1. Node.js (v18.17 or later)
2. pnpm (recommended) or npm
3. Git
4. A Supabase account

### Getting Started

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
   Update `.env.local` with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

4. Set up the database:
   - Go to your Supabase project
   - Run the SQL commands from `Technical-PRD.md` to create tables and policies

5. Start the development server:
   ```bash
   pnpm dev
   ```

## Project Structure

```
src/
├── app/              # Next.js app router pages
│   ├── api/         # API routes
│   ├── (auth)/      # Authentication pages
│   └── globals.css  # Global styles
├── components/
│   ├── ui/          # Base UI components
│   ├── auth/        # Authentication components
│   └── chat/        # Chat interface components
├── lib/
│   ├── supabase/    # Supabase client and helpers
│   └── utils/       # General utilities
└── types/           # TypeScript type definitions
```

## Development Guidelines

### Code Style

- Use TypeScript for all new code
- Follow the existing code style (enforced by ESLint and Prettier)
- Run `pnpm lint` before committing
- Use meaningful variable and function names
- Add comments for complex logic

### Component Guidelines

- Create reusable components in `components/ui`
- Use TypeScript interfaces for props
- Implement proper accessibility attributes
- Follow the shadcn/ui component patterns
- Use the `cn()` utility for class merging

### CSS Guidelines

- Use TailwindCSS for styling
- Follow the existing color system using CSS variables
- Maintain dark mode support
- Keep styles modular and reusable

### Git Workflow

1. Create a new branch for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit them:
   ```bash
   git add .
   git commit -m "feat: your descriptive commit message"
   ```

3. Push your changes:
   ```bash
   git push origin feature/your-feature-name
   ```

4. Create a Pull Request on GitHub

### Commit Message Guidelines

Follow the Conventional Commits specification:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `style:` for code style changes
- `refactor:` for code refactoring
- `test:` for adding tests
- `chore:` for maintenance tasks

## Testing

1. Manual Testing
   - Test your changes in both light and dark mode
   - Verify mobile responsiveness
   - Check accessibility using keyboard navigation

2. API Testing
   - Test API endpoints using the `/test` page
   - Verify Supabase policies are working
   - Test error handling

## Need Help?

- Check the Technical PRD for detailed documentation
- Review existing components for patterns
- Create an issue for questions or problems 