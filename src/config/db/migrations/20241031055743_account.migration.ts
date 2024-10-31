import type { Knex } from 'knex'
import { AccountStatus } from '../../../types/account.types'

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('accounts', (table) => {
        table.uuid('id').primary().defaultTo(knex.fn.uuid())
        table
            .uuid('user_id')
            .notNullable()
            .references('id')
            .inTable('users')
            .onDelete('CASCADE')
        table.string('account_number').unique().notNullable()
        table.decimal('balance', 15, 2).defaultTo(0.0)
        table
            .enu('status', ['active', 'dormant', 'suspended', 'closed'])
            .defaultTo(AccountStatus.DORMANT)
        table.timestamps(true, true)
    })
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTableIfExists('account')
}
