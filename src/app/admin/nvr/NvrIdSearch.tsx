/** "Find by ID" box; a plain GET form, so it works without client code. */
export function NvrIdSearch({ defaultValue = "" }: { defaultValue?: string }) {
  return (
    <form action="/admin/nvr/question" method="get" className="flex flex-wrap items-end gap-2">
      <label className="flex-1 min-w-[10rem]">
        <span className="eyebrow block mb-1.5">Find question by ID</span>
        <input
          name="id"
          inputMode="numeric"
          pattern="[0-9]*"
          required
          defaultValue={defaultValue}
          placeholder="e.g. 3009"
          className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink tabular focus:border-brand focus:outline-none"
        />
      </label>
      <button type="submit" className="btn-primary px-4 py-2 text-sm">
        Open
      </button>
    </form>
  );
}
