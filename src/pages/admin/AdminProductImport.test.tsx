import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminProductImport from './AdminProductImport';
import { adminApi } from '@/lib/api';

vi.mock('@/lib/api', () => ({ adminApi: { previewProductImport: vi.fn(), commitProductImport: vi.fn(), getCategories: vi.fn() } }));
beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);
const upload = () => {
  const file = new File(['csv'], 'products.csv', { type: 'text/csv' });
  Object.defineProperty(file, 'text', { value: async () => 'name,brand,category,description,price,stock\nTest Coil,Test,PARTS,A sufficiently detailed product description,650,10' });
  fireEvent.change(screen.getByLabelText('Product file'), { target: { files: [file] } });
};
describe('reviewed bulk import', () => {
  it('requires review before committing and keeps the same token for a retry', async () => {
    vi.mocked(adminApi.previewProductImport).mockResolvedValue({ success: true, data: { token: 'review-token', canImport: true, creates: 1, updates: 0, rows: [{ row: 2, name: 'Test Coil', sku: 'NEW-SKU', action: 'create', stock: 10, errors: [] }] } } as never);
    vi.mocked(adminApi.commitProductImport).mockRejectedValueOnce(new Error('Connection lost')).mockResolvedValueOnce({ success: true, data: { created: 1, updated: 0 } } as never);
    render(<MemoryRouter><AdminProductImport /></MemoryRouter>); upload();
    const confirm = await screen.findByRole('button', { name: 'Confirm import' });
    expect(confirm).toBeDisabled(); expect(adminApi.commitProductImport).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('checkbox')); fireEvent.click(confirm);
    expect(await screen.findByRole('alert')).toHaveTextContent('Retry this preview');
    fireEvent.click(confirm);
    await screen.findByText('Import complete: 1 created, 0 updated.');
    expect(vi.mocked(adminApi.commitProductImport).mock.calls).toEqual([['review-token'], ['review-token']]);
  });
  it('blocks saving when a row has validation errors', async () => {
    vi.mocked(adminApi.previewProductImport).mockResolvedValue({ success: true, data: { canImport: false, creates: 0, updates: 0, rows: [{ row: 2, name: 'Test Coil', errors: ['Invalid category'], action: 'create' }] } } as never);
    render(<MemoryRouter><AdminProductImport /></MemoryRouter>); upload();
    await screen.findByText('Invalid category');
    expect(screen.queryByRole('button', { name: 'Confirm import' })).not.toBeInTheDocument();
    expect(adminApi.commitProductImport).not.toHaveBeenCalled();
  });
});
