import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

let cors = require("@fastify/cors")
const Fastify = require('fastify');
const pino = require('pino')
const pretty = require('pino-pretty')
const logger = pino(pretty())
const fastify:FastifyInstance = Fastify({ logger });
require("dotenv").config()
const helmet = require('@fastify/helmet')
let userRouter = require("./routes/userRouter")
let taskRouter = require("./routes/taskRouter")
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
fastify.register(userRouter,{prefix:"/user"})
fastify.register(taskRouter,{prefix:"/task"})
async function main(){
    fastify.listen({
        port:Number(process.env.PORT),
        path:"/"
    })
}
main()
fastify.get("/",(req:FastifyRequest,reply:FastifyReply)=>{
    reply.send({message:"Hello World"})
})