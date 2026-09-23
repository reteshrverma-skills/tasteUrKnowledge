# TasteUrKnowledge - Setup Instructions

## Step 1: Configure PostgreSQL Database URL

### If you set a PostgreSQL password during installation:
Open `.env.local` and replace the DATABASE_URL:
```
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/tasteurknowledge"
```

### If you don't remember the password, reset it:
1. Open PowerShell as Administrator
2. Run:
```powershell
$env:Path += ";C:\Program Files\PostgreSQL\16\bin"
# This will prompt for the current postgres password
psql -U postgres
```

3. Once inside psql, set a new password:
```sql
ALTER USER postgres WITH PASSWORD 'your_new_password';
\q
```

## Step 2: Create the Database

Open PowerShell and run:
```powershell
$env:Path += ";C:\Program Files\PostgreSQL\16\bin"
psql -U postgres -c "CREATE DATABASE tasteurknowledge;"
```

## Step 3: Generate JWT Secret

Run this Node.js command to generate a random 32-byte JWT secret:
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and update `.env.local`:
```
JWT_SECRET="<paste_the_generated_string_here>"
```

## Step 4: Run Database Migrations

```powershell
npx prisma migrate dev --name init
```

## Step 5: Seed the Database

```powershell
npx prisma db seed
```

This will create:
- 1 Admin user (credentials printed to console)
- 1 Student sample user (credentials printed to console)
- Year 4 & Year 5 with 4 subjects each
- 3 Days per subject with 5 questions each

## Step 6: Start Development Server

```powershell
npm run dev
```

Visit `http://localhost:3000` and test the application!

## Default Test Credentials
After running the seed script, you can use:
- **Admin**: Check console output from `npx prisma db seed`
- **Student**: Check console output from `npx prisma db seed`

## Manage Database (Visual)
To view/edit the database visually, run:
```powershell
npx prisma studio
```
