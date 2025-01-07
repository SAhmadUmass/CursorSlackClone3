# ChatGenius Technical PRD

## Project Preparation

### Development Environment Setup ✓
- [x] **Local Environment**
  - [x] Node.js (v18.17 or later)
  - [x] pnpm (preferred) or npm
  - [x] Git
  - [x] VS Code with recommended extensions:
    - ESLint
    - Prettier
    - Tailwind CSS IntelliSense

- [x] **Account Setup**
  - [x] GitHub repository creation
  - [ ] Vercel account and project setup
  - [x] Supabase account and project creation

### Project Initialization ✓
- [x] **Repository Setup**
  - [x] Create Next.js project with TypeScript
  - [x] Initialize Git repository

- [x] **Dependencies Installation**
  ```bash
  # Core dependencies
  pnpm add @supabase/ssr @supabase/supabase-js
  pnpm add zustand
  pnpm add class-variance-authority clsx tailwind-merge
  pnpm add react-hook-form @hookform/resolvers zod
  pnpm add lucide-react
  
  # UI Components
  pnpm add @radix-ui/react-icons @radix-ui/react-slot
  
  # Development dependencies
  pnpm add -D @types/node @types/react @types/react-dom
  pnpm add -D eslint-config-prettier prettier eslint-plugin-prettier
  pnpm add -D tailwindcss postcss autoprefixer tailwindcss-animate
  ```

### Initial Configuration ✓
- [x] **Project Structure**
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

- [x] **Configuration Files**
  - [x] `.env.local` setup with Supabase credentials
  - [x] `tailwind.config.js` with shadcn/ui configuration
  - [x] `tsconfig.json` with proper path aliases
  - [x] ESLint and Prettier configuration

### Database Setup ✓
- [x] **Supabase Configuration**
  - [x] Create new Supabase project
  - [x] Set up database tables
    ```sql
    -- Users table
    CREATE TABLE users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      email TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      avatar_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
    );

    -- Channels table
    CREATE TABLE channels (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL,
      description TEXT,
      created_by UUID REFERENCES users(id) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
    );

    -- Messages table
    CREATE TABLE messages (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      channel_id UUID REFERENCES channels(id) ON DELETE CASCADE NOT NULL,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
    );
    ```
  - [x] Set up Row Level Security (RLS) policies
    ```sql
    -- Enable RLS
    ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
    ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

    -- Users policies
    CREATE POLICY "Users can read their own profile" ON users FOR SELECT USING (auth.uid() = id);
    CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);

    -- Channels policies
    CREATE POLICY "Anyone can read channels" ON channels FOR SELECT USING (true);
    CREATE POLICY "Authenticated users can create channels" ON channels FOR INSERT WITH CHECK (auth.uid() = created_by);
    CREATE POLICY "Channel creators can update their channels" ON channels FOR UPDATE USING (auth.uid() = created_by);

    -- Messages policies
    CREATE POLICY "Anyone can read messages" ON messages FOR SELECT USING (true);
    CREATE POLICY "Authenticated users can insert messages" ON messages FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update their own messages" ON messages FOR UPDATE USING (auth.uid() = user_id);
    ```

## Development Guidelines

### Code Style
- TypeScript for type safety
- ESLint configuration with Prettier integration
- Consistent code formatting rules:
  - Single quotes
  - No semicolons
  - 2 space indentation
  - 100 character line limit
  - Trailing commas in objects and arrays

### CSS and Styling
- TailwindCSS for styling
- CSS variables for theming:
  ```css
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    /* ... other theme variables ... */
  }
  ```
- Dark mode support via `.dark` class
- Consistent border radius using CSS variables:
  ```css
  --radius: 0.5rem;
  ```

### Component Development
- Use functional components with TypeScript
- Implement proper accessibility attributes
- Follow shadcn/ui patterns for consistency
- Use the `cn()` utility for class merging:
  ```typescript
  import { cn } from '@/lib/utils'
  
  export function Button({ className, ...props }) {
    return (
      <button
        className={cn(
          'rounded-lg bg-primary text-primary-foreground',
          className
        )}
        {...props}
      />
    )
  }
  ```

### API Routes
- [x] Implement in `src/app/api` directory
- [x] Use Next.js App Router conventions
- [x] Handle errors consistently:
  ```typescript
  try {
    // API logic
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error message' },
      { status: 500 }
    )
  }
  ```

### Testing
- [x] Test routes manually through the `/test` page
- [x] Verify Supabase connections and policies
- [ ] Test real-time functionality
- [x] Ensure proper error handling

## Next Steps
1. [ ] Set up authentication pages
2. [x] Implement channel creation
3. [x] Build message components
4. [ ] Add real-time updates 

## Feature Checklist (MVP)

### 1. Authentication
- [x] **User Management**
  - [x] Email/password registration with email verification
  - [x] Login page with error handling
  - [x] Protected routes with middleware
  - [x] Responsive auth pages with proper UI/UX
  - [ ] Sign out functionality
  - [ ] Password reset
  - [ ] User profile page

### 2. Channels ✓
- [x] **Channel Management**
  - [x] Channel list view
  - [x] Channel switching
  - [x] Channel navigation
  - [x] Active channel indication


### 3. Messaging ✓
- [x] **Core Messaging**
  - [x] Send text messages
  - [x] Message history
  - [x] Basic message timestamps
  - [x] Message input with Enter to send
  - [ ] Real-time message updates


### 4. User Interface ✓
- [x] **Essential UI**
  - [x] Responsive layout
  - [x] Channel sidebar
  - [x] Message list
  - [x] Message input
  - [x] Loading states
  - [x] Error handling
  - [x] User avatars (initials fallback)
  - [ ] Dark mode support

### 5. File Uploads
- [ ] **File Uploads**
  - [ ] Image uploads
  - [ ] File storage
  - [ ] File sharing

### 6. User presence, & status
- [ ] **User presence, & status**
  - [ ] User presence
  - [ ] User status

### 7. Thread support
- [ ] **Thread support**
  - [ ] Threaded messages
  - [ ] Threaded message history

### 8. Emoji reactions
- [ ] **Emoji reactions**
  - [ ] Emoji reactions

## Implementation Phases (MVP)
    
### Phase 1: Foundation (Week 1) ✓
1. ✓ Project Setup
   - ✓ Next.js with TypeScript
   - ✓ TailwindCSS configuration
   - ✓ Supabase setup
   - ✓ Database schema
   - ✓ RLS policies

2. ✓ Authentication
   - ✓ Basic registration/login
   - ✓ Protected routes
   - ✓ Email verification
   - ✓ Auth middleware

### Phase 2: Core Features (Week 2)
1. Channel System ✓
   - ✓ List channels
   - ✓ Switch channels
   - ✓ Channel state management

2. Messaging System ✓
   - ✓ Send messages
   - [ ] Real-time updates
   - ✓ Message history
   - ✓ Message UI components

### Phase 3: Polish (Week 3)
1. User Experience
   - Loading states
   - Error handling
   - Responsive design
   - Bug fixes

2. Launch Preparation
   - [ ] Testing
   - [ ] Deployment
   - [ ] Documentation

## Future Enhancements (Post-MVP)
- Password reset functionality
- Channel search
- Message formatting (markdown)
- Edit/delete messages
- Message reactions
- File attachments
- User avatars
- Dark mode
- Message pagination
- Infinite scroll
- Channel settings
- User presence indicators 