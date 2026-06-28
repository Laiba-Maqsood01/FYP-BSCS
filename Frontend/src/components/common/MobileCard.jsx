export default function MobileCard({ title, fields = [], actions }) {
  return (
    <div className="w-full rounded-xl overflow-hidden shadow-sm border border-gray-200 bg-white mx-1.25">
      <div className="p-4">

        {/* TITLE */}
        {title && (
          <h3 className="mb-3 text-base font-semibold text-gray-800">
            {title}
          </h3>
        )}

        {/* FIELDS */}
        <div className="flex flex-col">
          {fields.map((field, index) => (
            <div key={index} className="flex justify-between mb-1.5">
              <span className="text-[13px] text-gray-500">{field.label}</span>
              <span className="font-medium text-right max-w-[60%] wrap-break-word">{field.value}</span>
            </div>
          ))}
        </div>

        {/* ACTIONS */}
        {actions && (
          <div className="mt-3 flex gap-2 flex-wrap">
            {actions}
          </div>
        )}

      </div>
    </div>
  );
}
