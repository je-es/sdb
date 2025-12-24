<!-- ╔══════════════════════════════ BEG ══════════════════════════════╗ -->

<br>
<div align="center">
    <p>
        <img src="./assets/img/logo.png" alt="logo" style="" height="80" />
    </p>
</div>

<div align="center">
    <img src="https://img.shields.io/badge/v-0.0.3-black"/>
    <img src="https://img.shields.io/badge/🔥-@je--es-black"/>
    <br>
    <img src="https://github.com/je-es/sdb/actions/workflows/ci.yml/badge.svg" alt="CI" />
    <img src="https://img.shields.io/badge/coverage-100%25-brightgreen" alt="Test Coverage" />
    <img src="https://img.shields.io/github/issues/je-es/sdb?style=flat" alt="Github Repo Issues" />
    <img src="https://img.shields.io/github/stars/je-es/sdb?style=social" alt="GitHub Repo stars" />
</div>
<br>

<!-- ╚═════════════════════════════════════════════════════════════════╝ -->



<!-- ╔══════════════════════════════ DOC ══════════════════════════════╗ -->

- ## Quick Start 🔥

    > **A lightweight, type-safe SQLite database wrapper for Bun with an elegant API and zero dependencies.**

    - #### Setup

        > install [`space`](https://github.com/solution-lib/space) first.

        ```bash
        # install
        space i @je-es/sdb
        ```

        ```ts
        // import
        import { DB, table, integer, text, primaryKey, notNull, unique } from '@je-es/sdb';
        ```

    <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

    - #### Usage

        - ##### Initialize Database
            ```ts
            // In-memory database
            const db = new DB();

            // Or file-based database
            const db = new DB('./my-database.db');
            ```

        <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

        - ##### Define Schema
            ```ts
            import { table, integer, text, real, primaryKey, notNull, unique, defaultValue } from '@je-es/sdb';

            // Define table schema
            const usersSchema = table('users', [
                primaryKey(integer('id'), true),  // auto-increment primary key
                notNull(text('name')),
                unique(text('email')),
                integer('age'),
                defaultValue(text('status'), 'active')
            ]);

            // Create the table
            db.defineSchema(usersSchema);
            ```

        <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

        - ##### CRUD Operations
            ```ts
            // Insert
            const user = db.insert('users', {
                name: 'Alice',
                email: 'alice@example.com',
                age: 25
            });

            // Find by ID
            const foundUser = db.findById('users', 1);

            // Find one
            const user = db.findOne('users', { email: 'alice@example.com' });

            // Find many
            const youngUsers = db.find('users', { status: 'active' });

            // Get all
            const allUsers = db.all('users');

            // Update
            db.update('users', 1, { age: 26 });

            // Delete
            db.delete('users', 1);
            ```

        <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

        - ##### Query Builder
            ```ts
            // Simple query
            const results = db.query()
                .select(['name', 'email'])
                .from('users')
                .where({ column: 'age', operator: '>', value: 21 })
                .orderBy('name', 'ASC')
                .limit(10)
                .execute();

            // Complex query with multiple conditions
            const activeUsers = db.query()
                .select()
                .from('users')
                .where({ column: 'status', operator: '=', value: 'active' })
                .and({ column: 'age', operator: '>=', value: 18 })
                .orderBy('name', 'ASC')
                .execute();

            // OR conditions
            const users = db.query()
                .select()
                .from('users')
                .where({ column: 'status', operator: '=', value: 'active' })
                .or({ column: 'status', operator: '=', value: 'pending' })
                .execute();

            // IN operator
            const specificUsers = db.query()
                .select()
                .from('users')
                .where({ column: 'id', operator: 'IN', value: [1, 2, 3] })
                .execute();

            // LIKE operator
            const searchResults = db.query()
                .select()
                .from('users')
                .where({ column: 'name', operator: 'LIKE', value: 'A%' })
                .execute();

            // Pagination
            const page2 = db.query()
                .select()
                .from('users')
                .orderBy('id', 'ASC')
                .limit(10)
                .offset(10)
                .execute();

            // Get single result
            const user = db.query()
                .select()
                .from('users')
                .where({ column: 'email', operator: '=', value: 'test@example.com' })
                .executeOne();
            ```

        <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

        - ##### Transactions
            ```ts
            db.transaction((txDb) => {
                txDb.insert('users', { name: 'Alice', email: 'alice@example.com' });
                txDb.insert('users', { name: 'Bob', email: 'bob@example.com' });
                // Automatically commits if no error
                // Automatically rolls back on error
            });
            ```

        <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

        - ##### Raw SQL
            ```ts
            // Execute without return
            db.exec('DELETE FROM users WHERE status = "inactive"');

            // Execute with parameters and get results
            const results = db.raw(
                'SELECT * FROM users WHERE age > ? AND status = ?',
                [21, 'active']
            );

            // Get single result
            const user = db.rawOne(
                'SELECT * FROM users WHERE email = ?',
                ['test@example.com']
            );
            ```

        <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

        - ##### Foreign Keys & Indexes
            ```ts
            import { references, index } from '@je-es/sdb';

            // Table with foreign key
            const postsSchema = table('posts', [
                primaryKey(integer('id'), true),
                notNull(text('title')),
                text('content'),
                references(integer('user_id'), 'users', 'id')
            ]);

            // Foreign key with cascade delete
            const ordersSchema = table('orders', [
                primaryKey(integer('id'), true),
                notNull(references(integer('user_id'), 'users', 'id', { onDelete: 'CASCADE' })),
                text('description')
            ]);

            // Foreign key with set null on delete
            const projectsSchema = table('projects', [
                primaryKey(integer('id'), true),
                text('name'),
                references(integer('org_id'), 'organizations', 'id', { onDelete: 'SET NULL' })
            ]);

            // Table with composite unique constraints
            const providersSchema = table('oauth_providers', [
                primaryKey(integer('id'), true),
                notNull(integer('user_id')),
                notNull(text('provider')),
                text('provider_id'),
                unique(['user_id', 'provider']),           // One provider per account
                unique(['provider', 'provider_id']),       // Provider ID must be globally unique
                index('idx_user_id', 'user_id'),
                index('idx_provider', 'provider')
            ]);

            // Table with indexes
            const productsSchema = table('products', [
                primaryKey(integer('id'), true),
                text('name'),
                defaultValue(real('discount_percent'), 0),
                index('idx_name', 'name'),
                index('idx_discount', 'discount_percent', true)  // unique index
            ]);

            db.defineSchema(postsSchema);
            db.defineSchema(ordersSchema);
            db.defineSchema(projectsSchema);
            db.defineSchema(providersSchema);
            db.defineSchema(productsSchema);
            ```

        <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

        - ##### Schema Management
            ```ts
            // Get table schema
            const schema = db.getSchema('users');

            // List all tables
            const tables = db.listTables();

            // Drop table
            db.dropTable('old_table');

            // Close database connection
            db.close();
            ```

        <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

        - ##### Types

          - ###### Column Types

              - `integer(name)` - INTEGER column
              - `text(name)` - TEXT column
              - `real(name)` - REAL column (floating point)
              - `blob(name)` - BLOB column (binary data)
              - `numeric(name)` - NUMERIC column

          - ###### Column Modifiers

              - `primaryKey(col, autoIncrement?)` - Mark as primary key
              - `notNull(col)` - Add NOT NULL constraint
              - `unique(col)` - Add UNIQUE constraint on single column
              - `unique(columns[])` - Add UNIQUE constraint on multiple columns (composite)
              - `defaultValue(col, value)` - Set default value
              - `references(col, table, column, options?)` - Add foreign key constraint with optional `onDelete` and `onUpdate` behavior
              - `index(name, columns, unique?)` - Create index on one or more columns

<!-- ╚═════════════════════════════════════════════════════════════════╝ -->



<!-- ╔══════════════════════════════ END ══════════════════════════════╗ -->

<br>

---

<div align="center">
    <a href="https://github.com/solution-lib/space"><img src="https://img.shields.io/badge/by-Space-black"/></a>
</div>

<!-- ╚═════════════════════════════════════════════════════════════════╝ -->