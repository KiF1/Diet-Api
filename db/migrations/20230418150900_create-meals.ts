import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('meals', (table) => {
    table.uuid('id').primary()
    table.text('name').notNullable()
    table.text('description').notNullable()
    table.date('date').notNullable()
    table.time('hour').notNullable()
    table.boolean('inDiet').notNullable().defaultTo(false);
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('meals')
}