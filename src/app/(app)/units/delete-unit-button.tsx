"use client";

import { SubmitButton } from "@/components/submit-button";

export function DeleteUnitButton({ action }: { action: () => void }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Delete this unit? This can't be undone.")) e.preventDefault();
      }}
    >
      <SubmitButton className="min-h-11 w-full rounded-md border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 active:bg-red-50">
        Delete unit
      </SubmitButton>
    </form>
  );
}
