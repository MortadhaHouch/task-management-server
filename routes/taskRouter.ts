import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

async function taskRouter(fastify: FastifyInstance,options:object) {
    fastify.get('/', async (req: FastifyRequest, reply: FastifyReply) => {
        reply.send({ message: 'Hello World' });
    });
}
export default taskRouter