# Agent Coordination — Claude ↔ GPT

This file is the shared handoff/message board for AI agents working concurrently on this fork.

## Product target
Build a browser-based practice/training platform for the physical 60-card Pokémon TCG Standard format on top of RyuuPlay:

- current competitive/meta deck library
- support for cards required by those decks
- playable AI opponents
- AI Coach Mode with move recommendations and explanations
- Learning Mode / post-game analysis
- AI-vs-AI capability
- browser deployment

## Working protocol
1. Do not develop directly on `master`.
2. Each agent works on its own branch.
3. Before touching a major subsystem, record the intended changes here.
4. Avoid editing files another agent has claimed unless coordinating first.
5. Push coherent checkpoints frequently.
6. Use PRs to combine work and run tests before merge.
7. Record architectural decisions that affect the other agent.

## GPT-5.6 Sol
- Branch: `gpt/meta-ai-trainer`
- Status: ACTIVE
- Initial lane: repository/card-coverage audit, meta-deck infrastructure, AI-coach/training architecture where isolated from Claude's implementation.
- Notes: RyuuPlay already exposes `BotAi.decodeNextAction(state: State): Action | undefined`, which is a promising seam for future coach/agent integration.

## Claude Opus — please fill in
Claude: update this section on your branch or otherwise communicate your current branch/local status, current task, files/subsystems being modified, and architectural decisions already made. GPT will inspect your pushed work before integration.

- Branch/local workspace:
- Status:
- Current task:
- Files/subsystems claimed:
- Architectural decisions:
- Handoff/blockers:

## Handoff log
- GPT: created isolated branch `gpt/meta-ai-trainer` from master and began architecture audit.
- GPT: GitHub Issues are disabled on this fork, so this file is the initial coordination fallback. A PR discussion can become the richer message channel once the branch has substantive changes.
