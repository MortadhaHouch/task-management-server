import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient } from "@prisma/client";
import { LoginRequest, LogoutRequest, SignupRequest } from '../types/types';
import { sign, verify } from "jsonwebtoken";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// Middleware to hash passwords before saving
prisma.$use(async (params, next) => {
    if (params.model === 'User' && params.action === 'create') {
        const user = params.args.data;
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
        params.args.data = user;
    }
    return next(params);
});

async function userRouter(fastify: FastifyInstance) {
    fastify.post("/login", async (req: FastifyRequest<{
        Body: LoginRequest
    }>, reply: FastifyReply) => {
        try {
            if (req.headers?.cookie?.includes("jwt_token")) {
                return reply.code(400).send({ 
                    error: "You are already logged in" 
                });
            }

            const { email, password } = req.body;

            const foundUser = await prisma.user.findUnique({
                where: { email }
            });

            if (!foundUser) {
                return reply.code(400).send({ 
                    error: "Invalid credentials" 
                });
            }

            const isValidPassword = await bcrypt.compare(password, foundUser.password);

            if (!isValidPassword) {
                return reply.code(400).send({ 
                    error: "Invalid password" 
                });
            }

            await prisma.user.update({
                where: { email: foundUser.email },
                data: { isLoggedIn: true }
            });

            const token = sign({
                email: foundUser.email,
                firstName: foundUser.firstName,
                lastName: foundUser.lastName,
                birthday: foundUser.birthday,
                isLoggedIn: true
            }, process.env.SECRET_KEY as string);

            return reply.code(200).send({ 
                token,
                isVerified:true,
                data:{
                    email: foundUser.email,
                    firstName: foundUser.firstName,
                    lastName: foundUser.lastName,
                    avatar: foundUser.avatar,
                    birthday: foundUser.birthday
                }
            });

        } catch (error) {
            console.error(error);
            return reply.code(500).send({ 
                error: "Internal server error" 
            });
        }
    });

    fastify.post("/signup", async (req: FastifyRequest<{
        Body: SignupRequest
    }>, reply: FastifyReply) => {
        try {
            if (req.headers?.cookie?.includes("jwt_token")) {
                return reply.code(400).send({ 
                    error: "You are already logged in" 
                });
            }

            const { email } = req.body;

            const existingUser = await prisma.user.findUnique({
                where: { email }
            });

            if (existingUser) {
                return reply.code(400).send({ 
                    error: "User with this email already exists" 
                });
            }

            const createdUser = await prisma.user.create({
                data: {
                    ...req.body,
                    isLoggedIn: true,
                    bin: { create: {} }
                }
            });

            const token = sign({
                email: createdUser.email,
                firstName: createdUser.firstName,
                lastName: createdUser.lastName,
                birthday: createdUser.birthday,
                isLoggedIn: true
            }, process.env.SECRET_KEY as string);

            return reply.code(200).send({ 
                token,
                isVerified:true,
                data:{
                    email: createdUser.email,
                    firstName: createdUser.firstName,
                    lastName: createdUser.lastName,
                    avatar: createdUser.avatar,
                    birthday: createdUser.birthday
                }
            });

        } catch (error) {
            console.error(error);
            return reply.code(500).send({ 
                error: "Internal server error" 
            });
        }
    });

    fastify.put("/logout", async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const { email } = verify(req.headers.cookie as string, process.env.SECRET_KEY as string) as { email: string };

            const foundUser = await prisma.user.findUnique({
                where: { email }
            });

            if (!foundUser) {
                return reply.code(400).send({ 
                    error: "User not found" 
                });
            }

            await prisma.user.update({
                where: { email },
                data: { isLoggedIn: false }
            });

            return reply.send({ 
                message: "Logged out successfully" 
            });

        } catch (error) {
            console.error(error);
            return reply.code(500).send({ 
                error: "Internal server error" 
            });
        }
    });
}

export default userRouter;