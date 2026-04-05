import { SkeletonBox } from "./SkeletonBox";

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#f7f8fc] p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <SkeletonBox className="h-8 w-56" />
            <SkeletonBox className="h-4 w-80" />
          </div>
          <div className="flex items-center gap-3">
            <SkeletonBox className="h-10 w-28 rounded-xl" />
            <SkeletonBox className="h-10 w-10 rounded-full" />
          </div>
        </div>

        {/* 요약 카드 */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <div className="mb-4 flex items-center justify-between">
                <SkeletonBox className="h-4 w-24" />
                <SkeletonBox className="h-8 w-8 rounded-full" />
              </div>
              <SkeletonBox className="mb-3 h-8 w-20" />
              <SkeletonBox className="h-3 w-28" />
            </div>
          ))}
        </div>

        {/* 메인 영역 */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* 왼쪽 큰 차트/리스트 */}
          <div className="xl:col-span-2 space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <SkeletonBox className="h-6 w-40" />
                <SkeletonBox className="h-9 w-24 rounded-xl" />
              </div>
              <SkeletonBox className="h-72 w-full rounded-2xl" />
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <SkeletonBox className="h-6 w-36" />
                <SkeletonBox className="h-9 w-20 rounded-xl" />
              </div>

              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 rounded-xl border border-gray-100 p-4"
                  >
                    <SkeletonBox className="h-14 w-14 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <SkeletonBox className="h-4 w-2/5" />
                      <SkeletonBox className="h-3 w-3/5" />
                    </div>
                    <SkeletonBox className="h-8 w-16 rounded-lg" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 오른쪽 사이드 */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <SkeletonBox className="mb-4 h-6 w-28" />
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <SkeletonBox className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <SkeletonBox className="h-4 w-24" />
                      <SkeletonBox className="h-3 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <SkeletonBox className="mb-4 h-6 w-32" />
              <SkeletonBox className="h-44 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}