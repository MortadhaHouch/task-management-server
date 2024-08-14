import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { v4 } from 'uuid';
import { UserType } from '../types';

let users: UserType[] = [
  { name: "Mohamed", age: 20, id: v4() },
  { name: "Ali", age: 25, id: v4() },
  { name: "Ahmed", age: 30, id: v4() }
];

async function userRouter(fastify: FastifyInstance) {
  fastify.get("/", {
    schema: {
      response: {
        200: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              age: { type: "number" },
              id: { type: "string" },
            }
          }
        }
      }
    },
    handler: (req: FastifyRequest, reply: FastifyReply) => {
      reply.send(users);
    }
  });

  fastify.get("/:id", {
    schema: {
      response: {
        200: {
          type: "object",
          properties: {
            name: { type: "string" },
            age: { type: "number" },
            id: { type: "string" },
          }
        },
        404: {
          type: "object",
          properties: {
            message: { type: "string" },
          }
        }
      }
    },
    handler: (req: FastifyRequest, reply: FastifyReply) => {
      const { id }: any = req.params;
      const foundUser: any = users.find(item => item.id === id);
      if (foundUser) {
        return reply.code(200).send(foundUser);
      } else {
        return reply.code(404).send({ message: "User Not Found" });
      }
    }
  });

  fastify.post("/", {
    schema: {
      response: {
        200: {
          type: "object",
          properties: {
            name: { type: "string" },
            age: { type: "number" },
            id: { type: "string" },
          }
        }
      }
    },
    handler: (req: FastifyRequest<{
      Body: {
        name: string;
        age: number;
      }
    }>, reply: FastifyReply) => {
      const newUser = {
        name: req.body.name,
        age: req.body.age,
        id: v4(),
      };
      users.push(newUser);
      reply.send(newUser);
    }
  });

  fastify.put("/", (req: FastifyRequest<{
    Body: {
      name: string;
      age: number;
    }
  }>, reply: FastifyReply) => {
    const updatedUser = {
      name: req.body.name,
      age: req.body.age,
      id: v4(),
    };
    users.push(updatedUser);
    reply.send(users);
  });
}

export default userRouter;
