import Footer from "@/app/components/Footer";
import Header from "@/app/components/Header";
import LoadingState from "@/app/components/ui/LoadingState";
import { uiClassNames } from "@/app/lib/styles";

export default function RoomDetailLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className={`${uiClassNames.appContainer} flex-1 py-8`}>
        <LoadingState label="Đang tải thông tin phòng..." variant="profile" />
      </main>
      <Footer />
    </div>
  );
}
