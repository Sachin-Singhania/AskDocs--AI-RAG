import GoogleProvider from "next-auth/providers/google"
import { prisma } from "@/lib/prisma" // adjust path as needed
import { SessionStrategy } from "next-auth"

export const authOptions = {
  session : {
    strategy: "jwt" as SessionStrategy,
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.JWT_SECRET || "secret",
  callbacks: {
    async jwt({ token,user }:any) {
      console.log("JWT Callback", { token, user });
      if(user){
        const exsistingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });
        if (!exsistingUser) {
          await prisma.user.create({
            data: {
              name: token.name ,
              email: token.email ,googleID: token.sub,tokenExpiry : token.exp,
            },
          });
        }
      token.id = user.sub ?? token.sub;
      token.name = user.name;
      token.email = user.email;
      }
      return token
    },
    async session({ session, token }:any) {
      console.log("Session Callback", { session, token });
       session.user = {
                name: token.name,
                email: token.email,
              };
            return session;
    },
  },
}
