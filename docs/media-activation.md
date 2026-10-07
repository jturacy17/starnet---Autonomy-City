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

## Free editing engine (FFmpeg)

OpusClip is not required. `sidecar/media/clip-worker.js` renders local source files using FFmpeg and FFprobe, with one encoder thread to reduce CPU contention. It produces 720×1280 MP4 exports for the three platforms, preserving the full frame with padding. It does not infer highlight timestamps, burn captions, verify rights or monetization automatically, upload source videos, schedule or publish. Each job requires explicit documented commercial reuse rights and verified monetization eligibility; these assertions must come from a reviewed source, not an agent guessing. No revenue guarantee is implied.

Run one reviewed job:

```
node scripts/render-media-clip.js /absolute/path/to/job.json
```

Example (replace paths and evidence with real reviewed information):

```json
{
  "input": "/data/source.mp4",
  "outputDir": "/data/jobs/unique-job-id",
  "startSeconds": 120,
  "durationSeconds": 45,
  "rights": {"status": "owned", "evidence": "Recorded and owned by this business"},
  "monetizationEligible": true
}
```

The output directory must not already exist. Failed jobs leave a failure record and must be reviewed before rerunning under a new ID. The current worker supports up to 180 seconds per clip; 30–60 seconds is the typical target. All three outputs currently contain the same vertical video; platform-specific metadata and captions are future work. Temporary exports are not durable on Render Free.

`Dockerfile.render` provides an optional Docker runtime with FFmpeg installed. The existing Render Node service is unchanged: pushing this file does not switch its runtime. A Render Docker service must explicitly select this Dockerfile and receive the hosted authentication configuration through secure environment variables. Validate the image and hosted editing on Render before activation; the image has not been built in this workspace. Do not delete the current service before validating a replacement. Its public hostname may differ.

The worker was validated locally with a generated video, three probed exports, out-of-range selection rejection, missing rights rejection and overwrite prevention. This is editing-engine validation, not an end-to-end publishing test. Render Free's 512 MB memory, sleep behavior and ephemeral disk remain constraints. Ninety source videos per week and unattended morning posting are not established as feasible on this tier. Queue integration, durable storage, an appropriate scheduler, AI selection/transcription and official platform connections remain required.

## Create real agents and Media rooms from the city

Media → Teams & Workflow now offers **Create Media Rooms & All 31 Agents**. A category page offers creation of its three workers plus the four shared managers. The control uses `App.summonAgent`, the existing StarNet recruitment flow, preserving model inheritance, ask-mode approval, agent documents, workstreams, floor sprites and roster synchronization. A woken Overseer is required. No model run or schedule is launched by creation.

The normal WorldModel placement API adds one lab room named `Media · <category>` per selected category and `Media · Managers`, each with desks bound to its agents. Existing rooms and unrelated agents are preserved. Each position has a stable specialty identity so repeats reuse the agent. Room/desk placement can fail if the floor has no space; the UI reports it and a retry reuses existing members. The creation flow verifies server roster sync, but floor persistence uses the existing App/Save/CloudSave path and its save-health indicator. Render Free remains ephemeral: this feature does not make server storage durable.

Each worker has category-specific duties, manager reporting instructions, a 1–3 day trend horizon, source-rights requirements and explicit tool/account blockers. Manager assignments are operating instructions, not a new enforced hierarchical permissions system. Created workers/managers have **Open Agent / Open Manager** controls in the city; these switch to the actual StarNet conversation. Actual model credential availability is determined when a run is attempted; creation does not verify API billing or model access.

This change does not mutate the user's live hosted account from the development workspace. Deploy the updated branch and use the creation control in the signed-in hosted session. Verify the crew, rooms and save-health status before starting work.
