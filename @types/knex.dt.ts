declare module 'knex/types/tables'{
  export interface Tables {
    meals: {
      id: string
      name: string
      description: string
      date: string
      hour: string
      inDiet: boolean
      session_id?: string
    }
  }
}