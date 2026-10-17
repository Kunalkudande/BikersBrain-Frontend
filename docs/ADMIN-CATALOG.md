# Admin catalog tools

## Bulk upload

Open **Admin → Products → Bulk upload**. Download the CSV template and category list. CSV files can be edited in Excel; both CSV and `.xlsx` files are accepted. The first Excel sheet is read. Maximum: 200 product rows, 2 MB per file.

Required columns: `name`, `brand`, `category`, `description`, `price`, `stock`. Column names are case-sensitive. Use plain INR amounts without currency symbols or thousands separators. Description must be at least 20 characters. Category can be its stored value or an unambiguous label.

Optional columns:

| Column | Behaviour |
| --- | --- |
| sku | Blank creates a product with an automatic SKU. An exact, case-sensitive existing SKU updates that product. A new SKU creates a product. Duplicate SKUs in one file are rejected. |
| discountPrice | Blank preserves the current discount on updates. `CLEAR` removes it. Numeric discounts must be below the price. |
| lowStockThreshold | Whole number, 0–1,000,000. Defaults to 5 for new products; blank preserves an existing threshold. |
| isActive | `true` or `false`. New products default to hidden. Blank preserves existing visibility. |
| imageUrls | Up to 10 HTTPS URLs separated by `|`, for new products only. Files are not downloaded by the server. Existing images must be changed in the editor. |
| details | JSON array of `label`/`value` pairs. Supplying it replaces Extra Details; blank preserves them. `[]` clears them. Existing feature lists are preserved on updates. |

Review the new/update action, generated SKU, category, stock and visibility for every row. Correct errors and re-upload the file; an error report can be downloaded. Check the review acknowledgement, then select **Confirm import**. No product rows are written during preview. All rows commit in one database transaction, or none do.

Previews belong to the signed-in admin and expire after one hour. Retrying the same confirmed preview returns the original result and does not create duplicate products. Products changed since preview produce a conflict; upload again to review the latest data. Bulk updates keep existing product URLs stable. Products that already have variants must be updated through the editor, to avoid treating base stock as variant stock. Variants can be added to newly imported products afterward.

## Duplicate product

Select the copy icon in **Admin → Products**. The new product opens in the existing editor with its details, prices, images, variants and alert threshold copied. It has a new product SKU, new variant SKUs, a new URL and a “(Copy)” name. Product and variant stock start at zero. Visibility is hidden. Sales, orders and reviews are not copied.

Review the name, compatibility, prices and stock, save, then activate the product from the Products list. Images initially share the source asset, but have independent database records. Removing an image or deleting either product will not delete the Cloudinary asset while another product still references it.

## Low-stock alerts

Set **Low-stock alert level** in the product editor. An alert appears when stock is at or below that level. Zero means out-of-stock alerts only. For products with variants, each variant is checked independently; a sold-out option still raises an alert when other options have stock.

The dashboard's Low Stock section links to **Products → View low-stock alerts**. The Products page shows the count of active products needing attention, total sellable stock and a list of affected variants. Hidden products are excluded from alerts. Existing variant IDs are preserved when saving stock. Options referenced by orders or carts cannot be removed; set their stock to zero instead. These are in-app alerts; no email or WhatsApp messages are sent.

## Deployment and verification

- Deploy both frontend and backend.
- Backend migration: `20261017183000_admin_catalog_tools`. Run `npx prisma migrate deploy` and `npx prisma generate` on deployment. The migration adds a default alert level of 5 to existing products and a table for reviewed imports. It has been applied to this workspace's configured database.
- Standard frontend/backend builds remain unchanged. No payment or customer-facing design changes are included.
- Frontend: `npm test`, `npm run build`, `npx tsc --noEmit -p tsconfig.app.json`.
- Backend: `npm run build`, `npx ts-node tests/adminCatalog.validation.ts`, `npx ts-node tests/adminCatalog.integration.ts`.
- Integration tests mock persistence; they do not import or duplicate products in the connected store.
