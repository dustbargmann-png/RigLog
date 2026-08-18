import { SubmitButton } from "@/components/submit-button";
import { createTemplate } from "../actions";

export default async function NewTemplatePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">New checklist template</h1>

      {error && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <form action={createTemplate} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Name *</span>
          <input
            name="name"
            required
            placeholder="e.g. Inside CT Trailer Assessment"
            className="min-h-12 rounded-md border border-gray-300 px-4 text-base"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Category</span>
          <input
            name="category"
            placeholder="e.g. CT Trailer"
            className="min-h-12 rounded-md border border-gray-300 px-4 text-base"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Run every (days)</span>
          <input
            name="interval_days"
            type="number"
            inputMode="numeric"
            defaultValue={365}
            className="min-h-12 rounded-md border border-gray-300 px-4 text-base"
          />
        </label>

        <SubmitButton className="min-h-12 rounded-md bg-navy-700 px-4 text-base font-semibold text-white active:bg-navy-800">
          Create template
        </SubmitButton>
      </form>
    </div>
  );
}
