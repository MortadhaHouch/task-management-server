import { PrismaClient } from "@prisma/client";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
let {verify,sign} = require("jsonwebtoken")
let prisma = new PrismaClient();
require("dotenv").config()
export default function notificationsRouter(fastify:FastifyInstance,options:object,done:Function){
    fastify.get("/",async(req:FastifyRequest<{
        Params:{
            p:string
        }
    }>,reply:FastifyReply)=>{
        try {
            let cookie = req.cookies.jwt_token;
            if(cookie && cookie.length > 0){
                let {email} = verify(cookie,process.env.SECRET_KEY);
                let user = await prisma.user.findUnique({
                    where:{
                        email
                    }
                })
                if(user){
                    if(req.params.p){
                        let notifications = await prisma.notification.findMany({
                            where:{
                                userId:user.id
                            },
                            skip:(Number(req.params.p) - 1) * 10,
                            take:10
                        });
                        reply.code(200).send({notifications,pagesCount:Math.floor(notifications.length/10)});
                    }else{
                        let notifications = await prisma.notification.findMany({
                            where:{
                                userId:user.id
                            }
                        });
                        reply.code(200).send({notifications,pagesCount:Math.floor(notifications.length/10)});
                    }
                }else{
                    reply.send({error:"OOPS!! invalid credentials"});
                }
            }else{
                reply.send({error:"OOPS!! you are not logged in"});
            }
        } catch (error) {
            console.log(error);
        }
    })
    done()
}