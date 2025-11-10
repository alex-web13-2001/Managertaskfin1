# Access Control System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Task Manager Application                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────┐      ┌─────────────────┐                   │
│  │   Frontend     │◄────►│    Backend      │                   │
│  │   (React)      │      │   (Express)     │                   │
│  └────────────────┘      └─────────────────┘                   │
│                                    │                             │
│                          ┌─────────▼────────┐                   │
│                          │  Permission      │                   │
│                          │    System        │                   │
│                          └─────────┬────────┘                   │
│                                    │                             │
│                          ┌─────────▼────────┐                   │
│                          │   PostgreSQL     │                   │
│                          │   (Prisma)       │                   │
│                          └──────────────────┘                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Database Schema

```
┌───────────────────┐
│      User         │
├───────────────────┤
│ id (PK)           │
│ email             │
│ name              │
│ password          │
└─────┬─────────────┘
      │
      │ ownerId
      ▼
┌───────────────────┐         ┌───────────────────┐
│     Project       │         │  ProjectMember    │
├───────────────────┤◄───────►├───────────────────┤
│ id (PK)           │         │ id (PK)           │
│ name              │         │ userId (FK)       │
│ description       │         │ projectId (FK)    │
│ color             │         │ role              │
│ archived          │         │   - owner         │
│ ownerId (FK)      │         │   - collaborator  │
└───────────────────┘         │   - member        │
      │                       │   - viewer        │
      │                       └───────────────────┘
      │
      │ projectId
      ▼
┌───────────────────┐         ┌───────────────────┐
│      Task         │         │    Invitation     │
├───────────────────┤         ├───────────────────┤
│ id (PK)           │         │ id (PK)           │
│ title             │         │ email             │
│ description       │         │ role              │
│ status            │         │ token             │
│ priority          │         │ status            │
│ projectId (FK)    │         │   - pending       │
│ creatorId (FK)    │         │   - accepted      │
│ assigneeId (FK)   │         │   - expired       │
└───────────────────┘         │   - revoked       │
                              │ projectId (FK)    │
                              │ expiresAt         │
                              └───────────────────┘
```

## Role Hierarchy

```
                    ┌──────────────┐
                    │    OWNER     │ (Full Control)
                    └──────┬───────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
    ┌───────▼──────┐  ┌───▼────────┐  ┌─▼────────┐
    │ COLLABORATOR │  │   MEMBER   │  │  VIEWER  │
    └──────────────┘  └────────────┘  └──────────┘
    (Edit All)        (Own Tasks)     (Read Only)
```

## Permission Matrix

```
┌──────────────────────────┬───────┬──────────────┬────────┬─────────┐
│        Action            │ Owner │ Collaborator │ Member │ Viewer  │
├──────────────────────────┼───────┼──────────────┼────────┼─────────┤
│ View Project             │   ✅   │      ✅      │   ✅   │    ✅   │
│ Edit Project             │   ✅   │      ✅      │   ❌   │    ❌   │
│ Archive Project          │   ✅   │      ❌      │   ❌   │    ❌   │
│ Delete Project           │   ✅   │      ❌      │   ❌   │    ❌   │
├──────────────────────────┼───────┼──────────────┼────────┼─────────┤
│ View All Tasks           │   ✅   │      ✅      │   ❌   │    ✅   │
│ View Own Tasks           │   ✅   │      ✅      │   ✅   │    ✅   │
│ Create Task (Any)        │   ✅   │      ✅      │   ❌   │    ❌   │
│ Create Task (Self)       │   ✅   │      ✅      │   ✅   │    ❌   │
│ Edit Task (Any)          │   ✅   │      ✅      │   ❌   │    ❌   │
│ Edit Task (Own)          │   ✅   │      ✅      │   ✅   │    ❌   │
│ Delete Task              │   ✅   │      ✅      │   ❌   │    ❌   │
├──────────────────────────┼───────┼──────────────┼────────┼─────────┤
│ Invite Users             │   ✅   │      ❌      │   ❌   │    ❌   │
│ Manage Members           │   ✅   │      ❌      │   ❌   │    ❌   │
│ View All Members         │   ✅   │      ✅      │   ❌   │    ✅   │
│ View Self Only           │   ✅   │      ✅      │   ✅   │    ✅   │
└──────────────────────────┴───────┴──────────────┴────────┴─────────┘
```

## Invitation Flow

```
┌─────────────┐
│   OWNER     │
│  Creates    │
│ Invitation  │
└──────┬──────┘
       │
       │ Generate Token (32-byte hex)
       │ Set Expiry (72 hours)
       │
       ▼
┌──────────────┐
│  Send Email  │
│  with Link   │
└──────┬───────┘
       │
       │
       ▼
┌──────────────────┐
│   USER Clicks    │
│      Link        │
└──────┬───────────┘
       │
       ├─────► Already Registered?
       │              │
       │              ├──► YES ──► Accept ──► Added to Project
       │              │
       │              └──► NO ──► Register ──► Accept ──► Added to Project
       │
       └─────► Token Valid?
                      │
                      ├──► YES ──► Continue
                      │
                      └──► NO ──► Show Error
                                  - Expired (>72h)
                                  - Revoked
                                  - Already Used
```

## API Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     REST API                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  /api/auth/*              (Existing - Authentication)   │
│    POST /signup                                         │
│    POST /signin                                         │
│    GET  /me                                             │
│                                                         │
│  /api/invitations/*       (NEW - Invitation System)     │
│    POST   /:projectId/invitations      (Create)        │
│    GET    /:projectId/invitations      (List)          │
│    GET    /my-invitations              (User's)        │
│    GET    /token/:token                (Details)       │
│    POST   /:token/accept               (Accept)        │
│    DELETE /:invitationId               (Revoke)        │
│    POST   /:invitationId/resend        (Resend)        │
│                                                         │
│  /api/projects/*          (Existing - KV Store)         │
│    ⚠️  Needs Migration to Prisma                        │
│                                                         │
│  /api/tasks/*             (Existing - KV Store)         │
│    ⚠️  Needs Migration to Prisma                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Permission Check Flow

```
┌─────────────┐
│   Request   │
│  (Endpoint) │
└──────┬──────┘
       │
       ▼
┌──────────────┐
│ Authenticate │
│  JWT Token   │
└──────┬───────┘
       │
       ├─────► Valid Token?
       │              │
       │              ├──► NO ──► 401 Unauthorized
       │              │
       │              └──► YES ──► Continue
       │
       ▼
┌──────────────────┐
│ Get User Role    │
│ in Project       │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Check Permission │
│   Function       │
└──────┬───────────┘
       │
       ├─────► Has Permission?
       │              │
       │              ├──► NO ──► 403 Forbidden
       │              │
       │              └──► YES ──► Execute Action
       │
       ▼
┌──────────────────┐
│ Return Response  │
└──────────────────┘
```

## Security Layers

```
┌─────────────────────────────────────────────┐
│         Security Layer 1: JWT Auth          │
│  ✅ All endpoints require authentication     │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│      Security Layer 2: Role Check           │
│  ✅ getUserRoleInProject(user, project)      │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│    Security Layer 3: Permission Check       │
│  ✅ canEdit/Delete/View/etc(user, resource) │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│   Security Layer 4: Business Rules          │
│  ✅ Cannot remove last owner                 │
│  ✅ Cannot invite existing member            │
│  ✅ Member sees only own tasks               │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│       Security Layer 5: Database            │
│  ✅ Prisma ORM (SQL injection protection)   │
│  ✅ Parameterized queries                    │
└─────────────────────────────────────────────┘
```

## Implementation Status

```
DATABASE SCHEMA           ████████████████████ 100% ✅
PERMISSION SYSTEM         ████████████████████ 100% ✅
INVITATION SYSTEM         ████████████████████ 100% ✅
SECURITY VERIFICATION     ████████████████████ 100% ✅
DOCUMENTATION             ████████████████████ 100% ✅

PROJECT ENDPOINTS         ░░░░░░░░░░░░░░░░░░░░   0% ⏳
TASK ENDPOINTS            ░░░░░░░░░░░░░░░░░░░░   0% ⏳
MEMBER ENDPOINTS          ░░░░░░░░░░░░░░░░░░░░   0% ⏳
FRONTEND INTEGRATION      ░░░░░░░░░░░░░░░░░░░░   0% ⏳
```

## Files Organization

```
Managertaskfin1/
├── prisma/
│   ├── schema.prisma          ✅ (Updated)
│   └── migrations/            ✅ (Generated)
│
├── src/
│   ├── lib/
│   │   ├── permissions.ts     ✅ (NEW - 451 lines)
│   │   ├── invitations.ts     ✅ (NEW - 393 lines)
│   │   ├── migrate.ts         ✅ (NEW - 259 lines)
│   │   ├── prisma.ts          ✅ (Existing)
│   │   └── auth.ts            ✅ (Existing)
│   │
│   └── server/
│       ├── index.ts           ✅ (Updated)
│       ├── types.ts           ✅ (NEW - 7 lines)
│       └── routes/
│           └── invitations.ts ✅ (NEW - 286 lines)
│
├── Documentation/
│   ├── QUICK_START.md         ✅ (NEW - 200 lines)
│   ├── ACCESS_CONTROL_...md   ✅ (NEW - 315 lines)
│   ├── SECURITY_SUMMARY.md    ✅ (NEW - 177 lines)
│   ├── ACCESS_CONTROL_...RU   ✅ (NEW - 256 lines)
│   └── IMPLEMENTATION_...md   ✅ (NEW - 296 lines)
│
└── README.md                  ✅ (Existing)
```

## Next Steps Roadmap

```
Phase 1: Foundation ✅ COMPLETE
├── Database schema
├── Permission system
├── Invitation system
└── Documentation

Phase 2: Backend Migration ⏳ NEXT
├── Project CRUD → Prisma
├── Task CRUD → Prisma
├── Member management endpoints
└── Data migration execution

Phase 3: Frontend Integration ⏳ FUTURE
├── Component updates
├── Permission UI
├── Role indicators
└── Testing

Phase 4: Production ⏳ FUTURE
├── Integration testing
├── Performance optimization
├── Monitoring setup
└── Deployment
```
