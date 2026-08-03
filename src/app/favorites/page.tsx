import type { Metadata } from "next";

import FavoritesPageContent from "@/app/components/favorites/FavoritesPageContent";

export const metadata: Metadata = {
  title: "Phòng yêu thích",
  description: "Xem lại những phòng bạn đã lưu vào danh sách yêu thích.",
};

const FavoritesPage = () => <FavoritesPageContent />;

export default FavoritesPage;
