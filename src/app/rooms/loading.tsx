import Footer from "@/app/components/Footer";
import Header from "@/app/components/Header";
import LoadingState from "@/app/components/ui/LoadingState";
import { uiClassNames } from "@/app/lib/styles";

export default function RoomsLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className={`${uiClassNames.appContainer} flex-1 py-10`}>
        <LoadingState label="Đang tải danh sách phòng..." variant="cards" />
      </main>
      <Footer />
    </div>
  );
}
