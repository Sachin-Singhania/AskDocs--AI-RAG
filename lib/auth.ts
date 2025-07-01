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
            
          }
        token.id = user.sub ?? token.sub;
        token.name = user.name;
        token.email = user.email;
        token.userId= exsistingUser?.id ? exsistingUser.id : userId;
        }
        return token
      } catch (error) {
        throw new Error("Error while signing in : Error "+ error);
      }
    },
    async session({ session, token }:any) {
       session.user = {
                name: token.name,
                email: token.email,
              };
            return session;
    },
  },
}
