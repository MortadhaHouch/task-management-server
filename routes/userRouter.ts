import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import {PrismaClient} from "@prisma/client";
import { LoginRequest, LogoutRequest, SignupRequest, User } from '../types/types';
let {sign,verify} = require("jsonwebtoken")
let {v4} = require("uuid")
let bcrypt = require("bcrypt");
let prisma = new PrismaClient();
prisma.$use(async (params, next) => {
	if (params.model === 'User' && params.action === 'create') {
		const user = params.args.data;
		// Hash password before saving to the database
		const salt = await bcrypt.genSalt(10);
		user.password = await bcrypt.hash(user.password, salt);
		params.args.data = user;
	}
	return next(params);
});
async function userRouter(fastify: FastifyInstance) {
	fastify.post("/login",async(req:FastifyRequest<{
		Body:{
			body:string
		},
	}>,reply:FastifyReply) =>{
		try {
			if(!req.headers?.cookie?.includes("jwt_token")){
				let userCredentials:LoginRequest = verify(req.body.body,process.env.SECRET_KEY??"");
				if(userCredentials){
					let foundUser = await prisma.user.findUnique({
						where:{
							email:userCredentials.email,
						}
					})
					if(foundUser){
						let isValidPassword = await bcrypt.compare(userCredentials.password,foundUser.password);
						await prisma.user.update({
							where:{
								email:foundUser.email
							},
							data:{
								isLoggedIn:true
							}
						})
						if(isValidPassword){
							let token = sign({
								email:foundUser.email,
								firstName:foundUser.firstName,
								lastName:foundUser.lastName,
								avatar:foundUser.avatar,
								birthday:foundUser.birthday,
								isLoggedIn:foundUser.isLoggedIn,
								password:userCredentials.password,
								isVerified:true
							},process.env.SECRET_KEY)
							reply.code(200).send({ token})
						}else{
							let token = sign({password_error:"please verify your password"},process.env.SECRET_KEY);
							reply.send({ token})
						}
					}else{
						let token = sign({credentials_message:"please verify your credentials"},process.env.SECRET_KEY);
						reply.code(400).send({token})
					}
				}else{
					let token = sign({credentials_message:"please verify your credentials"},process.env.SECRET_KEY);
					reply.code(400).send({token})
				}
			}else{
				let token = sign({error:"Error !! You are already logged In"},process.env.SECRET_KEY);
				reply.code(400).send({token})
			}
		} catch (error) {
			console.log(error);
		}
	})
	fastify.post("/signup",async(req:FastifyRequest<{
		Body:{
			body:string
		},
		cookies:{
			jwt_token:string
		}
	}>,reply:FastifyReply) =>{
		try {
			if(!req.headers?.cookie?.includes("jwt_token")){
				let userCredentials:SignupRequest = verify(req.body.body,process.env.SECRET_KEY??"");
				if(userCredentials){
					let user = await prisma.user.findUnique({
						where:{
							email:userCredentials.email
						}
					})
					if(user){
						let token = sign({email_error:"user with this email already exists"},process.env.SECRET_KEY);
						reply.send({token})
					}else{
						let createdUser = await prisma.user.create({
							data:{
								firstName:userCredentials.firstName,
								lastName:userCredentials.lastName,
								avatar:userCredentials.avatar,
								email:userCredentials.email,
								password:userCredentials.password,
								birthday:userCredentials.birthday,
								bin:{
									create:{
									}
								}
							}
						})
						await prisma.user.update({
							where:{
								email:createdUser.email
							},
							data:{
								isLoggedIn:true
							}
						})
						let token = sign({
							email:createdUser.email,
							firstName:createdUser.firstName,
							lastName:createdUser.lastName,
							avatar:createdUser.avatar,
							birthday:createdUser.birthday,
							isVerified:true
						},process.env.SECRET_KEY);
						reply.code(200).send({ token})
					}
				}else{
					let token = sign({message:"please verify your credentials"},process.env.SECRET_KEY);
					reply.code(400).send({token})
				}
			}else{
				let token = sign({message:"Error !! You are already logged In"},process.env.SECRET_KEY);
				reply.code(400).send({token})
			}
		} catch (error) {
			console.log(error);
		}
	})
	fastify.put("/logout",async(req:FastifyRequest<{
		Body:{
			body:string
		}
	}>,reply:FastifyReply)=>{
		try {
			if(req.body.body){
				let userCredentials:LogoutRequest = verify(req.body.body,process.env.SECRET_KEY??"");
				if(userCredentials){
					let foundUser = await prisma.user.findUnique({
						where:{
							email:userCredentials.email
						}
					})
					if(foundUser){
						await prisma.user.update({
							where:{
								email:foundUser.email
							},
							data:{
								isLoggedIn:false
							}
						})
						let token = sign({
							message:"logged out successfully",
							description:"You have been logged out successfully !! don't forget to visit us in the next time"
						},process.env.SECRET_KEY);
						reply.send({token});
					}else{
						let token = sign({
							error:"Please try again",
							description:"Your logout process has failed because of falsy credentials please try again"
						},process.env.SECRET_KEY);
						reply.send({token});
					}
				}else{
					let token = sign({error:"Please try again"},process.env.SECRET_KEY);
					reply.send({token});
				}
			}
		} catch (error) {
			console.log(error);
		}
	})
}

export default userRouter;
