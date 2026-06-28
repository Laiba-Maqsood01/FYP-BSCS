export function Pagination({ pagination, onPrev, onNext }) {
  if (pagination.totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
      <p className="text-xs text-brand-muted">
        Page {pagination.page} of {pagination.totalPages}
      </p>
      <div className="flex gap-2">
        <button
          onClick={onPrev}
          disabled={pagination.page === 1}
          className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 cursor-pointer transition-colors"
        >
          Previous
        </button>
        <button
          onClick={onNext}
          disabled={pagination.page === pagination.totalPages}
          className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 cursor-pointer transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}

// Text-button variant (used below card lists).
export function TextPagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-4 px-1">
      <p className="text-xs text-brand-muted">Page {page} of {totalPages}</p>
      <div className="flex gap-2">
        <button
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 cursor-pointer transition-colors"
        >
          Previous
        </button>
        <button
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 cursor-pointer transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}
