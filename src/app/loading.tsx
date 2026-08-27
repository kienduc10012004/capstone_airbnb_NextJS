import LoadingState from "@/app/components/ui/LoadingState";
import Footer from "@/app/components/Footer";
import Header from "@/app/components/Header";

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6">
        <LoadingState
          className="min-h-[55vh]"
          label="Đang tải..."
        />
      </main>
      <Footer />
    </div>
  );
}
