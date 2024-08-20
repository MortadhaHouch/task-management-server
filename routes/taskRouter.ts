import { PrismaClient, TaskStatus } from '@prisma/client';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
let {verify,sign} = require("jsonwebtoken");
let prisma = new PrismaClient();
require("dotenv").config()
async function taskRouter(fastify: FastifyInstance,options:object) {
    fastify.get('/', async (req: FastifyRequest, reply: FastifyReply) => {
        reply.send({ message: 'Hello World' });
    });
    fastify.post("/validate",async(req: FastifyRequest<{
        Body:{
            body:any
        }
    }>, reply: FastifyReply) =>{
        try {
            let jwt_token = req.headers.cookie?.split(";").find((item)=>item.split("=")[0] == "jwt_token")?.split("=")[1];
            if(jwt_token?.length == 0){
                let token = sign({error:"OOPS you don't have the permission to access this resource"},process.env.SECRET_KEY);
                reply.code(403).send({token})
            }else{
                let name:string = verify(req.body.body,process.env.SECRET_KEY).name;
                let {email} = verify(jwt_token,process.env.SECRET_KEY);
                let user = await prisma.user.findUnique({
                    where:{
                        email
                    }
                })
                if(user){
                    let task = await prisma.task.findUnique({
                        where:{
                            title:name,
                            userId:user.id
                        }
                    })
                    if(task){
                        let token = sign({
                                task_exists:"task existence",
                                description:"task with title already exists, please choose a different relevant title"
                            },process.env.SECRET_KEY);
                        reply.send({token})
                    }else{
                        let token = sign({
                            message:"task validated",
                            description:"task has been successfully admitted keep customizing it"
                        },process.env.SECRET_KEY);
                        reply.code(200).send({token})
                    }
                }else{
                    let token = sign({
                        error:"OOPS!! you are not logged in",
                        description:"you are not logged in, please consider signing in or create an account"
                    },process.env.SECRET_KEY);
                    reply.code(403).send({token})
                }
            }
        } catch (error) {
            console.log(error);
        }
    })
    fastify.post("/create",async(req: FastifyRequest<{
        Body:{
            body:any
        }
    }>, reply: FastifyReply) =>{
        try {
            let jwt_token = req.headers.cookie?.split(";").find((item)=>item.split("=")[0] == "jwt_token")?.split("=")[1];
            if(jwt_token?.length == 0){
                let token = sign({error:"OOPS you don't have the permission to access this resource"},process.env.SECRET_KEY);
                reply.code(403).send({token})
            }else{
                let {email} = verify(jwt_token,process.env.SECRET_KEY);
                let user = await prisma.user.findUnique({
                    where:{
                        email
                    }
                })
                if(user){
                    let {title,description,status,dueDate,content,thumbnail,coverImage,deletedBy,startingDate} = verify(req.body.body,process.env.SECRET_KEY);
                    let task = await prisma.task.create({
                        data:{
                            title,
                            description,
                            status,
                            dueDate,
                            content,
                            thumbnail,
                            coverImage,
                            userId:user.id,
                            startingDate,
                            deletedBy:user.id,
                            cancelledBy:user.id,
                        }
                    })
                    let token = sign({task},process.env.SECRET_KEY);
                    reply.code(201).send({token})
                }else{
                    let token = sign({
                        error:"OOPS!! you are not logged in",
                        description:"you are not logged in, please consider signing in or create an account"
                    },process.env.SECRET_KEY);
                    reply.code(403).send({token})
                }
            }
        } catch (error) {
            console.log(error);
        }
    })
}
export default taskRouter