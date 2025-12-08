# CLO Evaluation System

A full-stack web application for tracking and evaluating Course Learning Outcomes (CLOs) built with MongoDB, Express.js, and Next.js.

## Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB** (v6.0 or higher) - running locally or accessible via connection string
- **npm** or **yarn** package manager

## Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd "CLOMS Project"
```

### 2. Backend Setup

Navigate to the backend directory and install dependencies:

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory with your MongoDB connection string:

```env
MONGODB_URI=mongodb://localhost:27017/clo_evaluation
PORT=5000
JWT_SECRET=your-secret-key-here
```

Start the backend server:

```bash
npm start
```

The backend API will run on [http://localhost:5000](http://localhost:5000)

### 3. Frontend Setup

Navigate to the frontend directory and install dependencies:

```bash
cd ../frontend
npm install
```

Create a `.env.local` file in the `frontend` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Start the frontend development server:

```bash
npm run dev
```

The frontend will run on [http://localhost:3000](http://localhost:3000)

## Running the Application

1. **Start MongoDB** (if running locally):
   ```bash
   mongod
   ```

2. **Start Backend** (in `backend` directory):
   ```bash
   npm start
   ```

3. **Start Frontend** (in `frontend` directory):
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to [http://localhost:3000](http://localhost:3000)

## Login Credentials

- **Admin:** 
  - Email: `admin2@system.com`
  - Password: `gusiuppy`

- **Instructor:** 
  - Email: `maqbool.khan@aubh.edu.bh`
  - Password: `test1234`

- **Student:** 
  - Email: `aisha.m@example.edu`
  - Password: `m4bolitm`

## Features

- **Authentication & Authorization:** JWT-based authentication with role-based access control (Admin, Instructor, Student)
- **Admin Panel:** Full CRUD operations for students, users, instructors, courses, assessments, and enrollments
- **Dynamic Forms:** Configurable CLO fields for courses and CLO mappings for assessments
- **Audit Logging:** Comprehensive transaction logs for all administrative actions
- **Dashboard:** Real-time statistics and analytics for CLO achievement tracking
- **Responsive UI:** Modern interface built with Tailwind CSS

## Project Structure

```
CLOMS Project/
├── backend/
│   ├── src/
│   │   ├── models/          # MongoDB schemas
│   │   ├── controllers/     # Request handlers
│   │   ├── services/        # Business logic
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Auth & RBAC
│   │   ├── config/          # Database config
│   │   ├── scripts/         # Utility scripts
│   │   └── backups/         # Backup/restore scripts
│   ├── server.js
│   └── package.json
└── frontend/
    ├── src/
    │   ├── app/             # Next.js app router pages
    │   ├── components/      # React components
    │   └── lib/             # API client
    └── package.json
```

## API Endpoints

- **Authentication:** `POST /api/auth/login`, `POST /api/auth/register`
- **Users:** `GET|POST|PUT|DELETE /api/users`
- **Students:** `GET|POST|PUT|DELETE /api/students`
- **Instructors:** `GET|POST|PUT|DELETE /api/instructors`
- **Courses:** `GET|POST|PUT|DELETE /api/courses`
- **Assessments:** `GET|POST|PUT|DELETE /api/assessments`
- **Enrollments:** `GET|POST|PUT|DELETE /api/enrollments`
- **Transaction Logs:** `GET|POST /api/transaction-logs`

## Technologies Used

**Backend:**
- Node.js & Express.js
- MongoDB & Mongoose
- JWT (jsonwebtoken)
- bcryptjs

**Frontend:**
- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS

## Database Backup & Restore

**Via Web Interface (Admin Panel):**
1. Login as an admin user
2. Navigate to Admin Panel → Backup tab
3. Click "🗄️ Create New Backup" to create a timestamped backup
4. View all available backups in the list
5. Click "♻️ Restore" on any backup to restore the database
6. Confirm the restoration (this will overwrite current data)

**Via Command Line (PowerShell):**

**Backup:**
```powershell
cd backend/src/backups
.\backup.ps1
```

**Restore:**
```powershell
cd backend/src/backups
.\restore.ps1
```

**Via Bash (Linux/Mac):**
```bash
cd backend/src/backups
./backup.sh
```

**Restore:**
```bash
cd backend/src/backups
./restore.sh
```

## Troubleshooting

- **MongoDB Connection Error:** Ensure MongoDB is running and the connection string in `.env` is correct
- **Port Already in Use:** Change the port in `.env` (backend) or kill the process using the port
- **CORS Issues:** Verify `NEXT_PUBLIC_API_URL` matches your backend URL

## License

This project is created for educational purposes as part of COSC 412: Implementation of Database Systems.

---