# C-038 — Bản nháp nội dung storefront

Ngày: 03/10/2026. Trạng thái: đề xuất để review, chưa áp dụng lên trang.
Sheet điều phối là nguồn trạng thái chính; cột Quyết định C-038 vẫn Chưa duyệt.

## Hướng ngôn ngữ đề xuất

Tiếng Anh làm ngôn ngữ chính cho storefront, giữ tên Product/Colorway nguyên bản.
Bản tiếng Việt bên cạnh giúp chủ studio duyệt ý và có thể dùng cho bản dịch sau.
Đây là đề xuất; chưa thêm bộ chuyển ngôn ngữ hoặc tự đổi toàn bộ website.
ERP tiếp tục dùng tiếng Việt theo quy tắc hiện có.

Copy giới thiệu nói về sản phẩm và trải nghiệm của người xem. Trạng thái raffle,
mua hàng và gửi commission phải theo khả năng thực tế; không đưa tên phase,
framework, database, transport hoặc nguồn dữ liệu nội bộ ra màn hình khách.

## Home — thêm lời giải thích ngắn, giữ thứ tự section hiện có

| Vị trí | English draft | Bản tiếng Việt để duyệt |
| --- | --- | --- |
| Giải thích artisan keycap dưới phần giới thiệu Meowhe | Small sculpted characters for your keyboard. Explore Meowhe through its individual colorways. | Những nhân vật nhỏ được tạo hình cho bàn phím của bạn. Khám phá Meowhe qua từng phối màu. |
| Nhãn gallery | A closer look | Nhìn gần hơn |
| Mô tả gallery | Color, expression and the details that give each object its character. | Màu sắc, biểu cảm và những chi tiết tạo nên cá tính của mỗi sản phẩm. |
| CTA khám phá Product | Explore Meowhe | Khám phá Meowhe |
| CTA release khi chưa có raffle mở | Explore the collection | Khám phá bộ sưu tập |
| Thông báo chưa có release được công bố | No raffle is open right now. Browse the collection while we prepare what comes next. | Hiện chưa có raffle mở. Bạn có thể khám phá bộ sưu tập trong lúc chờ đợt phát hành tiếp theo. |

Giải thích trên chỉ là copy cho vị trí sẵn có hoặc bản thiết kế C-039 được duyệt.
CTA Product chỉ bật khi có trang công khai hợp lệ; draft Meowhe không được link
ra storefront. Thông báo raffle chỉ dùng khi nguồn trạng thái đã xác nhận không
có đợt mở; không lấy một placeholder làm bằng chứng. Không đặt ngày hoặc countdown.

## Shop — danh mục khám phá

| Vị trí / trạng thái | English draft | Bản tiếng Việt để duyệt |
| --- | --- | --- |
| Tiêu đề | Objects with a character of their own. | Những vật thể mang cá tính riêng. |
| Mô tả | Explore artisan keycaps and collectible objects from Luminal Factory. Open an object to see its story and release details. | Khám phá artisan keycap và những vật thể sưu tầm của Luminal Factory. Mở từng sản phẩm để xem câu chuyện và thông tin phát hành. |
| Ô tìm kiếm | Search objects | Tìm sản phẩm |
| Bộ lọc loại | Object type | Loại sản phẩm |
| Bộ lọc phát hành | Release type | Hình thức phát hành |
| Nút áp dụng / bỏ lọc | Apply filters / Clear filters | Áp dụng / Bỏ bộ lọc |
| Không có kết quả tìm kiếm | No objects match your search. Try another name or clear the filters. | Chưa có sản phẩm phù hợp. Thử tên khác hoặc bỏ bộ lọc. |
| Danh mục chưa có nội dung | More objects are on the way. Explore our work in the Archive. | Bộ sưu tập đang được bổ sung. Khám phá những sản phẩm tại Archive. |
| Nguồn danh mục tạm không truy cập được | The collection is temporarily unavailable. Please try again shortly. | Tạm thời chưa tải được bộ sưu tập. Vui lòng thử lại sau. |
| CTA card | View object | Xem sản phẩm |

Tách lỗi tải khỏi danh mục trống. Không đổi lỗi truy cập thành “sold out”.
Không hiển thị Object Study mẫu như một sản phẩm thật trên Production.
Danh sách và lọc tiếp tục dùng dữ liệu hiện có; chỉnh nhãn không đổi release_type.
Artisan keycap phải đi theo raffle; dữ liệu Lolipop đang ghi direct cần được
kiểm tra riêng, không được hợp thức hóa bằng một nhãn “Buy now”.

## Product / Colorway — story và trạng thái phát hành

| Vị trí | English draft | Bản tiếng Việt để duyệt |
| --- | --- | --- |
| Tên sculpt / phối màu | Meowhe / {Colorway name} | Meowhe / {Tên phối màu} |
| Story Meowhe | Meet Meowhe: a mischievous artisan keycap character from Luminal Factory. Each colorway offers another way to discover its personality. | Làm quen với Meowhe — nhân vật artisan keycap tinh nghịch của Luminal Factory. Mỗi phối màu mang đến một cách khám phá cá tính của Meowhe. |
| Nhãn gallery / story | Details / The story | Chi tiết / Câu chuyện |
| Nhãn thông số | Object details | Thông tin sản phẩm |
| Giá khi có giá đã được xác nhận | Price | Giá |
| Chưa có thông tin phát hành | Release details will be shared when confirmed. | Thông tin phát hành sẽ được bổ sung khi được xác nhận. |
| Raffle đang mở, có detail thật | View raffle | Xem raffle |
| Raffle đã đóng, có detail thật | View release | Xem đợt phát hành |
| Sản phẩm lưu trữ, có hồ sơ thật | Explore this colorway | Khám phá phối màu này |
| Mua trực tiếp chưa hoạt động | Online purchasing is not available yet. | Hiện chưa thể mua trực tiếp trên website. |
| Quay lại | Back to the collection | Về bộ sưu tập |

Không lặp lại cùng một mô tả ở hero và story. Chưa có story riêng cho Lolipop,
Mictlán hoặc Mono thì để editor chờ tư liệu, không tự gán lore cho tên phối màu.
Ẩn trường chưa xác nhận thay vì đặt một đoạn “data authority” hoặc bảng thông số
rỗng. Không suy đoán vật liệu, kích thước, stem, compatibility, số lượng hay phụ kiện.
CTA theo đúng trạng thái của release; không đồng nghĩa “có giá” với “có thể mua”.

## Raffle — trạng thái thật và hướng dẫn ngắn

| Vị trí / trạng thái | English draft | Bản tiếng Việt để duyệt |
| --- | --- | --- |
| Tiêu đề | Discover the next Luminal release. | Khám phá đợt phát hành tiếp theo của Luminal. |
| Mô tả | Find the colorways, release details and entry information for each raffle here. | Xem các phối màu, thông tin phát hành và hướng dẫn tham gia của từng raffle tại đây. |
| Chưa có đợt mở | No raffle is open right now. | Hiện chưa có raffle mở. |
| Chưa công bố lịch | The next release will appear here when its details are confirmed. | Đợt phát hành tiếp theo sẽ xuất hiện tại đây khi thông tin được xác nhận. |
| Sắp mở, có lịch thật | Entries open {date/time/timezone}. | Mở tham gia lúc {ngày/giờ/múi giờ}. |
| Đang mở, nhận entry thật | Entries are open until {date/time/timezone}. | Nhận đăng ký đến {ngày/giờ/múi giờ}. |
| Đã đóng | Entries are closed for this release. | Đợt phát hành này đã đóng đăng ký. |
| Chưa rõ trạng thái / lỗi tải | Release details are temporarily unavailable. Please try again shortly. | Tạm thời chưa tải được thông tin phát hành. Vui lòng thử lại sau. |
| CTA khi thật sự nhận entry | Enter raffle | Tham gia raffle |
| Không có CTA entry hợp lệ | Explore the collection | Khám phá bộ sưu tập |

Bản nháp hướng dẫn tổng quát:

1. **Explore the release.** Read the colorway details and the rules for that release.
   / **Khám phá đợt phát hành.** Xem các phối màu và thể lệ của đợt đó.
2. **Submit an entry.** Enter during the announced window when entries are open.
   / **Gửi đăng ký.** Tham gia trong khoảng thời gian được công bố khi đợt mở.
3. **Follow the result.** The release page explains the next steps for selected entries.
   / **Theo dõi kết quả.** Trang đợt phát hành hướng dẫn bước tiếp theo cho người được chọn.

Entry is not a purchase and does not guarantee selection.
/ Đăng ký không phải đơn mua hàng và không bảo đảm được chọn.

Hướng dẫn này không tự chốt luật chọn, giới hạn entry, thời hạn thanh toán hay
phí vận chuyển. Những chi tiết đó thuộc C-041 và chỉ công bố sau khi chủ studio
xác nhận. Không dùng disabled CTA để gợi rằng hệ thống đang nhận entry.

## Archive — hình ảnh và ký ức của từng phối màu

| Vị trí | English draft | Bản tiếng Việt để duyệt |
| --- | --- | --- |
| Tiêu đề | A record of our objects. | Những dấu ấn trong bộ sưu tập. |
| Mô tả | Explore the characters, colorways and details from Luminal Factory's collection. | Khám phá nhân vật, phối màu và những chi tiết trong bộ sưu tập Luminal Factory. |
| CTA card khi có detail thật | Explore colorway | Khám phá phối màu |
| CTA tới danh sách raffle | Explore raffles | Xem các raffle |
| Chưa có hồ sơ được công bố | We're preparing more stories from the collection. | Những câu chuyện trong bộ sưu tập đang được bổ sung. |

Link về danh sách raffle là `/raffle`, không phải một anchor Home thiếu section.
Không gọi một phối màu là “past release”, “sold out” hoặc “limited edition” khi
chưa có mốc và thông tin xác nhận. Chuyển Object Study mẫu sang hồ sơ thật là C-042,
không chỉ thay tên trong copy. Không phát hành hồ sơ nếu ảnh/story chưa được duyệt.

## About / Commission / Footer

| Vị trí | English draft | Bản tiếng Việt để duyệt |
| --- | --- | --- |
| About headline | Small characters. A world of their own. | Nhân vật nhỏ. Thế giới riêng. |
| About opening | Luminal Factory is an artisan studio creating keycaps and collectible objects. We shape characters through design, sculpting and hands-on making. | Luminal Factory là xưởng tạo tác artisan keycap và những vật thể sưu tầm. Chúng tôi phát triển nhân vật qua thiết kế, tạo hình và quá trình làm thủ công. |
| About process | Concept / Sculpt / Make / Finish | Ý tưởng / Tạo hình / Chế tác / Hoàn thiện |
| Commission headline | Let's shape an idea together. | Cùng tạo hình một ý tưởng. |
| Commission intro | A character, a keycap or a small collectible object — every commission starts with an idea and a conversation about what we can make. | Một nhân vật, một keycap hay một vật thể sưu tầm nhỏ — mỗi commission bắt đầu từ ý tưởng và trao đổi về điều chúng ta có thể tạo nên. |
| Chưa nhận inquiry online | Online commission inquiries are not available yet. | Hiện chưa nhận yêu cầu commission trực tiếp trên website. |
| Có kênh liên hệ đã được xác nhận | Contact the studio to discuss your idea. | Liên hệ xưởng để trao đổi ý tưởng của bạn. |
| Có form gửi thật | Tell us about your idea | Chia sẻ ý tưởng của bạn |
| Footer mô tả | Artisan keycaps, sculpted characters and collectible objects by Luminal Factory. | Artisan keycap, nhân vật được tạo hình và những vật thể sưu tầm của Luminal Factory. |
| Footer nhãn hỗ trợ | Contact / Care & Shipping / Privacy / Terms | Liên hệ / Bảo quản & Vận chuyển / Quyền riêng tư / Điều khoản |

Không tự thêm email/social, nhận slot, báo giá hoặc hứa deadline.
Privacy/Terms chỉ thành link khi có trang chính sách thật; nội dung chính sách
không thuộc bản copy này. Ảnh xưởng, credit, lịch sử rebrand và case commission
là tư liệu C-043; chưa thêm địa chỉ, nhân sự hoặc thời gian hoạt động chưa xác nhận.

## Metadata draft

| Route | English description đề xuất |
| --- | --- |
| `/shop` | Explore artisan keycaps and collectible objects from Luminal Factory. Discover each object's story and release details. |
| `/raffle` | Explore Luminal Factory raffle releases, colorways and entry information. |
| `/archive` | Explore the characters, colorways and details in Luminal Factory's collection. |
| `/about` | Meet Luminal Factory, an artisan studio shaping keycaps, characters and collectible objects. |
| `/commission` | Explore custom keycap and collectible object ideas with Luminal Factory. |

Product metadata lấy đúng tên và mô tả công khai được duyệt; draft admin không
được đưa vào SEO. Metadata không khẳng định nhận entry/đơn hàng khi chưa hoạt động.

## Map triển khai sau duyệt

| Nhóm | Nguồn hiện tại cần thay |
| --- | --- |
| Shop list / SEO | `src/app/shop/page.tsx`, `src/features/shop/shop-collection.tsx` |
| Product detail / labels | `src/features/shop/shop-product-detail.tsx`, `shop-content.ts`, catalog adapter labels |
| Raffle / SEO | `src/features/raffle/raffle-content.ts`, `raffle-discovery.tsx`, `src/app/raffle/page.tsx` |
| Archive / CTA / SEO | `src/app/archive/page.tsx`, `src/features/archive/archive-content.ts` |
| About | `src/features/about/about-content.ts`, `src/app/about/page.tsx` |
| Commission | `src/features/commission/commission-content.ts`, `commission-discovery.tsx`, `commission-inquiry-form.tsx`, `src/app/commission/page.tsx` |
| Footer | `src/components/layout/footer.tsx` |

Trước implementation: duyệt EN chính hoặc VN chính; rà từng trạng thái với
nguồn release/capability thật; chọn copy phù hợp. Giữ runtime flag, schema,
permission và luồng giao dịch ngoài phạm vi C-038. Test lỗi tải/empty/success
tách nhau, CTA dẫn trang thật, desktop/mobile không overflow và không lộ copy
kỹ thuật trong HTML/metadata công khai. Không cần thêm ảnh để review C-038.
