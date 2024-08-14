import { FastifyInstance } from "fastify";

let cors = require("@fastify/cors")
const Fastify = require('fastify');
const fastify:FastifyInstance = Fastify({ logger: true });
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
        port:Number(process.env.PORT)||4000,
        path:"/"
    })
}
main()
// async function getData():Promise<any>{
//     try {
//         let users = await prisma.user.findMany({
//             include:{
//                 posts:true
//             }
//         });
//         return users;
//     } catch (error) {
//         console.log(error);
//     }
// }
// async function insertData():Promise<any>{
//     try {
//         let user = await prisma.user.create({
//             data:{ 
//                 name:"Mohamed",
//                 email:"MohamedH@gmail.com",
//                 age:20,
//                 posts:{
//                     create:[{
//                         content:"First post content",
//                         title:"Post Title",
//                         id:uuidV4(), 
//                     }]
//                 }
//             }
//         });
//         return user;
//     } catch (error) {
//         console.log(error);
//     }
// }
// async function editData():Promise<any>{
//     try {
//         let user = await prisma.user.updateMany({
//             where:{
//                 name:{
//                     equals:"Ali"
//                 }
//             },
//             data:{
//                 name:"Mohamed",
//             }
//         });
//         return user;
//     } catch (error) {
//         console.log(error);
//     }
// }
// async function deleteData():Promise<any>{
//     try {
//         await prisma.post.deleteMany({});
//         await prisma.user.deleteMany({});
//     } catch (error) {
//         console.log(error);
//     }
// }
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