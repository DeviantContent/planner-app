import { AISDKExporter } from 'langsmith/vercel';
import { registerOTel } from '@vercel/otel';

export async function register() {
  registerOTel({
    serviceName: 'planner-app',
    traceExporter: new AISDKExporter({
      projectName: process.env.LANGSMITH_PROJECT || 'planner-app',
    }),
  });
}
