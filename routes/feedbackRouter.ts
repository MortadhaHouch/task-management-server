import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { PrismaClient } from '@prisma/client';
import { verify } from "jsonwebtoken";
require("dotenv").config();

const prisma = new PrismaClient();

export default function feedbackRouter(fastify: FastifyInstance, options: object, done: Function) {
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

    // Get all feedbacks with pagination
    fastify.get("/", async (req: FastifyRequest<{
        Querystring: { p?: number }
    }>, reply: FastifyReply) => {
        try {
            const page = req.query.p || 1;
            const skip = (page - 1) * 10;
            
            const [feedbacks, total] = await Promise.all([
                prisma.feedback.findMany({
                    include: {
                        author: {
                            select: {
                                email: true,
                                firstName: true,
                                lastName: true,
                                avatar: true,
                                isLoggedIn: true,
                                birthday: true,
                            }
                        },
                        _count: {
                            select: { comments: true }
                        }
                    },
                    skip,
                    take: 10,
                    orderBy: { createdAt: 'desc' }
                }),
                prisma.feedback.count()
            ]);

            return reply.code(200).send({
                feedbacks: feedbacks.map(f => ({
                    ...f,
                    commentsCount: f.likes
                })),
                totalPages: Math.ceil(total / 10),
                currentPage: page
            });
        } catch (error) {
            console.error("Error fetching feedbacks:", error);
            return reply.code(500).send({ 
                error: "Internal server error",
                message: "Failed to fetch feedbacks" 
            });
        }
    });

    // Get single feedback by ID
    fastify.get("/:id", async (req: FastifyRequest<{
        Params: { id: string }
    }>, reply: FastifyReply) => {
        try {
            const feedback = await prisma.feedback.findUnique({
                where: { id: req.params.id },
                include: {
                    author: {
                        select: {
                            email: true,
                            firstName: true,
                            lastName: true,
                            avatar: true,
                            isLoggedIn: true,
                            birthday: true,
                        }
                    },
                    _count: {
                        select: { comments: true }
                    }
                }
            });

            if (!feedback) {
                return reply.code(404).send({ 
                    error: "Not found",
                    message: "Feedback not found" 
                });
            }

            return reply.code(200).send({
                feedback: {
                    ...feedback,
                    commentsCount: feedback._count.comments
                }
            });
        } catch (error) {
            console.error("Error fetching feedback:", error);
            return reply.code(500).send({ 
                error: "Internal server error",
                message: "Failed to fetch feedback" 
            });
        }
    });

    // Get current user's feedbacks
    fastify.get("/mine/:p?", async (req: FastifyRequest<{
        Querystring: { p?: number }
    }>, reply: FastifyReply) => {
        try {
            const user = await verifyUser(req.cookies.jwt_token as string);
            if (!user) {
                return reply.code(401).send({ 
                    error: "Unauthorized",
                    message: "Please login to access your feedbacks" 
                });
            }

            const page = req.query.p || 1;
            const skip = (page - 1) * 10;

            const [feedbacks, total] = await Promise.all([
                prisma.feedback.findMany({
                    where: { authorId: user.id },
                    include: {
                        author: {
                            select: {
                                email: true,
                                firstName: true,
                                lastName: true,
                                avatar: true,
                                isLoggedIn: true,
                                birthday: true,
                            }
                        },
                        _count: {
                            select: { comments: true }
                        }
                    },
                    skip,
                    take: 10,
                    orderBy: [{
                        createdAt: 'desc'
                    }]
                }),
                prisma.feedback.count({ where: { authorId: user.id } })
            ]);

            return reply.code(200).send({
                feedbacks: feedbacks.map(f => ({
                    ...f,
                    commentsCount: f.likes
                })),
                totalPages: Math.ceil(total / 10),
                currentPage: page
            });
        } catch (error) {
            console.error("Error fetching user feedbacks:", error);
            return reply.code(500).send({ 
                error: "Internal server error",
                message: "Failed to fetch your feedbacks" 
            });
        }
    });
    fastify.post("/create", async (req: FastifyRequest<{
        Body: { content: string }
    }>, reply: FastifyReply) => {
        try {
            const user = await verifyUser(req.cookies.jwt_token as string);
            if (!user) {
                return reply.code(401).send({ 
                    error: "Unauthorized",
                    message: "Please login to create feedback" 
                });
            }

            const { content } = req.body;
            if (!content || content.trim().length === 0) {
                return reply.code(400).send({ 
                    error: "Bad request",
                    message: "Feedback content cannot be empty" 
                });
            }

            const feedback = await prisma.feedback.create({
                data: {
                    content,
                    authorId: user.id,
                },
            });

            return reply.code(201).send({ feedback });
        } catch (error) {
            console.error("Error creating feedback:", error);
            return reply.code(500).send({ 
                error: "Internal server error",
                message: "Failed to create feedback" 
            });
        }
    });

    // Like a feedback
    fastify.put("/like", async (req: FastifyRequest<{
        Body: { feedbackId: string }
    }>, reply: FastifyReply) => {
        try {
            const user = await verifyUser(req.cookies.jwt_token as string);
            if (!user) {
                return reply.code(401).send({ 
                    error: "Unauthorized",
                    message: "Please login to like feedback" 
                });
            }

            const { feedbackId } = req.body;
            const feedback = await prisma.feedback.findUnique({
                where: { id: feedbackId },
                include: { 
                    likers: { where: { id: user.id } },
                    dislikers: { where: { id: user.id } }
                }
            });

            if (!feedback) {
                return reply.code(404).send({ 
                    error: "Not found",
                    message: "Feedback not found" 
                });
            }

            let updateData: any = {};
            
            if (feedback.likers.length > 0) {
                // User already liked - remove like
                updateData = {
                    likers: { disconnect: { id: user.id } },
                    likes: { decrement: 1 }
                };
            } else if (feedback.dislikers.length > 0) {
                // User disliked - switch to like
                updateData = {
                    dislikers: { disconnect: { id: user.id } },
                    likers: { connect: { id: user.id } },
                    dislikes: { decrement: 1 },
                    likes: { increment: 1 }
                };
            } else {
                // User hasn't reacted - add like
                updateData = {
                    likers: { connect: { id: user.id } },
                    likes: { increment: 1 }
                };
            }

            const updatedFeedback = await prisma.feedback.update({
                where: { id: feedbackId },
                data: updateData
            });

            return reply.code(200).send({ 
                likes: updatedFeedback.likes,
                dislikes: updatedFeedback.dislikes
            });
        } catch (error) {
            console.error("Error liking feedback:", error);
            return reply.code(500).send({ 
                error: "Internal server error",
                message: "Failed to process like" 
            });
        }
    });

    // Dislike a feedback
    fastify.put("/dislike", async (req: FastifyRequest<{
        Body: { feedbackId: string }
    }>, reply: FastifyReply) => {
        try {
            const user = await verifyUser(req.cookies.jwt_token as string);
            if (!user) {
                return reply.code(401).send({ 
                    error: "Unauthorized",
                    message: "Please login to dislike feedback" 
                });
            }

            const { feedbackId } = req.body;
            const feedback = await prisma.feedback.findUnique({
                where: { id: feedbackId },
                include: { 
                    likers: { where: { id: user.id } },
                    dislikers: { where: { id: user.id } }
                }
            });

            if (!feedback) {
                return reply.code(404).send({ 
                    error: "Not found",
                    message: "Feedback not found" 
                });
            }

            let updateData: any = {};
            
            if (feedback.dislikers.length > 0) {
                // User already disliked - remove dislike
                updateData = {
                    dislikers: { disconnect: { id: user.id } },
                    dislikes: { decrement: 1 }
                };
            } else if (feedback.likers.length > 0) {
                // User liked - switch to dislike
                updateData = {
                    likers: { disconnect: { id: user.id } },
                    dislikers: { connect: { id: user.id } },
                    likes: { decrement: 1 },
                    dislikes: { increment: 1 }
                };
            } else {
                // User hasn't reacted - add dislike
                updateData = {
                    dislikers: { connect: { id: user.id } },
                    dislikes: { increment: 1 }
                };
            }

            const updatedFeedback = await prisma.feedback.update({
                where: { id: feedbackId },
                data: updateData
            });

            return reply.code(200).send({ 
                likes: updatedFeedback.likes,
                dislikes: updatedFeedback.dislikes
            });
        } catch (error) {
            console.error("Error disliking feedback:", error);
            return reply.code(500).send({ 
                error: "Internal server error",
                message: "Failed to process dislike" 
            });
        }
    });

    done();
}