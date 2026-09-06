# Findings and Decisions

## Requirements
- Make 1.2% media income mathematically correct across repeated claims.
- Refine continuous-recruit label behavior and batch-only result animations.
- Restore team-level growth to recruitment probability.
- Preload practical scene and homepage assets.
- Add per-player basketball knowledge questions and recruitment-result player profiles.
- Show full pre-match team OVR values.

## Research Findings
- `IdleIncomeController` calculates `Math.floor(baseReward * mediaTeamBonus)`, so 182 at 1.2% displays 2 by design. The presentation loses the fractional 0.184 and therefore cannot prove the advertised percentage in a single claim.
- `IdleState` currently persists offline timing but no fractional media carry. The fix needs a backwards-compatible numeric carry field.
- `RecruitmentController` already owns continuous-recruit state, queue progression, and the `主页/底部按钮/招募/连续招募` Label.
- The long-press label is currently one plain Label, so highlighted count text needs rich-text rendering or a sibling Label. The prefab must be inspected for a safe replacement before editing it.
- Batch recruitment currently passes the normal full-screen entrance and exit helpers, so its speed multiplier can be scoped to a batch flag instead of changing single recruit behavior.
- `PreMatchController` formats both team totals through `formatPlayerOverall`, so the full-number requirement has one shared change point.
- Recruitment probability data is runtime JSON and the popup reads it via `RecruitmentProbabilityController`; team-level progression has to be traced through the recruitment model before changing weights.
- `RecruitmentProgression.resolveRecruitmentWindow` returns each window's static weights. Since levels 0–20 share `[60, 28, 9, 2.5, 0.5]`, a level 7 to 8 transition cannot change the result.
- There are 1,336 card templates for 148 source players. Questions and profile data must key by `sourcePlayerName`, never a per-quality card id.
- `球员知识` contains `题目`, `问题`, `是`, `否`, `答对全部`, and `下一题`; `球员资料` contains a `资料` Label. No prefab restructuring is needed.
- `HomeUiController.renderDetailedPlayerCard` is the sole player-detail renderer. `RecruitmentController.showRecruitmentResult` is the sole recruit-result renderer.
- The media team really grants `managementLevel * 0.004`, so management level 3 is exactly 1.2%.
- Root data already includes player career info, award shares, All-Star selections, end-of-season teams, and per-season five-stat CSVs. Those are the scalable factual backbone for all 148 player profiles and questions.
- `star_card_quality_profiles.json` already aggregates source-player career span, NBA 75, Hall-of-Fame, All-Star, MVP, FMVP, Sixth Man, and Chinese special-player information. It is the correct internal source for honors, while raw CSVs remain the evidence inputs.
- The normal full-screen entrance/exit helper has fixed timing. It needs a per-call speed multiplier so only continuous recruit results animate at double speed.
- `GameState` owns roster persistence and event emission, making it the safe place for player-knowledge progress and permanent-OVR reward helpers.
- Started public-source searches for NBA 75/Hall-of-Fame validation and community meme examples; results are stored only under ignored `.firecrawl` until they are distilled into game configuration.
- Ran targeted public searches for Simmons' regular-season three and the Wiggins thermos meme. The final question bank will use these only as clearly labelled community-meme facts, while honors and career facts stay on structured source data.
- `LoadingController` already preloads the Homepage scene. Match and pre-match controllers still call `director.loadScene` directly.
- The updated prefabs contain `球员详情页面/球员知识` with `答对全部` and `下一题`, plus `招募结果页面/球员资料`.
- Runtime numeric truth is under `assets/resources/data/balance`, including recruitment probability and management effects.
- Offline media rewards now retain their fractional remainder in the save state: the UI can show the mathematically exact bonus while currency claims remain integers without discarding fractional entitlement.
- The probability configuration now specifies an end-weight vector for each level window, allowing each team-level increase to change displayed recruitment odds instead of waiting for the next window.
- `player_knowledge.json` is generated from the canonical card configuration plus curated career/award data, then byte-synchronized to runtime resources. It contains six factual questions per source player and explicit community-meme questions only where those facts are deliberately curated.
- The revised recruitment-result prefab no longer contains five-stat labels, so `RecruitmentController` must not require their old references during initialization.
- Focused type checking is blocked by the project's existing Cocos declaration/baseline configuration. With declaration checks skipped and modern library types enabled, the only remaining error is the unrelated pre-existing `PreMatchEntrance.ts` Promise tuple type mismatch; changed files are clean.

## Technical Decisions
| Decision | Rationale |
|---|---|
| Store unclaimable media fractional income in save state | Prevents perpetual loss or accidental overpayment caused by rounding each claim. |
| Treat the prefab as the source of truth for the new knowledge/profile nodes | The user has already changed node structure; controllers must bind to those nodes rather than recreate old five-stat UI. |

## Issues Encountered
| Issue | Resolution |
|---|---|
| Existing `.planning` active plan belongs to unrelated completed work | Created a separate dated plan folder. |

## Resources
- Pending player-research sources.
