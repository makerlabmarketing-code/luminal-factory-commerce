export type RafflePresentationState =
  | "upcoming"
  | "open"
  | "closed"
  | "drawing"
  | "completed"
  | "unavailable"
  | "unknown";

export type RaffleProcessStep = Readonly<{
  number: string;
  title: string;
  description: string;
}>;

export type RafflePresentation = Readonly<{
  eyebrow: string;
  title: string;
  summary: string;
  presentationState: RafflePresentationState;
  statusLabel: string;
  statusDescription: string;
  timeZone: "Asia/Ho_Chi_Minh";
  releaseTitle: string;
  releaseStory: string;
  materialNote: string;
  howItWorks: readonly RaffleProcessStep[];
  trustNotes: readonly string[];
}>;

export const rafflePresentation = {
  eyebrow: "Luminal raffle",
  title: "Raffle-first discovery, trước khi entry flow được mở.",
  summary:
    "Đây là nơi theo dõi đợt raffle hiện tại hoặc tiếp theo của Luminal Factory. Phiên bản này chỉ trình bày release context và cách raffle vận hành, chưa nhận entry.",
  presentationState: "upcoming",
  statusLabel: "Đợt raffle tiếp theo đang được chuẩn bị",
  statusDescription:
    "Chưa có thời gian mở/đóng được công bố, không có countdown và không có entry action trong phiên bản này.",
  timeZone: "Asia/Ho_Chi_Minh",
  releaseTitle: "Next raffle object study",
  releaseStory:
    "Một placeholder có chủ đích cho release tiếp theo, giữ trọng tâm ở object và ngôn ngữ vật liệu cho tới khi asset sản xuất được duyệt.",
  materialNote:
    "Internal presentation study only. Không phải tên sản phẩm, edition size, giá, stock hay cam kết vật liệu.",
  howItWorks: [
    {
      number: "01",
      title: "Release được công bố",
      description: "Luminal công bố raffle và cửa sổ tham gia khi dữ liệu chính thức đã sẵn sàng.",
    },
    {
      number: "02",
      title: "Collector gửi entry",
      description: "Trong flow tương lai, collector đủ điều kiện có thể gửi entry trong thời gian được phép.",
    },
    {
      number: "03",
      title: "Entry window đóng",
      description: "Entry chỉ ghi nhận việc tham gia. Nó không phải order và không tự tạo doanh thu.",
    },
    {
      number: "04",
      title: "Winner flow diễn ra sau đó",
      description: "Winner administration thuộc workflow được duyệt; payment/order chỉ xuất hiện ở bước phù hợp sau này.",
    },
  ],
  trustNotes: [
    "Entry không đảm bảo quyền mua.",
    "Entry không phải order và không tự phát sinh payment obligation.",
    "Eligibility, duplicate-entry và winner rules sẽ chỉ được công bố từ contract đã duyệt.",
    "Storefront công khai không thực hiện winner administration.",
  ],
} as const satisfies RafflePresentation;

export function getRafflePresentation(): RafflePresentation {
  return rafflePresentation;
}
