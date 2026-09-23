/**
 * Server-Only Environment Schema & Secret Boundary
 * Implements #env-variable-server-isolation architectural standard.
 */
import { z } from 'zod';

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  SESSION_SECRET: z.string().min(16).default('rayeen-itqanic-super-secret-session-key-2026'),
  API_BASE_URL: z.string().url().default('https://api.rayeen.web.id'),
  AI_BRIDGE_KEY: z.string().default('rayeen-ai-bridge-2026'),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

function loadServerEnv(): ServerEnv {
  const result = serverEnvSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Invalid server environment configuration:', result.error.format());
    // In production, fail-fast
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Invalid server environment configuration');
    }
    return serverEnvSchema.parse({});
  }
  return result.data;
}

export const serverEnv = loadServerEnv();
