import { describe, it, expect } from "vitest";
import { getDetailFields, readProductDetails } from "./productDetails";

describe("category extra details", () => {
  it("shows oil fields without helmet fields", () => {
    const labels = getDetailFields("Oil", "ENGINE_OIL").map(field => field.label);
    expect(labels).toContain("Volume");
    expect(labels).toContain("Viscosity Grade");
    expect(labels).not.toContain("Visor Type");
    expect(labels).not.toContain("Suitable for 4-Stroke");
  });
  it("specializes gloves and boots", () => {
    expect(getDetailFields("Riding Gear", "GLOVES").map(field => field.label)).toContain("Touchscreen Support");
    expect(getDetailFields("Riding Gear", "BOOTS").map(field => field.label)).toContain("Ankle Protection");
  });
  it("does not assume helmets for an unknown category", () => {
    expect(getDetailFields("", "CUSTOM").map(field => field.label)).toEqual(["Weight", "Material", "Dimensions", "Compatibility"]);
  });
  it("renders legacy oil data with oil labels and keeps explicit No", () => {
    const rows = readProductDetails({ weight: "1L", material: "Fully Synthetic", visorType: "10W-40", ventilation: false }, "", "OIL");
    expect(rows).toContainEqual({ label: "Volume", value: "1L" });
    expect(rows).toContainEqual({ label: "Viscosity Grade", value: "10W-40" });
    expect(rows).toContainEqual({ label: "Suitable for 4-Stroke", value: "No" });
  });
  it("preserves custom details and does not resurrect cleared legacy values", () => {
    expect(readProductDetails({ details: [], weight: "1kg", ventilation: true }, "", "FULL_FACE")).toEqual([]);
    expect(readProductDetails({ details: [{ label: "Warranty", value: "1 year" }] }, "", "OIL")).toEqual([{ label: "Warranty", value: "1 year" }]);
  });
  it("does not invent an IP rating from a legacy boolean", () => {
    expect(readProductDetails({ ventilation: true }, "", "ELECTRONICS")).toEqual([]);
  });
});
