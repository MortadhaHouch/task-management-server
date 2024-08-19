import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

let cors = require("@fastify/cors")
const pino = require('pino')
const pretty = require('pino-pretty')
const logger = pino(pretty())
const Fastify:FastifyInstance = require('fastify')({
    bodyLimit: 104857600,
    logger
});
require("dotenv").config()
const helmet = require('@fastify/helmet')
let userRouter = require("./routes/userRouter")
let taskRouter = require("./routes/taskRouter")
Fastify.register(require('@fastify/cookie'), {
    secret: "my-secret", // for cookies signature
    hook: 'onRequest', // set to false to disable cookie autoparsing or set autoparsing on any of the following hooks: 'onRequest', 'preParsing', 'preHandler', 'preValidation'. default: 'onRequest'
    parseOptions: {}  // options for parsing cookies
})
Fastify.register(require('@fastify/postgres'), {
    connectionString: process.env.DATABASE_URL,
});
Fastify.register(
    helmet,
    // Example disables the `contentSecurityPolicy` middleware but keeps the rest.
    { contentSecurityPolicy: false }
)
Fastify.register(require('@fastify/multipart'))
Fastify.register(require('@fastify/formbody'))
Fastify.register(require('@fastify/swagger'))
Fastify.register(cors, { 
    methods:["GET","POST","PUT","DELETE"],
    origin:"http://localhost:3000",
    credentials:true
})
Fastify.register(userRouter,{prefix:"/user"})
Fastify.register(taskRouter,{prefix:"/task"})
async function main(){
    Fastify.listen({
        port:Number(process.env.PORT),
        path:"/"
    })
}
main()
Fastify.get("/",(req:FastifyRequest,reply:FastifyReply)=>{
    reply.send({message:"Hello World"})
})