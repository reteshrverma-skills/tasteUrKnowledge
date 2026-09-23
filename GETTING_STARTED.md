# Getting Started - TasteUrKnowledge

Your complete quiz platform is ready! Follow these steps to get it running.

## ✅ What's Been Built

- ✨ Full Next.js full-stack application
- 🔐 Complete authentication system (login, register, JWT)
- 📚 Student dashboard with year/subject/day navigation
- ❓ Interactive quiz with instant grading
- 👨‍💼 Admin dashboard for content management
- 🗄️ PostgreSQL database with Prisma ORM
- 🎨 Beautiful Tailwind CSS responsive UI

## 🚀 Step-by-Step Setup

### Step 1: Update `.env.local` with Database Password

1. Open `C:\myProjects\tasteurknowledge\.env.local`
2. Replace the placeholder with your PostgreSQL password:

```env
DATABASE_URL="postgresql://postgres:YOUR_ACTUAL_PASSWORD@localhost:5432/tasteurknowledge"
JWT_SECRET="already-configured"
```

### Step 2: Create the Database

Open **PowerShell** and run:

```powershell
$env:Path += ";C:\Program Files\PostgreSQL\16\bin"
psql -U postgres -c "CREATE DATABASE tasteurknowledge;"
```

**Expected output:** `CREATE DATABASE`

### Step 3: Run Database Migrations

```powershell
cd C:\myProjects\tasteurknowledge
npx prisma migrate dev --name init
```

**This will:**
- Create all tables in your PostgreSQL database
- Generate Prisma client code

### Step 4: Seed Sample Data

```powershell
npx prisma db seed
```

**This creates:**
- ✅ Admin User: `admin` / `admin123`
- ✅ Student User: `student` / `student123`
- ✅ Parent User: `parent` / `parent123`
- ✅ Years: Year 4, Year 5
- ✅ Subjects: English, Maths, Verbal, Non-Verbal
- ✅ Days: 3 days per subject
- ✅ Questions: 5 questions per day (all seeded)

### Step 5: Start Development Server

```powershell
npm run dev
```

**You should see:**
```
- ready started server on 0.0.0.0:3000, url: http://localhost:3000
```

### Step 6: Open in Browser

Visit: **http://localhost:3000**

## 🎯 Test the Application

### Test Student Flow

1. **Register a New Student:**
   - Click "Sign up"
   - Enter name, email, password
   - Should redirect to dashboard

2. **View Dashboard:**
   - You should see "Year 4" and "Year 5" cards
   - Each card shows 4 subjects: English, Maths, Verbal, Non-Verbal

3. **Take a Quiz:**
   - Click on a subject
   - Click on a day (e.g., "Day 1")
   - Answer all 5 questions
   - Click "Submit Answers"
   - View results with score and correct answers

4. **Logout:**
   - Click "Logout" in top navigation
   - Should redirect to login page

### Test Admin Flow

1. **Login as Admin:**
   - User ID: `admin`
   - Password: `admin123`

2. **Access Admin Panel:**
   - Click "Admin Panel" link in top navigation
   - Or visit: `http://localhost:3000/admin`

3. **Test Each Admin Section:**
   
   **Years:**
   - Add "Year 6"
   - Delete it to test deletion

   **Subjects:**
   - Add "Computer Science" under Year 4
   - Verify it appears in student dashboard
   - Delete it

   **Days:**
   - Add "Day 4" under a subject
   - Verify it appears in quiz selection
   - Delete it

   **Questions:**
   - Add a new question for any day
   - Fill all fields and select correct option
   - Verify it appears in the quiz
   - Delete it

## 📁 Project File Structure

```
tasteurknowledge/
├── src/
│   ├── app/
│   │   ├── api/              # All API routes
│   │   ├── admin/            # Admin dashboard pages
│   │   ├── dashboard/        # Student dashboard
│   │   ├── quiz/             # Quiz taking page
│   │   ├── login/            # Login page
│   │   ├── register/         # Registration page
│   │   └── layout.tsx        # Root layout
│   ├── lib/
│   │   ├── auth.ts          # Authentication utilities
│   │   └── prisma.ts        # Prisma client singleton
│   └── middleware.ts        # Route protection
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts              # Sample data seeding
├── .env.local               # Environment variables
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
└── README.md
```

## 🛠️ Useful Commands

```powershell
# Start development server
npm run dev

# View database visually (Prisma Studio)
npx prisma studio

# Reset database (CAREFUL! Deletes all data)
npx prisma migrate reset

# Build for production
npm run build

# Start production server
npm start

# View database migrations
npx prisma migrate status
```

## 🔑 Default Users (After Seeding)

| User Type | User ID | Password |
|------|-------|----------|
| Admin | admin | admin123 |
| Student | student | student123 |
| Parent | parent | parent123 |

## 🐛 Troubleshooting

### Issue: "PostgreSQL psql not found"
```powershell
# Add to PATH
$env:Path += ";C:\Program Files\PostgreSQL\16\bin"
```

### Issue: "Cannot find module 'next'"
```powershell
npm install
```

### Issue: "Database connection refused"
1. Check PostgreSQL is running:
   - Open Services (Win+R → services.msc)
   - Look for "postgresql-x64-16"
   - Should show "Running"

2. Verify database exists:
   ```powershell
   $env:Path += ";C:\Program Files\PostgreSQL\16\bin"
   psql -U postgres -l
   ```

### Issue: "Invalid JWT token"
- Clear browser cookies
- Delete stored tokens
- Log in again

### Issue: "Cannot find page"
- Make sure server is running (`npm run dev`)
- Check you're accessing correct URLs
- Try http://localhost:3000 first

## 📚 Next Steps

### Customize the Platform

1. **Change Colors:** Edit Tailwind classes in components
2. **Add More Years:** Admin panel → Years → Add Year
3. **Create Custom Questions:** Admin panel → Questions → Add Question
4. **Modify Seed Data:** Edit `prisma/seed.ts` for different sample data

### Deploy to Production

1. **Vercel (Recommended):**
   - Push code to GitHub
   - Connect to Vercel
   - Set environment variables
   - Deploy!

2. **Other Platforms (Heroku, Railway, etc.):**
   - Ensure PostgreSQL is available
   - Set DATABASE_URL environment variable
   - Deploy as Node.js app

## 📞 Support

For issues or questions:
1. Check the main README.md
2. Review Prisma docs: https://www.prisma.io/docs
3. Check Next.js docs: https://nextjs.org/docs

## 🎉 You're All Set!

Your quiz platform is ready to use. Start by:
1. Running `npm run dev`
2. Opening http://localhost:3000
3. Testing with student and admin accounts
4. Customizing with your own content!

Happy quizzing! 🚀
