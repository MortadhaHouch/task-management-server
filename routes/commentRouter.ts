import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { verify } from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
require("dotenv").config();

const prisma = new PrismaClient();

export function commentRouter(fastify: FastifyInstance, options: object, done: Function) {
    const verifyUser = async (cookie: string | undefined) => {
        if (!cookie) return null;
        try {
            const { email } = verify(cookie, process.env.SECRET_KEY as string) as { email: string };
            return await prisma.user.findUnique({ where: { email } });
        } catch {
            return null;
        }
    };

    fastify.get("/:id/:p?", async (req: FastifyRequest<{ Params: { id: string, p?: string } }>, reply: FastifyReply) => {
        try {
            const { id, p } = req.params;
            const page = Number(p) || 1;
            const take = 10;
            const skip = (page - 1) * take;

            const totalComments = await prisma.comment.count({ where: { feedbackId: id } });
            const comments = await prisma.comment.findMany({
                where: { feedbackId: id },
                select: {
                    id: true,
                    content: true,
                    createdAt: true,
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true,
                            avatar: true,
                        }
                    }
                },
                take,
                skip,
                orderBy: { createdAt: 'desc' }
            });

            reply.code(200).send({
                comments,
                totalPages: Math.ceil(totalComments / take),
                currentPage: page
            });
        } catch (error) {
            console.error(error);
            reply.code(500).send({ error: "Failed to fetch comments" });
        }
    });

    fastify.post("/create", async (req: FastifyRequest<{ Body: { content: string, feedbackId: string } }>, reply: FastifyReply) => {
        try {
            const user = await verifyUser(req.cookies.jwt_token);
            if (!user) return reply.code(401).send({ error: "Unauthorized" });

            const { content, feedbackId } = req.body;
            const comment = await prisma.comment.create({
                data: {
                    userId: user.id,
                    content,
                    feedbackId
                }
            });

            reply.code(201).send({ comment });
        } catch (error) {
            console.error(error);
            reply.code(500).send({ error: "Failed to create comment" });
        }
    });

    // Edit a comment
    fastify.put("/edit", async (req: FastifyRequest<{ Body: { content: string, id: string } }>, reply: FastifyReply) => {
        try {
            const user = await verifyUser(req.cookies.jwt_token);
            if (!user) return reply.code(401).send({ error: "Unauthorized" });

            const { content, id } = req.body;

            // Optional: ensure the user owns the comment before editing
            const existingComment = await prisma.comment.findUnique({ where: { id } });
            if (!existingComment || existingComment.userId !== user.id) {
                return reply.code(403).send({ error: "Forbidden: You can only edit your own comments" });
            }

            const updatedComment = await prisma.comment.update({
                where: { id },
                data: { content }
            });

            reply.code(200).send({ comment: updatedComment });
        } catch (error) {
            console.error(error);
            reply.code(500).send({ error: "Failed to edit comment" });
        }
    });

    // Delete a comment
    fastify.delete("/delete/:id", async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        try {
            const user = await verifyUser(req.cookies.jwt_token);
            if (!user) return reply.code(401).send({ error: "Unauthorized" });

            const { id } = req.params;

            const existingComment = await prisma.comment.findUnique({ where: { id } });
            if (!existingComment || existingComment.userId !== user.id) {
                return reply.code(403).send({ error: "Forbidden: You can only delete your own comments" });
            }

            await prisma.comment.delete({ where: { id } });

            reply.code(200).send({ message: "Comment deleted successfully" });
        } catch (error) {
            console.error(error);
            reply.code(500).send({ error: "Failed to delete comment" });
        }
    });

    done();
}
