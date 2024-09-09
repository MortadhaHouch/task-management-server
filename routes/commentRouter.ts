import {FastifyInstance,FastifyRequest,FastifyReply} from "fastify"
let {verify,sign} = require("jsonwebtoken");
require("dotenv").config()
import {PrismaClient} from "@prisma/client"
let prisma:PrismaClient = new PrismaClient()
export function commentRouter(fastify:FastifyInstance,options:object,done:Function){
    fastify.get("/:id",async(req:FastifyRequest<{
        Params:{
            id:string
        }
    }>,reply:FastifyReply)=>{
        try {
            if(req.params.id){
                let comments = await prisma.comment.findMany({
                    where:{
                        feedbackId:req.params.id
                    },
                    select:{
                        id:true,
                        content:true,
                        createdAt:true,
                        user:{
                            select:{
                                firstName:true,
                                lastName:true,
                                email:true,
                                avatar:true,
                            }
                        }
                    },
                })
                let token = sign({comments},process.env.SECRET_KEY)
                reply.code(200).send({token})
            }
        } catch (error) {
            console.log(error);
        }
    })
    fastify.get("/:id/:p",async(req:FastifyRequest<{
        Params:{
            id:string
            p:string
        }
    }>,reply:FastifyReply)=>{
        try {
            if(req.params.id){
                if(Number(req.params.p)){
                    let comments = await prisma.comment.findMany({
                        where:{
                            feedbackId:req.params.id
                        },
                        select:{
                            id:true,
                            content:true,
                            createdAt:true,
                            user:{
                                select:{
                                    firstName:true,
                                    lastName:true,
                                    email:true,
                                    avatar:true,
                                }
                            }
                        },
                        take:10,
                        skip:(Number(req.params.p) - 1) * 10
                    })
                    let token = sign({comments},process.env.SECRET_KEY)
                    reply.code(200).send({token})
                }else{
                    let comments = await prisma.comment.findMany({
                        where:{
                            feedbackId:req.params.id
                        },
                        select:{
                            id:true,
                            content:true,
                            createdAt:true,
                            user:{
                                select:{
                                    firstName:true,
                                    lastName:true,
                                    email:true,
                                    avatar:true,
                                }
                            }
                        },
                    })
                    let token = sign({comments},process.env.SECRET_KEY)
                    reply.code(200).send({token})
                }
            }
        } catch (error) {
            console.log(error);
        }
    })
    fastify.post("/create",async(req:FastifyRequest<{
        Body:{
            body:any
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
                    let {content,feedbackId} = verify(req.body.body,process.env.SECRET_KEY);
                    let comment = await prisma.comment.create({
                        data:{
                            userId:user.id,
                            content,
                            feedbackId
                        }
                    })
                    let token = sign({comment},process.env.SECRET_KEY)
                    reply.code(201).send({token})
                }
            }else{
                let token = sign({error:"unauthorized to access this resource"},process.env.SECRET_KEY)
                reply.code(401).send({token})
            }
        } catch (error) {
            console.log(error);
        }
    })
    fastify.put("/edit",async(req:FastifyRequest<{
        Body:{
            body:any
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
                    let {content,id} = verify(req.body.body,process.env.SECRET_KEY);
                    let comment = await prisma.comment.update({
                        where:{
                            id
                        },
                            data:{
                            content,
                        }
                    })
                    let token = sign({comment},process.env.SECRET_KEY)
                    reply.code(201).send({token})
                }
            }else{
                let token = sign({error:"unauthorized to access this resource"},process.env.SECRET_KEY)
                reply.code(401).send({token})
            }
        } catch (error) {
            console.log(error);
        }
    })
    fastify.delete("/delete/:id",async(req:FastifyRequest<{
        Params:{
            id:string
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
                    let comment = await prisma.comment.delete({
                        where:{
                            id:req.params.id
                        }
                    })
                    let token = sign({message:"feedback deleted"},process.env.SECRET_KEY)
                    reply.code(201).send({token})
                }
            }else{
                let token = sign({error:"unauthorized to access this resource"},process.env.SECRET_KEY)
                reply.code(401).send({token})
            }
        } catch (error) {
            console.log(error);
        }
    })
    done()
}