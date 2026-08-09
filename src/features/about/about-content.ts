export type AboutPresentation = Readonly<{
  eyebrow: string;
  brandLine: string;
  title: string;
  summary: string;
  objectCategories: readonly Readonly<{ title: string; description: string }>[];
  processSteps: readonly Readonly<{ number: string; title: string; description: string }>[];
  principles: readonly Readonly<{ title: string; description: string }>[];
  routeBridges: readonly Readonly<{
    label: string;
    description: string;
    href: "/raffle" | "/archive" | "/shop" | "/commission";
  }>[];
}>;

export const aboutPresentation = {
  eyebrow: "About Luminal",
  brandLine: "Shaped by light. Crafted to last.",
  title: "Một studio nhỏ dành cho những object có hình khối, bề mặt và câu chuyện riêng.",
  summary:
    "Luminal Factory tập trung vào artisan keycap, collectible object, character/object study và những commission phù hợp với ngôn ngữ tạo hình của studio. Mỗi hướng được phát triển theo từng bước từ concept đến một vật thể có thể cầm, nhìn và giữ lại.",
  objectCategories: [
    {
      title: "Artisan keycap",
      description: "Những object nhỏ nơi silhouette, character, bề mặt và cảm giác vật liệu cùng tồn tại trong một footprint rất giới hạn.",
    },
    {
      title: "Collectible object",
      description: "Các object và character study được phát triển như những vật thể sưu tầm độc lập, không chỉ là hình ảnh hay concept trên màn hình.",
    },
    {
      title: "Commission",
      description: "Những hướng custom hoặc branded object được xem xét theo độ phù hợp, khả thi và phạm vi trước khi trở thành một project thực tế.",
    },
  ],
  processSteps: [
    {
      number: "01",
      title: "Concept & form",
      description: "Bắt đầu từ ý tưởng, silhouette, character language và cách object nên tồn tại trong không gian thật.",
    },
    {
      number: "02",
      title: "3D & prototype",
      description: "Sculpt, thử tỉ lệ và prototype giúp kiểm tra hình khối trước khi chuyển sang quá trình tạo vật thể vật lý.",
    },
    {
      number: "03",
      title: "Make",
      description: "Tùy object, quá trình có thể bao gồm printing, mold/casting hoặc những phương pháp tạo hình phù hợp khác.",
    },
    {
      number: "04",
      title: "Finish & present",
      description: "Hoàn thiện bề mặt, kiểm tra cảm giác tổng thể và chuẩn bị object cho release, archive hoặc commission handoff.",
    },
  ],
  principles: [
    {
      title: "Form first",
      description: "Hình khối và cảm giác của object dẫn đường cho quyết định thị giác, thay vì thêm chi tiết chỉ để tạo cảm giác phức tạp.",
    },
    {
      title: "Small-batch attention",
      description: "Quy mô nhỏ cho phép tập trung vào iteration, bề mặt và presentation mà không biến sự khan hiếm thành một lời hứa marketing.",
    },
    {
      title: "Truthful presentation",
      description: "Thông tin public chỉ nói những gì đã được xác nhận. Giá, timing, availability và production claims không được tự suy diễn.",
    },
  ],
  routeBridges: [
    { label: "Raffle", description: "Theo dõi release và trạng thái raffle public.", href: "/raffle" },
    { label: "Archive", description: "Xem các object study theo hướng historical/editorial.", href: "/archive" },
    { label: "Shop", description: "Khám phá các object presentation trực tiếp.", href: "/shop" },
    { label: "Commission", description: "Bắt đầu một inquiry để studio review custom-object context.", href: "/commission" },
  ],
} as const satisfies AboutPresentation;

export function getAboutPresentation(): AboutPresentation {
  return aboutPresentation;
}
