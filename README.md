JobPortal Enhanced — PERN Stack Learning Edition
A full-featured real-time Job Portal application built with PostgreSQL, Express, React, and Node.js. This project is structured specifically to demonstrate core PERN stack concepts—from relational database schemas to SQL queries and real-time events—making it the perfect project to showcase during developer interviews.

🚀 Quick Start
1. Set up PostgreSQL Database
Open pgAdmin 4 and log in.
Right-click on Databases → Create → Database...
Name the database jobportal and save.
2. Set up Environment Variables
Create a .env file in the root directory:

env

PORT=5000
DB_USER=postgres
DB_PASSWORD=your_pgadmin_password_here
DB_HOST=localhost
DB_PORT=5432
DB_NAME=jobportal
JWT_SECRET=your_jwt_secret_here
3. Install & Start Backend
This will run the server and automatically run DDL queries to create the database tables (Users, Jobs, Applications, Bookmarks):

bash

npm install
node server.js
4. Install & Start React Client
In a new terminal:

bash

cd client
npm install
npm start
Open http://localhost:3000 to view the application.

✨ Core Learning Features
1. 🔍 Advanced Job Search & Multi-Filters
What it does: Allows job seekers to search jobs by keyword, location, and filter by job type (Full-Time, Part-Time, Remote).
PERN concept: SQL pattern matching using the ILIKE clause (case-insensitive keyword matching) and SQL AND / OR conditional filters.
Where to look:
server.js → GET /api/jobs/search running:
sql

SELECT * FROM jobs 
WHERE (title ILIKE $1 OR description ILIKE $1) 
AND location = $2 AND job_type = $3;
App.js → handleSearchFilter(), jobResults state
2. 📊 Recruiter Analytics & Application Stats
What it does: Displays analytics for recruiters (e.g., total job posts, applicant counts, and application statuses: Pending, Shortlisted, Rejected).
PERN concept: SQL aggregation querying using GROUP BY, COUNT(), and relational Joins.
Where to look:
server.js → GET /api/stats/recruiter running:
sql

SELECT status, COUNT(*) as count 
FROM applications 
WHERE recruiter_id = $1 
GROUP BY status;
App.js → fetchRecruiterStats(), Dashboard UI charts
3. ⚡ Real-Time Application Tracking Alerts
What it does: Alerts the job seeker instantly via toast notifications when a recruiter updates their application status.
PERN concept: Socket.io rooms (socket.join(userId)) combined with an Express database update callback.
Where to look:
server.js → PUT /api/applications/:id/status (updates status and emits socket notification)
App.js → socket.on("notificationReceived"), notifications state
4. 📁 Resume Upload & Profile completeness
What it does: Job seekers upload a PDF resume and see a percentage meter of how complete their profile is.
PERN concept: File upload using Multer middleware (Express) and dynamic percentage scoring calculated in SQL based on COALESCE and IS NOT NULL checks.
Where to look:
server.js → POST /api/profile/upload (saves path to database column resume_path)
App.js → handleFileUpload(), profile completion meter UI
5. 🔖 Bookmarked Jobs (Save for Later)
What it does: Job seekers bookmark lists to view later.
PERN concept: Many-to-Many relationship using a Junction Table (bookmarks) with Foreign Keys (user_id, job_id) and ON DELETE CASCADE constraints.
Where to look:
server.js → POST /api/jobs/bookmark/:jobId running:
sql

INSERT INTO bookmarks (user_id, job_id) VALUES ($1, $2)
ON CONFLICT DO NOTHING; -- Prevents duplicate bookmarks
App.js → toggleBookmark(), bookmarkedJobs state
6. 👥 Role-Based Access Control (RBAC)
What it does: Redirects Job Seekers to the job list, and Recruiters to applicant cards.
PERN concept: JWT token verification and user verification check against database role column (role VARCHAR(20) DEFAULT 'jobseeker').
Where to look:
server.js → authorizeRoles('recruiter') Express middleware checking DB column
App.js → Conditional routes checking user.role state
📁 Key Files
text

JobPortal-Enhanced/
├── server.js            # Node/Express backend with pg (node-postgres) Pool + SQL setup
├── package.json
└── client/
    ├── package.json
    └── src/
        ├── App.js       # Main React client with role-based dashboards
        └── App.css      # Core styles, dashboards, and stats modal rules
🧠 PERN Concepts at a Glance
Concept	Where & How It Is Used
Relational Schema (DDL)	Table creations (CREATE TABLE users..., CREATE TABLE jobs...)
Primary & Foreign Keys	id SERIAL PRIMARY KEY and FOREIGN KEY (user_id) REFERENCES users(id)
Junction Tables	bookmarks table connecting users(id) and jobs(id) for many-to-many relationships
SQL JOINs	Joining applications, jobs, and users tables to view applicant details in a single query
SQL Aggregations	COUNT(*) and GROUP BY to dynamically count applications by status
SQL Pattern Matching	Using ILIKE for case-insensitive keyword searches
Cascade Deletes	ON DELETE CASCADE ensures deleting a job automatically deletes associated applications/bookmarks
Express Connection Pools	Using pg.Pool to efficiently manage database connection sockets
HTTP-Only Cookies	Storing JWT safely to shield the application from Cross-Site Scripting (XSS) attacks
JSON Web Tokens (JWT)	Authenticating users and checking permission roles in REST API requests
