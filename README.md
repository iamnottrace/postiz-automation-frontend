# Postiz Control

A self-hosted social media automation dashboard that provides a simple, user-friendly UI to control all Postiz features and n8n automation workflows — without ever exposing the n8n node editor.

## Architecture

```
┌──────────────────────────────────────────┐
│        Custom Frontend (Next.js)          │
│  App Router + shadcn/ui + Tailwind        │
│                                          │
│  Pages:                                  │
│  /dashboard     - Overview & stats        │
│  /posts         - Create/edit/schedule    │
│  /calendar      - Visual drag-drop cal    │
│  /automations   - Pipeline templates      │
│  /analytics     - Per-platform metrics    │
│  /approvals     - Review queue            │
│  /channels      - Manage integrations     │
│  /settings      - API keys, prefs         │
└───────┬──────────────┬────────────────────┘
        │              │
        ▼              ▼
┌──────────────┐  ┌──────────────────┐
│     n8n      │  │      Postiz      │
│  (Docker)    │  │    (Docker)      │
│              │  │                  │
│ Workflows:   │  │  30+ social      │
│ - RSS fetch  │  │  platforms       │
│ - AI generate│  │  OAuth, schedule │
│ - Approval   │  │  analytics       │
│ - Auto-engage│  │  AI image/video  │
└──────────────┘  └──────────────────┘
```

## Quick Start

### 1. Clone and configure

```bash
cp .env.example .env
# Edit .env with your API keys
```

### 2. Get your API keys

**Postiz API Key:**
- Start Postiz, create an account
- Go to Settings → Developers → Public API
- Copy your API key

**n8n API Key:**
- Start n8n, go to Settings → API
- Enable API and generate a key

### 3. Run everything

```bash
docker compose up -d
```

This starts:
- **Postiz** on `http://localhost:3000`
- **n8n** on `http://localhost:5678`
- **Frontend** on `http://localhost:3100`
- **PostgreSQL** (internal)
- **Redis** (internal)

### 4. Connect your social channels

1. Open `http://localhost:3000` (Postiz)
2. Connect your social media accounts via OAuth
3. Open `http://localhost:3100` (Frontend)
4. Go to Settings to verify connections
5. Go to Channels to see your connected accounts

## Features

### Dashboard
- Overview cards: scheduled posts, published, pending approvals, channels, active automations
- Recent activity feed
- Connection status indicators

### Posts
- Create posts with platform-specific previews
- Character counters per platform
- Media upload (images, video)
- AI content generation
- Post now, schedule, or save as draft
- Multi-channel selection
- Filter and manage existing posts

### Calendar
- FullCalendar month/week/day views
- Drag & drop to reschedule
- Color-coded by platform
- Click events for details

### Automations
- 5 pre-built n8n workflow templates:
  1. **RSS → AI → Post**: Monitor RSS, generate content, auto-schedule
  2. **AI Content Generator**: Generate multi-platform posts from prompts
  3. **Auto-Engage**: Monitor milestones, auto-like/comment
  4. **Bulk Schedule**: CSV upload → schedule across channels
  5. **Evergreen Recycler**: Reschedule top-performing posts
- Create, activate, deactivate, delete automations
- Manual trigger and execution history

### Analytics
- Per-platform metrics: impressions, likes, comments, shares, reach, engagement rate
- Engagement over time chart
- Top performing posts table

### Approvals
- Review queue for draft/pending posts
- Approve (schedules post) or reject (deletes)
- Bulk approve all

### Channels
- Grid of connected social accounts
- Connect/disconnect channels
- Health status indicators

### Settings
- Postiz API connection status
- n8n API connection status
- AI provider configuration
- Default posting schedule windows

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router) |
| UI | shadcn/ui + Tailwind CSS |
| Calendar | FullCalendar |
| Charts | Recharts |
| Forms | react-hook-form + zod |
| State | Zustand + TanStack Query |
| Container | Docker Compose |

## Development

```bash
# Install dependencies
pnpm install

# Run dev server
pnpm dev

# Build for production
pnpm build
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTIZ_API_URL` | Postiz REST API base URL | `http://postiz:3000/api/public/v1` |
| `POSTIZ_API_KEY` | Postiz API key | Required |
| `N8N_API_URL` | n8n REST API base URL | `http://n8n:5678/api/v1` |
| `N8N_API_KEY` | n8n API key | Required |
| `OPENAI_API_KEY` | OpenAI API key for AI features | Optional |
| `ANTHROPIC_API_KEY` | Anthropic API key (alternative) | Optional |

## License

This project is designed to work with Postiz (AGPL-3.0) and n8n (Sustainable Use License).
