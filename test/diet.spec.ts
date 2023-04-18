import { afterAll, beforeAll, it, describe, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../src/app';
import { execSync } from 'node:child_process';

describe('Meals routes', () => {
  beforeAll(async () => {
    await app.ready()
   })
   
   afterAll(async () => {
     await app.close()
   })

   beforeEach(() => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
   })
   
   it('Should be able to create a new meal', async () => {
     await request(app.server).post('/meals').send({
       name: 'Hamburguer',
       description: 'Hamburguer de picanha',
       date: '18/02/2023',
       hour: '16:30',
       inDiet: false
     }).expect(201)
   })

   it('Shoud be able to list all meal', async () => {
      const createMealResponse = await request(app.server).post('/meals').send({
        name: 'Hamburguer',
        description: 'Hamburguer de picanha',
        date: '18/02/2023',
        hour: '16:30',
        inDiet: false
      })
      const cookies = createMealResponse.get('Set-Cookie');
      const listMealsResponse = await request(app.server).get('/meals').set('Cookie', cookies).expect(200);
      expect(listMealsResponse.body.meals).toEqual([
        expect.objectContaining({
          name: 'Hamburguer',
          description: 'Hamburguer de picanha',
        })
      ])
   })

   it('Shoud be able to get a specific Meal', async () => {
      const createMealResponse = await request(app.server).post('/meals').send({
        name: 'Hamburguer',
        description: 'Hamburguer de picanha',
        date: '18/02/2023',
        hour: '16:30',
        inDiet: false
      })
      const cookies = createMealResponse.get('Set-Cookie');
      const listMealsResponse = await request(app.server).get('/meals').set('Cookie', cookies).expect(200);
      const mealId = listMealsResponse.body.meals[0].id;
      const getMealResponse = await request(app.server).get(`/meals/${mealId}`).set('Cookie', cookies).expect(200);
      expect(getMealResponse.body.meals).toEqual(
        expect.objectContaining({
          name: 'Hamburguer',
          description: 'Hamburguer de picanha',
        })
      )
   })

   it('Shoud be able to get the summary', async () => {
    const createMealResponse = await request(app.server).post('/meals').send({
      name: 'Hamburguer',
        description: 'Hamburguer de picanha',
        date: '18/02/2023',
        hour: '16:30',
        inDiet: true
    })
    const cookies = createMealResponse.get('Set-Cookie');
    await request(app.server).post('/meals').set('Cookie', cookies).send({
      name: 'Pizza',
        description: 'Pizza de calabresa',
        date: '18/02/2023',
        hour: '16:30',
        inDiet: false
    })
    await request(app.server).post('/meals').set('Cookie', cookies).send({
      name: 'Batata Doce',
        description: 'Batata doce com Frango',
        date: '18/02/2023',
        hour: '16:30',
        inDiet: true
    })
    const summaryResponse = await request(app.server).get('/meals/summary').set('Cookie', cookies).expect(200);
    expect(summaryResponse.body.summary).toEqual({
      totalMeals: 3,
      mealsInDiet: 1,
      mealsOffDiet: 2,
      maxOfMealsFollowedInDiet: 1
    })
 })

  it('Shoud be able to edit a specific Meal', async () => {
    const createMealResponse = await request(app.server).post('/meals').send({
      name: 'Hamburguer',
      description: 'Hamburguer de picanha',
      date: '18/02/2023',
      hour: '16:30',
      inDiet: false
    })
    const cookies = createMealResponse.get('Set-Cookie');
    const listMealsResponse = await request(app.server).get('/meals').set('Cookie', cookies).expect(200);
    const mealId = listMealsResponse.body.meals[0].id;
    await request(app.server).put(`/meals/${mealId}`).send({
      name: 'Sanduíche',
      description: 'Sanduíche de frango',
      date: '18/02/2023',
      hour: '16:30',
      inDiet: true
    }).expect(200)
  })

  it('Shoud be able to delete a specific Meal', async () => {
    const createMealResponse = await request(app.server).post('/meals').send({
      name: 'Hamburguer',
      description: 'Hamburguer de picanha',
      date: '18/02/2023',
      hour: '16:30',
      inDiet: false
    })
    const cookies = createMealResponse.get('Set-Cookie');
    const listMealsResponse = await request(app.server).get('/meals').set('Cookie', cookies).expect(200);
    const mealId = listMealsResponse.body.meals[0].id;
    await request(app.server).delete(`/meals/${mealId}`).expect(204)
  })
})