import { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { JWT } from 'next-auth/jwt';
import { Session } from 'next-auth';
import { Account } from 'next-auth';
import { typedEnv } from '@/app/environment-variables';

const scopes = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/drive.file'
];

async function refreshAccessToken(token: JWT) {
  try {
    const url =
      "https://oauth2.googleapis.com/token?" +
      new URLSearchParams({
        client_id: typedEnv.GOOGLE_CLIENT_ID,
        client_secret: typedEnv.GOOGLE_CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken as string,
      });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
    };
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: typedEnv.GOOGLE_CLIENT_ID,
      clientSecret: typedEnv.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: scopes.join(' '),
          access_type: 'offline',
          prompt: 'consent',
          response_type: 'code',
          timeout: 10000
        }
      },
      httpOptions: {
        timeout: 10000
      }
    })
  ],
  callbacks: {
    async jwt({ token, account }: { token: JWT; account: Account | null }) {
      // Initial sign in
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.accessTokenExpires = account.expires_at! * 1000;
        return token;
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      // Access token has expired, try to refresh it
      return refreshAccessToken(token);
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.accessToken = token.accessToken as string;
        // Add error to session if token refresh failed
        if (token.error) {
          session.error = token.error as string;
        }
      }
      return session;
    }
  },
  pages: {
    signIn: '/',
    signOut: '/',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV === 'development'
}; 