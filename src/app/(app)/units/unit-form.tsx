import type { Unit } from "@/lib/types";
import { SubmitButton } from "@/components/submit-button";

export function UnitForm({
  action,
  unit,
  error,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  unit?: Unit;
  error?: string;
  submitLabel: string;
}) {
  return (
    <form action={action} className="flex flex-col gap-4">
      {error && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Label *</span>
        <input
          name="label"
          required
          defaultValue={unit?.label}
          placeholder="e.g. Unit 4 — Mobile Clinic"
          className="min-h-12 rounded-md border border-gray-300 px-4 text-base"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Unit type</span>
        <input
          name="unit_type"
          list="unit-type-options"
          defaultValue={unit?.unit_type ?? ""}
          placeholder="e.g. CT Trailer"
          className="min-h-12 rounded-md border border-gray-300 px-4 text-base"
        />
        <datalist id="unit-type-options">
          <option value="CT Trailer" />
          <option value="MRI Trailer" />
          <option value="Mammography Trailer" />
          <option value="Generator Trailer" />
        </datalist>
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Make</span>
          <input
            name="make"
            defaultValue={unit?.make ?? ""}
            className="min-h-12 rounded-md border border-gray-300 px-4 text-base"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Model</span>
          <input
            name="model"
            defaultValue={unit?.model ?? ""}
            className="min-h-12 rounded-md border border-gray-300 px-4 text-base"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Year</span>
          <input
            name="year"
            type="number"
            inputMode="numeric"
            defaultValue={unit?.year ?? ""}
            className="min-h-12 rounded-md border border-gray-300 px-4 text-base"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">VIN</span>
          <input
            name="vin"
            defaultValue={unit?.vin ?? ""}
            className="min-h-12 rounded-md border border-gray-300 px-4 text-base"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Photo</span>
        <input
          name="photo"
          type="file"
          accept="image/*"
          capture="environment"
          className="min-h-12 rounded-md border border-gray-300 px-4 py-3 text-base"
        />
        {unit?.photo_url && (
          <p className="text-xs text-gray-500">Uploading a new photo replaces the current one.</p>
        )}
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Notes</span>
        <textarea
          name="notes"
          rows={3}
          defaultValue={unit?.notes ?? ""}
          className="rounded-md border border-gray-300 px-4 py-3 text-base"
        />
      </label>

      <SubmitButton className="min-h-12 rounded-md bg-navy-700 px-4 text-base font-semibold text-white active:bg-navy-800">
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
