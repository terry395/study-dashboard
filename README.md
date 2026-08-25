# StudyDash

StudyDash is a lightweight, high-performance personal life and study dashboard built with React, TypeScript, and Supabase.

---

## 🚀 Beginner's Guide: Running StudyDash Locally

If you are a total beginner and want to run this project directly from your PC terminal, follow these step-by-step instructions.

### Step 1: Install Prerequisites
Before you start, make sure you have these installed on your computer:
1. **Node.js**: Download and install it from [nodejs.org](https://nodejs.org/). This allows your computer to run JavaScript applications.
2. **Git**: Download and install it from [git-scm.com](https://git-scm.com/).

### Step 2: Open the Project in your Terminal
1. Open your computer's terminal (Command Prompt or PowerShell on Windows, Terminal on Mac).
2. Navigate to the folder where you want to keep the project, and clone the repository:
   ```bash
   git clone https://github.com/terry395/study-dashboard.git
   ```
3. Change your directory into the new project folder:
   ```bash
   cd "study-dashboard"
   ```
   *(Note: If you downloaded the folder directly to your Desktop instead of using Git, you would type: `cd Desktop\Study Dashboard`)*

### Step 3: Install Dependencies
Now you need to install all the required code libraries that the project relies on. In your terminal, run:
```bash
npm install
```
*(Wait for this process to finish. It might take a minute or two.)*

### Step 4: Set Up the Database (Supabase)
StudyDash uses a free cloud database called Supabase to store your assignments and events.
1. Go to [Supabase.com](https://supabase.com/) and create a free account.
2. Click **"New Project"**. Give it a name and a strong database password.
3. Once your project is ready, go to the **SQL Editor** (the terminal icon on the left sidebar in Supabase).
4. Click **"New query"**.
5. Copy all the text from the `supabase/migrations/001_initial_schema.sql` file in this project folder, paste it into the Supabase SQL editor, and click **Run**. This creates all the necessary database tables.

### Step 5: Connect Your App to the Database
Your app needs to know how to talk to your new database.
1. In your project folder, you will see a file named `.env.example`.
2. Make a copy of this file and rename the copy to exactly: `.env.local`
3. Open `.env.local` in any text editor (like Notepad or VS Code).
4. Go to your Supabase Dashboard, click the **Settings** gear icon, then click **API**.
5. Copy the **Project URL** and paste it into `.env.local` next to `VITE_SUPABASE_URL=`.
6. Copy the **anon / public key** and paste it next to `VITE_SUPABASE_ANON_KEY=`.

Your `.env.local` file should look something like this:
```env
VITE_SUPABASE_URL=https://your-unique-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 6: Start the Application!
You are finally ready to start the app. In your terminal, run:
```bash
npm run dev
```
You will see an output with a local web address. Open your web browser and go to:
👉 **http://localhost:5173/**

You can now create an account and start using StudyDash!

---

## 🛠 Tech Stack

- **Frontend**: React 18, Vite, TypeScript
- **Styling**: Tailwind CSS v4, Lucide React (icons)
- **Database/Auth**: Supabase (PostgreSQL, Row Level Security)
- **Routing**: React Router DOM

## 📦 Production Build

If you want to test exactly how the app will perform on a live web server, you can build and preview the production version locally by running these two commands:
```bash
npm run build
npm run preview
```

## 🌐 Deployment (Vercel)

The project includes a `vercel.json` file to make deploying to Vercel easy.
When you import this repository into Vercel, simply ensure you add your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the **Environment Variables** section in Vercel before clicking deploy.

## License

MIT License
