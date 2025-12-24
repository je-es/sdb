// src/main.ts
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import { Database } from 'bun:sqlite';
    import * as types from './types.d';
    export * from './types.d';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    export class DB {

        // ┌──────────────────────────────── INIT ──────────────────────────────┐

            private db              : Database;
            private schemas         : Map<string, types.TableSchema>;
            private currentQuery    : string = '';
            private currentParams   : types.SqlValue[] = [];

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── CORE ──────────────────────────────┐

            constructor(path: string = ':memory:') {
                this.schemas = new Map;
                this.db = new Database(path);
                this.db.exec('PRAGMA foreign_keys = ON');
            }

            close(): void {
                this.db.close();
            }

            // ════════ Schema Management ════════
            defineSchema(schema: types.TableSchema): void {
                this.schemas.set(schema.name, schema);
                const sql = this.generateCreateTableSQL(schema);
                this.db.exec(sql);

                // Create indexes from schema.indexes
                if (schema.indexes) {
                    for (const index of schema.indexes) {
                        const uniqueStr = index.unique ? 'UNIQUE' : '';
                        const indexSql = `CREATE ${uniqueStr} INDEX IF NOT EXISTS ${index.name} ON ${schema.name} (${index.columns.join(', ')})`;
                        this.db.exec(indexSql);
                    }
                }

                // Create indexes from columns array (from index() helper)
                for (const col of schema.columns) {
                    if (col && typeof col === 'object' && '_type' in col && col._type === 'index') {
                        const indexDef = col as types.IndexDefinition;
                        const uniqueStr = indexDef.unique ? 'UNIQUE' : '';
                        const indexSql = `CREATE ${uniqueStr} INDEX IF NOT EXISTS ${indexDef.name} ON ${schema.name} (${indexDef.columns.join(', ')})`;
                        this.db.exec(indexSql);
                    }
                }
            }

            getSchema(tableName: string): types.TableSchema | undefined {
                return this.schemas.get(tableName);
            }

            listTables(): string[] {
                const result = this.db.query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
                return result.map((r: unknown) => (r as types.TableRow).name);
            }

            dropTable(tableName: string): void {
                this.db.exec(`DROP TABLE IF EXISTS ${tableName}`);
                this.schemas.delete(tableName);
            }

            // ════════ Query Builder ════════
            query(): types.QueryBuilder {
                this.reset();
                return this.createQueryBuilder();
            }

            // ════════ Quick Operations ════════
            find(table: string, conditions: Record<string, types.SqlValue>): unknown[] {
                const whereConditions: types.WhereCondition[] = Object.entries(conditions).map(([column, value]) => ({
                    column,
                    operator: '=' as const,
                    value
                }));

                return this.query()
                    .select()
                    .from(table)
                    .where(whereConditions)
                    .execute();
            }

            findOne(table: string, conditions: Record<string, types.SqlValue>): unknown | null {
                return this.query()
                    .select()
                    .from(table)
                    .where(Object.entries(conditions).map(([column, value]) => ({
                        column,
                        operator: '=' as const,
                        value
                    })))
                    .limit(1)
                    .executeOne();
            }

            findById(table: string, id: number | string): unknown | null {
                return this.findOne(table, { id });
            }

            all(table: string): unknown[] {
                return this.query().select().from(table).execute();
            }

            insert(table: string, data: Record<string, types.SqlValue>): unknown {
                this.query().insert(table, data).execute();

                // Return inserted row
                const lastId = this.db.query('SELECT last_insert_rowid() as id').get() as types.LastIdRow;
                return this.findById(table, lastId.id);
            }

            update(table: string, id: number | string, data: Record<string, types.SqlValue>): unknown | null {
                this.query()
                    .update(table, data)
                    .where({ column: 'id', operator: '=', value: id })
                    .execute();

                return this.findById(table, id);
            }

            delete(table: string, id: number | string): boolean {
                this.query()
                    .delete(table)
                    .where({ column: 'id', operator: '=', value: id })
                    .execute();

                return true;
            }

            // ════════ Transactions ════════
            transaction(callback: (db: DB) => void): void {
                this.db.exec('BEGIN TRANSACTION');
                try {
                    callback(this);
                    this.db.exec('COMMIT');
                } catch (error) {
                    this.db.exec('ROLLBACK');
                    throw error;
                }
            }

            // ════════ Raw SQL ════════
            exec(sql: string): void {
                this.db.exec(sql);
            }

            raw(sql: string, params: types.SqlValue[] = []): unknown[] {
                const stmt = this.db.query(sql);
                return stmt.all(...params) as unknown[];
            }

            rawOne(sql: string, params: types.SqlValue[] = []): unknown | null {
                const stmt = this.db.query(sql);
                return stmt.get(...params) as unknown | null;
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── HELP ──────────────────────────────┐

            private reset(): void {
                this.currentQuery = '';
                this.currentParams = [];
            }

            private createQueryBuilder(): types.QueryBuilder {
                const builder: types.QueryBuilderInternal & Partial<types.QueryBuilder> & { buildWhereClause?: () => string } = {
                    _select: ['*'],
                    _from: '',
                    _where: [],
                    _orderBy: '',
                    _limit: null,
                    _offset: null,
                    _isInsert: false,
                    _isUpdate: false,
                    _isDelete: false,
                    _insertData: null,
                    _updateData: null
                };

                // Bind methods to this DB instance
                // eslint-disable-next-line @typescript-eslint/no-this-alias
                const self = this;

                builder.select = function(columns?: string[]): types.QueryBuilder {
                    this._select = columns || ['*'];
                    return this as unknown as types.QueryBuilder;
                };

                builder.from = function(table: string): types.QueryBuilder {
                    this._from = table;
                    return this as unknown as types.QueryBuilder;
                };

                builder.where = function(condition: types.WhereCondition | types.WhereCondition[]): types.QueryBuilder {
                    const conditions = Array.isArray(condition) ? condition : [condition];

                    const whereClauses = conditions.map(cond => {
                        if (cond.operator === 'IS NULL' || cond.operator === 'IS NOT NULL') {
                            return `${cond.column} ${cond.operator}`;
                        } else if (cond.operator === 'IN' && Array.isArray(cond.value)) {
                            const placeholders = cond.value.map(() => '?').join(', ');
                            // Spread array values into params
                            cond.value.forEach(val => {
                                self.currentParams.push(val as types.SqlValue);
                            });
                            return `${cond.column} IN (${placeholders})`;
                        } else {
                            self.currentParams.push(cond.value as types.SqlValue);
                            return `${cond.column} ${cond.operator} ?`;
                        }
                    });

                    this._where.push(...whereClauses);
                    return this as unknown as types.QueryBuilder;
                };

                builder.and = function(condition: types.WhereCondition): types.QueryBuilder {
                    return this.where!(condition);
                };

                builder.or = function(condition: types.WhereCondition): types.QueryBuilder {
                    let clause = '';
                    if (condition.operator === 'IS NULL' || condition.operator === 'IS NOT NULL') {
                        clause = `${condition.column} ${condition.operator}`;
                    } else if (condition.operator === 'IN' && Array.isArray(condition.value)) {
                        const placeholders = condition.value.map(() => '?').join(', ');
                        // Spread array values into params
                        condition.value.forEach(val => {
                            self.currentParams.push(val as types.SqlValue);
                        });
                        clause = `${condition.column} IN (${placeholders})`;
                    } else {
                        self.currentParams.push(condition.value as types.SqlValue);
                        clause = `${condition.column} ${condition.operator} ?`;
                    }

                    // Add OR prefix to the clause itself
                    this._where.push(`OR ${clause}`);
                    return this as unknown as types.QueryBuilder;
                };

                builder.orderBy = function(column: string, direction: 'ASC' | 'DESC' = 'ASC'): types.QueryBuilder {
                    this._orderBy = `ORDER BY ${column} ${direction}`;
                    return this as unknown as types.QueryBuilder;
                };

                builder.limit = function(count: number): types.QueryBuilder {
                    this._limit = count;
                    return this as unknown as types.QueryBuilder;
                };

                builder.offset = function(count: number): types.QueryBuilder {
                    this._offset = count;
                    return this as unknown as types.QueryBuilder;
                };

                builder.insert = function(table: string, data: Record<string, types.SqlValue>): types.QueryBuilder {
                    this._isInsert = true;
                    this._from = table;
                    this._insertData = data;
                    return this as unknown as types.QueryBuilder;
                };

                builder.update = function(table: string, data: Record<string, types.SqlValue>): types.QueryBuilder {
                    this._isUpdate = true;
                    this._from = table;
                    this._updateData = data;
                    return this as unknown as types.QueryBuilder;
                };

                builder.delete = function(table: string): types.QueryBuilder {
                    this._isDelete = true;
                    this._from = table;
                    return this as unknown as types.QueryBuilder;
                };

                builder.raw = function(sql: string, params: types.SqlValue[] = []): types.QueryBuilder {
                    self.currentQuery = sql;
                    self.currentParams = params;
                    return this as unknown as types.QueryBuilder;
                };

                builder.execute = function(): unknown[] {
                    let sql = '';

                    if (this._isInsert && this._insertData) {
                        const columns = Object.keys(this._insertData);
                        const values = Object.values(this._insertData);

                        // Handle empty insert (all defaults)
                        if (columns.length === 0) {
                            sql = `INSERT INTO ${this._from} DEFAULT VALUES`;
                            self.currentParams = [];
                        } else {
                            const placeholders = columns.map(() => '?').join(', ');
                            sql = `INSERT INTO ${this._from} (${columns.join(', ')}) VALUES (${placeholders})`;
                            self.currentParams = values;
                        }
                    } else if (this._isUpdate && this._updateData) {
                        const setClauses = Object.keys(this._updateData).map(col => `${col} = ?`);
                        const updateValues = Object.values(this._updateData);
                        self.currentParams = [...updateValues, ...self.currentParams] as types.SqlValue[];
                        sql = `UPDATE ${this._from} SET ${setClauses.join(', ')}`;

                        if (this._where.length > 0) {
                            // Build WHERE clause properly handling OR conditions
                            const whereClause = this.buildWhereClause!();
                            sql += ` WHERE ${whereClause}`;
                        }
                    } else if (this._isDelete) {
                        sql = `DELETE FROM ${this._from}`;

                        if (this._where.length > 0) {
                            // Build WHERE clause properly handling OR conditions
                            const whereClause = this.buildWhereClause!();
                            sql += ` WHERE ${whereClause}`;
                        }
                    } else {
                        // SELECT query or raw query
                        if (self.currentQuery) {
                            sql = self.currentQuery;
                        } else {
                            sql = `SELECT ${this._select.join(', ')} FROM ${this._from}`;

                            if (this._where.length > 0) {
                                // Build WHERE clause properly handling OR conditions
                                const whereClause = this.buildWhereClause!();
                                sql += ` WHERE ${whereClause}`;
                            }

                            if (this._orderBy) {
                                sql += ` ${this._orderBy}`;
                            }

                            if (this._limit !== null) {
                                sql += ` LIMIT ${this._limit}`;
                            }

                            // OFFSET requires LIMIT in SQLite
                            if (this._offset !== null) {
                                if (this._limit === null) {
                                    // Add a very large limit if offset is used without limit
                                    sql += ` LIMIT -1`;
                                }
                                sql += ` OFFSET ${this._offset}`;
                            }
                        }
                    }

                    const stmt = self.db.query(sql);
                    const result = stmt.all(...self.currentParams) as unknown[];
                    self.reset();
                    return result;
                };

                builder.buildWhereClause = function(): string {
                    const parts: string[] = [];
                    for (let i = 0; i < this._where.length; i++) {
                        const clause = this._where[i];
                        if (clause.startsWith('OR ')) {
                            parts.push('OR');
                            parts.push(clause.substring(3)); // Remove 'OR ' prefix
                        } else {
                            if (i > 0 && !this._where[i - 1].startsWith('OR ')) {
                                parts.push('AND');
                            }
                            parts.push(clause);
                        }
                    }
                    return parts.join(' ');
                };

                builder.executeOne = function(): unknown | null {
                    const results = this.execute!();
                    return results.length > 0 ? results[0] : null;
                };

                builder.executeRaw = function(sql: string, params: types.SqlValue[] = []): unknown[] {
                    const stmt = self.db.query(sql);
                    const result = stmt.all(...params) as unknown[];
                    return result;
                };

                return builder as types.QueryBuilder;
            }

            private generateCreateTableSQL(schema: types.TableSchema): string {
                const columnDefs: string[] = [];
                const uniqueConstraints: string[] = [];

                for (const col of schema.columns) {
                    // Skip constraint definitions, they're handled separately
                    if (!col || typeof col !== 'object' || !('name' in col)) {
                        if (col && '_type' in col && col._type === 'unique') {
                            const uniqueCol = col as types.UniqueConstraint;
                            uniqueConstraints.push(`UNIQUE (${uniqueCol.columns.join(', ')})`);
                        }
                        continue;
                    }

                    const columnCol = col as types.ColumnDefinition;
                    let def = `${columnCol.name} ${columnCol.type}`;

                    if (columnCol.primaryKey) {
                        def += ' PRIMARY KEY';
                        if (columnCol.autoIncrement) {
                            def += ' AUTOINCREMENT';
                        }
                    }

                    if (columnCol.notNull && !columnCol.primaryKey) {
                        def += ' NOT NULL';
                    }

                    if (columnCol.unique) {
                        def += ' UNIQUE';
                    }

                    if (columnCol.default !== undefined) {
                        if (typeof columnCol.default === 'string') {
                            def += ` DEFAULT '${columnCol.default}'`;
                        } else if (columnCol.default === null) {
                            def += ' DEFAULT NULL';
                        } else {
                            def += ` DEFAULT ${columnCol.default}`;
                        }
                    }

                    if (columnCol.references) {
                        def += ` REFERENCES ${columnCol.references.table}(${columnCol.references.column})`;
                        if (columnCol.references.options) {
                            if (columnCol.references.options.onDelete) {
                                def += ` ON DELETE ${columnCol.references.options.onDelete}`;
                            }
                            if (columnCol.references.options.onUpdate) {
                                def += ` ON UPDATE ${columnCol.references.options.onUpdate}`;
                            }
                        }
                    }

                    columnDefs.push(def);
                }

                // Add unique constraints
                const allDefs = [...columnDefs, ...uniqueConstraints];
                return `CREATE TABLE IF NOT EXISTS ${schema.name} (${allDefs.join(', ')})`;
            }

        // └────────────────────────────────────────────────────────────────────┘

    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ HELP ════════════════════════════════════════╗

    // ════════ Schema Builder Helpers ════════
    export function table(name: string, columns: (types.ColumnDefinition | types.UniqueConstraint | types.IndexDefinition)[]): types.TableSchema {
        return { name, columns };
    }

    export function column(name: string, type: types.ColumnType): types.ColumnDefinition {
        return { name, type };
    }

    export function integer(name: string): types.ColumnDefinition {
        return { name, type: 'INTEGER' };
    }

    export function text(name: string): types.ColumnDefinition {
        return { name, type: 'TEXT' };
    }

    export function real(name: string): types.ColumnDefinition {
        return { name, type: 'REAL' };
    }

    export function blob(name: string): types.ColumnDefinition {
        return { name, type: 'BLOB' };
    }

    export function numeric(name: string): types.ColumnDefinition {
        return { name, type: 'NUMERIC' };
    }

    // ════════ Column Modifiers ════════
    export function primaryKey(col: types.ColumnDefinition, autoIncrement = false): types.ColumnDefinition {
        return { ...col, primaryKey: true, autoIncrement };
    }

    export function notNull(col: types.ColumnDefinition): types.ColumnDefinition {
        return { ...col, notNull: true };
    }

    export function unique(col: types.ColumnDefinition): types.ColumnDefinition;
    export function unique(columns: string[]): types.UniqueConstraint;
    export function unique(col: types.ColumnDefinition | string[]): types.ColumnDefinition | types.UniqueConstraint {
        // If it's an array, treat it as composite unique constraint
        if (Array.isArray(col)) {
            return { _type: 'unique', columns: col };
        }
        // Otherwise, it's a single column unique constraint
        return { ...col, unique: true };
    }

    export function defaultValue(col: types.ColumnDefinition, value: types.SqlValue): types.ColumnDefinition {
        return { ...col, default: value };
    }

    export function references(col: types.ColumnDefinition, table: string, column: string, options?: types.ForeignKeyOptions): types.ColumnDefinition {
        return { ...col, references: { table, column, options } };
    }

    export function index(name: string, columns: string | string[], unique?: boolean): types.IndexDefinition {
        return { _type: 'index', name, columns: Array.isArray(columns) ? columns : [columns], unique };
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝