import { ChatAnthropic } from '@langchain/anthropic';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { StateGraph, END } from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { CoachingState, CoachingStateType } from './state';
import { coachingTools } from './tools';

// Initialize the model
const model = new ChatAnthropic({
  model: 'claude-sonnet-4-20250514',
  maxTokens: 300,
  temperature: 0.7,
});

// Bind tools to the model
const modelWithTools = model.bindTools(coachingTools);

// System prompt for the coaching agent
const SYSTEM_PROMPT = `You are a veteran, world-class life and CEO coach communicating via SMS. You bring decades of experience coaching high-performers, with a deep focus on mental health and work/life balance.

Your primary purpose is to help the user plan their following day by:
1. Generating 3 key goals for tomorrow
2. Asking strategic questions about their calendar, priorities, and ongoing projects
3. Building a schedule broken into 30-minute blocks (pomodoro-style)

IMPORTANT SMS CONSTRAINTS:
- Keep each response under 160 characters when possible
- Ask ONE question at a time
- Be direct and actionable
- No fluff or lengthy explanations

Coaching approach:
- Ask probing questions before giving advice
- Balance ambition with sustainability
- Challenge assumptions gently but directly
- One question or insight at a time

When you have enough information to create goals and a schedule, use the create_goal and create_task tools to save them to the database.

Remember: sustainable high performance beats burnout. Guard their mental health fiercely.`;

// Main agent node - processes messages and decides next action
async function agentNode(state: CoachingStateType) {
  const messages = [
    new SystemMessage(SYSTEM_PROMPT),
    ...state.messages,
  ];

  const response = await modelWithTools.invoke(messages);

  return {
    messages: [response],
  };
}

// Check if the agent should continue or end
function shouldContinue(state: CoachingStateType): 'tools' | 'respond' {
  const lastMessage = state.messages[state.messages.length - 1];

  // If the last message has tool calls, route to tools
  if (
    lastMessage &&
    'tool_calls' in lastMessage &&
    Array.isArray(lastMessage.tool_calls) &&
    lastMessage.tool_calls.length > 0
  ) {
    return 'tools';
  }

  // Otherwise, we're done - format response
  return 'respond';
}

// Extract the final response for SMS
function respondNode(state: CoachingStateType) {
  const lastMessage = state.messages[state.messages.length - 1];

  let response = '';
  if (lastMessage && 'content' in lastMessage) {
    response = typeof lastMessage.content === 'string'
      ? lastMessage.content
      : JSON.stringify(lastMessage.content);
  }

  return {
    response,
  };
}

// Create the tool node
const toolNode = new ToolNode(coachingTools);

// Build the graph
const workflow = new StateGraph(CoachingState)
  .addNode('agent', agentNode)
  .addNode('tools', toolNode)
  .addNode('respond', respondNode)
  .addEdge('__start__', 'agent')
  .addConditionalEdges('agent', shouldContinue, {
    tools: 'tools',
    respond: 'respond',
  })
  .addEdge('tools', 'agent')
  .addEdge('respond', '__end__');

// Compile the graph
export const coachingAgent = workflow.compile();

// Helper function to invoke the agent with conversation history
export async function invokeCoachingAgent(
  userId: string,
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<string> {
  // Convert conversation history to LangChain messages
  const messages = conversationHistory.map((msg) =>
    msg.role === 'user'
      ? new HumanMessage(msg.content)
      : new AIMessage(msg.content)
  );

  // Add the new user message
  messages.push(new HumanMessage(userMessage));

  // Invoke the agent
  const result = await coachingAgent.invoke({
    messages,
    userId,
    currentPhase: 'gathering',
    collectedInfo: {},
  });

  return result.response || 'I had trouble generating a response. Please try again.';
}
