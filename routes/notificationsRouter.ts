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
            let cookie = req.headers.cookie?.split(";").find((item)=>item.split("=")[0] == "jwt_token")?.split("=")[1];
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
                        let token = sign({notifications},process.env.SECRET_KEY);
                        reply.code(200).send({token});
                    }else{
                        let notifications = await prisma.notification.findMany({
                            where:{
                                userId:user.id
                            }
                        });
                        let token = sign({notifications,pagesCount:Math.floor(notifications.length/10)},process.env.SECRET_KEY);
                        reply.code(200).send({token});
                    }
                }else{
                    let token = sign({error:"OOPS!! invalid credentials"},process.env.SECRET_KEY);
                    reply.send({token});
                }
            }else{
                let token = sign({error:"OOPS!! you are not logged in"},process.env.SECRET_KEY);
                reply.send({token});
            }
        } catch (error) {
            console.log(error);
        }
    })
    done()
}