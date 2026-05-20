import { Loader2 } from 'lucide-react';

export default function PageLoader() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-[#0038FF]" />
      <p className="text-sm text-gray-500 font-medium">Loading...</p>
    </div>
  );
}
