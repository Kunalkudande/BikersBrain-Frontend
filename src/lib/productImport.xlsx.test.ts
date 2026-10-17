import { expect, it } from 'vitest';
import { Buffer } from 'node:buffer';
import { zipSync, strToU8 } from 'fflate';
import { readSheet } from 'read-excel-file/node';
import { importRows } from './productImport';

it('reads a real XLSX workbook with text headers and numeric inventory cells', async () => {
  const rows = [['name', 'brand', 'category', 'description', 'price', 'stock'], ['Test Coil', 'Test', 'PARTS', 'Replacement ignition coil for the specified model.', 650, 0]];
  const sheet = rows.map((row, r) => `<row r="${r + 1}">${row.map((value, c) => typeof value === 'number' ? `<c r="${String.fromCharCode(65 + c)}${r + 1}"><v>${value}</v></c>` : `<c r="${String.fromCharCode(65 + c)}${r + 1}" t="inlineStr"><is><t>${value}</t></is></c>`).join('')}</row>`).join('');
  const files = {
    '[Content_Types].xml': '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
    '_rels/.rels': '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    'xl/workbook.xml': '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Products" sheetId="1" r:id="rId1"/></sheets></workbook>',
    'xl/_rels/workbook.xml.rels': '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
    'xl/worksheets/sheet1.xml': `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheet}</sheetData></worksheet>`,
  };
  const bytes = zipSync(Object.fromEntries(Object.entries(files).map(([name, xml]) => [name, strToU8(xml)])));
  const parsed = importRows(await readSheet(Buffer.from(bytes)));
  expect(parsed[0]).toMatchObject({ row: 2, values: { name: 'Test Coil', price: '650', stock: '0' } });
});
