import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import {PrismaClient} from "@prisma/client";
import { User } from '../types/types';
import { log } from 'console';
let prisma = new PrismaClient();
async function userRouter(fastify: FastifyInstance) {
	fastify.get("/",async(req:FastifyRequest,reply:FastifyReply) =>{
		let users = await prisma.user.findMany({});
		reply.send({users})
	})
	fastify.get("/:id",async(req:FastifyRequest<{
		Params:{
			id:string
		}
	}>,reply:FastifyReply) =>{
		let users = await prisma.user.findMany({
			where:{
                id:req.params.id,
            }
		});
		reply.send({users})
	})
	fastify.post("/create-user",async(req:FastifyRequest<{
		Body:{
			avatar:string
			birthday:string
			id:string
			name:string
			email:string
			age:number
			password:string
		}
	}>,reply:FastifyReply) =>{
		let user = await prisma.user.create({
			data:{
				avatar:req.body.avatar,
				birthday:req.body.birthday,
				id:req.body.id,
				name:req.body.name,
				email:req.body.email,
				age:req.body.age,
				password:req.body.password,
			}
		})
		reply.status(201).send({user})
	})
	fastify.put("/update-user",async(req:FastifyRequest<{
		Body:{
			id:string
			data:{
				avatar:string,
				birthday:string,
				name:string,
				email:string,
				age:number,
				password:string,
			}
		}
	}>,reply:FastifyReply) =>{
		try {
			let foundUser = await prisma.user.findUnique({
				where:{
					id:req.body.id,
				}
			})
			if(!foundUser){
                reply.code(404).send({message:"user not found"})
                return
            }else{
				let user = await prisma.user.update({
					where:{
						id:req.body.id,
					},
					data:{
						avatar:req.body.data.avatar,
						birthday:req.body.data.birthday,
						name:req.body.data.name,
						email:req.body.data.email,
						age:req.body.data.age,
						password:req.body.data.avatar,
					}
				})
				reply.code(200).send(user)
			}
		} catch (error) {
			reply.code(404).send({message:"user not found"})
		}
	})
	fastify.delete("/:id",async(req:FastifyRequest<{
		Params:{
            id:string
        }
	}>,reply:FastifyReply) =>{
		try {
			let userToDelete = await prisma.user.delete({
				where:{
					id:req.params.id,
				}
			})
			reply.send({message:"user deleted"});
		} catch (error) {
			console.log(error);
		}
	})
}

export default userRouter;
