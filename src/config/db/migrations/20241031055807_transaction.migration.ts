import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('transactions', (table) => {
        table.uuid('id').primary().defaultTo(knex.fn.uuid());
        table.uuid('account_id').notNullable().references('id').inTable('accounts').onDelete('CASCADE');
        table.decimal('amount', 15, 2).notNullable(); 
        table.decimal('balance_after', 15, 2).notNullable(); 
        table.enu('transaction_type', ['credit', 'debit']).notNullable(); 
        table.string('description').nullable();
        table.timestamps(true, true);
      });
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTableIfExists('transaction')
}

