# Compatibility Matrix - Setup Guide

Welcome to **Compatibility Matrix** - a modern proof-of-concept web application for managing employee assessments, skills, and proficiency tracking.

## 🎯 Overview

Compatibility Matrix helps you:
- Manage employees and their departmental assignments
- Define organizational roles and their requirements
- Create proficiency level scales for assessments
- Track employee assessments against roles and skills
- Visualize trends in employee proficiency over time

## 🚀 Quick Start

### Prerequisites

You need to have:
- **MySQL Server** running locally or accessible via network
- **Node.js** (v16+)
- **npm/pnpm** package manager

### 1. Set Up Database

Compatibility Matrix uses **MySQL** as its database. Follow these steps:

#### Option A: Local MySQL Installation

**On macOS (using Homebrew):**
```bash
brew install mysql
brew services start mysql
```

**On Linux (Ubuntu/Debian):**
```bash
sudo apt-get install mysql-server
sudo service mysql start
```

**On Windows:**
- Download and install [MySQL Community Server](https://dev.mysql.com/downloads/mysql/)
- Start the MySQL service

#### Option B: Docker (Recommended for quick setup)

If you have Docker installed, run:
```bash
docker run -d \
  -e MYSQL_ROOT_PASSWORD=root \
  -p 3306:3306 \
  --name compatibility-matrix-db \
  mysql:latest
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DB_HOST=localhost          # MySQL host (default: localhost)
DB_USER=root               # MySQL username (default: root)
DB_PASSWORD=root           # MySQL password
DB_NAME=compatibility_matrix  # Database name (auto-created if doesn't exist)

# Server Configuration
PORT=3000                  # Server port (default: 3000)
NODE_ENV=development       # Environment
```

### 3. Start the Application

```bash
# Install dependencies (if not already done)
pnpm install

# Start the development server
pnpm run dev
```

The application will be available at: **http://localhost:8080**

### 4. Seed Sample Data (Optional)

To populate the database with sample roles, employees, and proficiency levels:

```bash
pnpm run seed
```

This will create:
- 5 proficiency levels (Beginner to Master)
- 5 sample roles (Frontend Engineer, Backend Engineer, etc.)
- 5 sample employees
- Sample assessments with historical data

## 📱 Using the Application

### Dashboard
The main dashboard shows:
- **Overall Proficiency Trend** - Average proficiency across all assessments
- **Individual Employee Trends** - Filter and view trends by employee
- **Key Metrics** - Total employees, assessments, and average proficiency

### Employees
Manage your workforce:
- Create, update, and delete employees
- Track employee names, emails, and departments
- View all employees in a sortable table

### Roles
Define organizational roles:
- Create roles with descriptions
- Associate skills and proficiency requirements
- Manage role lifecycle

### Proficiency Levels
Create custom proficiency scales:
- Define level names (e.g., Beginner, Intermediate, Advanced)
- Assign numeric values (1-5) for scoring
- View color-coded proficiency badges

### Assessments
Track employee skill assessments:
- Create new assessments for employees against roles
- Add multiple skill evaluations per assessment
- Include assessment dates and comments
- View complete assessment history
- Delete assessments as needed

## 📊 Database Schema

The application uses the following tables:

```sql
roles
  ├─ id (INT, PRIMARY KEY)
  ├─ name (VARCHAR)
  ├─ description (TEXT)
  └─ timestamps

proficiency_levels
  ├─ id (INT, PRIMARY KEY)
  ├─ level_name (VARCHAR)
  ├─ numeric_value (INT, 1-5)
  └─ timestamps

employees
  ├─ id (INT, PRIMARY KEY)
  ├─ name (VARCHAR)
  ├─ email (VARCHAR, UNIQUE)
  ├─ department (VARCHAR)
  └─ timestamps

assessments
  ├─ id (INT, PRIMARY KEY)
  ├─ employee_id (INT, FK)
  ├─ role_id (INT, FK)
  ├─ date (DATE)
  ├─ comments (TEXT)
  └─ timestamps

assessment_items
  ├─ id (INT, PRIMARY KEY)
  ├─ assessment_id (INT, FK)
  ├─ skill_name (VARCHAR)
  ├─ proficiency_level_id (INT, FK)
  └─ timestamps
```

## 🔧 API Endpoints

All API endpoints are prefixed with `/api/`

### Roles
- `GET /api/roles` - Get all roles
- `POST /api/roles` - Create a new role
- `PUT /api/roles/:id` - Update a role
- `DELETE /api/roles/:id` - Delete a role

### Proficiency Levels
- `GET /api/proficiency-levels` - Get all proficiency levels
- `POST /api/proficiency-levels` - Create a new level
- `PUT /api/proficiency-levels/:id` - Update a level
- `DELETE /api/proficiency-levels/:id` - Delete a level

### Employees
- `GET /api/employees` - Get all employees
- `POST /api/employees` - Create a new employee
- `PUT /api/employees/:id` - Update an employee
- `DELETE /api/employees/:id` - Delete an employee

### Assessments
- `GET /api/assessments` - Get all assessments
- `POST /api/assessments` - Create a new assessment
- `GET /api/assessments/history/:employeeId` - Get assessments for specific employee
- `GET /api/assessments/analytics/trends` - Get trend analytics

## 🎨 Technology Stack

- **Frontend**: React 18 + React Router 6 + TypeScript
- **Backend**: Express.js + Node.js
- **Database**: MySQL with promise-based client (mysql2/promise)
- **UI Framework**: TailwindCSS 3 + shadcn/ui components
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React
- **Form Handling**: React Hook Form

## 📦 Build & Deployment

### Development Build
```bash
pnpm run dev
```

### Production Build
```bash
pnpm run build
```

### Start Production Server
```bash
pnpm start
```

## 🐛 Troubleshooting

### Database Connection Error
If you see "ECONNREFUSED" error:
1. Verify MySQL is running: `mysql -u root -p`
2. Check environment variables in `.env`
3. Make sure the database user has proper permissions

### Port Already in Use
If port 8080 or 3000 is already in use:
```bash
# Change in vite.config.ts or via environment
PORT=3001 pnpm run dev
```

### Missing Tables
Tables are auto-created on first run. If issues persist:
```bash
pnpm run seed  # This recreates all tables
```

## 📝 Project Structure

```
compatibility-matrix/
├── client/                  # React Frontend
│   ├── pages/              # Route components
│   │   ├── Dashboard.tsx
│   │   ├── Employees.tsx
│   │   ├── Roles.tsx
│   │   ├── ProficiencyLevels.tsx
│   │   ├── Assessments.tsx
│   │   └── NotFound.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   └── AppLayout.tsx  # Main layout with sidebar
│   │   └── ui/                # shadcn/ui components
│   ├── lib/
│   │   └── utils.ts           # Utility functions
│   ├── App.tsx                # Main app with routing
│   └── global.css             # Global styles & theme
│
├── server/                  # Express Backend
│   ├── routes/
│   │   ├── roles.ts
│   │   ├── proficiency-levels.ts
│   │   ├── employees.ts
│   │   └── assessments.ts
│   ├── db.ts                # Database connection & initialization
│   ├── seed.ts              # Database seeding script
│   ├── index.ts             # Express app setup
│   └── node-build.ts        # Production server entry
│
├── shared/                  # Shared types
│   └── api.ts               # API type definitions
│
├── tailwind.config.ts       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite dev server configuration
└── .env                     # Environment variables (create this)
```

## 🤝 Contributing

This is a proof-of-concept application. Feel free to extend it with:
- Advanced filtering and search
- User authentication
- Email notifications
- Export to CSV/PDF
- Advanced analytics
- Mobile app
- More assessment types

## 📄 License

This is a starter template for the Compatibility Matrix application.

---

**Need help?** Make sure you have:
1. ✅ MySQL running
2. ✅ `.env` file configured
3. ✅ Dependencies installed (`pnpm install`)
4. ✅ Dev server running (`pnpm run dev`)

The application is fully functional and ready to use!
