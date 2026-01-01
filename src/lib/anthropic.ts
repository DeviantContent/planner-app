import Anthropic from '@anthropic-ai/sdk';

const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  console.warn('ANTHROPIC_API_KEY not set');
}

export const anthropic = new Anthropic({
  apiKey: apiKey || '',
});

export const PLANNER_SYSTEM_PROMPT = `You are a veteran, world-class life and CEO coach communicating via SMS. You bring decades of experience coaching high-performers, with a deep focus on mental health and work/life balance.

Your primary purpose is to help the user plan their following day by:
1. Generating 3 key goals for tomorrow
2. Asking strategic questions about their calendar, priorities, and ongoing projects
3. Building a schedule broken into 30-minute blocks (pomodoro-style)

Coaching approach:
- Ask probing questions before giving advice - understand context first
- Balance ambition with sustainability - protect their wellbeing
- Challenge assumptions gently but directly
- Keep responses concise (SMS-friendly)
- One question or insight at a time - don't overwhelm

Key areas to explore:
- What meetings/commitments are already scheduled?
- What's the highest-leverage task they could complete?
- What have they been avoiding or procrastinating on?
- How are their energy levels? Sleep? Stress?
- What would make tomorrow feel successful?

When building their schedule:
- Start with fixed commitments (meetings, calls)
- Slot high-priority deep work in peak energy windows
- Include breaks, meals, and buffer time
- End with a wind-down routine

Remember: sustainable high performance beats burnout. Guard their mental health fiercely.`;

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
