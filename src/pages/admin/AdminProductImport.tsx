import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Upload, Download, RefreshCw, ArrowLeft, CheckCircle } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { readProductFile, csvDownload, IMPORT_HEADERS, type ImportRow } from '@/lib/productImport';

interface Preview { canImport: boolean; token?: string; creates: number; updates: number; rows: { row: number; name: string; sku: string; action: string; errors: string[]; category?: string; stock?: number; price?: number; discountPrice?: number | null; lowStockThreshold?: number; isActive?: boolean }[]; }
const button = 'inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white disabled:opacity-40';

export default function AdminProductImport() {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [sourceRows, setSourceRows] = useState<ImportRow[]>([]);
  const [result, setResult] = useState<{ created: number; updated: number } | null>(null);
  const [reviewed, setReviewed] = useState(false);
  const selectFile = async (file?: File) => {
    if (!file) return;
    setBusy(true); setError(''); setPreview(null); setResult(null); setReviewed(false); setFileName(file.name);
    try {
      const rows = await readProductFile(file);
      setSourceRows(rows);
      const response = await adminApi.previewProductImport(rows);
      setPreview(response.data as Preview);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not read the file.'); }
    finally { setBusy(false); }
  };
  const commit = async () => {
    if (!preview?.canImport || !preview.token || !reviewed) return;
    setBusy(true); setError('');
    try { const response = await adminApi.commitProductImport(preview.token); setResult(response.data as { created: number; updated: number }); }
    catch (e) { setError((e instanceof Error ? e.message : 'Import could not be confirmed.') + ' Retry this preview to check the same import; it will not create duplicate products. If the preview expired or the catalog changed, upload the file again.'); }
    finally { setBusy(false); }
  };
  return <div className="p-6 lg:p-8 space-y-6 text-white">
    <Link to="/admin/products" className="inline-flex gap-2 items-center text-sm text-white/60"><ArrowLeft size={16} /> Back to products</Link>
    <div><h1 className="font-oswald text-2xl lg:text-3xl font-bold">Bulk product upload</h1><p className="text-sm text-white/50 mt-2">Upload CSV or Excel (.xlsx), review every row, then import. Up to 200 products per file, 2 MB maximum.</p></div>
    <section className="rounded-2xl bg-white/[0.03] border border-white/10 p-5 space-y-4">
      <h2 className="font-semibold">1. Prepare your file</h2>
      <p className="text-sm text-white/60">Required: name, brand, category, description (20+ characters), price and stock. Use category values from the list below or an exact category label.</p>
      <p className="text-sm text-white/60">Leave SKU blank to create a product with an automatic SKU. An existing SKU updates that product. Blank optional fields keep existing values; use <strong>CLEAR</strong> in discountPrice to remove a discount. New products are hidden unless isActive is explicitly true.</p>
      <div className="flex flex-wrap gap-3"><button className={button} onClick={() => csvDownload('bikersbrain-product-template.csv', [IMPORT_HEADERS, ['Example Coil', 'Your Brand', 'REPLACE_WITH_CATEGORY_VALUE', 'Replacement ignition coil. Confirm compatibility before ordering.', 650, 10, '', '', 5, 'false', '', '']])}><Download size={16} /> Download CSV template</button><button className={button} onClick={async () => { try { const response = await adminApi.getCategories(); const categories = response.data as { value: string; label: string; isActive: boolean }[]; csvDownload('bikersbrain-categories.csv', [['category', 'label'], ...categories.filter(c => c.isActive).map(c => [c.value, c.label])]); } catch { setError('Could not download categories. Please try again.'); } }}>Download category list</button></div>
      <details className="text-sm text-white/60"><summary className="cursor-pointer">Optional columns and update rules</summary><p className="mt-2">lowStockThreshold sets the alert level (default 5). isActive accepts true/false. imageUrls accepts up to 10 HTTPS URLs separated by | for new products only. details accepts a JSON array such as {`[{"label":"Compatible models","value":"Confirm exact bike model"}]`}; providing it replaces Extra Details. Existing products with variants must be updated in the editor to protect variant stock. Prices use plain numbers in INR, without currency symbols or commas. Images and variants can also be added after import.</p></details>
    </section>
    <section className="rounded-2xl bg-white/[0.03] border border-white/10 p-5 space-y-4">
      <h2 className="font-semibold">2. Upload and review</h2>
      <label className="block text-sm text-white/70">Choose product file<input aria-label="Product file" type="file" accept=".csv,.xlsx" disabled={busy} className="block mt-2 max-w-full text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-orange-500 file:text-white file:px-4 file:py-2" onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; void selectFile(file); }} /></label>
      {busy && <p role="status" className="flex items-center gap-2 text-white/60"><RefreshCw className="animate-spin" size={16} /> Processing…</p>}
      {error && <p role="alert" className="text-red-400 text-sm">{error}</p>}
      {preview && !result && <>
        <p className="text-sm">{fileName}: {preview.rows.length} rows · {preview.creates} new · {preview.updates} updates{!preview.canImport && <span className="text-red-400"> · Fix all errors and upload again. Nothing has been imported.</span>}</p>
        {!preview.canImport && <button className={button} onClick={() => csvDownload('product-import-errors.csv', [['row', 'name', 'sku', 'errors'], ...preview.rows.filter(row => row.errors.length).map(row => [row.row, row.name, row.sku, row.errors.join('; ')])])}>Download error report</button>}
        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-white/40"><tr>{['Row', 'Action', 'Product', 'SKU', 'Category', 'Price / discount', 'Stock / alert level', 'Visibility', 'Validation'].map(label => <th key={label} className="p-3 font-medium">{label}</th>)}</tr></thead><tbody>{preview.rows.map(row => <tr key={row.row} className="border-t border-white/10"><td className="p-3">{row.row}</td><td className="p-3">{row.action}</td><td className="p-3 min-w-40">{row.name}<details className="text-white/60 text-xs mt-2"><summary>Review details</summary><p className="mt-2 whitespace-pre-wrap">{sourceRows.find(source => source.row === row.row)?.values.description}</p><p>Brand: {sourceRows.find(source => source.row === row.row)?.values.brand}</p><p className="break-all">Image URLs: {sourceRows.find(source => source.row === row.row)?.values.imageUrls || "Unchanged / none"}</p><p className="break-all">Extra Details: {sourceRows.find(source => source.row === row.row)?.values.details || "Unchanged / none"}</p></details></td><td className="p-3 break-all">{row.sku}</td><td className="p-3">{row.category}</td><td className="p-3">₹{row.price}{row.discountPrice != null && <p className="text-xs text-orange-400">Sale: ₹{row.discountPrice}</p>}</td><td className="p-3">{row.stock}<p className="text-xs text-white/40">Alert at {row.lowStockThreshold ?? 5}</p></td><td className="p-3">{row.isActive ? 'Active' : 'Hidden'}</td><td className="p-3 min-w-48">{row.errors.length ? <ul className="text-red-400">{row.errors.map((message, i) => <li key={i}>{message}</li>)}</ul> : <span className="text-emerald-400">Ready</span>}</td></tr>)}</tbody></table></div>
        {preview.canImport && <div className="space-y-4 border-t border-white/10 pt-4"><label className="flex items-start gap-3 text-sm"><input type="checkbox" disabled={busy} checked={reviewed} onChange={e => setReviewed(e.target.checked)} className="mt-1" /> I reviewed these products, stock levels and updates. Import all {preview.rows.length} rows together.</label><button disabled={busy || !reviewed} onClick={commit} className={button + ' bg-orange-500 border-orange-500'}><Upload size={16} /> Confirm import</button><p className="text-xs text-white/40">No rows are saved unless the entire import succeeds. The preview is valid for one hour.</p></div>}
      </>}
      {result && <div role="status" className="flex flex-col gap-3"><CheckCircle className="text-emerald-400" /><p>Import complete: {result.created} created, {result.updated} updated.</p><Link to="/admin/products" className="text-orange-400 underline">Review products and activate them when ready</Link></div>}
    </section>
  </div>;
}
