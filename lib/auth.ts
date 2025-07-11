import GoogleProvider from "next-auth/providers/google"
import { prisma } from "@/lib/prisma" 
import { DefaultSession, SessionStrategy } from "next-auth"
import { signin_rate_limit } from "./redis";
import { headers } from "next/headers";
declare module "next-auth" {
  interface Session {
    user?: DefaultSession["user"] & {
      userId?: string;
    };
  }

  interface User {
    id: string;
  }

  interface JWT {
    userId?: string;
  }
}
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
      try {
        if(user){
          const exsistingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });
          let userId;
          if (!exsistingUser) {
            const newUser =await prisma.user.create({
              data: {
                name: token.name ,
                email: token.email ,googleID: token.sub,tokenExpiry : token.exp,
              },
            });
            userId=newUser.id
          }else{
            await prisma.user.update({
              where: { email: user.email },
              data:{
                googleID: token.sub,tokenExpiry : token.exp,
              }
            })
            userId = exsistingUser.id;
            
          }
        token.id = user.sub ?? token.sub;
        token.name = user.name;
        token.email = user.email;
         token.userId = userId;
        }
        return token
      } catch (error) {
        throw new Error("Error while signing in : Error "+ error);
      }
    },
    async session({ session, token }:any) {
         session.user = {
    ...session.user,  
    userId: token.userId
  };

            return session;
    },
    async signIn() {
      const ip = (await headers()).get('x-forwarded-for') ?? 'unknown';
      const { success } = await signin_rate_limit.limit(ip);
      console.log(`Request from IP: ${ip}`);
      if (!success) {
        return false;
      }
      return true;
  },
}}
