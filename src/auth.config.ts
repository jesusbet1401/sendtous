import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            // Only allow public access to login page
            const isOnLogin = nextUrl.pathname.startsWith('/login');

            if (isOnLogin) {
                if (isLoggedIn) {
                    return Response.redirect(new URL('/', nextUrl));
                }
                return true;
            }

            // For all other routes (which are protected by middleware matcher), require login
            if (!isLoggedIn) {
                return false; // Redirect to login
            }

            return true;
        },
        async session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub;
            }
            if (token.role && session.user) {
                session.user.role = token.role;
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role;
            }
            return token;
        }
    },
    providers: [], // Providers added in auth.ts
} satisfies NextAuthConfig;
