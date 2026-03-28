#!/bin/bash

################################################################################
# run-phase.sh — Execute a single phase of LawyerBuddy development
#
# USAGE:
#   ./run-phase.sh <phase-number>
#
# EXAMPLES:
#   ./run-phase.sh 1    # Run Phase 1 (Project Scaffold)
#   ./run-phase.sh 2    # Run Phase 2 (Internationalization)
#
# This script:
# 1. Reads the prompt for the specified phase from prompts.txt
# 2. Creates a task in claude-flow
# 3. Spawns a coder agent
# 4. Assigns the task to the agent
# 5. Sends the full prompt to the agent
# 6. Shows the task ID and agent ID for monitoring
#
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROMPTS_FILE="prompts.txt"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"

# Change to project root
cd "$PROJECT_ROOT"

################################################################################
# Helper Functions
################################################################################

print_header() {
    echo -e "\n${BLUE}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

print_section() {
    echo -e "\n${YELLOW}» $1${NC}"
}

################################################################################
# Validation
################################################################################

if [ $# -ne 1 ]; then
    print_error "Missing phase number"
    echo -e "\nUsage: ./run-phase.sh <phase-number>"
    echo -e "Example: ./run-phase.sh 1\n"
    exit 1
fi

PHASE_NUM=$1

# Validate phase number is between 1-10
if ! [[ "$PHASE_NUM" =~ ^[0-9]+$ ]] || [ "$PHASE_NUM" -lt 1 ] || [ "$PHASE_NUM" -gt 10 ]; then
    print_error "Phase number must be between 1 and 10"
    exit 1
fi

# Check that prompts.txt exists
if [ ! -f "$PROMPTS_FILE" ]; then
    print_error "File not found: $PROMPTS_FILE"
    exit 1
fi

################################################################################
# Extract Prompt from prompts.txt
################################################################################

print_section "Extracting prompt for Phase $PHASE_NUM..."

# Extract the prompt for the specified phase
# Prompts are delimited by lines containing only "================"
# Find the phase header and extract content until the next delimiter

PROMPT=$(awk -v phase="PHASE $PHASE_NUM" '
    BEGIN { found = 0; in_phase = 0; }
    /^================================================================================/ {
        if (in_phase) {
            exit
        }
        if (found) {
            in_phase = 1
            next
        }
    }
    index($0, phase) {
        found = 1
        next
    }
    in_phase {
        print
    }
' "$PROMPTS_FILE")

if [ -z "$PROMPT" ]; then
    print_error "Could not find Phase $PHASE_NUM in $PROMPTS_FILE"
    exit 1
fi

print_success "Prompt extracted ($(echo "$PROMPT" | wc -l) lines)"

################################################################################
# Create Task
################################################################################

print_section "Creating task in claude-flow..."

TASK_DESCRIPTION="Phase $PHASE_NUM: $(echo "$PROMPT" | head -1)"
TASK_TYPE="implementation"

TASK_OUTPUT=$(claude-flow task create -t "$TASK_TYPE" -d "$TASK_DESCRIPTION" --verbose 2>&1)

# Extract task ID from output
TASK_ID=$(echo "$TASK_OUTPUT" | grep "Task created:" | grep -oE "task-[a-z0-9-]+")

if [ -z "$TASK_ID" ]; then
    print_error "Failed to create task"
    echo "$TASK_OUTPUT"
    exit 1
fi

print_success "Task created: $TASK_ID"

################################################################################
# Spawn Agent
################################################################################

print_section "Spawning coder agent..."

AGENT_OUTPUT=$(claude-flow agent spawn -t coder --verbose 2>&1)

# Extract agent ID from output (format may vary, look for agent-<id>)
AGENT_ID=$(echo "$AGENT_OUTPUT" | grep -oE "agent-[a-z0-9-]+" | head -1)

# Fallback: if agent ID not found in first line, search entire output
if [ -z "$AGENT_ID" ]; then
    AGENT_ID=$(echo "$AGENT_OUTPUT" | grep "spawned\|created\|Spawned\|Created" | grep -oE "agent-[a-z0-9-]+" | head -1)
fi

if [ -z "$AGENT_ID" ]; then
    print_info "Agent spawn output:"
    echo "$AGENT_OUTPUT"
    print_error "Could not extract agent ID"
    exit 1
fi

print_success "Agent spawned: $AGENT_ID"

################################################################################
# Assign Task to Agent
################################################################################

print_section "Assigning task to agent..."

ASSIGN_OUTPUT=$(claude-flow task assign "$TASK_ID" --agent "$AGENT_ID" --verbose 2>&1)

if echo "$ASSIGN_OUTPUT" | grep -q "Error\|error"; then
    print_error "Failed to assign task"
    echo "$ASSIGN_OUTPUT"
    exit 1
fi

print_success "Task assigned to agent"

################################################################################
# Send Prompt to Agent
################################################################################

print_section "Sending full prompt to agent..."

# Send the extracted prompt to the agent via wasm-prompt
PROMPT_OUTPUT=$(claude-flow agent wasm-prompt "$AGENT_ID" --input "$PROMPT" 2>&1)

if echo "$PROMPT_OUTPUT" | grep -q "Error\|error"; then
    print_error "Failed to send prompt"
    echo "$PROMPT_OUTPUT"
    exit 1
fi

print_success "Prompt sent to agent"

################################################################################
# Display Status & Next Steps
################################################################################

print_header "Phase $PHASE_NUM Started"

echo -e "Task ID:     ${GREEN}$TASK_ID${NC}"
echo -e "Agent ID:    ${GREEN}$AGENT_ID${NC}"
echo ""

print_section "Monitoring Progress"

echo "Check task status:"
echo -e "  ${BLUE}claude-flow task status $TASK_ID${NC}"
echo ""
echo "Check agent logs:"
echo -e "  ${BLUE}claude-flow agent logs $AGENT_ID${NC}"
echo ""
echo "Stop the agent (if needed):"
echo -e "  ${BLUE}claude-flow agent stop $AGENT_ID${NC}"
echo ""

print_section "Next Steps"

NEXT_PHASE=$((PHASE_NUM + 1))
if [ $NEXT_PHASE -le 10 ]; then
    echo "When Phase $PHASE_NUM is complete, verify the output, then run:"
    echo -e "  ${BLUE}./run-phase.sh $NEXT_PHASE${NC}"
else
    echo "Phase $PHASE_NUM is the final phase. All phases will be complete!"
fi

echo ""

print_success "Phase $PHASE_NUM launched successfully"
print_info "Use the task ID and agent ID above to monitor progress"

################################################################################
