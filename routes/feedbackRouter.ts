import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { PrismaClient, TaskStatus } from '@prisma/client';
let prisma = new PrismaClient();
let {verify,sign} = require("jsonwebtoken");
require("dotenv").config();
export default function feedbackRouter(fastify:FastifyInstance,options:object){
    fastify.get("/",async(req:FastifyRequest<{
        Querystring:{
            p:number
        }
    }>,reply:FastifyReply)=>{
        try {
            let cookie = req.headers.cookie?.split(";").find((item)=>item.split("=")[0] == "jwt_token")?.split("=")[1];
            if(cookie && cookie.length > 0) {
                let {email} = verify(cookie,process.env.SECRET_KEY);
                let user = await prisma.user.findUnique({
                    where:{
                        email
                    }
                })
                if(user){
                    if(req.query.p){
                        let feedbacks = await prisma.feedback.findMany({
                            where:{
                                authorId:user.id
                            },
                            take:10,
                            skip:(req.query.p - 1) * 10
                        })
                        let token = sign({feedbacks},process.env.SECRET_KEY)
                        reply.send({
                            token
                        })
                    }else{
                        let feedbacks = await prisma.feedback.findMany({
                            where:{
                                authorId:user.id
                            },
                        })
                        let token = sign({feedbacks},process.env.SECRET_KEY)
                        reply.send({
                            token
                        })
                    }
                }
            }
        } catch (error) {
            console.log(error);
        }
    })
    fastify.post("/create",async(req:FastifyRequest<{
        Body:{
            body:string
        }
    }>,reply:FastifyReply)=>{
        try {
            let cookie = req.headers.cookie?.split(";").find((item)=>item.split("=")[0] == "jwt_token")?.split("=")[1];
            if(cookie && cookie.length > 0) {
                let {email} = verify(cookie,process.env.SECRET_KEY);
                let user = await prisma.user.findUnique({
                    where:{
                        email
                    }
                })
                if(user){
                    let {content} = verify(user,process.env.SECRET_KEY);
                    let feedback = await prisma.feedback.create({
                        data:{
                            content:content,
                            authorId:user.id,
                        },
                    })
                    let token = sign({feedback},process.env.SECRET_KEY);
                    reply.send({
                        token
                    })
                }
            }else{
                let token = sign({error:"OOPS !! you don't have the permission to access this resource"},process.env.SECRET_KEY);
                reply.send({
                    token
                })
            }
        } catch (error) {
            console.log(error);
        }
    })
    fastify.post("/like", async (req: FastifyRequest<{
        Body: {
            body: string
        }
    }>, reply: FastifyReply) => {
        try {
            let cookie = req.headers.cookie?.split(";").find((item) => item.split("=")[0] == "jwt_token")?.split("=")[1];
            if (cookie && cookie.length > 0) {
                let { email } = verify(cookie, process.env.SECRET_KEY) as { email: string };
                let user = await prisma.user.findUnique({
                    where: { email }
                })
                if (user) {
                    let feedback = await prisma.feedback.findUnique({
                        where: {
                            id: req.body.body,
                            likers: {
                                some: {
                                    id: user.id,
                                },
                            }
                        }
                    });
                    if (feedback) {
                        await prisma.feedback.update({
                            where: { id: feedback.id },
                            data: {
                                likers: {
                                    delete: { id: user.id }
                                },
                                likes: { decrement: 1 }
                            }
                        });
                        reply.send({ success: true, message: "Feedback unliked" });
                    } else {
                        let dislikedFeedback = await prisma.feedback.findUnique({
                            where: {
                                id: req.body.body,
                                dislikers: {
                                    some: {
                                        id: user.id,
                                    },
                                }
                            }
                        });
                        if (dislikedFeedback) {
                            await prisma.feedback.update({
                                where: { id: dislikedFeedback.id },
                                data: {
                                    dislikers: {
                                        delete: { id: user.id }
                                    },
                                    likers: {
                                        connect: { id: user.id }
                                    },
                                    dislikes: { decrement: 1 },
                                    likes: { increment: 1 }
                                }
                            });
                            reply.send({ success: true, message: "Feedback liked and dislike removed" });
                        } else {
                            await prisma.feedback.update({
                                where: { id: req.body.body },
                                data: {
                                    likers: {
                                        connect: { id: user.id }
                                    },
                                    likes: { increment: 1 }
                                }
                            });
                            reply.send({ success: true, message: "Feedback liked" });
                        }
                    }
                } else {
                    let token = sign({ error: "User not found" }, process.env.SECRET_KEY);
                    reply.send({ token });
                }
            } else {
                let token = sign({ error: "No permission to access this resource" }, process.env.SECRET_KEY);
                reply.send({ token });
            }
        } catch (error) {
            console.error(error);
            reply.status(500).send({ error: "Internal Server Error" });
        }
    });
    fastify.post("/dislike", async (req: FastifyRequest<{
        Body: {
            body: string
        }
    }>, reply: FastifyReply) => {
        try {
            let cookie = req.headers.cookie?.split(";").find((item) => item.split("=")[0] == "jwt_token")?.split("=")[1];
            if (cookie && cookie.length > 0) {
                let { email } = verify(cookie, process.env.SECRET_KEY) as { email: string };
                let user = await prisma.user.findUnique({
                    where: { email }
                });
                if (user) {
                    let feedback = await prisma.feedback.findUnique({
                        where: {
                            id: req.body.body,
                            dislikers: {
                                some: {
                                    id: user.id,
                                },
                            }
                        }
                    })
                    if (feedback) {
                        await prisma.feedback.update({
                            where: { id: feedback.id },
                            data: {
                                dislikers: {
                                    delete: { id: user.id }
                                },
                                dislikes: { decrement: 1 }
                            }
                        });
                        reply.send({ success: true, message: "Feedback undisliked" });
                    } else {
                        let likedFeedback = await prisma.feedback.findUnique({
                            where: {
                                id: req.body.body,
                                likers: {
                                    some: {
                                        id: user.id,
                                    },
                                }
                            }
                        });
                        if (likedFeedback) {
                            await prisma.feedback.update({
                                where: { id: likedFeedback.id },
                                data: {
                                    likers: {
                                        delete: { id: user.id }
                                    },
                                    dislikers: {
                                        connect: { id: user.id }
                                    },
                                    likes: { decrement: 1 },
                                    dislikes: { increment: 1 }
                                }
                            });
                            reply.send({ success: true, message: "Feedback disliked and like removed" });
                        } else {
                            await prisma.feedback.update({
                                where: { id: req.body.body },
                                data: {
                                    dislikers: {
                                        connect: { id: user.id }
                                    },
                                    dislikes: { increment: 1 }
                                }
                            });
                            reply.send({ success: true, message: "Feedback disliked" });
                        }
                    }
                } else {
                    let token = sign({ error: "User not found" }, process.env.SECRET_KEY);
                    reply.send({ token });
                }
            } else {
                let token = sign({ error: "No permission to access this resource" }, process.env.SECRET_KEY);
                reply.send({ token });
            }
        } catch (error) {
            console.error(error);
            reply.status(500).send({ error: "Internal Server Error" });
        }
    });
}