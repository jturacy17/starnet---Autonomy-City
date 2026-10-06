# Media organization and activation

The hosted Media campus displays nine categories with three planned specialist positions each: trend/source research, clip/video editing, and publishing/performance. Four managers share the 27 worker positions as 7 / 7 / 7 / 6. This is a versioned staffing blueprint exposed with the executive read model, not a registered runtime roster or an active automation service. Existing Sports pilot state is preserved.

Discovery is specified at 72-hour intervals. Production requires documented commercial reuse rights and verified platform monetization eligibility. Unknown eligibility must block clipping. Use free editing tools; model requests, storage and hosting still incur costs. Platform eligibility does not guarantee monetization, revenue or profit.

## Remaining implementation

1. Register the 31 positions through the existing agent harness; configure model budgets, scope and manager assignment. Verify real executions before changing planned statuses.
2. Implement source discovery with provenance and eligibility evidence, FFmpeg-based editing, previews and separate platform exports. Clip quality and platform eligibility require review.
3. Implement durable job state, retries and idempotent per-platform publishing receipts. Never retry a publish blindly after an ambiguous response.
4. Implement account OAuth using official platform APIs. Existing consumer accounts are insufficient by themselves: developer applications, permissions and, where required, platform review are needed. YouTube requires a Google OAuth application with YouTube upload permission; TikTok requires a developer application with Content Posting API access; Instagram requires the supported professional-account publishing flow and Meta developer application permissions. Verify current platform requirements before configuration. Secrets belong in Render environment settings; account sign-in and consent occur on each platform's own pages.
5. Move job state, account tokens and video assets to durable storage. Render Free sleeps and has no persistent disk, so it cannot guarantee an unattended 72-hour schedule. Use an always-on worker or external scheduler with durable storage before activation.

No OAuth flow, clipping adapter, recurring discovery job or publishing adapter is enabled by this UI update. Account login prompts must follow implemented, tested OAuth routes; do not ask the user to submit passwords or API tokens in chat.

## Viewing this change

Deploy the latest commit on `phase-1/enterprise-control` in Render, then refresh the existing public URL. Open Autonomy City → Media → Teams & Workflow or Manager Office. Each category opens its three planned positions. The original Sports pilot remains reachable from Existing Sports Pilot.
