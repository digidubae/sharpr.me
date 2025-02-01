import { z } from 'zod';

const envSchema = z.object({
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),

    NEXTAUTH_URL: z.string().url('NextAuth URL must be a valid URL'),
    NEXTAUTH_SECRET: z.string(),
    NODE_ENV: z.enum(['development', 'production']),
});

export function getTypedEnv() {
    try {
        return envSchema.parse({
            GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
            GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
            NEXTAUTH_URL: process.env.NEXTAUTH_URL,
            NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
            NODE_ENV: process.env.NODE_ENV,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error(`\n\nEnvironment variables validation failed:`);
            console.error(error.issues.map(issue => `❌ ${issue.path[0]}: ${issue.message}`).join('\n'));
            console.error('\nPlease check your .env file.\n');
        } else {
            console.error(`Environment variables validation failed: ${error}`);
        }
        process.exit(1);
    }
}

export const typedEnv = getTypedEnv();

export type Env = z.infer<typeof envSchema>;
