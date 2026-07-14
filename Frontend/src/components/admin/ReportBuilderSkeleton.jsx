// Full-page loading skeleton for the Report Builder.
// Mirrors the real layout: fixed top bar, step sidebar, checklist section.

function Bar({ className = "" }) {
  return <div className={`bg-slate-200 rounded ${className}`} />;
}

function ChecklistRow() {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-3 border-b border-slate-100">
      <Bar className="h-3.5 w-32" />
      <div className="flex items-center gap-1.5">
        <Bar className="h-6 w-12 rounded-full" />
        <Bar className="h-6 w-20 rounded-full" />
        <Bar className="h-6 w-16 rounded-full" />
      </div>
    </div>
  );
}

function ChecklistGroup() {
  return (
    <div className="border-b border-r border-slate-100">
      {/* group sub-header */}
      <div className="px-3 py-2.5 bg-slate-50 border-b border-slate-200">
        <Bar className="h-3 w-24" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => <ChecklistRow key={i} />)}
    </div>
  );
}

export default function ReportBuilderSkeleton() {
  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden animate-pulse">
      {/* top bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0">
        <Bar className="h-4 w-16" />
        <div className="flex flex-col items-center gap-1.5">
          <Bar className="h-4 w-44" />
          <Bar className="h-3 w-24" />
        </div>
        <Bar className="h-4 w-14" />
      </div>

      <div className="flex flex-1 min-h-0 w-full">
        {/* sidebar step navigator */}
        <div className="hidden lg:flex flex-col w-52 shrink-0 py-6 gap-1 border-r border-slate-200 bg-white">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5">
              <div className="w-5 h-5 rounded-full bg-slate-200 shrink-0" />
              <Bar className="h-3.5 flex-1 max-w-28" />
            </div>
          ))}
        </div>

        {/* main content */}
        <div className="flex-1 overflow-hidden min-w-0">
          <div className="px-4 lg:px-8 py-6 flex flex-col gap-6 max-w-5xl mx-auto">
            {/* mobile step indicator */}
            <div className="flex lg:hidden items-center gap-2 pb-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Bar key={i} className="h-7 w-24 rounded-full shrink-0" />
              ))}
            </div>

            {/* section card */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {/* dark section header */}
              <div className="bg-slate-700 px-4 py-3 flex items-center justify-between">
                <div className="h-4 w-48 rounded bg-slate-500" />
                <div className="h-4 w-10 rounded bg-slate-500" />
              </div>
              {/* groups in 2-column layout */}
              <div className="grid grid-cols-1 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => <ChecklistGroup key={i} />)}
              </div>
            </div>

            {/* navigation buttons */}
            <div className="flex justify-between pt-2 border-t border-slate-100">
              <Bar className="h-9 w-28 rounded-lg" />
              <Bar className="h-9 w-24 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
