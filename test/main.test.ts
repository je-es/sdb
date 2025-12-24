/* eslint-disable @typescript-eslint/no-explicit-any */
// test/main.test.ts
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

	import { describe, test, expect, beforeEach } from 'bun:test';
	import {
		DB,
		table,
		column,
		integer,
		text,
		real,
		blob,
		numeric,
		primaryKey,
		notNull,
		unique,
		defaultValue,
		references,
		index,
		type TableSchema
    } from '../src/main';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TEST ════════════════════════════════════════╗

	describe('@je-es/sdb', () => {

		let db: DB;

		beforeEach(() => {
			db = new DB(':memory:');
		});

		// ════════════════════════════════════════════════════════════════════════
		// Schema Builder Helpers Tests
		// ════════════════════════════════════════════════════════════════════════

		describe('Schema Builder Helpers', () => {
			test('table() creates table schema', () => {
				const schema = table('users', [
					integer('id'),
					text('name')
				]);
				expect(schema.name).toBe('users');
				expect(schema.columns).toHaveLength(2);
			});

			test('column() creates column definition', () => {
				const col = column('test', 'TEXT');
				expect(col.name).toBe('test');
				expect(col.type).toBe('TEXT');
			});

			test('integer() creates INTEGER column', () => {
				const col = integer('count');
				expect(col.type).toBe('INTEGER');
				expect(col.name).toBe('count');
			});

			test('text() creates TEXT column', () => {
				const col = text('description');
				expect(col.type).toBe('TEXT');
				expect(col.name).toBe('description');
			});

			test('real() creates REAL column', () => {
				const col = real('price');
				expect(col.type).toBe('REAL');
				expect(col.name).toBe('price');
			});

			test('blob() creates BLOB column', () => {
				const col = blob('data');
				expect(col.type).toBe('BLOB');
				expect(col.name).toBe('data');
			});

			test('numeric() creates NUMERIC column', () => {
				const col = numeric('value');
				expect(col.type).toBe('NUMERIC');
				expect(col.name).toBe('value');
			});

			test('primaryKey() adds primary key constraint', () => {
				const col = primaryKey(integer('id'));
				expect(col.primaryKey).toBe(true);
				expect(col.autoIncrement).toBe(false);
			});

			test('primaryKey() with autoIncrement', () => {
				const col = primaryKey(integer('id'), true);
				expect(col.primaryKey).toBe(true);
				expect(col.autoIncrement).toBe(true);
			});

			test('notNull() adds NOT NULL constraint', () => {
				const col = notNull(text('name'));
				expect(col.notNull).toBe(true);
			});

			test('unique() adds UNIQUE constraint', () => {
				const col = unique(text('email'));
				expect(col.unique).toBe(true);
			});

			test('defaultValue() adds DEFAULT constraint', () => {
				const col = defaultValue(integer('status'), 1);
				expect(col.default).toBe(1);
			});

			test('references() adds FOREIGN KEY constraint', () => {
				const col = references(integer('user_id'), 'users', 'id');
				expect(col.references).toEqual({ table: 'users', column: 'id' });
			});

			test('references() with onDelete CASCADE option', () => {
				const col = references(integer('user_id'), 'users', 'id', { onDelete: 'CASCADE' });
				expect(col.references?.options?.onDelete).toBe('CASCADE');
			});

			test('references() with onDelete SET NULL option', () => {
				const col = references(integer('org_id'), 'organizations', 'id', { onDelete: 'SET NULL' });
				expect(col.references?.options?.onDelete).toBe('SET NULL');
			});

			test('references() with multiple foreign key options', () => {
				const col = references(integer('repo_id'), 'repositories', 'id', { 
					onDelete: 'CASCADE',
					onUpdate: 'RESTRICT'
				});
				expect(col.references?.options?.onDelete).toBe('CASCADE');
				expect(col.references?.options?.onUpdate).toBe('RESTRICT');
			});

			test('chaining column modifiers', () => {
				const col = notNull(unique(text('email')));
				expect(col.notNull).toBe(true);
				expect(col.unique).toBe(true);
			});

			test('compositeUnique() creates composite unique constraint', () => {
				const constraint = unique(['user_id', 'provider']);
				expect(constraint._type).toBe('unique');
				expect((constraint as any).columns).toEqual(['user_id', 'provider']);
			});

			test('index() creates single column index', () => {
				const idx = index('idx_user_id', 'user_id');
				expect(idx._type).toBe('index');
				expect(idx.name).toBe('idx_user_id');
				expect(idx.columns).toEqual(['user_id']);
			});

			test('index() creates multi-column index', () => {
				const idx = index('idx_user_provider', ['user_id', 'provider']);
				expect(idx._type).toBe('index');
				expect(idx.name).toBe('idx_user_provider');
				expect(idx.columns).toEqual(['user_id', 'provider']);
			});

			test('index() with unique flag', () => {
				const idx = index('idx_email_unique', 'email', true);
				expect(idx._type).toBe('index');
				expect(idx.unique).toBe(true);
			});
		});

		// ════════════════════════════════════════════════════════════════════════
		// DB Class - Core Tests
		// ════════════════════════════════════════════════════════════════════════

		describe('DB Class - Initialization', () => {
			test('creates in-memory database by default', () => {
				const testDb = new DB();
				expect(testDb).toBeInstanceOf(DB);
				testDb.close();
			});

			test('creates database with custom path', () => {
				const testDb = new DB(':memory:');
				expect(testDb).toBeInstanceOf(DB);
				testDb.close();
			});

			test('close() closes database connection', () => {
				const testDb = new DB();
				expect(() => testDb.close()).not.toThrow();
			});
		});

		// ════════════════════════════════════════════════════════════════════════
		// Schema Management Tests
		// ════════════════════════════════════════════════════════════════════════

		describe('Schema Management', () => {
			test('defineSchema() creates table', () => {
				const schema = table('users', [
					primaryKey(integer('id'), true),
					notNull(text('name')),
					text('email')
				]);

				db.defineSchema(schema);
				const tables = db.listTables();
				expect(tables).toContain('users');
			});

			test('defineSchema() with all column types', () => {
				const schema = table('test_types', [
					primaryKey(integer('id'), true),
					text('text_col'),
					real('real_col'),
					blob('blob_col'),
					numeric('numeric_col')
				]);

				db.defineSchema(schema);
				expect(db.listTables()).toContain('test_types');
			});

			test('defineSchema() with default values', () => {
				const schema = table('defaults', [
					primaryKey(integer('id'), true),
					defaultValue(text('status'), 'active'),
					defaultValue(integer('count'), 0),
					defaultValue(text('nullable'), null)
				]);

				db.defineSchema(schema);
				db.insert('defaults', {});
				const result = db.findById('defaults', 1) as any;
				expect(result.status).toBe('active');
				expect(result.count).toBe(0);
			});

			test('defineSchema() with foreign keys', () => {
				const usersSchema = table('users', [
					primaryKey(integer('id'), true),
					text('name')
				]);

				const postsSchema = table('posts', [
					primaryKey(integer('id'), true),
					text('title'),
					references(integer('user_id'), 'users', 'id')
				]);

				db.defineSchema(usersSchema);
				db.defineSchema(postsSchema);

				expect(db.listTables()).toContain('users');
				expect(db.listTables()).toContain('posts');
			});

			test('defineSchema() with foreign key CASCADE delete', () => {
				const usersSchema = table('users', [
					primaryKey(integer('id'), true),
					text('name')
				]);

				const ordersSchema = table('orders', [
					primaryKey(integer('id'), true),
					notNull(references(integer('user_id'), 'users', 'id', { onDelete: 'CASCADE' })),
					text('description')
				]);

				db.defineSchema(usersSchema);
				db.defineSchema(ordersSchema);

				expect(db.listTables()).toContain('users');
				expect(db.listTables()).toContain('orders');
			});

			test('defineSchema() with foreign key SET NULL delete', () => {
				const organizationsSchema = table('organizations', [
					primaryKey(integer('id'), true),
					text('name')
				]);

				const projectsSchema = table('projects', [
					primaryKey(integer('id'), true),
					text('name'),
					references(integer('org_id'), 'organizations', 'id', { onDelete: 'SET NULL' })
				]);

				db.defineSchema(organizationsSchema);
				db.defineSchema(projectsSchema);

				expect(db.listTables()).toContain('organizations');
				expect(db.listTables()).toContain('projects');
			});

			test('defineSchema() with credit_transactions example', () => {
				const usersSchema = table('users', [
					primaryKey(integer('id'), true),
					text('name')
				]);

				const organizationsSchema = table('organizations', [
					primaryKey(integer('id'), true),
					text('name')
				]);

				const repositoriesSchema = table('repositories', [
					primaryKey(integer('id'), true),
					text('name')
				]);

				const paymentsSchema = table('payments', [
					primaryKey(integer('id'), true),
					text('description')
				]);

				const subscriptionsSchema = table('subscriptions', [
					primaryKey(integer('id'), true),
					text('name')
				]);

				const creditTransactionsSchema = table('credit_transactions', [
					primaryKey(integer('id'), true),
					notNull(references(integer('user_id'), 'users', 'id', { onDelete: 'CASCADE' })),
					notNull(integer('amount')),
					notNull(text('transaction_type')),
					notNull(text('description')),
					references(integer('related_organization_id'), 'organizations', 'id', { onDelete: 'SET NULL' }),
					references(integer('related_repository_id'), 'repositories', 'id', { onDelete: 'SET NULL' }),
					references(integer('related_payment_id'), 'payments', 'id', { onDelete: 'SET NULL' }),
					references(integer('related_subscription_id'), 'subscriptions', 'id', { onDelete: 'SET NULL' }),
					notNull(integer('balance_before')),
					notNull(integer('balance_after')),
					defaultValue(text('metadata'), '{}'),
					defaultValue(text('created_at'), new Date().toISOString())
				]);

				db.defineSchema(usersSchema);
				db.defineSchema(organizationsSchema);
				db.defineSchema(repositoriesSchema);
				db.defineSchema(paymentsSchema);
				db.defineSchema(subscriptionsSchema);
				db.defineSchema(creditTransactionsSchema);

				expect(db.listTables()).toContain('credit_transactions');
			});

			test('defineSchema() with indexes', () => {
				const schema: TableSchema = {
					name: 'indexed_table',
					columns: [
						{ ...primaryKey(integer('id'), true) },
						{ ...text('email') },
						{ ...text('username') }
					],
					indexes: [
						{ name: 'idx_email', columns: ['email'], unique: true },
						{ name: 'idx_username', columns: ['username'] }
					]
				};

				db.defineSchema(schema);
				expect(db.listTables()).toContain('indexed_table');
			});

			test('defineSchema() with composite unique constraint', () => {
				const schema = table('oauth_providers', [
					primaryKey(integer('id'), true),
					notNull(integer('user_id')),
					notNull(text('provider')),
					text('provider_id'),
					unique(['user_id', 'provider']),
					unique(['provider', 'provider_id'])
				]);

				db.defineSchema(schema);
				expect(db.listTables()).toContain('oauth_providers');
			});

			test('defineSchema() with index constraints', () => {
				const schema = table('transactions', [
					primaryKey(integer('id'), true),
					integer('user_id'),
					text('provider'),
					text('description'),
					index('idx_user_id', 'user_id'),
					index('idx_provider', 'provider'),
					index('idx_user_provider', ['user_id', 'provider'])
				]);

				db.defineSchema(schema);
				expect(db.listTables()).toContain('transactions');
			});

			test('defineSchema() with discount percent real column', () => {
				const schema = table('discounts', [
					primaryKey(integer('id'), true),
					defaultValue(real('discount_percent'), 0)
				]);

				db.defineSchema(schema);
				const result = db.insert('discounts', {}) as any;
				expect(result.discount_percent).toBe(0);
			});

			test('getSchema() retrieves table schema', () => {
				const schema = table('users', [
					primaryKey(integer('id'), true),
					text('name')
				]);

				db.defineSchema(schema);
				const retrieved = db.getSchema('users');
				expect(retrieved).toBeDefined();
				expect(retrieved?.name).toBe('users');
			});

			test('getSchema() returns undefined for non-existent table', () => {
				const retrieved = db.getSchema('nonexistent');
				expect(retrieved).toBeUndefined();
			});

			test('listTables() returns all tables', () => {
				db.defineSchema(table('table1', [primaryKey(integer('id'), true)]));
				db.defineSchema(table('table2', [primaryKey(integer('id'), true)]));

				const tables = db.listTables();
				expect(tables).toContain('table1');
				expect(tables).toContain('table2');
			});

			test('dropTable() removes table', () => {
				db.defineSchema(table('temp', [primaryKey(integer('id'), true)]));
				expect(db.listTables()).toContain('temp');

				db.dropTable('temp');
				expect(db.listTables()).not.toContain('temp');
			});
		});

		// ════════════════════════════════════════════════════════════════════════
		// CRUD Operations Tests
		// ════════════════════════════════════════════════════════════════════════

		describe('CRUD Operations', () => {
			beforeEach(() => {
				db.defineSchema(table('users', [
					primaryKey(integer('id'), true),
					notNull(text('name')),
					text('email'),
					integer('age')
				]));
			});

			test('insert() creates new record', () => {
				const result = db.insert('users', {
					name: 'John',
					email: 'john@example.com',
					age: 30
				}) as any;

				expect(result.id).toBe(1);
				expect(result.name).toBe('John');
			});

			test('insert() multiple records', () => {
				db.insert('users', { name: 'Alice', email: 'alice@example.com', age: 25 });
				db.insert('users', { name: 'Bob', email: 'bob@example.com', age: 35 });

				const all = db.all('users');
				expect(all).toHaveLength(2);
			});

			test('findById() retrieves record by id', () => {
				db.insert('users', { name: 'Jane', email: 'jane@example.com', age: 28 });
				const result = db.findById('users', 1) as any;

				expect(result.name).toBe('Jane');
				expect(result.email).toBe('jane@example.com');
			});

			test('findById() returns null for non-existent id', () => {
				const result = db.findById('users', 999);
				expect(result).toBeNull();
			});

			test('findOne() retrieves single record', () => {
				db.insert('users', { name: 'Tom', email: 'tom@example.com', age: 40 });
				const result = db.findOne('users', { name: 'Tom' }) as any;

				expect(result).toBeDefined();
				expect(result.name).toBe('Tom');
			});

			test('findOne() returns null when no match', () => {
				const result = db.findOne('users', { name: 'NonExistent' });
				expect(result).toBeNull();
			});

			test('find() retrieves multiple matching records', () => {
				db.insert('users', { name: 'Alice', email: 'alice1@example.com', age: 25 });
				db.insert('users', { name: 'Alice', email: 'alice2@example.com', age: 26 });
				db.insert('users', { name: 'Bob', email: 'bob@example.com', age: 30 });

				const results = db.find('users', { name: 'Alice' });
				expect(results).toHaveLength(2);
			});

			test('all() retrieves all records', () => {
				db.insert('users', { name: 'User1', email: 'user1@example.com', age: 20 });
				db.insert('users', { name: 'User2', email: 'user2@example.com', age: 21 });
				db.insert('users', { name: 'User3', email: 'user3@example.com', age: 22 });

				const all = db.all('users');
				expect(all).toHaveLength(3);
			});

			test('update() modifies existing record', () => {
				db.insert('users', { name: 'Original', email: 'original@example.com', age: 25 });
				const updated = db.update('users', 1, { name: 'Updated', age: 30 }) as any;

				expect(updated.name).toBe('Updated');
				expect(updated.age).toBe(30);
			});

			test('update() returns null for non-existent id', () => {
				const result = db.update('users', 999, { name: 'Test' });
				expect(result).toBeNull();
			});

			test('delete() removes record', () => {
				db.insert('users', { name: 'ToDelete', email: 'delete@example.com', age: 25 });
				const result = db.delete('users', 1);

				expect(result).toBe(true);
				expect(db.findById('users', 1)).toBeNull();
			});
		});

		// ════════════════════════════════════════════════════════════════════════
		// Query Builder Tests
		// ════════════════════════════════════════════════════════════════════════

		describe('Query Builder', () => {
			beforeEach(() => {
				db.defineSchema(table('products', [
					primaryKey(integer('id'), true),
					text('name'),
					real('price'),
					integer('stock'),
					text('category')
				]));

				db.insert('products', { name: 'Widget', price: 10.99, stock: 100, category: 'tools' });
				db.insert('products', { name: 'Gadget', price: 20.50, stock: 50, category: 'electronics' });
				db.insert('products', { name: 'Gizmo', price: 15.75, stock: 75, category: 'tools' });
				db.insert('products', { name: 'Doodad', price: 5.25, stock: 200, category: 'misc' });
			});

			test('select() with default columns', () => {
				const results = db.query().select().from('products').execute();
				expect(results).toHaveLength(4);
			});

			test('select() with specific columns', () => {
				const results = db.query()
					.select(['name', 'price'])
					.from('products')
					.execute() as any[];

				expect(results[0]).toHaveProperty('name');
				expect(results[0]).toHaveProperty('price');
			});

			test('where() with single condition', () => {
				const results = db.query()
					.select()
					.from('products')
					.where({ column: 'category', operator: '=', value: 'tools' })
					.execute();

				expect(results).toHaveLength(2);
			});

			test('where() with multiple conditions', () => {
				const results = db.query()
					.select()
					.from('products')
					.where([
						{ column: 'category', operator: '=', value: 'tools' },
						{ column: 'stock', operator: '>', value: 50 }
					])
					.execute();

				expect(results).toHaveLength(2);
			});

			test('where() with operators', () => {
				const tests = [
					{ operator: '>' as const, value: 50, expectedCount: 3 },
					{ operator: '<' as const, value: 100, expectedCount: 2 },
					{ operator: '>=' as const, value: 100, expectedCount: 2 },
					{ operator: '<=' as const, value: 75, expectedCount: 2 },
					{ operator: '!=' as const, value: 100, expectedCount: 3 }
				];

				tests.forEach(({ operator, value, expectedCount }) => {
					const results = db.query()
						.select()
						.from('products')
						.where({ column: 'stock', operator, value })
						.execute();
					expect(results).toHaveLength(expectedCount);
				});
			});

			test('where() with LIKE operator', () => {
				const results = db.query()
					.select()
					.from('products')
					.where({ column: 'name', operator: 'LIKE', value: 'G%' })
					.execute();

				expect(results).toHaveLength(2);
			});

			test('where() with IN operator', () => {
				const results = db.query()
					.select()
					.from('products')
					.where({ column: 'category', operator: 'IN', value: ['tools', 'electronics'] })
					.execute();

				expect(results).toHaveLength(3);
			});

			test('where() with IS NULL operator', () => {
				db.insert('products', { name: 'NullTest', price: 10, stock: 10, category: null });
				const results = db.query()
					.select()
					.from('products')
					.where({ column: 'category', operator: 'IS NULL' })
					.execute();

				expect(results).toHaveLength(1);
			});

			test('where() with IS NOT NULL operator', () => {
				db.insert('products', { name: 'NullTest', price: 10, stock: 10, category: null });
				const results = db.query()
					.select()
					.from('products')
					.where({ column: 'category', operator: 'IS NOT NULL' })
					.execute();

				expect(results).toHaveLength(4);
			});

			test('and() chains conditions', () => {
				const results = db.query()
					.select()
					.from('products')
					.where({ column: 'category', operator: '=', value: 'tools' })
					.and({ column: 'stock', operator: '>', value: 50 })
					.execute();

				expect(results).toHaveLength(2);
			});

			test('or() adds alternative conditions', () => {
				const results = db.query()
					.select()
					.from('products')
					.where({ column: 'category', operator: '=', value: 'tools' })
					.or({ column: 'category', operator: '=', value: 'electronics' })
					.execute();

				expect(results).toHaveLength(3);
			});

			test('or() with IN operator', () => {
				const results = db.query()
					.select()
					.from('products')
					.where({ column: 'stock', operator: '=', value: 100 })
					.or({ column: 'category', operator: 'IN', value: ['electronics', 'misc'] })
					.execute();

				expect(results).toHaveLength(3);
			});

			test('or() with IS NULL operator', () => {
				db.insert('products', { name: 'NullTest', price: 10, stock: 10, category: null });
				const results = db.query()
					.select()
					.from('products')
					.where({ column: 'category', operator: '=', value: 'tools' })
					.or({ column: 'category', operator: 'IS NULL' })
					.execute();

				expect(results).toHaveLength(3);
			});

			test('orderBy() sorts results ascending', () => {
				const results = db.query()
					.select()
					.from('products')
					.orderBy('price', 'ASC')
					.execute() as any[];

				expect(results[0].price).toBe(5.25);
				expect(results[results.length - 1].price).toBe(20.50);
			});

			test('orderBy() sorts results descending', () => {
				const results = db.query()
					.select()
					.from('products')
					.orderBy('price', 'DESC')
					.execute() as any[];

				expect(results[0].price).toBe(20.50);
				expect(results[results.length - 1].price).toBe(5.25);
			});

			test('limit() restricts result count', () => {
				const results = db.query()
					.select()
					.from('products')
					.limit(2)
					.execute();

				expect(results).toHaveLength(2);
			});

			test('offset() skips records', () => {
				const results = db.query()
					.select()
					.from('products')
					.orderBy('id', 'ASC')
					.offset(2)
					.execute();

				expect(results).toHaveLength(2);
			});

			test('limit() and offset() work together', () => {
				const results = db.query()
					.select()
					.from('products')
					.orderBy('id', 'ASC')
					.limit(2)
					.offset(1)
					.execute() as any[];

				expect(results).toHaveLength(2);
				expect(results[0].id).toBe(2);
			});

			test('executeOne() returns single result', () => {
				const result = db.query()
					.select()
					.from('products')
					.where({ column: 'name', operator: '=', value: 'Widget' })
					.executeOne() as any;

				expect(result).toBeDefined();
				expect(result.name).toBe('Widget');
			});

			test('executeOne() returns null for empty result', () => {
				const result = db.query()
					.select()
					.from('products')
					.where({ column: 'name', operator: '=', value: 'NonExistent' })
					.executeOne();

				expect(result).toBeNull();
			});

			test('insert() via query builder', () => {
				db.query()
					.insert('products', { name: 'NewProduct', price: 99.99, stock: 10, category: 'new' })
					.execute();

				const result = db.findOne('products', { name: 'NewProduct' }) as any;
				expect(result.name).toBe('NewProduct');
			});

			test('update() via query builder', () => {
				db.query()
					.update('products', { price: 12.99 })
					.where({ column: 'name', operator: '=', value: 'Widget' })
					.execute();

				const result = db.findOne('products', { name: 'Widget' }) as any;
				expect(result.price).toBe(12.99);
			});

			test('delete() via query builder', () => {
				db.query()
					.delete('products')
					.where({ column: 'name', operator: '=', value: 'Widget' })
					.execute();

				const result = db.findOne('products', { name: 'Widget' });
				expect(result).toBeNull();
			});

			test('raw() executes custom SQL', () => {
				const results = db.query()
					.raw('SELECT * FROM products WHERE price > ?', [10])
					.execute();

				expect(results.length).toBeGreaterThan(0);
			});

			test('executeRaw() executes custom SQL directly', () => {
				const results = db.query()
					.executeRaw('SELECT * FROM products WHERE price < ?', [10]);

				expect(results).toHaveLength(1);
			});

			test('complex query chain', () => {
				const results = db.query()
					.select(['name', 'price', 'stock'])
					.from('products')
					.where({ column: 'category', operator: '=', value: 'tools' })
					.orderBy('price', 'DESC')
					.limit(1)
					.execute() as any[];

				expect(results).toHaveLength(1);
				expect(results[0].name).toBe('Gizmo');
			});
		});

		// ════════════════════════════════════════════════════════════════════════
		// Transaction Tests
		// ════════════════════════════════════════════════════════════════════════

		describe('Transactions', () => {
			beforeEach(() => {
				db.defineSchema(table('accounts', [
					primaryKey(integer('id'), true),
					text('name'),
					real('balance')
				]));
			});

			test('transaction() commits on success', () => {
				db.transaction((txDb) => {
					txDb.insert('accounts', { name: 'Alice', balance: 100 });
					txDb.insert('accounts', { name: 'Bob', balance: 200 });
				});

				const accounts = db.all('accounts');
				expect(accounts).toHaveLength(2);
			});

			test('transaction() rolls back on error', () => {
				try {
					db.transaction((txDb) => {
						txDb.insert('accounts', { name: 'Alice', balance: 100 });
						throw new Error('Test error');
					});
				} catch {
					// Expected error
				}

				const accounts = db.all('accounts');
				expect(accounts).toHaveLength(0);
			});
		});

		// ════════════════════════════════════════════════════════════════════════
		// Raw SQL Tests
		// ════════════════════════════════════════════════════════════════════════

		describe('Raw SQL', () => {
			beforeEach(() => {
				db.defineSchema(table('items', [
					primaryKey(integer('id'), true),
					text('name'),
					integer('quantity')
				]));

				db.insert('items', { name: 'Item1', quantity: 10 });
				db.insert('items', { name: 'Item2', quantity: 20 });
				db.insert('items', { name: 'Item3', quantity: 30 });
			});

			test('exec() executes SQL without return', () => {
				expect(() => {
					db.exec('UPDATE items SET quantity = 0 WHERE id = 1');
				}).not.toThrow();

				const item = db.findById('items', 1) as any;
				expect(item.quantity).toBe(0);
			});

			test('raw() executes SQL with parameters', () => {
				const results = db.raw('SELECT * FROM items WHERE quantity > ?', [15]);
				expect(results).toHaveLength(2);
			});

			test('raw() without parameters', () => {
				const results = db.raw('SELECT * FROM items');
				expect(results).toHaveLength(3);
			});

			test('rawOne() returns single result', () => {
				const result = db.rawOne('SELECT * FROM items WHERE id = ?', [1]) as any;
				expect(result).toBeDefined();
				expect(result.id).toBe(1);
			});

			test('rawOne() returns null for no match', () => {
				const result = db.rawOne('SELECT * FROM items WHERE id = ?', [999]);
				expect(result).toBeNull();
			});

			test('raw() with complex query', () => {
				const results = db.raw(
					'SELECT name, quantity FROM items WHERE quantity BETWEEN ? AND ? ORDER BY quantity DESC',
					[10, 25]
				);
				expect(results).toHaveLength(2);
			});
		});

		// ════════════════════════════════════════════════════════════════════════
		// Edge Cases and Special Scenarios
		// ════════════════════════════════════════════════════════════════════════

		describe('Edge Cases', () => {
			test('handles empty results gracefully', () => {
				db.defineSchema(table('empty', [primaryKey(integer('id'), true)]));
				const results = db.all('empty');
				expect(results).toEqual([]);
			});

			test('handles null values correctly', () => {
				db.defineSchema(table('nullable', [
					primaryKey(integer('id'), true),
					text('optional')
				]));

				db.insert('nullable', { optional: null });
				const result = db.findById('nullable', 1) as any;
				expect(result.optional).toBeNull();
			});

			test('handles boolean values (stored as integers)', () => {
				db.defineSchema(table('booleans', [
					primaryKey(integer('id'), true),
					integer('active')
				]));

				db.insert('booleans', { active: true });
				const result = db.findById('booleans', 1) as any;
				expect(result.active).toBe(1);
			});

			test('handles Uint8Array (blob) values', () => {
				db.defineSchema(table('blobs', [
					primaryKey(integer('id'), true),
					blob('data')
				]));

				const binaryData = new Uint8Array([1, 2, 3, 4, 5]);
				db.insert('blobs', { data: binaryData });
				const result = db.findById('blobs', 1) as any;
				expect(result.data).toBeInstanceOf(Uint8Array);
			});

			test('handles string id in findById', () => {
				db.defineSchema(table('string_ids', [
					primaryKey(text('id')),
					text('name')
				]));

				db.raw('INSERT INTO string_ids (id, name) VALUES (?, ?)', ['abc123', 'Test']);
				const result = db.findById('string_ids', 'abc123') as any;
				expect(result.id).toBe('abc123');
			});

			test('handles update with string id', () => {
				db.defineSchema(table('string_ids', [
					primaryKey(text('id')),
					text('name')
				]));

				db.raw('INSERT INTO string_ids (id, name) VALUES (?, ?)', ['abc123', 'Test']);
				db.update('string_ids', 'abc123', { name: 'Updated' });
				const result = db.findById('string_ids', 'abc123') as any;
				expect(result.name).toBe('Updated');
			});

			test('handles delete with string id', () => {
				db.defineSchema(table('string_ids', [
					primaryKey(text('id')),
					text('name')
				]));

				db.raw('INSERT INTO string_ids (id, name) VALUES (?, ?)', ['abc123', 'Test']);
				db.delete('string_ids', 'abc123');
				const result = db.findById('string_ids', 'abc123');
				expect(result).toBeNull();
			});
        });
    });

// ╚══════════════════════════════════════════════════════════════════════════════════════╝