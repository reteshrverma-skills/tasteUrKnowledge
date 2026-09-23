# TasteUrKnowledge - Interactive Quiz Platform

A full-stack web application for creating and taking interactive quizzes. Built with Next.js, PostgreSQL, and modern web technologies.

## Features

- 🔐 **User Authentication**: Secure login and registration system with JWT tokens
- 📚 **Dynamic Content**: Years, Subjects, and Days managed in real-time
- ❓ **Quiz Taking**: Multiple-choice questions with immediate grading
- 📊 **Instant Results**: View scores and correct answers after submission
- 👨‍💼 **Admin Dashboard**: Full CRUD operations for managing all content
- 🎨 **Modern UI**: Beautiful, responsive design with Tailwind CSS
- 🗄️ **PostgreSQL Database**: Robust data persistence

## Tech Stack

- **Frontend**: Next.js 16+ (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: JWT + bcryptjs + httpOnly Cookies
- **Validation**: Zod

## Quick Start

### Prerequisites

- Node.js 18+ LTS ([Download](https://nodejs.org))
- PostgreSQL 16 ([Download](https://www.postgresql.org/download))
- npm or yarn

### 1. Environment Configuration

Create `.env.local` in the project root:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/tasteurknowledge"
JWT_SECRET="generate-a-random-32-byte-string-here"
```

**To generate a random JWT secret:**
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Database Setup

#### Create the database:
```powershell
$env:Path += ";C:\Program Files\PostgreSQL\16\bin"
psql -U postgres -c "CREATE DATABASE tasteurknowledge;"
```

#### Run migrations:
```powershell
npx prisma migrate dev --name init
```

#### Seed sample data:
```powershell
npx prisma db seed
```

This creates:
- **Admin User**: `admin` / admin123
- **Student User**: `student` / student123
- **Parent User**: `parent` / parent123
- **Years**: Year 4, Year 5
- **Subjects**: English, Maths, Verbal, Non-Verbal (under each year)
- **Days**: 3 days per subject with 5 sample questions each

### 3. Run Development Server

```powershell
npm run dev
```

Visit: [http://localhost:3000](http://localhost:3000)

## User Roles

### Student
- View available years and subjects
- Take quizzes day by day
- View instant results and correct answers
- Cannot access admin panel

### Admin
- Manage Years (create, view, delete)
- Manage Subjects (create, view, delete)
- Manage Days (create, view, delete)
- Manage Questions (create, view, delete)
- Full CRUD control over all content

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/              # Authentication endpoints
│   │   ├── admin/             # Admin CRUD APIs
│   │   ├── days/              # Quiz data and submission
│   │   ├── subjects/          # Subject data
│   │   └── years/             # Years data
│   ├── admin/                 # Admin dashboard pages
│   ├── dashboard/             # Student dashboard
│   ├── quiz/                  # Quiz taking page
│   ├── login/                 # Login page
│   └── register/              # Registration page
├── lib/
│   ├── auth.ts               # Authentication utilities
│   └── prisma.ts             # Prisma client
└── middleware.ts             # Route protection

prisma/
├── schema.prisma             # Database schema
└── seed.ts                   # Database seeding script
```

## Database Schema

### Models
- **User**: Stores user information with roles (STUDENT/ADMIN)
- **Year**: Academic years (e.g., Year 4, Year 5)
- **Subject**: Subjects under each year
- **Day**: Quiz days under each subject
- **Question**: MCQ questions with 4 options and correct answer
- **Attempt**: Student quiz attempts with scores
- **Answer**: Individual answers per question

## API Routes

### Authentication
- `POST /api/auth/register` - Register new student
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Data Retrieval
- `GET /api/years` - Get all years with subjects
- `GET /api/subjects/[id]/days` - Get days for a subject
- `GET /api/days/[id]` - Get questions for a day

### Quiz Submission
- `POST /api/days/[id]/submit` - Submit answers and get graded results

### Admin APIs
- `GET/POST /api/admin/years` - Manage years
- `DELETE /api/admin/years/[id]` - Delete year
- `GET/POST /api/admin/subjects` - Manage subjects
- `DELETE /api/admin/subjects/[id]` - Delete subject
- `GET/POST /api/admin/days` - Manage days
- `DELETE /api/admin/days/[id]` - Delete day
- `GET/POST /api/admin/questions` - Manage questions
- `DELETE /api/admin/questions/[id]` - Delete question

## Common Tasks

### View Database (Visual)
```powershell
npx prisma studio
```

### Reset Database
```powershell
npx prisma migrate reset
```

### Add New Year
1. Log in as admin
2. Go to Admin Panel → Years
3. Fill in the form and click "Add Year"

### Add Questions
1. Admin Panel → Questions
2. Select a Day
3. Fill in all 4 options
4. Select correct option
5. Click "Create"

## Troubleshooting

### "psql command not found"
Add PostgreSQL to PATH:
```powershell
$env:Path += ";C:\Program Files\PostgreSQL\16\bin"
```

### "Database connection refused"
- Check PostgreSQL is running
- Verify DATABASE_URL is correct
- Ensure database `tasteurknowledge` exists

### "JWT validation failed"
- Make sure `JWT_SECRET` is set in `.env.local`
- Clear browser cookies and try again

## Production Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect repo to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy!

### Other Platforms
Ensure:
- Node.js 18+ runtime available
- PostgreSQL connection string configured
- Environment variables set
- `npm run build` succeeds

## License

This project is open source and available for educational purposes.
