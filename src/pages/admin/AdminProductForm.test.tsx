import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import AdminProductForm from "./AdminProductForm";
import { adminApi } from "@/lib/api";

vi.mock("@/lib/api", () => ({ adminApi: {
  getCategories: vi.fn(), createProduct: vi.fn(), getProductBySlug: vi.fn(), updateProduct: vi.fn(),
} }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(adminApi.getCategories).mockResolvedValue({ data: [
    { id: "helmet", value: "FULL_FACE", label: "Full Face", group: "Helmets", isActive: true, parentId: null },
    { id: "oil", value: "OIL", label: "Engine Oil", group: "Oil", isActive: true, parentId: null },
  ] } as never);
  vi.mocked(adminApi.createProduct).mockResolvedValue({ data: { id: "created" } } as never);
});
afterEach(cleanup);

async function openForm() {
  render(<MemoryRouter><AdminProductForm /></MemoryRouter>);
  await screen.findByRole("option", { name: "Full Face" });
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "FULL_FACE" } });
}
function tab(name: string) { fireEvent.click(screen.getByRole("button", { name })); }
function fillBasics() {
  fireEvent.change(screen.getByPlaceholderText("e.g. Product name"), { target: { value: "Test Helmet" } });
  fireEvent.change(screen.getByPlaceholderText("e.g. Brand name"), { target: { value: "Test" } });
  fireEvent.change(screen.getByRole("textbox", { name: "SKU" }), { target: { value: "TEST-001" } });
  fireEvent.change(screen.getByPlaceholderText("e.g. 50"), { target: { value: "0" } });
  fireEvent.change(screen.getByPlaceholderText("e.g. 2999"), { target: { value: "2999" } });
  fireEvent.change(screen.getByPlaceholderText("Detailed product description (min 20 characters)..."), { target: { value: "A detailed description of this helmet." } });
}
describe("admin extra details flow", () => {
  it("generates a stable SKU and preserves manual overrides", async () => {
    await openForm();
    fireEvent.change(screen.getByPlaceholderText("e.g. Product name"), { target: { value: "Test Helmet" } });
    fireEvent.change(screen.getByPlaceholderText("e.g. Brand name"), { target: { value: "Test" } });
    const automatic = (screen.getByRole("textbox", { name: "SKU" }) as HTMLInputElement).value;
    expect(automatic).toMatch(/^BB-TEST-TEST-HELMET-[A-F0-9]{12}$/);
    tab("Extra Details"); tab("Basic Info");
    expect(screen.getByRole("textbox", { name: "SKU" })).toHaveValue(automatic);
    fireEvent.change(screen.getByRole("textbox", { name: "SKU" }), { target: { value: "MY-001" } });
    fireEvent.change(screen.getByPlaceholderText("e.g. Product name"), { target: { value: "Another Helmet" } });
    expect(screen.getByRole("textbox", { name: "SKU" })).toHaveValue("MY-001");
    tab("Use automatic SKU");
    expect(screen.getByRole("textbox", { name: "SKU" })).toHaveValue(automatic.replace("TEST-HELMET", "ANOTHER-HELMET"));
  });
  it("submits the automatic SKU without manual SKU input", async () => {
    await openForm(); fillBasics(); tab("Use automatic SKU");
    const sku = (screen.getByRole("textbox", { name: "SKU" }) as HTMLInputElement).value;
    fireEvent.click(screen.getAllByRole("button", { name: "Create Product" })[0]);
    await waitFor(() => expect(adminApi.createProduct).toHaveBeenCalled());
    expect(vi.mocked(adminApi.createProduct).mock.calls[0][0].sku).toBe(sku);
  });
  it("starts claims blank and preserves drafts when switching categories", async () => {
    await openForm(); tab("Extra Details");
    expect(screen.getByRole("combobox", { name: "Sun Visor" })).toHaveValue("");
    fireEvent.change(screen.getByRole("combobox", { name: "Sun Visor" }), { target: { value: "No" } });
    tab("Basic Info"); fireEvent.change(screen.getByRole("combobox"), { target: { value: "OIL" } });
    tab("Extra Details"); expect(screen.getByRole("textbox", { name: "Volume" })).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Sun Visor" })).not.toBeInTheDocument();
    tab("Basic Info"); fireEvent.change(screen.getByRole("combobox"), { target: { value: "FULL_FACE" } });
    tab("Extra Details"); expect(screen.getByRole("combobox", { name: "Sun Visor" })).toHaveValue("No");
  });
  it("saves a custom detail while allowing optional fields to be cleared", async () => {
    await openForm(); fillBasics(); tab("Extra Details");
    fireEvent.change(screen.getByRole("combobox", { name: "Sun Visor" }), { target: { value: "Yes" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Sun Visor" }), { target: { value: "" } });
    tab("Add another detail");
    fireEvent.change(screen.getByPlaceholderText("e.g. Warranty"), { target: { value: "Warranty" } });
    fireEvent.change(screen.getByPlaceholderText("e.g. 1 year"), { target: { value: "2 years" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Create Product" })[0]);
    await waitFor(() => expect(adminApi.createProduct).toHaveBeenCalled());
    expect(vi.mocked(adminApi.createProduct).mock.calls[0][0].specifications).toMatchObject({ details: [{ label: "Warranty", value: "2 years" }] });
  });
  it("clears legacy details on edit while preserving existing features", async () => {
    vi.mocked(adminApi.getProductBySlug).mockResolvedValue({ data: {
      id: "existing", name: "Existing Helmet", brand: "Test", category: "FULL_FACE",
      description: "An existing product description.", price: 100, stock: 0, sku: "EXISTING-001",
      specifications: { weight: "1kg", material: "N/A", visorType: "N/A", ventilation: false, certifications: [], features: ["Existing feature"] },
    } } as never);
    vi.mocked(adminApi.updateProduct).mockResolvedValue({ data: {} } as never);
    render(<MemoryRouter initialEntries={["/edit/existing"]}><Routes><Route path="/edit/:slug" element={<AdminProductForm />} /><Route path="/admin/products" element={<div>Saved</div>} /></Routes></MemoryRouter>);
    await screen.findByRole("button", { name: "Extra Details" });
    expect(screen.getByRole("textbox", { name: "SKU" })).toHaveValue("EXISTING-001");
    fireEvent.change(screen.getByPlaceholderText("e.g. Product name"), { target: { value: "Renamed Helmet" } });
    expect(screen.getByRole("textbox", { name: "SKU" })).toHaveValue("EXISTING-001");
    tab("Extra Details");
    expect(screen.getByRole("textbox", { name: "Weight" })).toHaveValue("1kg");
    expect(screen.getByRole("combobox", { name: "Ventilation" })).toHaveValue("No");
    fireEvent.change(screen.getByRole("textbox", { name: "Weight" }), { target: { value: "" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Ventilation" }), { target: { value: "" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Save Changes" })[0]);
    await waitFor(() => expect(adminApi.updateProduct).toHaveBeenCalled());
    expect(vi.mocked(adminApi.updateProduct).mock.calls[0][1].specifications).toMatchObject({ details: [], features: ["Existing feature"] });
  });
  it("blocks incomplete custom details with an actionable error", async () => {
    await openForm(); fillBasics(); tab("Extra Details"); tab("Add another detail");
    fireEvent.change(screen.getByPlaceholderText("e.g. Warranty"), { target: { value: "Warranty" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Create Product" })[0]);
    expect(screen.getByRole("alert")).toHaveTextContent("Enter both a name and value");
    expect(adminApi.createProduct).not.toHaveBeenCalled();
  });
});

it("saves a zero low-stock threshold without replacing it with the default", async () => {
  await openForm(); fillBasics();
  fireEvent.change(screen.getByRole("spinbutton", { name: "Low-stock alert level" }), { target: { value: "0" } });
  fireEvent.click(screen.getAllByRole("button", { name: "Create Product" })[0]);
  await waitFor(() => expect(adminApi.createProduct).toHaveBeenCalled());
  expect(vi.mocked(adminApi.createProduct).mock.calls[0][0].lowStockThreshold).toBe(0);
});
