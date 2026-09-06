# Task Plan: 2026-08-20 Game System Updates

## Goal
Implement and statically verify the requested economy, batch recruitment, loading, player knowledge, player profile, and OVR-display updates in the basketball Cocos project.

## Current Phase
Phase 2: Economy, probability, and display corrections

## Phases

### Phase 1: Requirements and discovery
- [x] Inspect current Cocos controllers, prefabs, save state, and balance data.
- [x] Identify the actual source of the media-income discrepancy and unchanged recruit odds.
- [x] Record node paths for the edited player-detail and recruit-result prefabs.
- **Status:** complete

### Phase 2: Economy, probability, and display corrections
- [ ] Make offline media income agree with its displayed percentage and rounding rule.
- [ ] Repair team-level recruitment probability progression.
- [ ] Show full OVR values in pre-match team headers.
- **Status:** in_progress

### Phase 3: Continuous recruitment interaction
- [ ] Format and retain the long-press count label through the result queue.
- [ ] Double only batch-recruit result transitions.
- **Status:** pending

### Phase 4: Scene loading
- [ ] Inspect scene transition ownership and resource load points.
- [ ] Preload the next practical scene and homepage roster dependencies without duplicating resource ownership.
- **Status:** pending

### Phase 5: Player knowledge and profile content
- [ ] Add persistent player-question state and UI behavior.
- [ ] Research basketball-specific questions and player honors from reliable sources.
- [ ] Surface profile data in recruitment results using the revised prefab nodes.
- **Status:** pending

### Phase 6: Verification and handoff
- [ ] Parse changed JSON and validate probability totals and reward formulas.
- [ ] Run focused TypeScript diagnostics and diff checks.
- [ ] Record verification scope and any Creator-preview work left for manual testing.
- **Status:** pending

## Decisions Made
| Decision | Rationale |
|---|---|
| Keep this task in its own `.planning` directory | The previous active plan is a completed July UI-design task. |
| Preserve configured percentages and use an explicit fractional-currency carry | Integer display alone cannot represent a 1.2% bonus on every small payout. |
| Interpolate the five weights inside each current quality window | Team levels must change the visible odds before the five-quality pool shifts. |

## Errors Encountered
| Error | Attempt | Resolution |
|---|---:|---|
| `bash` unavailable while running planning initializer | 1 | Tried absolute Git Bash paths. |
| Git Bash paths absent | 2 | Created an isolated planning directory with PowerShell. |
| `New-Item -LiteralPath` unsupported in this shell | 3 | Used `New-Item -Path` and continued with patch-created planning files. |
| Broad planning status patch missed an absent row | 1 | Re-read the plan and applied a narrower patch. |
