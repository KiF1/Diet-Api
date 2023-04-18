import { FastifyInstance } from "fastify"
import { knex } from "../database"
import { randomUUID } from 'node:crypto'
import { z } from "zod"
import { checkSessionIdExists } from "../middlewares/check-session-id-exists"

export async function mealsRoutes(app: FastifyInstance){
  app.get('/', { preHandler: [checkSessionIdExists] } , async (request, reply) => {
    const { sessionId } = request.cookies;
    const meals = await knex('meals').where('session_id', sessionId).select()
    return { meals }
  })

  app.get('/:id',  { preHandler: [checkSessionIdExists] } , async (request) => {
    const getMealParamsSchema = z.object({
      id: z.string().uuid(),
    })
    const { id } = getMealParamsSchema.parse(request.params);
    const { sessionId } = request.cookies;
    const meal = await knex('meals').where({
      session_id: sessionId,
      id,
    }).first()
    
    return { meal }
  })

  app.get('/summary',  { preHandler: [checkSessionIdExists] } , async (request) => {
    const { sessionId } = request.cookies;
    const meals = await knex('meals').where('session_id', sessionId);
    const totalMeals = meals.length;
    const mealsInDiet = meals.filter((meal) => meal.inDiet === true).length;
    const mealsOffDiet = meals.filter((meal) => meal.inDiet === false).length;
    const maxOfMealsFollowedInDiet = meals.reduce(({ currentMeal, maxInDiet }, { inDiet }) => {
      return {
        currentMeal: inDiet ? currentMeal + 1 : 0,
        maxInDiet: inDiet ? Math.max(currentMeal + 1, maxInDiet) : maxInDiet
      }
    }, { currentMeal: 0, maxInDiet: 0 }).maxInDiet;
    
    return { totalMeals, mealsInDiet, mealsOffDiet, maxOfMealsFollowedInDiet }
  })
  
  app.post('/', async (request, reply) => {
    const createMealBodySchema = z.object({
      name: z.string(),
      description: z.string(),
      date: z.string(),
      hour: z.string(),
      inDiet: z.boolean(),
    })
    const { name, description, date, hour, inDiet } = createMealBodySchema.parse(request.body);
    let sessionId = request.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()

      reply.setCookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      })
    }
    
    await knex('meals').insert({
      id: randomUUID(),
      name,
      description,
      date,
      hour,
      inDiet,
      session_id: sessionId,
    })

    return reply.status(201).send();
  })

  app.put('/:id', { preHandler: [checkSessionIdExists] } , async (request, reply) => {
    const getMealParamsSchema = z.object({ id: z.string().uuid() })
    const editMealBodySchema = z.object({
      name: z.string(),
      description: z.string(),
      date: z.string(),
      hour: z.string(),
      inDiet: z.boolean(),
    })
    const { id } = getMealParamsSchema.parse(request.params);
    const { name, description, date, hour, inDiet } = editMealBodySchema.parse(request.body);
    const { sessionId } = request.cookies;
    await knex('meals').where({ session_id: sessionId, id }).first().update({ name, description, date, hour, inDiet });
    return reply.status(200).send();
  })

  app.delete('/:id', { preHandler: [checkSessionIdExists] } , async (request, reply) => {
    const getMealParamsSchema = z.object({ id: z.string().uuid() })
    const { id } = getMealParamsSchema.parse(request.params);
    const { sessionId } = request.cookies;

    await knex('meals').where({ session_id: sessionId, id }).first().delete();

    return reply.status(204).send()
  })
}
