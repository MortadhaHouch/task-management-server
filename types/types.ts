type User = {
    name:string
    age:number
    id:number
    posts:Post[]
}
type Post = {
    content:string
    createdOn:Date
    updatedOn:Date
    likes:number
    id:number
    authorId:number
}
export {User,Post}