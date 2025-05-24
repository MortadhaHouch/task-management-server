import { PrismaClient, TaskStatus } from '@prisma/client';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { sign, verify } from "jsonwebtoken";
import { Task } from '../types/types';

const prisma = new PrismaClient();
require("dotenv").config();

const taskObject = {
    id: true,
    title: true,
    description: true,
    status: true,
    createdAt: true,
    startingDate: true,
    dueDate: true,
    modifiedAt: true,
    isDeleted: true,
    isCancelled: true,
    coverImage: true,
    thumbnail: true
}

async function taskRouter(fastify: FastifyInstance, options: object) {
    // Helper function to verify user from cookie
    const verifyUser = async (cookie: string | undefined) => {
        if (!cookie) return null;

        try {
            const { email } = verify(cookie, process.env.SECRET_KEY as string) as { email: string };
            return await prisma.user.findUnique({ where: { email } });
        } catch {
            return null;
        }
    };
    const findTasksByStatus = async (owner:string, status: "day" | "week" | "month"|"year"|"overdue"|"cancelled") => {
        let fields = {
            title: true,
            isCancelled: true,
            isDeleted: true,
            status: true,
            dueDate: true,
            startingDate: true,
        }
        let tasks;
        switch (status) {
            case "day":
                tasks = await prisma.task.findMany({
                    where:{
                        userId:owner,
                        status:TaskStatus.PENDING,
                        dueDate: {
                            gte: new Date(),
                            lte: new Date(new Date().setDate(new Date().getDate() + 1))
                        }
                    },
                    select:fields
                }
            )
            case "week":
                tasks = await prisma.task.findMany({
                    where:{
                        userId:owner,
                        status:TaskStatus.PENDING,
                        dueDate: {
                            gte: new Date(),
                            lte: new Date(new Date().setDate(new Date().getDate() + 7))
                        }
                    },
                    select:fields
                })
            case "month":
                tasks = await prisma.task.findMany({
                    where:{
                        userId:owner,
                        status:TaskStatus.PENDING,
                        dueDate: {
                            gte: new Date(),
                            lte: new Date(new Date().setDate(new Date().getDate() + 30))
                        }
                    },
                    select:fields
                })
            case "year":
                tasks = await prisma.task.findMany({
                    where:{
                        userId:owner,
                        status:TaskStatus.PENDING,
                        dueDate: {
                            gte: new Date(),
                            lte: new Date(new Date().setDate(new Date().getDate() + 365))
                        }
                    },
                    select:fields
                })
            case "cancelled":
                tasks = await prisma.task.findMany({
                    where:{
                        userId:owner,
                        status:TaskStatus.CANCELLED,
                    },
                    select:fields
                })
            case "overdue":
                tasks = await prisma.task.findMany({
                    where:{
                        userId:owner,
                        dueDate: {
                            lte: new Date(),
                        }
                    },
                    select:fields
                })
        }
        return tasks
    }
    // Get all tasks with pagination
    fastify.get('/', async (req: FastifyRequest<{
        Querystring: { p?: string }
    }>, reply: FastifyReply) => {
        try {
            const user = await verifyUser(req.cookies.jwt_token as string);
            if (!user) {
                return reply.code(401).send({ 
                    error: "Unauthorized",
                    description: "Please login or register" 
                });
            }

            const page = req.query.p ? Number(req.query.p) : 0;
            if (isNaN(page)) {
                return reply.code(400).send({ error: "Invalid page number" });
            }

            const [tasks, totalTasks] = await Promise.all([
                prisma.task.findMany({
                    where: { userId: user.id },
                    select: taskObject,
                    skip: page * 10,
                    take: 10
                }),
                prisma.task.count({ where: { userId: user.id } })
            ]);

            return reply.send({
                tasks,
                pagesCount: Math.ceil(totalTasks / 10)
            });

        } catch (error) {
            console.error(error);
            return reply.code(500).send({ error: "Internal server error" });
        }
    });

    // Get tasks overview
    fastify.get('/overview', async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const user = await verifyUser(req.cookies.jwt_token as string);
            if (!user) {
                return reply.code(401).send({ 
                    error: "Unauthorized",
                    description: "Please login or register" 
                });
            }

            const tasks = await prisma.task.findMany({
                where: { userId: user.id },
                select: {
                    title: true,
                    isCancelled: true,
                    isDeleted: true,
                    status: true,
                    dueDate: true,
                    startingDate: true,
                }
            });

            const completedTasks = tasks.filter(task => task.status == TaskStatus.DONE);
            const cancelledTasks = tasks.filter(task => task.isCancelled);
            const overdueTasks = tasks.filter(task => 
                new Date(task.dueDate) < new Date() && task.status == TaskStatus.PENDING
            );
            const pendingTasks = tasks.filter(task => 
                new Date(task.dueDate) > new Date() && task.status == TaskStatus.PENDING
            );

            return reply.send({
                completedTasks,
                cancelledTasks,
                overdueTasks,
                pendingTasks
            });

        } catch (error) {
            console.error(error);
            return reply.code(500).send({ error: "Internal server error" });
        }
    });
    fastify.get('/deleted', async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const user = await verifyUser(req.cookies.jwt_token as string);
            if (!user) {
                return reply.code(401).send({ 
                    error: "Unauthorized",
                    description: "Please login or register" 
                });
            }

            const tasks = await prisma.task.findMany({
                where: { userId: user.id, isDeleted: true },
                select: {
                    ...taskObject,
                    isDeleted: true
                }
            });

            return reply.send({
                tasks
            })
        } catch (error) {
            console.log(error);
        }
    });
    fastify.get('/cancelled', async (req: FastifyRequest<{
        Params:{
            p:string
        }
    }>, reply: FastifyReply) => {
        try {
            const user = await verifyUser(req.cookies.jwt_token as string);
            if (!user) {
                return reply.code(401).send({ 
                    error: "Unauthorized",
                    description: "Please login or register" 
                });
            }

            const tasks = await prisma.task.findMany({
                where: { userId: user.id, isCancelled: true },
                select: {
                    ...taskObject,
                }
            });

            return reply.send({
                tasks
            })
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
            const user = await verifyUser(req.cookies.jwt_token as string);
            if (!user) {
                return reply.code(401).send({ 
                    error: "Unauthorized",
                    description: "Please login or register" 
                });
            }

            const tasks = await prisma.task.findMany({
                where: { userId: user.id, isCancelled: true },
                select: {
                    ...taskObject,
                },
                take: Number(req.params.p) || 10,
                skip: req.params.p? (Number(req.params.p) - 1) * 10:0
            });

            return reply.send({
                tasks
            })
        } catch (error) {
            console.log(error);
        }
    });
    fastify.get('/overdue', async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const user = await verifyUser(req.cookies.jwt_token as string);
            if (!user) {
                return reply.code(401).send({ 
                    error: "Unauthorized",
                    description: "Please login or register" 
                });
            }

            const tasks = await prisma.task.findMany({
                where: { userId: user.id, isDeleted: false,dueDate: { lte: new Date() } },
                select: {
                    ...taskObject,
                    isDeleted: true
                }
            });

            return reply.send({
                tasks
            })
        } catch (error) {
            console.log(error);
        }
    });
    fastify.get('/active', async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const user = await verifyUser(req.cookies.jwt_token as string);
            if (!user) {
                return reply.code(401).send({ 
                    error: "Unauthorized",
                    description: "Please login or register" 
                });
            }

            const tasks = await prisma.task.findMany({
                where: { userId: user.id, isDeleted: false,dueDate: { gte: new Date() } },
                select: {
                    ...taskObject,
                    isDeleted: true
                }
            });

            return reply.send({
                tasks
            })
        } catch (error) {
            console.log(error);
        }
    });
    fastify.get('/by-date/:query', async (req: FastifyRequest<{
        Params: { query: "day" | "week" | "month"|"year"|"overdue"|"cancelled" }
    }>, reply: FastifyReply) => {
        try {
            const user = await verifyUser(req.cookies.jwt_token as string);
            if (!user) {
                return reply.code(401).send({
                    error: "Unauthorized",
                    description: "Please login or register"
                })
            }
            let query = req.params.query;
            const tasks = await findTasksByStatus(user.id,query);
            return reply.send({ tasks });
        } catch (error) {
            console.error(error);
            return reply.code(500).send({ error: "Internal server error" });
        }
    });
    fastify.get('/:id', async (req: FastifyRequest<{
        Params: { id: string }
    }>, reply: FastifyReply) => {
        try {
            const user = await verifyUser(req.cookies.jwt_token as string);
            if (!user) {
                return reply.code(401).send({ 
                    error: "Unauthorized",
                    description: "Please login or register" 
                });
            }
            const task = await prisma.task.findUnique({
                where: {
                    userId: user.id,
                    id: req.params.id
                },
                select: taskObject
            });
            if (!task) {
                return reply.code(404).send({ error: "Task not found" });
            }
            return reply.send({ task });
        } catch (error) {
            console.error(error);
            return reply.code(500).send({ error: "Internal server error" });
        }
    });

    fastify.post("/validate",async(req: FastifyRequest<{
        Body:{
            name:string
        }
    }>, reply: FastifyReply) =>{
        try {
            const user = await verifyUser(req.cookies.jwt_token as string);
            if (!user) {
                return reply.code(401).send({ 
                    error: "Unauthorized",
                    description: "Please login or register" 
                });
            }
            let {name} = req.body as { name: string };
            if(user){
                let task = await prisma.task.findFirst({
                    where:{
                        title:name,
                        userId:user.id
                    },
                    select:{
                        ...taskObject
                    },
                })
                if(task){
                    return reply.send({
                        task_exists:"task existence",
                        description:"task with title already exists, please choose a different relevant title"
                    })
                }else{
                    return reply.code(200).send({
                        message:"task validated",
                        description:"task has been successfully admitted keep customizing it"
                    })
                }
            }else{
                return reply.code(403).send({
                    error:"OOPS!! you are not logged in",
                    description:"you are not logged in, please consider signing in or create an account"
                })
            }
        } catch (error) {
            console.log(error);
            return reply.code(500).send({ error: "Internal server error" });
        }
    })
    fastify.post("/create", async (req: FastifyRequest<{
        Body: Task
    }>, reply: FastifyReply) => {
        try {
            const user = await verifyUser(req.cookies.jwt_token as string);
            if (!user) {
                return reply.code(401).send({ 
                    error: "Unauthorized",
                    description: "Please login or register" 
                });
            }

            const bin = await prisma.bin.findUnique({
                where: { userId: user.id }
            });

            if (!bin) {
                return reply.code(404).send({ error: "User bin not found" });
            }

            const task = await prisma.task.create({
                data: {
                    title: req.body.title,
                    description: req.body.description,
                    content: req.body.content,
                    status: TaskStatus.PENDING,
                    startingDate: new Date(req.body.startingDate),
                    dueDate: new Date(req.body.dueDate),
                    userId: user.id,
                    binId: bin.id,
                    ...(req.body.thumbnail && { thumbnail: req.body.thumbnail }),
                    ...(req.body.coverImage && { coverImage: req.body.coverImage }),
                    cancelledBy: user.id,
                    deletedBy: user.id,
                }
            });

            return reply.code(201).send({
                task,
                message: "Task created successfully"
            });

        } catch (error) {
            console.error(error);
            return reply.code(500).send({ error: "Internal server error" });
        }
    });

    // Update task
    fastify.put("/update", async (req: FastifyRequest<{
        Body: { tasks: Task[] }
    }>, reply: FastifyReply) => {
        try {
            const user = await verifyUser(req.cookies.jwt_token as string);
            if (!user) {
                return reply.code(401).send({ 
                    error: "Unauthorized",
                    description: "Please login or register" 
                });
            }

            const { tasks } = req.body;
            const updatedTasks = [];

            for (const taskData of tasks) {
                const task = await prisma.task.update({
                    where: {
                        id: taskData.id,
                        userId: user.id
                    },
                    data: {
                        title: taskData.title,
                        description: taskData.description,
                        status: taskData.status || TaskStatus.PENDING,
                        dueDate: taskData.dueDate,
                        startingDate: taskData.startingDate,
                        isCancelled: taskData.isCancelled,
                        isDeleted: taskData.isDeleted,
                        thumbnail: taskData.thumbnail,
                        coverImage: taskData.coverImage
                    }
                });
                updatedTasks.push(task);
            }

            return reply.send({
                message: "Tasks updated successfully",
                tasks: updatedTasks
            });

        } catch (error) {
            console.error(error);
            return reply.code(500).send({ error: "Internal server error" });
        }
    });

    // Delete task (soft delete)
    fastify.delete("/delete/:id", async (req: FastifyRequest<{
        Params: { id: string }
    }>, reply: FastifyReply) => {
        try {
            const user = await verifyUser(req.cookies.jwt_token as string);
            if (!user) {
                return reply.code(401).send({ 
                    error: "Unauthorized",
                    description: "Please login or register" 
                });
            }

            const task = await prisma.task.update({
                where: {
                    id: req.params.id,
                    userId: user.id
                },
                data: {
                    isDeleted: true
                }
            });

            return reply.send({ 
                message: "Task moved to bin successfully"
            });

        } catch (error) {
            console.error(error);
            return reply.code(500).send({ error: "Internal server error" });
        }
    });

    // Recover task from bin
    fastify.put("/recover", async (req: FastifyRequest<{
        Body: { id: string }
    }>, reply: FastifyReply) => {
        try {
            const user = await verifyUser(req.cookies.jwt_token as string);
            if (!user) {
                return reply.code(401).send({ 
                    error: "Unauthorized",
                    description: "Please login or register" 
                });
            }

            const { id } = req.body;
            await prisma.task.update({
                where: {
                    id,
                    userId: user.id
                },
                data: {
                    isDeleted: false
                }
            });

            return reply.send({ 
                message: "Task recovered successfully" 
            });

        } catch (error) {
            console.error(error);
            return reply.code(500).send({ error: "Internal server error" });
        }
    });

    // Permanently delete task
    fastify.delete("/permanently-delete", async (req: FastifyRequest<{
        Body: { id: string }
    }>, reply: FastifyReply) => {
        try {
            const user = await verifyUser(req.cookies.jwt_token as string);
            if (!user) {
                return reply.code(401).send({ 
                    error: "Unauthorized",
                    description: "Please login or register" 
                });
            }

            const { id } = req.body;
            await prisma.task.delete({
                where: {
                    id,
                    userId: user.id
                }
            });

            return reply.send({ 
                message: "Task permanently deleted" 
            });

        } catch (error) {
            console.error(error);
            return reply.code(500).send({ error: "Internal server error" });
        }
    });
}

export default taskRouter;