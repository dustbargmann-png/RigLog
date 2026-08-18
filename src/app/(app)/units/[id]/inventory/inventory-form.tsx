import type { InventoryItem } from "@/lib/types";

const CATEGORY_SUGGESTIONS = [
  "Gantry",
  "Power Injector",
  "Patient Lift",
  "Generator",
  "HVAC",
  "Electrical Panel",
  "Plumbing",
  "Fire Safety",
  "Patient Accessory",
];

export function InventoryItemForm({
  action,
  item,
  error,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  item?: InventoryItem;
  error?: string;
  submitLabel: string;
}) {
  return (
    <form action={action} className="flex flex-col gap-4">
      {error && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Name *</span>
        <input
          name="name"
          required
          defaultValue={item?.name}
          placeholder="e.g. CT Gantry"
          className="min-h-12 rounded-md border border-gray-300 px-4 text-base"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Category</span>
        <input
          name="category"
          list="inventory-category-options"
          defaultValue={item?.category ?? ""}
          className="min-h-12 rounded-md border border-gray-300 px-4 text-base"
        />
        <datalist id="inventory-category-options">
          {CATEGORY_SUGGESTIONS.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Model</span>
          <input
            name="model"
            defaultValue={item?.model ?? ""}
            className="min-h-12 rounded-md border border-gray-300 px-4 text-base"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Serial / Bar code</span>
          <input
            name="serial_number"
            defaultValue={item?.serial_number ?? ""}
            className="min-h-12 rounded-md border border-gray-300 px-4 text-base"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Condition</span>
        <select
          name="condition"
          defaultValue={item?.condition ?? "good"}
          className="min-h-12 rounded-md border border-gray-300 px-4 text-base"
        >
          <option value="good">Good</option>
          <option value="needs_attention">Needs attention</option>
          <option value="out_of_service">Out of service</option>
        </select>
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Install date</span>
          <input
            name="install_date"
            type="date"
            defaultValue={item?.install_date ?? ""}
            className="min-h-12 rounded-md border border-gray-300 px-4 text-base"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Warranty expires</span>
          <input
            name="warranty_expiration_date"
            type="date"
            defaultValue={item?.warranty_expiration_date ?? ""}
            className="min-h-12 rounded-md border border-gray-300 px-4 text-base"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Next maintenance due</span>
        <input
          name="next_maintenance_date"
          type="date"
          defaultValue={item?.next_maintenance_date ?? ""}
          className="min-h-12 rounded-md border border-gray-300 px-4 text-base"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Photo</span>
        <input
          name="photo"
          type="file"
          accept="image/*"
          capture="environment"
          className="min-h-12 rounded-md border border-gray-300 px-4 py-3 text-base"
        />
        {item?.photo_url && (
          <p className="text-xs text-gray-500">Uploading a new photo replaces the current one.</p>
        )}
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Notes</span>
        <textarea
          name="notes"
          rows={3}
          defaultValue={item?.notes ?? ""}
          className="rounded-md border border-gray-300 px-4 py-3 text-base"
        />
      </label>

      <button
        type="submit"
        className="min-h-12 rounded-md bg-blue-600 px-4 text-base font-semibold text-white active:bg-blue-700"
      >
        {submitLabel}
      </button>
    </form>
  );
}
