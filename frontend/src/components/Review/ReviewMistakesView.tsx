import { ArrowRight } from "lucide-react";

export const ReviewMistakes = () => {
    return (
        <div className="flex h-screen items-center justify-center">
        <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-7 py-5 text-white text-lg font-semibold shadow-lg transition-all hover:bg-blue-700">
          Review <ArrowRight size={20} />
        </button>
      </div>
    )
}