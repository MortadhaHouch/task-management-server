import { TaskStatus } from "@prisma/client"

type User = {
    avatar:string
    birthday:string
    id:string
    name:string
    email:string
    tasks:Task[]
    deletedTask:Task[]
    cancelledTask:Task[]
    age:number
    password:string
    bin:Bin
}
type Task = {
    id:string
    title:string
    description:string
    content:string
    status:Status
    createdAt:string
    startingDate:string
    dueDate:string
    modifiedAt:string
    owner:User
    isDeleted:boolean
    isCancelled:boolean
    deletedBy:string
    remover:User
    cancelledBy:string
    canceller:User
    bin:Bin
    thumbnail:string
    coverImage:string
}
type Bin = {
    id:string
    owner:User
    tasks:Task[]
}
enum Status{
    DONE,
    ACCOMPLISHED,
    PENDING,
}
type SignupRequest = {
    firstName:string
    lastName:string
    avatar:string
    email:string
    password:string
    birthday:string
}
type LoginRequest = {
    email:string
    password:string
}
type LogoutRequest = {
    email:string
}
type TaskCreationRequest = {
    title:string
    description:string
    status:TaskStatus
    duesDate:string
    content:string
    thumbnail:string
    coverImage:string
    deletedBy:string
}
export type {User,Task,Bin,SignupRequest,LoginRequest,LogoutRequest,TaskCreationRequest}
export {Status}