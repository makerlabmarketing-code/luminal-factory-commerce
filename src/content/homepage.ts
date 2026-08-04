export type PresentationCreation = Readonly<{ id: string; title: string; category: string; status: "Khái niệm" | "Lưu trữ" | "Sắp tới"; tone: string }>;

export const homepageContent = {
  featuredCreations: [
    { id: "study-01", title: "Nghiên cứu Tinh thể", category: "Artisan keycap", status: "Khái niệm", tone: "ice" },
    { id: "study-02", title: "Nhân vật Số 02", category: "3D character", status: "Lưu trữ", tone: "violet" },
    { id: "study-03", title: "Vật thể Ánh kim", category: "Collectible study", status: "Sắp tới", tone: "rose" },
  ] satisfies readonly PresentationCreation[],
  commissionSteps: [
    { title: "Gửi ý tưởng", description: "Chia sẻ câu chuyện, hình ảnh tham chiếu và mong muốn của bạn." },
    { title: "Cùng duyệt phạm vi", description: "Xưởng trao đổi hướng tạo hình, vật liệu và khả năng thực hiện." },
    { title: "Thiết kế & sản xuất", description: "Tạo hình, thử mẫu và hoàn thiện theo phạm vi đã thống nhất." },
    { title: "Bàn giao", description: "Kiểm tra, đóng gói và gửi tạo tác đã hoàn thiện." },
  ],
  processSteps: ["Ý niệm", "Điêu khắc", "Thử mẫu", "Đúc & hoàn thiện", "Đóng gói"],
  galleryStudies: [
    { id: "gallery-01", label: "Form study / translucent", tone: "ice" },
    { id: "gallery-02", label: "Character study / silhouette", tone: "violet" },
    { id: "gallery-03", label: "Material study / reflection", tone: "rose" },
  ],
} as const;
