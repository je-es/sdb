// src/types.d.ts
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗

    export type ColumnType = 'INTEGER' | 'TEXT' | 'REAL' | 'BLOB' | 'NUMERIC';
    export type SqlValue = string | number | boolean | null | Uint8Array;

    export interface ForeignKeyOptions {
        onDelete?       : 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION' | 'SET DEFAULT';
        onUpdate?       : 'CASCADE' | 'RESTRICT' | 'NO ACTION' | 'SET DEFAULT';
    }

    export interface ColumnDefinition {
        name            : string;
        type            : ColumnType;
        primaryKey?     : boolean;
        autoIncrement?  : boolean;
        notNull?        : boolean;
        unique?         : boolean;
        default?        : SqlValue;
        references?     : { table: string; column: string; options?: ForeignKeyOptions };
    }

    export interface UniqueConstraint {
        _type           : 'unique';
        columns         : string[];
    }

    export interface IndexDefinition {
        _type           : 'index';
        name            : string;
        columns         : string[];
        unique?         : boolean;
    }

    export interface TableSchema {
        name            : string;
        columns         : (ColumnDefinition | UniqueConstraint | IndexDefinition)[];
        indexes?        : { name: string; columns: string[]; unique?: boolean }[];
    }

    export interface WhereCondition {
        column          : string;
        operator        : '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'IN' | 'IS NULL' | 'IS NOT NULL';
        value?          : SqlValue | SqlValue[];
    }

    export interface QueryBuilder {
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

    export interface TableRow {
        name            : string;
    }

    export interface LastIdRow {
        id              : number | string;
    }

    export interface QueryBuilderInternal {
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

// ╚══════════════════════════════════════════════════════════════════════════════════════╝