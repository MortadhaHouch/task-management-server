import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { PrismaClient, TaskStatus } from '@prisma/client';
let prisma = new PrismaClient();
let {verify,sign} = require("jsonwebtoken");
require("dotenv").config();
export default function feedbackRouter(fastify:FastifyInstance,options:object,done:any){
    fastify.get("/",async(req:FastifyRequest<{
        Querystring:{
            p:number
        }
    }>,reply:FastifyReply)=>{
        try {
            if(req.query.p){
                let feedbacks = await prisma.feedback.findMany({
                    take:10,
                    skip:(req.query.p - 1) * 10,
                    include:{
                        author:true
                    }
                })
                let token = sign({feedbacks},process.env.SECRET_KEY)
                reply.code(200).send({token})
            }else{
                let feedbacks = await prisma.feedback.findMany({
                    include:{
                        author:{
                            select:{
                                email:true,
                                firstName:true,
                                lastName:true,
                                avatar:true,
                                isLoggedIn:true,
                                birthday:true,
                                id:true
                            }
                        }
                    }
                });
                let token = sign({feedbacks},process.env.SECRET_KEY)
                reply.code(200).send({token})
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
                    let {content} = verify(req.body.body,process.env.SECRET_KEY);
                    let feedback = await prisma.feedback.create({
                        data:{
                            content,
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
    fastify.put("/like", async (req: FastifyRequest<{ Body: { body: any } }>, reply: FastifyReply) => {
        try {
            const cookie = req.headers.cookie?.split(";").find((item) => item.split("=")[0] === "jwt_token")?.split("=")[1];
            if (cookie && cookie.length > 0) {
                const { email } = verify(cookie, process.env.SECRET_KEY) as { email: string };
                const user = await prisma.user.findUnique({ where: { email } });
                if (user) {
                    const feedbackId = verify(req.body.body, process.env.SECRET_KEY).id;
                    const feedback = await prisma.feedback.findUnique({
                        where: { id: feedbackId },
                        include: { likers: true, dislikers: true }
                    });
                    if (feedback?.likers.some(liker => liker.id === user.id)) {
                        const updatedFeedback = await prisma.feedback.update({
                            where: { id: feedbackId },
                            data: {
                                likers: { disconnect: { id: user.id } },
                                likes: { decrement: 1 }
                            }
                        });
                        reply.send({ token: sign({ data: { likes: updatedFeedback.likes, dislikes: updatedFeedback.dislikes } }, process.env.SECRET_KEY) });
                    } else if (feedback?.dislikers.some(disliker => disliker.id === user.id)) {
                        const updatedFeedback = await prisma.feedback.update({
                            where: { id: feedbackId },
                            data: {
                                dislikers: { disconnect: { id: user.id } },
                                likers: { connect: { id: user.id } },
                                dislikes: { decrement: 1 },
                                likes: { increment: 1 }
                            }
                        });
                        reply.send({ token: sign({ data: { likes: updatedFeedback.likes, dislikes: updatedFeedback.dislikes } }, process.env.SECRET_KEY) });
                    } else {
                        const updatedFeedback = await prisma.feedback.update({
                            where: { id: feedbackId },
                            data: {
                                likers: { connect: { id: user.id } },
                                likes: { increment: 1 }
                            }
                        });
                        reply.send({ token: sign({ data: { likes: updatedFeedback.likes, dislikes: updatedFeedback.dislikes } }, process.env.SECRET_KEY) });
                    }
                } else {
                    reply.send({ token: sign({ error: "User not found" }, process.env.SECRET_KEY) });
                }
            } else {
                reply.send({ token: sign({ error: "No permission to access this resource" }, process.env.SECRET_KEY) });
            }
        } catch (error) {
            console.error(error);
            reply.status(500).send({ error: "Internal Server Error" });
        }
    });
    fastify.put("/dislike", async (req: FastifyRequest<{ Body: { body: any } }>, reply: FastifyReply) => {
        try {
            const cookie = req.headers.cookie?.split(";").find((item) => item.split("=")[0] === "jwt_token")?.split("=")[1];
            if (cookie && cookie.length > 0) {
                const { email } = verify(cookie, process.env.SECRET_KEY) as { email: string };
                const user = await prisma.user.findUnique({ where: { email } });
                if (user) {
                    const feedbackId = verify(req.body.body, process.env.SECRET_KEY).id;
                    const feedback = await prisma.feedback.findUnique({
                        where: { id: feedbackId },
                        include: { likers: true, dislikers: true }
                    });
                    if (feedback?.dislikers.some(disliker => disliker.id === user.id)) {
                        const updatedFeedback = await prisma.feedback.update({
                            where: { id: feedbackId },
                            data: {
                                dislikers: { disconnect: { id: user.id } },
                                dislikes: { decrement: 1 }
                            }
                        });
                        reply.send({ token: sign({ data: { likes: updatedFeedback.likes, dislikes: updatedFeedback.dislikes } }, process.env.SECRET_KEY) });
                    } else if (feedback?.likers.some(liker => liker.id === user.id)) {
                        const updatedFeedback = await prisma.feedback.update({
                            where: { id: feedbackId },
                            data: {
                                likers: { disconnect: { id: user.id } },
                                dislikers: { connect: { id: user.id } },
                                likes: { decrement: 1 },
                                dislikes: { increment: 1 }
                            }
                        });
                        reply.send({ token: sign({ data: { likes: updatedFeedback.likes, dislikes: updatedFeedback.dislikes } }, process.env.SECRET_KEY) });
                    } else {
                        // If the user hasn't liked or disliked yet, add the dislike
                        const updatedFeedback = await prisma.feedback.update({
                            where: { id: feedbackId },
                            data: {
                                dislikers: { connect: { id: user.id } },
                                dislikes: { increment: 1 }
                            }
                        });
                        reply.send({ token: sign({ data: { likes: updatedFeedback.likes, dislikes: updatedFeedback.dislikes } }, process.env.SECRET_KEY) });
                    }
                } else {
                    reply.send({ token: sign({ error: "User not found" }, process.env.SECRET_KEY) });
                }
            } else {
                reply.send({ token: sign({ error: "No permission to access this resource" }, process.env.SECRET_KEY) });
            }
        } catch (error) {
            console.error(error);
            reply.status(500).send({ error: "Internal Server Error" });
        }
    });
    done();
}