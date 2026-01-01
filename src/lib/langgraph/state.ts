import { BaseMessage } from '@langchain/core/messages';
import { Annotation } from '@langchain/langgraph';

// Goal and schedule types matching database schema
export interface Goal {
  id?: string;
  title: string;
  description?: string;
  due_date?: string;
}

export interface ScheduleBlock {
  time: string; // e.g., "09:00"
  duration: number; // in minutes (30)
  activity: string;
  goalId?: string;
}

export interface CollectedInfo {
  meetings?: string[];
  priorities?: string[];
  energyLevel?: 'low' | 'medium' | 'high';
  stressLevel?: 'low' | 'medium' | 'high';
  wakeTime?: string;
  sleepTime?: string;
  goals?: Goal[];
  schedule?: ScheduleBlock[];
}

// Define the state schema using LangGraph's Annotation
export const CoachingState = Annotation.Root({
  // Conversation messages
  messages: Annotation<BaseMessage[]>({
    reducer: (current, update) => [...current, ...update],
    default: () => [],
  }),

  // User identifier for database operations
  userId: Annotation<string>({
    reducer: (_, update) => update,
    default: () => '',
  }),

  // Current phase of the coaching workflow
  currentPhase: Annotation<'gathering' | 'goals' | 'scheduling' | 'complete'>({
    reducer: (_, update) => update,
    default: () => 'gathering',
  }),

  // Information collected during the conversation
  collectedInfo: Annotation<CollectedInfo>({
    reducer: (current, update) => ({ ...current, ...update }),
    default: () => ({}),
  }),

  // The final response to send via SMS
  response: Annotation<string>({
    reducer: (_, update) => update,
    default: () => '',
  }),
});

export type CoachingStateType = typeof CoachingState.State;
