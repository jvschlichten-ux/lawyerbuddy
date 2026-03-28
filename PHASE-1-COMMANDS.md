# Phase 1 Execution Plan

## Overview
When you run `./run-phase.sh 1`, the script will execute the following commands in sequence:

---

## Command 1: Create Task

```bash
claude-flow task create \
  -t implementation \
  -d "Phase 1: Create a new React Native + Expo monorepo project called \"lawyerbuddy\" with the following structure: ..."
```

**Expected Output:**
```
[OK] Task created: task-<TIMESTAMP>-<RANDOM>
```

**Why:** Creates a trackable task in claude-flow's system that will remain assigned to an agent until completion.

---

## Command 2: Spawn Coder Agent

```bash
claude-flow agent spawn -t coder
```

**Expected Output:**
```
Agent spawned: agent-<ID>
```

**Why:** Creates a dedicated agent instance that will execute the prompt. Agent type `coder` is appropriate for implementation tasks.

---

## Command 3: Assign Task to Agent

```bash
claude-flow task assign <TASK_ID> --agent <AGENT_ID>
```

Example:
```bash
claude-flow task assign task-1774666397223-4z9no0 --agent agent-001
```

**Why:** Links the task to the agent so claude-flow knows this agent is responsible for this task.

---

## Command 4: Send Full Prompt to Agent

```bash
claude-flow agent wasm-prompt <AGENT_ID> --input "<FULL PHASE 1 PROMPT>"
```

**The full prompt sent will be:**

```
Create a new React Native + Expo monorepo project called "lawyerbuddy" with the following structure:

/lawyerbuddy
  /apps
    /mobile          # React Native (Expo) — iOS + Android
    /web             # React Native Web (same codebase, web target)
  /packages
    /shared          # Shared components, hooks, types, utilities
    /i18n            # Internationalization (English + Spanish)
    /api             # Supabase client, API calls, types
    /security        # Encryption utilities, file hashing
  /backend
    /src
      /routes        # Express route handlers
      /middleware    # Auth, logging, RLS enforcement
      /services      # Business logic (cases, events, users, exports)
      /types         # Shared TypeScript types
    server.ts
  /supabase
    /migrations      # SQL migration files
    /seed            # Seed data for development
  README.md
  package.json       # Monorepo root (use pnpm workspaces)

Tech stack:
- Frontend: React Native + Expo SDK 51, React Native Web
- Backend: Node.js + Express + TypeScript
- Database: Supabase (PostgreSQL + Auth + Storage + Realtime)
- Language: TypeScript throughout
- Package manager: pnpm with workspaces

Initialize all packages with TypeScript configs. Create a root README.md explaining the project structure. Do not add any feature code yet — scaffold only.
```

**Why:** Sends the full prompt to the agent so it knows exactly what to build.

---

## Monitoring

After the script completes, you can monitor progress with:

```bash
# Check task status
claude-flow task status <TASK_ID>

# View agent logs
claude-flow agent logs <AGENT_ID>

# Check agent status
claude-flow agent status <AGENT_ID>

# List all active agents
claude-flow agent list

# Stop agent if needed
claude-flow agent stop <AGENT_ID>
```

---

## Phase 1 Checkpoint

Before proceeding to Phase 2, verify:

- [ ] All directories created correctly
- [ ] All `package.json` files have correct workspace configs
- [ ] All `tsconfig.json` files exist
- [ ] Backend server entry point created
- [ ] Root README.md explains the structure
- [ ] No code beyond scaffold added

---

## Flow Diagram

```
┌─────────────────────────────┐
│  Create Task (Phase 1)      │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  Spawn Coder Agent          │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  Assign Task to Agent       │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  Send Full Prompt to Agent  │
└──────────────┬──────────────┘
               │
               ▼
        Agent Executes
        (builds scaffold)
               │
               ▼
     Ready for Checkpoint
```

---

## Files Created by This Script

- `prompts.txt` — All 10 phase prompts in one file
- `run-phase.sh` — This orchestration script
- `PHASE-1-COMMANDS.md` — This document

## Ready to Execute?

To start Phase 1, run:

```bash
./run-phase.sh 1
```

The script will:
1. Extract the Phase 1 prompt from `prompts.txt`
2. Create the task
3. Spawn the agent
4. Assign the task
5. Send the prompt
6. Display the task ID and agent ID for monitoring

**All you need to do is review the commands above and give approval to proceed.**
