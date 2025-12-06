#Student Wallet — Smart Financial Tracking System for Students

Student Wallet is a full-stack finance management application designed to help students track daily expenses, record lending/borrowing activities, and maintain better spending discipline. The application provides real-time alerts, spending insights, and automated email notifications to parents when overspending occurs, promoting transparency and responsible financial habits.

##🚀Features

**Expense Management

- Add and categorize daily expenses
- Track spending patterns over time
- View history with timestamps for transparency

**Lending / Borrowing Tracker

- Maintain logs of money borrowed/lent to peers
- Track returned and pending amounts

**Smart Alerts & Budget Control

- Set monthly/weekly/daily spending limits
- Get alerts when thresholds are crossed
- Sends email notifications to parents automatically when overspending continues

**Dashboard & Visual Insights

- Graph-based representation of spending trends
- Quick summaries of remaining budget, top categories, etc.

**Security & User Experience

- Modular component-based UI
- Clean and intuitive interface built for students

**Tech Stack

Layer	                         Technology
Frontend	                     React, HTML, CSS, JavaScript
Backend	                       Node.js 
Database	                     MongoDB
Email Notifications	           Gmail SMTP
Charts & Data Visualization	   Recharts

**Core Workflow (Methodology)

1️⃣ Students add daily expenses in the app
2️⃣ System stores and categorizes them in MongoDB
3️⃣ Dashboard visualizes spending pattern
4️⃣ When spending crosses threshold → alert pushed
5️⃣ If overspending continues → automatic email sent to parents

📌 Installation & Setup

1️⃣ Clone the repository
```sh
git clone https://github.com/sadhikasahana/studentwallet.git
cd studentwallet
```
2️⃣ Install the necessary dependencies
```sh
npm i
```
3️⃣ Run the project
```sh
npm run dev
```
