# 🧵 ApparelFlow Gatekeeper ERP

<p align="center">

<img src="https://img.shields.io/badge/React-TypeScript-blue?style=for-the-badge&logo=react"/>
<img src="https://img.shields.io/badge/Backend-Node.js-green?style=for-the-badge&logo=node.js"/>
<img src="https://img.shields.io/badge/Database-PostgreSQL-blue?style=for-the-badge&logo=postgresql"/>
<img src="https://img.shields.io/badge/Deployment-Cloud-success?style=for-the-badge"/>

</p>


<h3 align="center">
Production Batch Verification & Sewing Queue Gate for ApparelFlow ERP
</h3>


---

# 📌 Project Overview

**ApparelFlow Gatekeeper** is a production verification and sewing queue management system designed for garment manufacturing environments.

The system introduces a strict quality checkpoint between the **Cutting Department** and the **Sewing Assembly Floor**.

Its main purpose is preventing:

- ❌ Unverified production batches
- ❌ Component shortages
- ❌ Incorrect garment quantities
- ❌ Unauthorized status changes

from entering sewing operations.


The application implements:

- 🔐 JWT Authentication
- 👥 Role-Based Access Control (RBAC)
- 🚦 GREEN / YELLOW / RED verification logic
- 🛑 Server-side approval protection
- 🧵 Verified-only Sewing Queue
- 📊 Fabric wastage calculations
- 📝 Immutable verification audit logs


---

# 🎯 Business Workflow


```
CUTTING ORDER

      ↓

PENDING VERIFICATION

      ↓

COMPONENT CHECK

      ↓

 ┌───────────────┐
 │               │
GREEN         RED
MATCH       SHORTAGE

 │               │
 ↓               ↓

VERIFIED      REJECTED

 │

 ↓

SEWING QUEUE

 │

 ↓

SEWING STARTED
```


The backend enforces the rule:

> A batch cannot enter Sewing unless every required component has passed verification.


---

# ✨ Main Features


## 🔐 Authentication & Authorization

- JWT based authentication
- Secure password hashing
- Role based route protection
- Server-side permission validation


## ✂️ Cutting Operations

Cutting Supervisors can:

- Create production batches
- Select garment recipes
- Enter production quantities
- Track cutting progress


## 🔍 Verification Terminal

Cutting Verifiers can:

- Review pending batches
- Verify every component
- Approve valid batches
- Reject incomplete batches


Verification statuses:


| Status | Meaning |
|---|---|
| 🟢 GREEN | Exact component match |
| 🟡 YELLOW | Excess quantity available |
| 🔴 RED | Component shortage |



## 🧵 Sewing Queue

Sewing Supervisors can:

- View verified batches
- Review verification details
- Start sewing assembly


Only approved batches appear.

---

# 👥 User Roles


| Role | Responsibilities |
|-|-|
| ✂️ Cutting Supervisor | Creates cutting orders and manages production batches |
| 🔍 Cutting Verifier | Performs component verification and approval/rejection |
| 🧵 Sewing Supervisor | Receives verified batches and starts sewing |



---

# 🏗️ System Architecture


```
                 React Frontend
                       |
                       |
                 REST API Calls
                       |
                       |
              Express TypeScript API
                       |
        ┌──────────────┴──────────────┐
        |
 Authentication                 Business Logic
        |
        |
 PostgreSQL Database
```



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
- JWT Authentication
- Zod Validation
- Raw SQL Queries


## Database

- PostgreSQL (Supabase)
- Parameterized SQL
- Relational database design


---

# 🗄️ Database Design


## Users

Stores authentication and roles.


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

Stores garment production recipes.


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


```
recipe_components

id
recipe_id
component_name
pieces_per_garment
image_url
```


## Cutting Orders


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

# 🛡️ Security Architecture


Security is enforced on the backend.

Frontend restrictions are only for usability.


Implemented:


✅ JWT authentication

✅ Server-side RBAC middleware

✅ Protected API routes

✅ Parameterized SQL queries

✅ Request validation

✅ Database level filtering


## Hard Stop Rules


Approval is blocked when:


- Component shortage exists
- Required component is missing
- Verification is incomplete
- User does not have verifier permission


---

# 🚀 Deployment


## Frontend

Hosted on:

```
Vercel
```

URL:

```
https://apparelflow-gatekeeper-six.vercel.app
```


## Backend

Hosted on:

```
Render
```

URL:

```
https://apparelflow-gatekeeper.onrender.com
```


## Database

Hosted on:

```
Supabase PostgreSQL
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



## 🔍 Cutting Verifier


```
Email:
verifier@demo.com

Password:
Verifier@123
```



## 🧵 Sewing Supervisor


```
Email:
sewing@demo.com

Password:
Sewing@123
```



---

# 🧪 Testing


The automated test suite validates critical business rules.


Covered scenarios:


✅ Valid GREEN batch approval

✅ RED shortage approval blocking

✅ Mandatory rejection reason validation

✅ Unauthorized role protection

✅ Sewing Queue isolation



## Run Tests


Backend:


```bash
cd backend

npm test
```


Type checking:


```bash
npm run typecheck
```


Frontend:


```bash
cd frontend

npm test
```


---

# 📂 Project Structure


```
ApparelFlow-Gatekeeper

│
├── backend
│
│   ├── src
│   │   ├── modules
│   │   ├── database
│   │   ├── middleware
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

# 🤖 AI Usage Documentation


AI-assisted development was used during implementation.

Detailed documentation is available:

```
AI_OPTIMIZATION_REPORT.md
```


The report covers:

- AI tools used
- Generated code issues discovered
- Human refactoring decisions
- Defensive architecture choices


---

# 📈 Engineering Highlights


⭐ Production workflow modeling

⭐ Secure RBAC implementation

⭐ Database-driven state management

⭐ Server enforced business rules

⭐ Automated testing

⭐ Cloud deployment


---

# 🧵 ApparelFlow Gatekeeper

### Verify Before You Sew.