import type { ShopPresentationEntry } from "@/features/shop/shop-content";

const lolipopStory = "Meowhe Lolipop is the first colorway of the Meowhe artisan keycap, combining a candy-inspired palette with mismatched eyes and a mischievous grin. Originally introduced during the Lazy Factory chapter, it returns as part of Luminal Factory’s revival.";

export function meowheDiscoveryStory(entry: ShopPresentationEntry | undefined, locale: "vi" | "en", context: "shop" | "raffle"): string {
  if (entry?.story) {
    if (locale === "vi" && entry.story === lolipopStory) {
      return "Meowhe Lolipop là phiên bản màu đầu tiên của artisan keycap Meowhe: sắc màu gợi kẹo ngọt, đôi mắt lệch và nụ cười tinh nghịch. Từng xuất hiện trong giai đoạn Lazy Factory, Meowhe trở lại cùng chương mới của Luminal Factory.";
    }
    return entry.story;
  }
  if (locale === "vi") {
    return context === "shop"
      ? "Meowhe là nhân vật với một quá khứ và nhiều phiên bản màu sắc. Khám phá những vật thể đã công bố và câu chuyện của từng phiên bản."
      : "Meowhe là nhân vật với một quá khứ và nhiều phiên bản màu sắc. Khám phá các đợt phát hành đã công bố và câu chuyện của từng phiên bản.";
  }
  return context === "shop"
    ? "Meowhe is a character with a past and many colorways. Explore the published objects and the story behind each version."
    : "Meowhe is a character with a past and many colorways. Explore announced releases and the story behind each version.";
}
