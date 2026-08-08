export type CommissionAvailabilityMode = "coming-soon";

export type CommissionCategory = Readonly<{
  title: string;
  description: string;
}>;

export type CommissionProcessStep = Readonly<{
  number: string;
  title: string;
  description: string;
}>;

export type CommissionPresentation = Readonly<{
  eyebrow: string;
  title: string;
  summary: string;
  availabilityMode: CommissionAvailabilityMode;
  availabilityLabel: string;
  availabilityDescription: string;
  categories: readonly CommissionCategory[];
  processSteps: readonly CommissionProcessStep[];
  preparationItems: readonly string[];
  expectationItems: readonly string[];
}>;

export const commissionPresentation = {
  eyebrow: "Luminal commission",
  title: "Một cuộc trao đổi về object riêng, không phải checkout tức thì.",
  summary:
    "Commission là hướng hợp tác dành cho artisan keycap, collectible object và những object custom quy mô nhỏ. Trang này hiện chỉ giúp bạn hiểu phạm vi và quy trình trước khi hệ thống gửi yêu cầu được mở.",
  availabilityMode: "coming-soon",
  availabilityLabel: "Commission inquiry đang được chuẩn bị",
  availabilityDescription:
    "Chưa có form gửi yêu cầu hoặc lịch slot trực tiếp. Việc xem trang này không tạo đơn hàng, báo giá, thanh toán hay giữ chỗ sản xuất.",
  categories: [
    {
      title: "Artisan keycap",
      description: "Khám phá một hướng keycap custom dựa trên concept, nhân vật hoặc ngôn ngữ hình khối phù hợp với Luminal.",
    },
    {
      title: "Collectible object",
      description: "Trao đổi về một object sưu tầm nhỏ với trọng tâm ở silhouette, vật liệu cảm nhận và câu chuyện thị giác.",
    },
    {
      title: "Branded / custom object",
      description: "Một hướng object custom quy mô nhỏ cho brand hoặc collaboration, chỉ được chốt sau khi studio đánh giá độ phù hợp và khả thi.",
    },
  ],
  processSteps: [
    {
      number: "01",
      title: "Chuẩn bị ý tưởng",
      description: "Xác định object mong muốn, mục đích và reference cần thiết để diễn đạt hướng sáng tạo.",
    },
    {
      number: "02",
      title: "Studio review",
      description: "Luminal xem xét độ phù hợp, khả thi và phạm vi trước khi đi sâu vào điều khoản thương mại.",
    },
    {
      number: "03",
      title: "Scope & quote",
      description: "Nếu được chấp nhận, scope, timing, quote và điều kiện liên quan mới được trao đổi và thống nhất.",
    },
    {
      number: "04",
      title: "Production",
      description: "Sản xuất chỉ bắt đầu sau khi hai bên đã chốt phạm vi và các điều kiện cần thiết cho commission đó.",
    },
  ],
  preparationItems: [
    "Loại object và mục đích sử dụng",
    "Concept hoặc câu chuyện muốn thể hiện",
    "Reference mà bạn có quyền chia sẻ để trao đổi",
    "Ngữ cảnh kích thước hoặc nhu cầu sử dụng nếu có",
    "Budget context và các ràng buộc quan trọng nếu cần",
  ],
  expectationItems: [
    "Mỗi yêu cầu đều cần được review và không phải yêu cầu nào cũng được nhận.",
    "Quote và timing phụ thuộc vào scope, chưa được công bố cố định trên trang này.",
    "Không có slot sản xuất nào được giữ chỉ bằng việc xem hoặc liên hệ về commission.",
    "Commission request không tự động trở thành order, invoice hoặc payment obligation.",
  ],
} as const satisfies CommissionPresentation;

export function getCommissionPresentation(): CommissionPresentation {
  return commissionPresentation;
}
