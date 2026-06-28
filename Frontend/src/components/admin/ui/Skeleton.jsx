// Skeleton placeholder components reused across admin tables and card lists.

export function SkeletonRow({ cols = 5 }) {
  return (
    <tr className="border-b border-gray-50">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div
            className="h-4 rounded bg-gray-100 animate-pulse"
            style={{ width: i === 0 ? 180 : 100 }}
          />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 animate-pulse">
      <div className="flex justify-between mb-3">
        <div className="flex-1 mr-4">
          <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
        <div className="h-5 w-16 bg-gray-100 rounded" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="h-3 bg-gray-100 rounded w-16 mb-1" />
          <div className="h-4 bg-gray-100 rounded w-20" />
        </div>
        <div>
          <div className="h-3 bg-gray-100 rounded w-16 mb-1" />
          <div className="h-4 bg-gray-100 rounded w-20" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonListingCard() {
  return (
    <div className="bg-white rounded-xl p-4 animate-pulse border border-gray-100">
      <div className="flex flex-col gap-2 mb-3">
        <div className="h-4 rounded w-3/4 bg-gray-100" />
        <div className="h-3 rounded w-1/2 bg-gray-100" />
      </div>
      <div className="h-8 rounded bg-gray-50" />
    </div>
  );
}

export function SkeletonTableRow({ cols = 7 }) {
  return (
    <tr className="border-b border-gray-50">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div
            className="h-4 rounded animate-pulse bg-gray-100"
            style={{ width: i === 0 ? 160 : 80 }}
          />
        </td>
      ))}
    </tr>
  );
}
