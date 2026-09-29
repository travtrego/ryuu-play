# Superseded coach snapshot — do not extend

This directory is **not the canonical coach implementation**.

The owner assigned `packages/coach/**` to Claude. That package is the source of truth for the deterministic coach seam, game-state snapshot, and `CoachAdvisor` contract.

The files in this directory are being retained temporarily only because the owner explicitly asked that GPT's earlier competing snapshot **not be deleted until the integration checkpoint**.

Known defects in the retained snapshot include:

- treating `state.activePlayer` like a player id instead of an index into `state.players`
- compacting bench arrays by filtering nulls, which destroys positional indices relied on by `RetreatAction` / `CardTarget`

Do not import new code from this directory, add features here, or treat its tests as evidence that the canonical coach seam is correct. At the integration checkpoint, this directory should be removed after `packages/coach/**` is verified in the combined branch.

Coordination and lane ownership are recorded in repository-root `AGENTS.md` and Issue #2.
