import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('user', (table) => {
        table.uuid('id').primary().defaultTo(knex.fn.uuid());
        table.string('first_name').notNullable();
        table.string('last_name').notNullable();
        table.string('password').notNullable();
        table.string('email').unique().notNullable();
        table.string('phone_number').unique().notNullable();
        table.boolean('email_verified').defaultTo(false)
        table.timestamps(true, true);
      });
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTableIfExists('user');
}

