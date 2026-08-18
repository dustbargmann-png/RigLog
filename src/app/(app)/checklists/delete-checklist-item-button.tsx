"use client";

export function DeleteChecklistItemButton({ action }: { action: () => void }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Remove this checklist item?")) e.preventDefault();
      }}
    >
      <button
        type="submit"
        className="min-h-11 rounded-md border border-red-200 px-3 text-sm font-semibold text-red-600 active:bg-red-50"
      >
        Delete
      </button>
    </form>
  );
}
