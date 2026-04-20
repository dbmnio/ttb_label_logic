import NextAuth from "next-auth"
import CognitoProvider from "next-auth/providers/cognito"

const handler = NextAuth({
  providers: [
    CognitoProvider({
      clientId: process.env.COGNITO_CLIENT_ID || "",
      clientSecret: process.env.COGNITO_CLIENT_SECRET || "",
      issuer: process.env.COGNITO_ISSUER || "", // e.g., https://cognito-idp.{region}.amazonaws.com/{PoolId}
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        // @ts-expect-error - NextAuth types do not include id by default
        session.user.id = token.sub
      }
      return session
    }
  }
})

export { handler as GET, handler as POST }
