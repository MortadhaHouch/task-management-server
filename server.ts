import { PrismaClient } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';
import { UserType } from './types';
import cors from "@fastify/cors"
const Fastify = require('fastify');
const fastify = Fastify({ logger: true });
const prisma = new PrismaClient();
let {v4:uuidV4} =require('uuid');
require("dotenv").config()
const helmet = require('@fastify/helmet')
fastify.register(require('@fastify/cookie'), {
    secret: "my-secret", // for cookies signature
    hook: 'onRequest', // set to false to disable cookie autoparsing or set autoparsing on any of the following hooks: 'onRequest', 'preParsing', 'preHandler', 'preValidation'. default: 'onRequest'
    parseOptions: {}  // options for parsing cookies
})
fastify.register(require('@fastify/postgres'), {
    connectionString: process.env.DATABASE_URL,
});
fastify.register(
    helmet,
    // Example disables the `contentSecurityPolicy` middleware but keeps the rest.
    { contentSecurityPolicy: false }
)
fastify.register(require('@fastify/multipart'))
fastify.register(require('@fastify/formbody'))
fastify.register(require('@fastify/swagger'))
fastify.register(cors, { 
    methods:["GET","POST","PUT","DELETE"],
    origin:"http://localhost:5173",
    credentials:true
})
let users:UserType[] = [];
fastify.get("/",(req:FastifyRequest,reply:FastifyReply)=>{
    reply.send({message:"Hello world"})
})
fastify.get("/users",{
    schema:{
        response:{
            200:{
                type:"array",
                items:{
                    type:"object",
                    properties:{
                        name:{type:"string"},
                        age:{type:"number"},
                        id:{type:"string"},
                    }
                }
            }
        }
    },
    handler:(req:FastifyRequest,reply:FastifyReply)=>{
        let usersSorted = users.sort((a,b)=>{
            return a.age - b.age
        })
        reply.send(usersSorted)
    }
})
fastify.get("/users/:id",{
    schema:{
        response:{
            200:{
                type:"object",
                properties:{
                    name:{type:"string"},
                    age:{type:"number"},
                    id:{type:"string"},
                }
            },
            404:{
                type:"object",
                properties:{
                    message:{type:"string"},
                }
            }
        }
    },
    handler:(req:FastifyRequest,reply:FastifyReply)=>{
        const {id}:any = req.params;
        let foundUser:any = users.find((item)=>{
            return item.id === id
        })
        if(foundUser){
            return reply.code(200).send(foundUser)
        }else{
            return reply.code(404).send({message:"user Not Found"})
        }
    }
})
fastify.post("/user",{
    schema:{
        response:{
            200:{
                type:"object",
                properties:{
                    name: {type:"string"},
                    age: {type:"number"},
                    id: {type:"string"},
                }
            }
        }
    },
    handler:(req:FastifyRequest<{
        Body:{
            name:string,
            age:number
        }
    }>,reply:FastifyReply)=>{
        users.push({
            name: req.body.name,
            age: req.body.age,
            id: uuidV4(),
        })
        reply.send({
            name: req.body.name,
            age: req.body.age,
            id: uuidV4(),
        });
    }
},)
fastify.put("/user",(req:FastifyRequest<{
    Body:{
        name:string,
        age:number
    }
}>,reply:FastifyReply)=>{
    users.push({
        name: req.body.name,
        age: req.body.age,
        id: uuidV4(),
    })
    reply.send(users)
})
async function main(){
    fastify.listen(process.env.PORT,()=>console.log("server listening on port "+process.env.PORT))
}
main()
async function getData():Promise<any>{
    try {
        let users = await prisma.user.findMany({
            include:{
                posts:true
            }
        });
        return users;
    } catch (error) {
        console.log(error);
    }
}
async function insertData():Promise<any>{
    try {
        let user = await prisma.user.create({
            data:{ 
                name:"Mohamed",
                email:"MohamedH@gmail.com",
                age:20,
                posts:{
                    create:[{
                        content:"First post content",
                        title:"Post Title",
                        id:uuidV4(), 
                    }]
                }
            }
        });
        return user;
    } catch (error) {
        console.log(error);
    }
}
async function editData():Promise<any>{
    try {
        let user = await prisma.user.updateMany({
            where:{
                name:{
                    equals:"Ali"
                }
            },
            data:{
                name:"Mohamed",
            }
        });
        return user;
    } catch (error) {
        console.log(error);
    }
}
async function deleteData():Promise<any>{
    try {
        await prisma.post.deleteMany({});
        await prisma.user.deleteMany({});
    } catch (error) {
        console.log(error);
    }
}
// deleteData()
// insertData().then((data)=>{
//     console.log(data);
// }).catch((error)=>console.log(error))
// editData().then((data)=>{
//     console.log(data);
// }).catch((error)=>console.log(error))
// getData().then((users)=>{
//     console.log(users);
// }).catch((err)=>console.log(err))