// src/types.d.ts
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗

    type ColumnType = 'INTEGER' | 'TEXT' | 'REAL' | 'BLOB' | 'NUMERIC';
    type SqlValue = string | number | boolean | null | Uint8Array;

    interface ForeignKeyOptions {
        onDelete?       : 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION' | 'SET DEFAULT';
        onUpdate?       : 'CASCADE' | 'RESTRICT' | 'NO ACTION' | 'SET DEFAULT';
    }

    interface ColumnDefinition {
        name            : string;
        type            : ColumnType;
        primaryKey?     : boolean;
        autoIncrement?  : boolean;
        notNull?        : boolean;
        unique?         : boolean;
        default?        : SqlValue;
        references?     : { table: string; column: string; options?: ForeignKeyOptions };
    }

    interface UniqueConstraint {
        _type           : 'unique';
        columns         : string[];
    }

    interface IndexDefinition {
        _type           : 'index';
        name            : string;
        columns         : string[];
        unique?         : boolean;
    }

    interface TableSchema {
        name            : string;
        columns         : (ColumnDefinition | UniqueConstraint | IndexDefinition)[];
        indexes?        : { name: string; columns: string[]; unique?: boolean }[];
    }

    interface WhereCondition {
        column          : string;
        operator        : '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'IN' | 'IS NULL' | 'IS NOT NULL';
        value?          : SqlValue | SqlValue[];
    }

    interface QueryBuilder {
        select          : (columns?: string[]) => QueryBuilder;
        from            : (table: string) => QueryBuilder;
        where           : (condition: WhereCondition | WhereCondition[]) => QueryBuilder;
        and             : (condition: WhereCondition) => QueryBuilder;
        or              : (condition: WhereCondition) => QueryBuilder;
        orderBy         : (column: string, direction?: 'ASC' | 'DESC') => QueryBuilder;
        limit           : (count: number) => QueryBuilder;
        offset          : (count: number) => QueryBuilder;
        insert          : (table: string, data: Record<string, SqlValue>) => QueryBuilder;
        update          : (table: string, data: Record<string, SqlValue>) => QueryBuilder;
        delete          : (table: string) => QueryBuilder;
        execute         : () => unknown[];
        executeOne      : () => unknown | null;
        executeRaw      : (sql: string, params?: SqlValue[]) => unknown[];
        raw             : (sql: string, params?: SqlValue[]) => QueryBuilder;
    }

    interface TableRow {
        name            : string;
    }

    interface LastIdRow {
        id              : number | string;
    }

    interface QueryBuilderInternal {
        _select         : string[];
        _from           : string;
        _where          : string[];
        _orderBy        : string;
        _limit          : number | null;
        _offset         : number | null;
        _isInsert       : boolean;
        _isUpdate       : boolean;
        _isDelete       : boolean;
        _insertData     : Record<string, SqlValue> | null;
        _updateData     : Record<string, SqlValue> | null;
    }

declare class DB {
    private db;
    private schemas;
    private currentQuery;
    private currentParams;
    constructor(path?: string);
    close(): void;
    defineSchema(schema: TableSchema): void;
    getSchema(tableName: string): TableSchema | undefined;
    listTables(): string[];
    dropTable(tableName: string): void;
    query(): QueryBuilder;
    find(table: string, conditions: Record<string, SqlValue>): unknown[];
    findOne(table: string, conditions: Record<string, SqlValue>): unknown | null;
    findById(table: string, id: number | string): unknown | null;
    all(table: string): unknown[];
    insert(table: string, data: Record<string, SqlValue>): unknown;
    update(table: string, id: number | string, data: Record<string, SqlValue>): unknown | null;
    delete(table: string, id: number | string): boolean;
    transaction(callback: (db: DB) => void): void;
    exec(sql: string): void;
    raw(sql: string, params?: SqlValue[]): unknown[];
    rawOne(sql: string, params?: SqlValue[]): unknown | null;
    private reset;
    private createQueryBuilder;
    private generateCreateTableSQL;
}
declare function table(name: string, columns: (ColumnDefinition | UniqueConstraint | IndexDefinition)[]): TableSchema;
declare function column(name: string, type: ColumnType): ColumnDefinition;
declare function integer(name: string): ColumnDefinition;
declare function text(name: string): ColumnDefinition;
declare function real(name: string): ColumnDefinition;
declare function blob(name: string): ColumnDefinition;
declare function numeric(name: string): ColumnDefinition;
declare function primaryKey(col: ColumnDefinition, autoIncrement?: boolean): ColumnDefinition;
declare function notNull(col: ColumnDefinition): ColumnDefinition;
declare function unique(col: ColumnDefinition): ColumnDefinition;
declare function unique(columns: string[]): UniqueConstraint;
declare function defaultValue(col: ColumnDefinition, value: SqlValue): ColumnDefinition;
declare function references(col: ColumnDefinition, table: string, column: string, options?: ForeignKeyOptions): ColumnDefinition;
declare function index(name: string, columns: string | string[], unique?: boolean): IndexDefinition;

export { type ColumnDefinition, type ColumnType, DB, type ForeignKeyOptions, type IndexDefinition, type LastIdRow, type QueryBuilder, type QueryBuilderInternal, type SqlValue, type TableRow, type TableSchema, type UniqueConstraint, type WhereCondition, blob, column, defaultValue, index, integer, notNull, numeric, primaryKey, real, references, table, text, unique };
