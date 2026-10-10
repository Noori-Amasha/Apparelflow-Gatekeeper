# Apparelflow-Gatekeeper
Production Batch Verification &amp; Sewing Queue Gate for ApparelFlow ERP
# 🧵 ApparelFlow ERP — Gatekeeper System

### Production Batch Verification & Sewing Queue Management

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white) ![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white) ![React](https://img.shields.io/badge/React-149ECA?style=flat-square&logo=react&logoColor=white) ![Tailwind](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)

> A full-stack, role-based garment production verification system developed for the **Webtezza (Pvt) Ltd — Software Engineering Practical Challenge**.

---

## 📌 About the Project

ApparelFlow Gatekeeper helps garment factories manage cutting orders, verify fabric components, and safely release completed batches to sewing operations.

The system ensures that **incomplete or unverified cutting batches never enter the Sewing Queue**.

### 🎯 Main Features

- 🔐 Secure authentication and role-based access control (RBAC)
- ✂️ Cutting order creation and management
- 📋 Predefined garment recipes and component calculations
- 🚦 Real-time GREEN, YELLOW, and RED verification statuses
- 🛑 Server-side shortage prevention
- ✅ Authorized batch approvals and rejections
- 🧵 Verified-only Sewing Queue
- 📊 Fabric wastage calculation
- 📝 Persistent verification audit records
- 🧪 Automated API and business logic tests

---

## 👥 User Roles

| Role | Responsibilities |
|---|---|
| ✂️ **Cutting Supervisor** | Create cutting orders, manage batch quantities, and handle rejected batches |
| 🔍 **Cutting Verifier** | Verify component counts, approve valid batches, and reject shortages |
| 🧵 **Sewing Supervisor** | View verified batches and start sewing operations |

Each role has separate permissions enforced by the backend.

---

## 🔄 Production Workflow

```text
✂️ Cutting Order
       |
       ▼
📋 Pending Verification
       |
       ▼
🔍 Component Verification
       |
       ├── 🟢 GREEN  → Match
       ├── 🟡 YELLOW → Excess
       └── 🔴 RED    → Shortage
       |
       ├── ✅ Approved → Sewing Queue
       |
       └── ❌ Rejected → Supervisor Rework
```

**Important:** Any missing, uncounted, or shortage component prevents batch approval.

---

## 🛠️ Tech Stack

| Backend | Frontend |
|---|---|
| Node.js | React |
| Express.js | TypeScript |
| TypeScript | Tailwind CSS |
| PostgreSQL | Responsive UI |
| Raw SQL (`pg`) | |
| Zod | |
| JWT + bcrypt | |
| Vitest + Supertest | |

**Database:** PostgreSQL using raw, parameterized SQL queries — no ORM.

---


## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd Apparelflow-Gatekeeper
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Configure Environment Variables

Create a `.env` file using the backend `.env.example` template and configure the PostgreSQL connection and required secrets.

### 4. Run the Backend

```bash
npm run dev
```

### 5. Check TypeScript

```bash
npm run typecheck
```

### 6. Run Tests

```bash
npm test
```

> Database setup instructions and demo credentials will be added as the corresponding backend modules are completed.

---

## 🔒 Security

- ✅ Server-side RBAC enforcement
- ✅ Protected authentication endpoints
- ✅ Strict request validation
- ✅ Parameterized SQL queries
- ✅ Secure password hashing
- ✅ Unauthorized approval prevention
- ✅ Database-level Sewing Queue filtering
- ✅ Immutable verification audit requirements

---


## 🧪 Testing

The automated test suite will verify:

- Valid batches can be approved.
- Shortage batches cannot be approved.
- Rejection requires a reason.
- Unauthorized roles cannot approve batches.
- Unverified batches cannot appear in the Sewing Queue.

---

## 📄 Assessment

Developed as part of the **Software Engineering Intern (Full-Stack / React / Next.js) Practical Challenge** by **Webtezza (Pvt) Ltd**.

**Focus:** Secure cutting batch verification, manufacturing workflow control, and role-based operations.

---

⭐ **ApparelFlow Gatekeeper — Verify Before You Sew.**