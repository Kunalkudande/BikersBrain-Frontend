import { describe, expect, it } from 'vitest';
import { importRows, parseCsv } from './productImport';

describe('product file import', () => {
  it('reads BOM, escaped quotes, commas and multiline descriptions', () => {
    const rows = importRows(parseCsv('\uFEFFname,brand,category,description,price,stock\r\n"Coil, small",Test,PARTS,"A ""genuine"" replacement\r\nfor this model",650,0\r\n'));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ row: 2, values: { name: 'Coil, small', description: 'A "genuine" replacement\r\nfor this model', stock: '0' } });
  });
  it('rejects malformed or ambiguous files before sending anything to the backend', () => {
    expect(() => parseCsv('"Unclosed')).toThrow('not closed');
    expect(() => importRows([['name', 'name']])).toThrow('unique');
    expect(() => importRows([['name', 'unknown']])).toThrow('Unknown');
    expect(() => importRows([['name', 'brand', 'category', 'description', 'price', 'stock'], ['Coil', 'Test', 'PARTS', 'Description', 650, 1, 'extra']])).toThrow('extra columns');
  });
  it('handles numeric Excel cells and preserves worksheet row numbers', () => {
    const rows = importRows([['name', 'brand', 'category', 'description', 'price', 'stock', 'isActive'], [], ['Coil', 'Test', 'PARTS', 'Description of the product', 650, 0, false]]);
    expect(rows[0]).toMatchObject({ row: 3, values: { price: '650', stock: '0', isActive: 'false' } });
  });
  it('limits imports and rejects dates used as prices', () => {
    const headers = ['name', 'brand', 'category', 'description', 'price', 'stock'];
    expect(() => importRows([headers, ...Array.from({ length: 201 }, () => ['Coil'])])).toThrow('200');
    expect(() => importRows([headers, ['Coil', 'Test', 'PARTS', 'Description', new Date(), 2]])).toThrow('dates');
  });
});
