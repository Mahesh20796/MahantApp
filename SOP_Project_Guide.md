# Sabha Management System - Standard Operating Procedure (SOP)

## 1. Project Overview
The **Sabha Management System** (MahantApp) is a comprehensive administrative tool designed to streamline the operations of a Sabha (community gathering). It focuses on member registry, automated attendance tracking, financial management (Wallet), and data-driven reporting.

## 2. Technology Stack
- **Frontend**: Angular 18+ (Standalone Components)
- **Styling**: Vanilla CSS (Custom UI/UX with Bento Grid layout)
- **Backend/Database**: Supabase (PostgreSQL, Auth, Storage)
- **Visualization**: Chart.js (Trends and Analytics)
- **Reporting**: jsPDF (PDF Generation), XLSX (Excel Export)

---

## 3. Module Guide

### 🔐 Authentication & Security
- **Access**: Secure login via email/password.
- **RBAC**: Role-Based Access Control filters the sidebar and restricts actions (View/Create/Edit/Delete) based on the assigned user role.
- **Session**: Persistent sessions ensure users remain logged in across page refreshes.

### 📊 Dashboard (Command Center)
- **Real-time Stats**: Displays Total Members and Current Wallet Balance.
- **Attendance Trends**: Weekly line chart showing participation growth.
- **Financial Growth**: Monthly trend chart visualizing the community fund.
- **Last Sabha Recap**: Quick summary (Present/Absent/Leave) of the most recent session.

### 👥 Member Management
- **Registry**: Comprehensive list of all members with search/filter capabilities.
- **Profile Management**: Add new members or edit existing details (Contact, Address, Role).
- **Status Tracking**: Manage active/inactive status to keep the registry clean.

### 📅 Sabha Management
- **Scheduling**: Create and manage Sabha sessions (Title, Type, Time, Date).
- **History**: Maintain a record of all past and upcoming sessions.

### ✅ Attendance Management
- **Session Integration**: Links attendance records directly to a scheduled Sabha.
- **Smart Selection**: Automatically selects the current date and relevant Sabha for ease of use.
- **Bulk Recording**: Mark all members' status (P/A/L) and save in one click using Supabase Upsert logic.

### 💰 Wallet Management
- **Transactions**: Record individual deposits (e.g., monthly contributions) and withdrawals.
- **Monthly Collection**: Bulk process contributions for all active members.
- **Balance Tracking**: Automated balance updates on member profiles whenever a transaction is saved.

### 📈 Reports & Analytics
- **Leaderboard**: "Attendance Excellence" section showing the top 3 consistent attendees.
- **Financial Audit**: Searchable transaction history for auditing purposes.
- **Exporting**: Generate professional PDF reports or Excel sheets for offline documentation.

---

## 4. Operational Procedures (How-To)

### How to Mark Attendance
1. Navigate to the **Attendance** module.
2. Select the **Sabha Date** and **Sabha Title** (Defaulted to today).
3. The member list will load. Mark each member as **Present (P)**, **Absent (A)**, or **Leave (L)**.
4. Click **Save Attendance**.

### How to Process Monthly Collections
1. Navigate to **Wallet Management**.
2. Select the members (or "All Active").
3. Enter the collection amount.
4. Click **Process Collection**. This creates transaction records and updates balances automatically.

### How to Generate Reports
1. Navigate to the **Reports** module.
2. Use the **Date Range Filter** to narrow down data.
3. For Attendance: View the **Leaderboard**.
4. For Financials: View the **Audit Log**.
5. Click **Download PDF** or **Export Excel** for the desired report.

---

## 5. Development & Maintenance
- **Supabase Integration**: Centralized logic in `supabase.service.ts`.
- **Mock Mode**: The system automatically switches to local mock data if the database is unreachable, ensuring development can continue offline.
- **Theming**: Managed via `theme.service.ts` for consistent UI across all modules.
- **Responsive Design**: All modules are optimized for Desktop, Tablet, and Mobile (PWA ready).

---
*Created by Antigravity AI for Sabha Management Team.*
