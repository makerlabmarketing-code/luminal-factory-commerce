import type { PresentationMedia } from "@/types/media";

export type PresentationCreation = Readonly<{ id: string; title: string; category: string; status: "Khái niệm" | "Lưu trữ" | "Sắp tới"; tone: string }>;

export type HomeHeroContent = Readonly<{
  mode: "releasePlaceholder";
  eyebrow: string;
  statusLabel: string;
  title: string;
  description: string;
  primaryAction: Readonly<{ label: string; href: "#release-information" }>;
  timingLabel: string;
  timeZoneLabel: string;
  media: PresentationMedia & Readonly<{ label: string; placeholderNotice: string }>;
  metadata: readonly Readonly<{ label: string; value: string }>[];
  secondaryEntries: readonly Readonly<{ label: string; status: "Sắp mở" }>[];
}>;

export const homeHeroContent = {
  mode: "releasePlaceholder",
  eyebrow: "Luminal Release",
  statusLabel: "Đợt raffle tiếp theo đang được chuẩn bị",
  title: "Featured Object Study",
  description:
    "Một nghiên cứu vật thể sưu tầm theo tinh thần raffle-first của Luminal Factory: tập trung vào chất liệu, nhịp phát hành có chủ đích và thông tin minh bạch trước khi có bất kỳ entry hoặc thanh toán nào.",
  primaryAction: { label: "Khám phá bản phát hành", href: "#release-information" },
  timingLabel: "Lịch phát hành sẽ được công bố",
  timeZoneLabel: "Múi giờ trình bày: Asia/Ho_Chi_Minh",
  media: {
    type: "image",
    src: "/placeholders/internal-object-study.svg",
    alt: "Nghiên cứu vật thể trừu tượng nội bộ dùng làm placeholder, chưa phải media sản phẩm được phê duyệt.",
    width: 1200,
    height: 1500,
    aspectRatio: "4 / 5",
    credit: "Internal Luminal Factory placeholder",
    source: "internal-placeholder",
    historicalBrand: false,
    productionApproved: false,
    objectPosition: "50% 42%",
    placeholderFallback: "CSS abstract object study fallback",
    label: "Object study placeholder",
    placeholderNotice: "PLACEHOLDER MEDIA — NOT PRODUCTION APPROVED",
  },
  metadata: [
    { label: "Release mode", value: "Non-transactional placeholder" },
    { label: "Entry flow", value: "Chưa mở" },
    { label: "Schedule", value: "Sẽ được công bố" },
  ],
  secondaryEntries: [
    { label: "Shop", status: "Sắp mở" },
    { label: "Commission", status: "Sắp mở" },
  ],
} as const satisfies HomeHeroContent;
