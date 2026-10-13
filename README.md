# 🧵 ApparelFlow Gatekeeper ERP

<p align="center">

<img src="https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-blue?style=for-the-badge&logo=react"/>
<img src="https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-green?style=for-the-badge&logo=node.js"/>
<img src="https://img.shields.io/badge/Database-PostgreSQL-blue?style=for-the-badge&logo=postgresql"/>
<img src="https://img.shields.io/badge/Deployment-Vercel%20%2B%20Render-success?style=for-the-badge"/>

</p>


<h3 align="center">
Production Batch Verification & Sewing Queue Gate for ApparelFlow ERP
</h3>


<p align="center">
🧵 Ensuring only verified production batches reach the sewing floor.
</p>


---

# 📌 Project Overview

**ApparelFlow Gatekeeper** is a full-stack production verification and sewing queue management system designed for garment manufacturing environments.

The system creates a secure checkpoint between the **Cutting Department** and the **Sewing Assembly Floor**.

Its purpose is to prevent incorrect or incomplete production batches from entering sewing operations.

## The system prevents:

❌ Unverified production batches  
❌ Component shortages reaching sewing  
❌ Incorrect quantity approvals  
❌ Unauthorized workflow changes  


## Main Capabilities

✅ JWT Authentication  
✅ Role-Based Access Control (RBAC)  
✅ Cutting order management  
✅ Recipe-based component validation  
✅ GREEN / YELLOW / RED verification workflow  
✅ Server-side approval protection  
✅ Verified-only Sewing Queue  
✅ Fabric wastage calculation  
✅ Verification audit history  


---

# 🌐 Live Deployment


## Frontend Application

🚀 Hosted on **Vercel**

```
https://apparelflow-gatekeeper-six.vercel.app
```


## Backend API

⚙️ Hosted on **Render**

```
https://apparelflow-gatekeeper.onrender.com
```


## Database

🗄️ Hosted on **Supabase PostgreSQL**


Health Check:

```
https://apparelflow-gatekeeper.onrender.com/api/health
```


---

# 🔄 Production Workflow


```
             CUTTING ORDER

                    |
                    ↓

          PENDING VERIFICATION

                    |
                    ↓

            COMPONENT CHECK


          ┌─────────────────┐
          │                 │
       GREEN             RED
       MATCH          SHORTAGE
          │                 │
          ↓                 ↓

      VERIFIED          REJECTED

          |
          ↓

       SEWING QUEUE

          |
          ↓

   SEWING ASSEMBLY STARTED

```


## Core Business Rule

> A batch cannot enter the Sewing Queue unless all required components have passed verification.


---

# 👥 User Roles


| Role | Responsibilities |
|---|---|
| ✂️ Cutting Supervisor | Creates cutting orders, selects recipes, manages production batches |
| 🔍 Cutting Verifier | Verifies components, approves valid batches, rejects shortages |
| 🧵 Sewing Supervisor | Views verified batches and starts sewing operations |


All permissions are enforced on the backend.


---

# ✨ Features


# 🔐 Authentication & Security

Implemented:

- JWT authentication
- Password hashing using bcrypt
- Protected API routes
- Role-based authorization
- Request validation using Zod


Frontend restrictions are only for user experience.

The backend is the final authority.


---

# ✂️ Cutting Operations


Cutting Supervisors can:

- Create production orders
- Select garment recipes
- Enter production quantities
- Track order progress


---

# 🔍 Verification Terminal


Cutting Verifiers can:

- Review pending cutting batches
- Check every component quantity
- Approve valid batches
- Reject invalid batches with reasons


## Verification Status


| Status | Meaning |
|---|---|
| 🟢 GREEN | Exact quantity match |
| 🟡 YELLOW | Excess quantity available |
| 🔴 RED | Component shortage detected |


---

# 🧵 Sewing Queue


Sewing Supervisors can:

- View approved production batches
- Review verification information
- Start sewing assembly


Only verified batches appear in the queue.


---

# 🏗️ System Architecture


```
              React Frontend
                    |
                    |
              REST API Calls
                    |
                    |
        Express TypeScript Backend
                    |
        ┌───────────┴───────────┐
        |
 Authentication        Business Logic
        |
        |
     PostgreSQL Database

```


---

# 🛠️ Technology Stack


## Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router


## Backend

- Node.js
- Express.js
- TypeScript
- JWT
- Zod
- bcrypt
- Raw SQL queries


## Database

- PostgreSQL
- Supabase
- Parameterized SQL
- Relational database design


---

# 🗄️ Database Design


## Users

Stores authentication and user roles.

```
users

id
email
password_hash
role
full_name
created_at
```


## Recipes

Stores garment production definitions.

```
recipes

id
recipe_code
name
category
std_fabric_yards
wastage_cap
```


## Recipe Components

Stores garment components.

```
recipe_components

id
recipe_id
component_name
pieces_per_garment
image_url
```


## Cutting Orders

Stores production batches.

```
cutting_orders

id
order_no
recipe_id
target_qty
fabric_roll_id
actual_fabric_yds
status
created_by
```


## Verification Items

Stores component verification results.

```
verification_items

id
order_id
component_id
expected_qty
actual_qty
status
```


## Verification Logs

Stores approval and rejection history.

```
verification_logs

id
order_id
verifier_id
decision
rejection_note
wastage_pct
created_at
```


---

# 🛡️ Defensive Architecture


Security is implemented at the backend API layer.


Implemented:


✅ Server-side RBAC middleware

✅ JWT protected routes

✅ Parameterized SQL queries

✅ Request validation

✅ Protected status transitions

✅ Database-level queue filtering


---

# 🚫 Approval Protection Rules


A batch approval is blocked when:


- Required components are missing
- Any component has shortage
- Verification is incomplete
- User does not have verifier permission


This prevents bypassing the frontend and directly calling APIs with invalid data.


---

# 🧪 Testing


The project includes automated tests covering important business rules.


## Backend Tests


Install dependencies:

```bash
cd backend

npm install
```


Run tests:

```bash
npm test
```


Run TypeScript validation:

```bash
npm run typecheck
```


---

## Frontend Tests


Install dependencies:

```bash
cd frontend

npm install
```


Run tests:

```bash
npm test
```


---

## End-to-End Tests


Install Playwright browsers:

```bash
npx playwright install
```


Run:

```bash
npx playwright test
```


---

# ✅ Tested Scenarios


The test suite verifies:


✅ Valid batches can be approved

✅ Shortage batches cannot be approved

✅ Rejection requires a reason

✅ Unauthorized users cannot perform restricted actions

✅ Unverified batches cannot appear in Sewing Queue

✅ Workflow state persists correctly


---

# 🚀 Local Development Setup


## Clone Repository


```bash
git clone <repository-url>

cd Apparelflow-Gatekeeper
```


---

# Backend Setup


```bash
cd backend

npm install
```


Create environment file:


```
.env
```


Use:


```
.env.example
```


Run backend:


```bash
npm run dev
```


Backend runs:

```
http://localhost:5000
```


---

# Frontend Setup


```bash
cd frontend

npm install

npm run dev
```


Frontend runs:

```
http://localhost:5173
```


---

# 🔑 Demo Credentials


## ✂️ Cutting Supervisor


```
Email:
supervisor@demo.com

Password:
Super@123
```


---

## 🔍 Cutting Verifier


```
Email:
verifier@demo.com

Password:
Verifier@123
```


---

## 🧵 Sewing Supervisor


```
Email:
sewing@demo.com

Password:
Sewing@123
```


---

# 📂 Project Structure


```
ApparelFlow-Gatekeeper

│
├── backend
│
│   ├── src
│   │   ├── database
│   │   ├── middleware
│   │   ├── modules
│   │   └── routes
│
├── frontend
│
│   ├── src
│   │   ├── pages
│   │   ├── components
│   │   └── services
│
├── README.md
│
└── AI_OPTIMIZATION_REPORT.md

```


---

# 🤖 AI Engineering Documentation


AI tools were used as development assistants during implementation.


Detailed documentation:


```
AI_OPTIMIZATION_REPORT.md
```


The report includes:


- AI tools used
- Development tasks assisted by AI
- AI-generated issues discovered
- Human refactoring decisions
- Defensive architecture improvements


---

# 📈 Engineering Highlights


⭐ Full-stack TypeScript architecture

⭐ Secure RBAC implementation

⭐ Database-driven workflow control

⭐ Server-side business validation

⭐ Automated testing strategy

⭐ Cloud deployment


---

# 🧵 ApparelFlow Gatekeeper


## Verify Before You Sew.
