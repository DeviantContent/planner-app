# Planner App

An agentic life planning assistant that communicates via SMS. Built with Next.js, Claude AI, Supabase, and Surge SMS.

## Features

- **SMS-based interaction** - No app needed, just text your planner
- **AI-powered assistance** - Claude helps with planning, goals, and accountability
- **Persistent memory** - Remembers your conversations, goals, and tasks
- **Proactive check-ins** - Get reminders and follow-ups (coming soon)

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Anthropic Claude** - AI assistant
- **Supabase** - PostgreSQL database
- **Surge SMS** - SMS messaging
- **Tailwind CSS** - Styling
- **Vercel** - Hosting

## Setup

### 1. Clone and install

```bash
git clone https://github.com/DeviantContent/planner-app.git
cd planner-app
pnpm install
```

### 2. Configure environment

Copy `.env.local.example` to `.env.local` and fill in:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Anthropic Claude
ANTHROPIC_API_KEY=your-anthropic-key

# Surge SMS
SURGE_ACCOUNT_ID=your-account-id
SURGE_API_KEY=your-api-key
SURGE_PHONE_NUMBER=+1XXXXXXXXXX
SURGE_WEBHOOK_SECRET=your-webhook-secret
```

### 3. Set up database

Run the migration in Supabase SQL editor:

```bash
# Copy contents of supabase/migrations/001_initial_schema.sql
# and run in Supabase SQL Editor
```

### 4. Configure Surge webhook

In your Surge dashboard, set the webhook URL to:
```
https://your-domain.vercel.app/api/webhooks/sms
```

### 5. Run locally

```bash
pnpm dev
```

## How it works

1. User sends SMS to your Surge phone number
2. Surge forwards the message to `/api/webhooks/sms`
3. App looks up or creates user based on phone number
4. Retrieves conversation history from Supabase
5. Sends message + history to Claude for response
6. Saves both messages to database
7. Sends Claude's response back via SMS

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── webhooks/
│   │       └── sms/
│   │           └── route.ts    # SMS webhook handler
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── anthropic.ts            # Claude AI client
│   ├── supabase.ts             # Supabase client
│   └── surge.ts                # SMS client
└── types/
    └── database.ts             # TypeScript types
```

## License

MIT
