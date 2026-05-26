export function SkeletonCard() {
  return (
    <div className="animate-pulse bg-white/[0.02] border border-white/5 rounded-xl h-[120px] w-full p-4 flex flex-col justify-between">
      <div className="flex justify-between items-center">
        <div className="h-4 w-16 bg-white/5 rounded"></div>
        <div className="h-4 w-8 bg-white/5 rounded"></div>
      </div>
      <div className="h-10 w-24 bg-white/5 rounded self-center mt-2"></div>
      <div className="h-3 w-32 bg-white/5 rounded mx-auto mt-2"></div>
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="animate-pulse bg-white/[0.02] border border-white/5 rounded-2xl h-[400px] w-full p-6 flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div className="h-6 w-48 bg-white/5 rounded"></div>
        <div className="flex gap-2">
          <div className="h-6 w-16 bg-white/5 rounded"></div>
          <div className="h-6 w-16 bg-white/5 rounded"></div>
        </div>
      </div>
      <div className="flex-1 w-full bg-white/5 rounded-xl"></div>
    </div>
  );
}

export function SkeletonTimeline() {
  return (
    <div className="animate-pulse bg-white/[0.02] border-b border-white/5 w-full h-[60px] flex items-center px-6 gap-4">
      <div className="h-4 w-32 bg-white/5 rounded"></div>
      <div className="flex-1 flex gap-2 overflow-hidden">
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className="h-8 w-2 bg-white/5 rounded"></div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonKPIBar() {
  return (
    <div className="animate-pulse bg-white/[0.02] border border-white/5 rounded-2xl w-full p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-[80px] w-full bg-white/5 rounded-xl"></div>
      ))}
    </div>
  );
}

export function SkeletonMachineCard() {
  return (
    <div className="animate-pulse bg-white/[0.02] border border-white/5 rounded-xl w-full p-4 flex justify-between items-center h-[72px]">
      <div className="flex gap-3 items-center">
        <div className="h-8 w-8 rounded-full bg-white/5"></div>
        <div className="space-y-2">
          <div className="h-4 w-12 bg-white/5 rounded"></div>
          <div className="h-3 w-16 bg-white/5 rounded"></div>
        </div>
      </div>
      <div className="h-6 w-16 rounded-full bg-white/5"></div>
    </div>
  );
}

export function SkeletonBanner() {
  return (
    <div className="animate-pulse bg-white/[0.02] border border-white/5 rounded-xl py-4 px-4 xl:py-6 xl:px-6 min-h-[120px] xl:min-h-[160px] flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0 w-full">
      <div className="flex-1 mr-0 md:mr-4 w-full space-y-3">
        <div className="h-6 w-48 bg-white/5 rounded"></div>
        <div className="h-16 w-full bg-white/5 rounded-lg"></div>
      </div>
      <div className="flex items-center gap-6 xl:gap-10 pr-0 md:pr-4">
        <div className="h-24 w-24 xl:h-32 xl:w-32 rounded-full bg-white/5"></div>
        <div className="flex flex-col gap-3 min-w-[130px] xl:min-w-[180px]">
          <div className="h-2 w-full bg-white/5 rounded"></div>
          <div className="h-2 w-full bg-white/5 rounded"></div>
          <div className="h-2 w-full bg-white/5 rounded"></div>
        </div>
      </div>
    </div>
  );
}
