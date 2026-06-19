const IDENTIFIER_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

export function quoteIdentifier(identifier: string): string {
  if (!IDENTIFIER_REGEX.test(identifier)) {
    throw new Error(`Identificador SQL inválido: ${identifier}`);
  }
  return `"${identifier}"`;
}

export function quoteTable(schema: string, table: string): string {
  return `${quoteIdentifier(schema)}.${quoteIdentifier(table)}`;
}
