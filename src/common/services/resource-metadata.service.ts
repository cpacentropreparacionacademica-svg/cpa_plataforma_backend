import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ResourceConfig } from '../../modules/resource-registry';

export interface TableColumnMetadata {
  columnName: string;
  isNullable: boolean;
  dataType: string;
}

@Injectable()
export class ResourceMetadataService {
  private readonly cache = new Map<string, TableColumnMetadata[]>();

  constructor(private readonly dataSource: DataSource) {}

  async getColumns(resource: ResourceConfig): Promise<TableColumnMetadata[]> {
    const key = `${resource.schema}.${resource.tableName}`;
    const cached = this.cache.get(key);
    if (cached) return cached;

    const rows = await this.dataSource.query(
      `SELECT column_name AS "columnName", is_nullable AS "isNullable", data_type AS "dataType"
       FROM information_schema.columns
       WHERE table_schema = $1 AND table_name = $2
       ORDER BY ordinal_position`,
      [resource.schema, resource.tableName],
    ) as Array<{ columnName: string; isNullable: string; dataType: string }>;

    const columns = rows.map((row) => ({
      columnName: row.columnName,
      isNullable: row.isNullable === 'YES',
      dataType: row.dataType,
    }));

    this.cache.set(key, columns);
    return columns;
  }

  async getColumnNames(resource: ResourceConfig): Promise<Set<string>> {
    const columns = await this.getColumns(resource);
    return new Set(columns.map((column) => column.columnName));
  }
}
