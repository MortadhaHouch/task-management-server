import { PrismaClient, TaskStatus } from '@prisma/client';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
let {verify,sign} = require("jsonwebtoken");
let prisma = new PrismaClient();
require("dotenv").config();
let taskObject = {
    id:true,
    title:true,
    description:true,
    status:true,
    createdAt:true,
    startingDate:true,
    dueDate:true,
    modifiedAt:true,
    isDeleted:true,
    isCancelled:true,
}
async function taskRouter(fastify: FastifyInstance,options:object) {
    fastify.get('/', async (req: FastifyRequest<{
        Querystring:{
            p:string,
        }
    }>, reply: FastifyReply) => {
        try {
            let cookie = req.headers.cookie?.split(";").find((item)=>item.split("=")[0] == "jwt_token")?.split("=")[1];
            let {email} = verify(cookie,process.env.SECRET_KEY);
            if(cookie && cookie.length > 0){
                let user = await prisma.user.findUnique({
                    where:{
                        email
                    }
                })
                if(user){
                    let allTasks = await prisma.task.findMany({
                        where:{
                            userId:user.id
                        }
                    })
                    if(!isNaN(Number(req.query.p))){
                        let tasks = await prisma.task.findMany({
                            where:{
                                userId:user.id
                            },
                            select:{
                                ...taskObject
                            },
                            skip:Number(req.query.p)*10,
                            take:10
                        })
                        let token = sign({tasks,pagesCount:Math.ceil(allTasks.length/10)},process.env.SECRET_KEY);
                        reply.send({token})
                    }else{
                        let tasks = await prisma.task.findMany({
                            where:{
                                userId:user.id
                            },
                            select:{
                                ...taskObject
                            },
                            skip:0,
                            take:10
                        })
                        let token = sign({tasks,pagesCount:Math.ceil(tasks.length/10)},process.env.SECRET_KEY);
                        reply.send({token})
                    }
                }else{
                    let token = sign({
                        error:"OOPS !! you're not authorized",
                        description:"OOPS !! you're not authorized,please consider logging in or creating an account"
                    },process.env.SECRET_KEY)
                    reply.code(401).send({token})
                }
            }else{
                let token = sign({error:"OOPS !! you're not authorized ,Please login or register"},process.env.SECRET_KEY)
                reply.code(401).send({token})
            }
        } catch (error) {
            console.log(error);
        }
    });
    fastify.get('/overview', async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            let cookie = req.headers.cookie?.split(";").find((item)=>item.split("=")[0] == "jwt_token")?.split("=")[1];
            let {email} = verify(cookie,process.env.SECRET_KEY);
            if(cookie && cookie.length > 0){
                let user = await prisma.user.findUnique({
                    where:{
                        email
                    }
                })
                if(user){
                    let allTasks = await prisma.task.findMany({
                        where:{
                            userId:user.id
                        },
                        select:{
                            title:true,
                        }
                    })
                    let tasks = await prisma.task.findMany({
                        where:{
                            userId:user.id
                        },
                        select:{
                            ...taskObject
                        }
                    })
                    let completedTasks = tasks.filter((task)=>task.status == TaskStatus.ACCOMPLISHED);
                    let cancelledTasks = tasks.filter((task)=>task.isCancelled);
                    let overdueTasks = tasks.filter((task)=>task.dueDate.toString() < new Date().getTime().toString() && task.status != TaskStatus.ACCOMPLISHED);
                    let pendingTasks = tasks.filter((task)=>task.dueDate.toString() > new Date().getTime().toString() && task.status != TaskStatus.ACCOMPLISHED);
                    let token = sign({completedTasks,cancelledTasks,overdueTasks,pendingTasks},process.env.SECRET_KEY);
                    reply.send({token})
                }else{
                    let token = sign({
                        message:"OOPS !! you're not authorized",
                        description:"OOPS !! you're not authorized,please consider logging in or creating an account"
                    },process.env.SECRET_KEY)
                    reply.code(401).send({token})
                }
            }else{
                let token = sign({message:"OOPS !! you're not authorized ,Please login or register"},process.env.SECRET_KEY)
                reply.code(401).send({token})
            }
        } catch (error) {
            console.log(error);
        }
    });
    fastify.get('/templates', async (req: FastifyRequest<{
        Querystring:{
            p:string,
        }
    }>, reply: FastifyReply) => {
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
                    if(req.query.p){
                        if(!isNaN(Number(req.query.p))){
                            let token = sign({templates:user?.savedTemplates[(Number(req.query.p))*10,(Number(req.query.p)+1)*10]},process.env.SECRET_KEY);
                            reply.send({token})
                        }else{
                            let token = sign({message:"invalid query parameter"},process.env.SECRET_KEY);
                            reply.code(400).send({token})
                        }
                    }else{
                        let token = sign({templates:user?.savedTemplates.slice(0,9)},process.env.SECRET_KEY);
                        reply.send({token})
                    }
                }else{
                    let token = sign({message:"OOPS !! authentication failed , Please login or register"},process.env.SECRET_KEY)
                    reply.code(401).send({token})
                }
            }else{
                let token = sign({message:"OOPS !! invalid credentials ,Please login or register"},process.env.SECRET_KEY)
                reply.code(401).send({token})
            }
        } catch (error) {
            console.log(error);
        }
    });
    fastify.get('/by-day/:date', async (req: FastifyRequest<{
        Params:{
            date:string
        }
    }>, reply: FastifyReply) => {
        try {
            let cookie = req.headers.cookie?.split(";").find((item)=>item.split("=")[0] == "jwt_token")?.split("=")[1];
            if(cookie && cookie.length > 0){
                let user = await prisma.user.findUnique({
                    where:{
                        email:verify(cookie,process.env.SECRET_KEY).email
                    }
                })
                if(user){
                    if(req.params.date){
                        let tasks = await prisma.task.findMany({
                            where:{
                                userId:user.id,
                                dueDate:new Date(req.params.date)
                            },
                            select:{
                                ...taskObject
                            },
                        })
                        let token = sign({tasks},process.env.SECRET_KEY);
                        reply.send({token})
                    }else{
                        let tasks = await prisma.task.findMany({
                            where:{
                                userId:user.id,
                                dueDate:new Date(Date.now())
                            },
                            select:{
                                ...taskObject
                            },
                        })
                        let token = sign({tasks},process.env.SECRET_KEY);
                        reply.send({token})
                    }
                }else{
                    let token = sign({message:"OOPS !! you're not authorized ,Please login or register"},process.env.SECRET_KEY)
                    reply.code(401).send({token})
                }
            }else{
                let token = sign({message:"OOPS !! invalid credentials ,Please login or register"},process.env.SECRET_KEY)
                reply.code(401).send({token})
            }
        } catch (error) {
            console.log(error);
        }
    });
    fastify.get('/by-month/:month', async (req: FastifyRequest<{
        Params:{
            month:string
        }
    }>, reply: FastifyReply) => {
        try {
            let cookie = req.headers.cookie?.split(";").find((item)=>item.split("=")[0] == "jwt_token")?.split("=")[1];
            if(cookie && cookie.length > 0){
                let user = await prisma.user.findUnique({
                    where:{
                        email:verify(cookie,process.env.SECRET_KEY).email
                    }
                })
                if(user){
                    if(req.params.month){
                        let tasks = await prisma.task.findMany({
                            where:{
                                userId:user.id,
                                dueDate:new Date(req.params.month).getMonth().toString()
                            },
                            select:{
                                ...taskObject
                            },
                        })
                        let token = sign({tasks},process.env.SECRET_KEY);
                        reply.send({token})
                    }else{
                        let tasks = await prisma.task.findMany({
                            where:{
                                userId:user.id,
                                dueDate:new Date(Date.now()).getMonth().toString()
                            },
                            select:{
                                ...taskObject
                            },
                        })
                        let token = sign({tasks},process.env.SECRET_KEY);
                        reply.send({token})
                    }
                }else{
                    let token = sign({message:"OOPS !! you're not authorized ,Please login or register"},process.env.SECRET_KEY)
                    reply.code(401).send({token})
                }
            }else{
                let token = sign({message:"OOPS !! invalid credentials ,Please login or register"},process.env.SECRET_KEY)
                reply.code(401).send({token})
            }
        } catch (error) {
            console.log(error);
        }
    });
    fastify.get('/:start/:end', async (req: FastifyRequest<{
        Params:{
            start:string,
            end:string
        }
    }>, reply: FastifyReply) => {
        try {
            let cookie = req.headers.cookie?.split(";").find((item)=>item.split("=")[0] == "jwt_token")?.split("=")[1];
            if(cookie && cookie.length > 0){
                let user = await prisma.user.findUnique({
                    where:{
                        email:verify(cookie,process.env.SECRET_KEY).email
                    }
                })
                if(user){
                    if(req.params.start){
                        let tasks = await prisma.task.findMany({
                            where:{
                                userId:user.id,
                                startingDate:new Date(req.params.start).toString()
                            },
                            select:{
                                ...taskObject
                            },
                        })
                        let token = sign({tasks},process.env.SECRET_KEY);
                        reply.send({token})
                    }
                    if(req.params.end){
                        let tasks = await prisma.task.findMany({
                            where:{
                                userId:user.id,
                                dueDate:new Date(req.params.end).toString()
                            },
                            select:{
                                ...taskObject
                            },
                        })
                        let token = sign({tasks},process.env.SECRET_KEY);
                        reply.send({token})
                    }
                    if(req.params.start && req.params.end){
                        let tasks = await prisma.task.findMany({
                            where:{
                                userId:user.id,
                                startingDate:new Date(req.params.start).toString(),
                                dueDate:new Date(req.params.end).toString()
                            },
                            select:{
                                ...taskObject
                            },
                        })
                        let token = sign({tasks},process.env.SECRET_KEY);
                        reply.send({token})
                    }
                }else{
                    let token = sign({message:"OOPS !! you're not authorized ,Please login or register"},process.env.SECRET_KEY)
                    reply.code(401).send({token})
                }
            }else{
                let token = sign({message:"OOPS !! invalid credentials ,Please login or register"},process.env.SECRET_KEY)
                reply.code(401).send({token})
            }
        } catch (error) {
            console.log(error);
        }
    });
    fastify.get('/by-year/:year', async (req: FastifyRequest<{
        Params:{
            year:string
        }
    }>, reply: FastifyReply) => {
        try {
            let cookie = req.headers.cookie?.split(";").find((item)=>item.split("=")[0] == "jwt_token")?.split("=")[1];
            if(cookie && cookie.length > 0){
                let user = await prisma.user.findUnique({
                    where:{
                        email:verify(cookie,process.env.SECRET_KEY).email
                    }
                })
                if(user){
                    if(req.params.year){
                        let tasks = await prisma.task.findMany({
                            where:{
                                userId:user.id,
                                dueDate:new Date(req.params.year).getFullYear().toString()
                            },
                            select:{
                                ...taskObject
                            },
                        })
                        let token = sign({tasks},process.env.SECRET_KEY);
                        reply.send({token})
                    }else{
                        let tasks = await prisma.task.findMany({
                            where:{
                                userId:user.id,
                                dueDate:new Date(Date.now()).getFullYear().toString()
                            },
                            select:{
                                ...taskObject
                            },
                        })
                        let token = sign({tasks},process.env.SECRET_KEY);
                        reply.send({token})
                    }
                }else{
                    let token = sign({message:"OOPS !! you're not authorized ,Please login or register"},process.env.SECRET_KEY)
                    reply.code(401).send({token})
                }
            }else{
                let token = sign({message:"OOPS !! invalid credentials ,Please login or register"},process.env.SECRET_KEY)
                reply.code(401).send({token})
            }
        } catch (error) {
            console.log(error);
        }
    });
    fastify.get('/deleted', async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            let cookie = req.headers.cookie?.split(";").find((item)=>item.split("=")[0] == "jwt_token")?.split("=")[1];
            if(cookie && cookie.length > 0){
                let user = await prisma.user.findUnique({
                    where:{
                        email:verify(cookie,process.env.SECRET_KEY).email
                    }
                })
                if(user){
                    let tasks = await prisma.task.findMany({
                        where:{
                            userId:user.id,
                            isDeleted:true
                        }
                    })
                    let token = sign({tasks},process.env.SECRET_KEY);
                    reply.send({token})
                }else{
                    let token = sign({message:"OOPS !! you're not authorized ,Please login or register"},process.env.SECRET_KEY)
                    reply.code(401).send({token})
                }
            }else{
                let token = sign({message:"OOPS !! invalid credentials ,Please login or register"},process.env.SECRET_KEY)
                reply.code(401).send({token})
            }
        } catch (error) {
            console.log(error);
        }
    });
    fastify.get('/cancelled/:p', async (req: FastifyRequest<{
        Params:{
            p:string
        }
    }>, reply: FastifyReply) => {
        try {
            let cookie = req.headers.cookie?.split(";").find((item)=>item.split("=")[0] == "jwt_token")?.split("=")[1];
            if(cookie && cookie.length > 0){
                let user = await prisma.user.findUnique({
                    where:{
                        email:verify(cookie,process.env.SECRET_KEY).email
                    }
                })
                if(user){
                    if(Number(req.params.p)){
                        let tasks = await prisma.task.findMany({
                            where:{
                                userId:user.id,
                                isCancelled:true
                            },
                            select:{
                                ...taskObject
                            },
                            skip:(Number(req.params.p) - 1)*10,
                            take:10
                        })
                        let token = sign({tasks},process.env.SECRET_KEY);
                        reply.send({token})
                    }else{
                        let tasks = await prisma.task.findMany({
                            where:{
                                userId:user.id,
                                isCancelled:true
                            },
                            select:{
                                ...taskObject
                            },
                        })
                        let token = sign({tasks},process.env.SECRET_KEY);
                        reply.send({token})
                    }
                }else{
                    let token = sign({message:"OOPS !! you're not authorized ,Please login or register"},process.env.SECRET_KEY)
                    reply.code(401).send({token})
                }
            }else{
                let token = sign({message:"OOPS !! invalid credentials ,Please login or register"},process.env.SECRET_KEY)
                reply.code(401).send({token})
            }
        } catch (error) {
            console.log(error);
        }
    });
    fastify.get('/overdue', async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            let cookie = req.headers.cookie?.split(";").find((item)=>item.split("=")[0] == "jwt_token")?.split("=")[1];
            if(cookie && cookie.length > 0){
                let user = await prisma.user.findUnique({
                    where:{
                        email:verify(cookie,process.env.SECRET_KEY).email
                    }
                })
                if(user){
                    let tasks = await prisma.task.findMany({
                        where:{
                            userId:user.id,
                            dueDate:{
                                lte:new Date()
                            }
                        },
                        select:{
                            ...taskObject
                        },
                    })
                    let token = sign({tasks},process.env.SECRET_KEY);
                    reply.send({token})
                }else{
                    let token = sign({message:"OOPS !! you're not authorized ,Please login or register"},process.env.SECRET_KEY)
                    reply.code(401).send({token})
                }
            }else{
                let token = sign({message:"OOPS !! invalid credentials ,Please login or register"},process.env.SECRET_KEY)
                reply.code(401).send({token})
            }
        } catch (error) {
            console.log(error);
        }
    });
    fastify.get('/active', async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            let cookie = req.headers.cookie?.split(";").find((item)=>item.split("=")[0] == "jwt_token")?.split("=")[1];
            if(cookie && cookie.length > 0){
                let user = await prisma.user.findUnique({
                    where:{
                        email:verify(cookie,process.env.SECRET_KEY).email
                    }
                })
                if(user){
                    let tasks = await prisma.task.findMany({
                        where:{
                            userId:user.id,
                            startingDate:{
                                lte:new Date().toString()
                            },
                            dueDate:{
                                gte:new Date().toString()
                            },
                            isDeleted:false,
                            isCancelled:false,
                        },
                        select:{
                            ...taskObject
                        },
                    })
                    let token = sign({tasks},process.env.SECRET_KEY);
                    reply.send({token})
                }else{
                    let token = sign({message:"OOPS !! you're not authorized ,Please login or register"},process.env.SECRET_KEY)
                    reply.code(401).send({token})
                }
            }else{
                let token = sign({message:"OOPS !! invalid credentials ,Please login or register"},process.env.SECRET_KEY)
                reply.code(401).send({token})
            }
        } catch (error) {
            console.log(error);
        }
    });
    fastify.get('/:id', async (req: FastifyRequest<{
        Params:{
            id:string
        }
    }>, reply: FastifyReply) => {
        try {
            let cookie = req.headers.cookie?.split(";").find((item)=>item.split("=")[0] == "jwt_token")?.split("=")[1];
            if(cookie && cookie.length > 0){
                let user = await prisma.user.findUnique({
                    where:{
                        email:verify(cookie,process.env.SECRET_KEY).email
                    }
                })
                if(user){
                    let task = await prisma.task.findUnique({
                        where:{
                            userId:user?.id,
                            id:req.params.id
                        },
                        select:{
                            ...taskObject
                        },
                    })
                    let token = sign({task},process.env.SECRET_KEY);
                    reply.send({token})
                }else{
                    let token = sign({
                        task_exists:"Error",
                        description:"You're not authorized to access this resource"
                    },process.env.SECRET_KEY);
                    reply.send({token})
                }
            }else{
                let token = sign({
                        task_exists:"Error",
                        description:"You're not authorized to access this resource"
                    },process.env.SECRET_KEY);
                reply.send({token})
            }
        } catch (error) {
            console.log(error);
        }
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
                        },
                        select:{
                            ...taskObject
                        },
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
                    let {title,description,status,dueDate,content,thumbnail,coverImage,startingDate} = verify(req.body.body,process.env.SECRET_KEY);
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
                            binId:user.id
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
    fastify.put("/update",async(req: FastifyRequest<{
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
                    let {id,title,description,thumbnail,coverImage,status,dueDate,content,deletedBy} = verify(req.body.body,process.env.SECRET_KEY);
                    let foundTask = await prisma.task.findUnique({
                        where:{
                            id,
                            userId:user.id,
                        }
                    })
                    if(foundTask){
                        await prisma.task.update({
                            where:{
                                id:foundTask.id,
                            },
                            data:{
                                userId:user.id,
                                title,
                                description,
                                thumbnail,
                                coverImage,
                                status,
                                dueDate,
                                content,
                                deletedBy,
                            }
                        })
                        let token = sign({task:foundTask},process.env.SECRET_KEY);
                        reply.code(200).send({token})
                    }else{
                        let token = sign({
                            error:"OOPS!! you can't update this task",
                            description:"you are not the owner or admin of this task"
                        },process.env.SECRET_KEY);
                        reply.code(403).send({token})
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
    fastify.post("/save",async(req: FastifyRequest<{
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
                    let {content} = verify(req.body,user,process.env.SECRET_KEY);
                    let template = await prisma.user.update({
                        where:{
                            id:user.id
                        },
                        data:{
                            savedTemplates:{
                                push:content
                            }
                        }
                    })
                    let token = sign({
                        message:"saved",
                        description:"the template has been successfully saved to your personal workspace"
                    },process.env.SECRET_KEY);
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
    fastify.put("/cancel",async(req: FastifyRequest<{
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
                    let task = await prisma.task.findUnique({
                        where:{
                            id:verify(req.body.body,process.env.SECRET_KEY).id,
                            userId:user.id
                        }
                    })
                    if(task){
                        let {isCancelled} = verify(req.body.body,process.env.SECRET_KEY);
                        await prisma.task.update({
                            where:{
                                id:task.id
                            },
                            data:{
                                isCancelled:JSON.parse(isCancelled),
                            }
                        })
                        let token = sign({task},process.env.SECRET_KEY);
                        reply.code(200).send({token});
                    }else{
                        let token = sign({
                            error:"OOPS!! task not found",
                            description:"you are not the owner of this task"
                        },process.env.SECRET_KEY);
                        reply.code(404).send({token})
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
    fastify.delete("/delete/:id",async(req: FastifyRequest<{
        Params:{
            id:string
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
                    if(req.params.id && req.params.id.length > 0){
                        let {id} = verify(req.params.id,process.env.SECRET_KEY);
                        let foundTask = await prisma.task.findUnique({
                            where:{
                                id,
                                userId:user.id
                            }
                        })
                        if(foundTask){
                        await prisma.user.update({
                            where:{
                                id:user.id
                            },
                            data:{
                                tasks:{
                                    delete:{
                                        id:foundTask.id
                                    }
                                }
                            }
                        })
                        let token = sign({message:"task deleted successfully!! you can see it in your bin or recover whenever you want"},process.env.SECRET_KEY);
                        reply.code(200).send({token});
                    }
                    }else{
                        let token = sign({
                            error:"OOPS!! you can't delete this task",
                            description:"you are not the owner or admin of this task"
                        },process.env.SECRET_KEY);
                        reply.code(403).send({token})
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
    fastify.put("/recover",async(req: FastifyRequest<{
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
                    let {id} = verify(req.body.body,process.env.SECRET_KEY);
                    let foundTask = await prisma.task.findUnique({
                        where:{
                            id,
                            userId:user.id
                        }
                    })
                    if(foundTask){
                        let bin = await prisma.bin.findUnique({
                            where:{
                                userId:user.id
                            }
                        });
                        if(bin){
                            await prisma.bin.update({
                                where:{
                                    userId:user.id
                                },
                                data:{
                                    tasks:{
                                        delete:{
                                            ...foundTask
                                        }
                                    }
                                }
                            })
                            await prisma.task.update({
                                where:{
                                    id:foundTask.id
                                },
                                data:{
                                    isDeleted:false
                                }
                            })
                        }
                        let token = sign({message:"task recovered successfully!! you can see it in your tasks again"},process.env.SECRET_KEY);
                        reply.code(200).send({token});
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
    fastify.put("/permanently-delete",async(req: FastifyRequest<{
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
                    let {id} = verify(req.body.body,process.env.SECRET_KEY);
                    let foundTask = await prisma.task.findUnique({
                        where:{
                            id,
                            userId:user.id
                        }
                    })
                    if(foundTask){
                        await prisma.task.delete({
                            where:{
                                id:foundTask.id
                            }
                        })
                        let token = sign({message:"Task permanently deleted"},process.env.SECRET_KEY);
                        reply.code(200).send({token});
                    }else{
                        let token = sign({
                            error:"OOPS!! task not found",
                            description:"you are not the owner of this task"
                        },process.env.SECRET_KEY);
                        reply.code(404).send({token})
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
}
export default taskRouter