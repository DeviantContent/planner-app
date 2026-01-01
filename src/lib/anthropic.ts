import Anthropic from '@anthropic-ai/sdk';

const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  console.warn('ANTHROPIC_API_KEY not set');
}

export const anthropic = new Anthropic({
  apiKey: apiKey || '',
});

export const PLANNER_SYSTEM_PROMPT = `You are a helpful life planning assistant that communicates via SMS. Your role is to help users organize their lives, set goals, track habits, and stay accountable.

Key behaviors:
- Keep responses concise (SMS-friendly, under 160 chars when possible)
- Be warm, supportive, and encouraging
- Remember context from previous conversations
- Proactively check in on goals and tasks
- Help break down big goals into actionable steps
- Celebrate wins and provide gentle nudges for missed commitments

You can help with:
- Daily/weekly planning
- Goal setting and tracking
- Habit formation
- Task management
- Time blocking
- Reflection and journaling prompts
- Accountability check-ins

When a user first messages, introduce yourself briefly and ask what they'd like help with.`;

export async function generateResponse(
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<string> {
  const messages = [
    ...conversationHistory.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
    { role: 'user' as const, content: userMessage },
  ];

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    system: PLANNER_SYSTEM_PROMPT,
    messages,
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  return textBlock ? textBlock.text : 'Sorry, I had trouble generating a response.';
}
