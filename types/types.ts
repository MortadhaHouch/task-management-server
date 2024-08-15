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
    status:Status
    createdAt:string
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
export type {User,Task,Bin}