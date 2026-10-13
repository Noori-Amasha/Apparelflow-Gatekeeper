
Content:

```md
# AI Optimization Report

## 1. Tools & Prompting

During development, AI tools were used as engineering assistants.

Tools used:

- ChatGPT - GPT-6


AI assistance was used for:

- Initial project structure suggestions
- Database schema discussion
- SQL query review
- React component improvement ideas
- Test case planning
- Debugging assistance


AI output was treated as a starting point only. All generated code was reviewed and modified based on project requirements and security considerations.


---

# 2. Flawed / Broken AI Generated Code

## Issue 1: Client-side only authorization suggestion

Some AI-generated approaches suggested hiding UI elements based only on frontend roles.

Problem:

Frontend restrictions can be bypassed using direct API requests.

Risk:

A user could manipulate requests using tools like Postman.

Solution:

Implemented backend middleware validation:

- JWT authentication
- Role checking middleware
- Protected API routes


---

## Issue 2: Incorrect database assumptions

During development, AI-generated SQL suggestions used incorrect column names and aliases.

Example:

Using:

verification_logs.timestamp

when the database schema used:

verification_logs.created_at


Problem:

Production queries failed because generated SQL did not match the actual database.


Solution:

Reviewed every query against the real PostgreSQL schema and corrected repository implementations.


---

# 3. Human Refactoring

AI generated code was improved by applying engineering decisions:

- Added strict TypeScript typing
- Added Zod environment validation
- Added parameterized SQL queries
- Added transaction-based status updates
- Added database-level filtering
- Improved error handling
- Added RBAC middleware


The final implementation follows the business workflow instead of blindly accepting generated code.


---

# 4. Defensive Architecture

The system uses a server-enforced state machine:

CUTTING
↓
PENDING VERIFICATION
↓
VERIFIED
↓
SEWING STARTED


Security controls:

## Role Isolation

Cutting Supervisor:
- Can create orders
- Cannot approve verification


Cutting Verifier:
- Can verify batches
- Cannot create orders


Sewing Supervisor:
- Can only access verified batches


## Hard Stop Protection

Approval is rejected when:

- Any component has shortage
- Required component is missing
- Verification data is incomplete


## Sewing Queue Protection

Sewing Queue queries only return:

status = VERIFIED


Frontend restrictions are only usability features.
Backend rules are the actual security boundary.