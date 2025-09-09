# Product Requirements Document (PRD) - (chưa nghĩ ra tên hic') Launcher  
tên nháp : Trạm Game
## 1. Giới thiệu

### 1.1. Mục tiêu sản phẩm

Launcher Client là một ứng dụng desktop (Windows) và cổng thông tin web nhằm cung cấp bản dịch Việt hóa cho các tựa game và thêm game vào thư viện steam của mình , tích hợp sâu với nền tảng Steam, và mang đến trải nghiệm quản lý thư viện game đẹp mắt, tiện lợi cho người dùng. Sản phẩm hướng tới việc xây dựng một cộng đồng game thủ Việt Nam lớn mạnh, nơi họ có thể dễ dàng tiếp cận các bản dịch chất lượng cao và tương tác với nhau.
là một sản phẩm có chức năng nhạy cảm là thêm game vào thư viện steam của người dùng , thông qua cách thêm .manifest và .lua giả vào hai thư mục là stplug-in và depotcache của steam, dữ liệu manifest và lua được quản lý trên github dưới dạng braches name : app_id của game và chứa .manifest và .lua giả ở mỗi braches tương ứng với appid của game . cần được thông báo cho người dùng về rủi ro khi sử dụng sản phẩm và trách nhiệm của họ trong việc tuân thủ các điều khoản sử dụng của Steam qua điều khoản sử dụng .


### 1.2. Phạm vi sản phẩm

Sản phẩm bao gồm:

- **Ứng dụng Desktop (Windows):** Launcher chính, cung cấp giao diện tương tác với thư viện game,thêm game vào thư viện steam chính mình và downloads path dịch qua api server, và tích hợp Steam.
   client sẽ dùng app_id mà server cung cấp danh sách app_id và client gọi api steam để lấy thông tin game 
     Steam có endpoint để gọi :
    https://store.steampowered.com/api/appdetails?appids=<APPID>
          Ví dụ ta có Dota 2 (app_id :570)
           https://store.steampowered.com/api/appdetails?appids=570
           kết quả trả về dạng json và client sẽ hiển thị
  thêm game và tải bản dịch:
   + thêm game:
    ta dùng một kho lưu trữ chứa những app_id khả dụng trên data base, 
    kiểu dữ liệu :
    {
  "_id": "10",
  "last_commit_date": "2025-08-24T12:14:37.873325Z",
  "last_commit_sha": "a725c02e545ea2ef3783240b140ddf8513ce34a7",
  "updated_at": "2025-09-01T22:24:30.441931Z",
  "free_until": null,
  "is_free": false,
  "requires_vip": true,
  "name": "Dota 2"
}
    
    server phải kiểm tra và đảm bảo người dùng đủ quyền mới có thể truy cập 
    che giấu url tải thật qua Redirect / Proxy tải
    ta có link lưu trữ mà chứa dữ liệu https://github.com/SteamAutoCracks/ManifestHub/archive/refs/heads/{appid}.zip
    ví dụ : https://github.com/SteamAutoCracks/ManifestHub/archive/refs/heads/2087470.zip
     client sẽ tải và giải nén vào thư mục cần thiết : 
       thư mục giải nén tạm file zip tải về - 
       sau đó chuyển .manifest tới Steam\config\st và .lua tới file \Steam\config\depotcache 
   + bản dịch patch:
    tương tụ như game ,chia làm 2 collection chứa dữ liệu khả dụng , phân chia miễn phí và trả phí 
    che giấu link stoge qua link tạm thời (Signed URL / Pre-signed URL) để tránh tăng băng thông server
    dữ liệu sẽ được lưu ở một cloud stoge
- danh sách item , thư viện game đã sử hữu được lưu trong data base và đồng bộ với ứng dụng .

- redeem gift code để nhận game và item 
               

- **Cổng thông tin Web (Web Portal):** Cung cấp catalog game,danh sách game và patch khả dụng , và các thông tin cộng đồng.

### 1.3. Đối tượng người dùng

- **Free Users:**
  - Truy cập ứng dụng/web, xem catalog game.
  - Tải một số patch dịch miễn phí .
  - Có thể truy cập những tựa game miễn phí trên launcher.


- **VIP Subscribers:(dạng donater)**
  - Truy cập toàn bộ thư viện patch dịch.
  - Có thể truy cập toàn bộ kho game.

- **Admin/Moderator:**
  - Upload patch, quản lý game.
  - Quản lý người dùng, kiểm soát trạng thái VIP, xử lý thanh toán.
  - Theo dõi analytics.
  - thêm gifcode

## 2. Tính năng chi tiết

### 2.1. Launcher Client (Ứng dụng Desktop)

#### 2.1.1. Giao diện người dùng

- Giao diện đẹp mắt, hiện đại, dễ sử dụng.

- Hiển thị hình ảnh, thông tin chi tiết về game khả dụng chứa app_id khả dụng trên database

- Tích hợp hiển thị danh sách appid khả dụng từ server.

- Tích hợp hiển thị danh sách patch dịch khả dụng từ server.

- Tích hợp hiển thị danh sách game đã cài đặt từ Steam.

- hiển thị thông tin của người dùng

#### 2.1.2. Quản lý bản dịch

- Tải và áp dụng bản dịch Việt hóa cho game.

- Quản lý các bản dịch đã cài đặt.
 
- Có trang giới thiệu author , link tác giả

#### 2.1.3. Tích hợp Steam

- Tương tác với Steam thông qua Steamkitv2.

- Phát hiện game đã cài đặt trên Steam.
dùng
- Khởi chạy game từ Launcher Client.

- phát hiện game trong thư viện của steam người dùng

#### 2.1.4. Thư viện game

- Hiển thị thư viện game có sẵn trên Launcher (bao gồm game miễn phí). bằng cách get danh sách app_id từ server
và gọi api steam để lấy thông tin game hoặc qua https://api.xiaoheihe.cn/game/web/get_game_detail/?appid={app_id}

- Hiển thị thư viện game Steam của người dùng.

- Chức năng tìm kiếm, lọc game.

- hiển thị danh sách game việt hóa

- chức năng thêm game có bản dịch

#### 2.1.5 Thanh toán:

- tạo nội dung thanh toán riêng cho từng user , có thể dựa vào username ví dụ : taikhoan donate , chuyển khoản
 
- nhận web hook từ một bên thứ ba (sepay) đọc nội dung chuyển khoản từ đó để xác minh tài khoản nào nạp tiền 
: flow thanh toán : 
User vào trang nạp tiền
 → Hệ thống hiển thị nội dung chuyển khoản (content) và số tài khoản ngân hàng cho user 
 → user nhập số tiền cần nạp.
 →client tạo qr dựa vào thông tin User mở app ngân hàng 
 → chuyển khoản đúng số tiền + đúng nội dung. user được chọn nạp số tiền tùy chỉnh và cộng vào blance để mua vip thay vì mua trực tiếp vip qua thanh toán 
 2. Ngân hàng ghi nhận giao dịch User chuyển khoản thành công.
  Ngân hàng → thông báo tới SePay. SePay → xử lý giao dịch, đối chiếu nội dung, số tiền, … 
3. SePay gửi webhook đến server SePay gửi một HTTP POST tới url của ta khi có giao dịch.  một request với phương thức là POST, với nội dung gửi như sau: 
json:
{ "id": 92704, // ID giao dịch trên SePay
 "gateway":"Vietcombank", // Brand name của ngân hàng 
 "transactionDate":"2023-03-25 14:02:37", // Thời gian xảy ra giao dịch phía ngân hàng 
 "accountNumber":"0123499999", // Số tài khoản ngân hàng 
 "code":null, // Mã code thanh toán (sepay tự nhận diện dựa vào cấu hình tại Công ty -> Cấu hình chung)
  "content":"username nạp tiền", // Nội dung chuyển khoản riêng cho mỗi user cần nhập chính xác
  "transferType":"in", // Loại giao dịch. in là tiền vào, out là tiền ra 
  "transferAmount":2277000, // Số tiền giao dịch
  "accumulated":19077000, // Số dư tài khoản (lũy kế) 
  "subAccount":null, // Tài khoản ngân hàng phụ (tài khoản định danh),
  "referenceCode":"MBVCB.3278907687", // Mã tham chiếu của tin nhắn sms 
  "description":"" // Toàn bộ nội dung tin nhắn sms } 
  Đồng thời gửi kèm Authorization: Apikey <api-key> trong header. 
  4. Server của ta nhận webhook API /api/sepay/webhook nhận request → chạy middleware: ✅ Kiểm tra Authorization header đúng API key. ✅ Parse payload.
  5. Xử lý giao dịch Kiểm tra referenceCode hoặc id: cần kiểm tra tính duy nhất của trường id, hoặc kết hợp thêm các trường khác như referenceCode, transferType, transferAmount từ dữ liệu SePay gửi qua webhook để đảm bảo tính duy nhất của giao dịch. Nếu đã tồn tại trong DB → bỏ qua (tránh cộng tiền 2 lần). Nếu chưa có → tạo transaction record mới. Parse content để lấy username (ví dụ alice123). Tìm user trong DB theo username. Nếu có user: Cộng số dư Ghi log audit để trace giao dịch. Nếu không có user: Đánh dấu transaction là “pending” → cần admin xử lý. 6. Phản hồi cho SePay Sau khi xử lý xong, Với chứng thực API Key Nội dung trả về là json có success: true: {"success": true, ....} HTTP Status Code phải là 201 hoặc 200 Nếu trả về 500 hoặc timeout, SePay sẽ retry webhook. 7. Lưu trữ & thống kê Toàn bộ transaction được lưu DB (MongoDB, PostgreSQL, …). Có thể build dashboard → xem tổng số nạp, số giao dịch thành công, thất bại.# Payment System Analysis Report
  nếu user nhập sai content (không match username), thì transaction sẽ luôn vào “pending” cho admin xử lý

- có 2 loại số dư là balance và point , balance dùng để mua vip , point dùng để mua game và item

- thêm chức năng point : quy đổi nạp 1k vnd thì sẽ nhận được 1 point người dùng nhận cả balance và point (bonus)
point có convert sang balance , nhưng k thể ngược lại

-point này có thể đổi item như avatar , frame , và game 
Top-up Balance: nạp bao nhiêu cũng được (minium 10k vnd) → cộng vào balance.
#### 2.1.6 Đăng kí vip :

- người dùng chọn gói vip (vipid) thanh toán qua balance , trừ balance , cập nhập balance , vip_expiry , vip_status = active , vip_package_id = vipid , vip_history = [vipid]
#### 2.1.7 đăng nhập và quản lý phiên:
- đăng nhập , đăng xuất , quản lý phiên khi tài khoản đăng nhập ở nơi khác thì đăng xuất ở thiết bị hiện tại, Chỉ cho phép 1 phiên active tại 1 thời điểm

### 2.2. Web Portal
 chỉ là một trang web introduc về launcher : hiển thị game có trên launcher , danh sách game việt hóa, và một nút tải xuống cho window 
#### 2.2.1. Catalog game
- hiển thị danh sách game
- Hiển thị danh sách game có bản dịch.

#### 2.2.3. Quản lý nội dung (dành cho Admin/Moderator) đây là Admin dashboard k phải publish

- Giao diện upload patch dịch, và thêm game vào database.

- Công cụ quản lý người dùng, cấp/thu hồi quyền VIP.

- Báo cáo thống kê, analytics.

- công cụ thêm và quản lý giftcode

## 3. Yêu cầu kỹ thuật

### 3.1. Công nghệ sử dụng

- **Frontend (Web):** ReactJS

- **Backend (Web):** Node.js (hoặc ngôn ngữ khác phù hợp với ReactJS)

- **Ứng dụng Desktop:** C#

### 3.2. Bảo mật và tính toàn vẹn

- Đảm bảo các phương thức bảo mật cho ứng dụng và dữ liệu người dùng.

- Kiểm tra quyền truy cập và xóa file khi đóng ứng dụng.

- Kiểm tra tính toàn vẹn của ứng dụng (ẩn danh).

- Bảo vệ dữ liệu người dùng và thông tin thanh toán.
- kiểm tra phiên , khi đăng nhập ở nơi khác cần đăng xuất ở thiết bị hiện tại, không thể sử dụng đồng thời cả 2 thiết bị
Cơ chế kỹ thuật trên Windows:

Không nên dùng process ẩn hoàn toàn vì có thể bị antivirus flag là malware. Thay vào đó, sử dụng Windows Service riêng biệt (e.g., một background service cài đặt qua Installer) để monitor main app. Khi main app bị kill (qua Event Viewer hoặc polling), service sẽ trigger cleanup: xóa temp files, tạo backup (e.g., zip thư viện game và upload lên cloud nếu cần).
Alternative: Sử dụng AppDomain.UnhandledException và Application.Exit events trong C# để hook cleanup trước khi exit. Đối với kill đột ngột (e.g., Task Manager), dùng Windows Task Scheduler để schedule một cleanup task định kỳ.

### 3.3. Yêu cầu phi chức năng

- **Hiệu suất:** Ứng dụng phải có tốc độ phản hồi nhanh, mượt mà.

- **Khả năng mở rộng:** Hệ thống có khả năng mở rộng để đáp ứng số lượng người dùng và game tăng lên.

- **Độ tin cậy:** Ứng dụng hoạt động ổn định, ít lỗi.

- **Khả năng bảo trì:** Mã nguồn rõ ràng, dễ bảo trì và phát triển.

- Khả năng bảo mật , phòng vệ : có khả năng chạy ngầm , ẩn danh để xóa , tạo back up nếu bị người dùng kill ứng dụng hoặc các biện pháp khác )

## 4. Kế hoạch phát triển (Tổng quan)

### 4.1. Giai đoạn 1: Phát triển MVP (Minimum Viable Product)

- Triển khai các tính năng cốt lõi của Launcher Client và Web Portal.

- Tập trung vào chức năng tải và áp dụng bản dịch, tích hợp Steam cơ bản.

### 4.2. Giai đoạn 2: Phát triển tính năng nâng cao

- Phát triển hệ thống VIP, quản lý người dùng, analytics.

- Cải thiện giao diện người dùng và trải nghiệm.

### 4.3. Giai đoạn 3: Tối ưu hóa và mở rộng

- Tối ưu hiệu suất, bảo mật.

- Mở rộng thư viện game, hỗ trợ thêm các nền tảng khác (nếu có).

## 5. Các rủi ro tiềm ẩn

- Vấn đề pháp lý liên quan đến bản quyền game và bản dịch.


- Thách thức về bảo mật và chống gian lận.

## 6. Phụ lục

- Glossary of Terms

- References

### 2.1. Launcher Client (Ứng dụng Desktop)

#### 2.1.1. Giao diện người dùng

Launcher Client sẽ có một giao diện người dùng (UI) hiện đại, trực quan và dễ điều hướng, được thiết kế để mang lại trải nghiệm tốt nhất cho game thủ. Giao diện sẽ tập trung vào việc hiển thị thông tin game một cách hấp dẫn, đồng thời cung cấp các chức năng quản lý bản dịch và tích hợp Steam một cách liền mạch. Thiết kế sẽ ưu tiên sự rõ ràng, dễ đọc và tính thẩm mỹ, sử dụng các yếu tố đồ họa chất lượng cao để làm nổi bật các tựa game. Người dùng có thể dễ dàng tìm kiếm, lọc và sắp xếp thư viện game của mình, cũng như truy cập nhanh các bản dịch đã cài đặt. Giao diện cũng sẽ được tối ưu hóa để tương thích với nhiều độ phân giải màn hình khác nhau, đảm bảo trải nghiệm nhất quán trên các thiết bị [1].
Tích hợp Steam: Client gọi trực tiếp Steam API cho metadata chi tiết; backend validate app_id qua API calls để tránh abuse.
#### 2.1.2. Quản lý bản dịch

Một trong những tính năng cốt lõi của Launcher Client là khả năng quản lý bản dịch Việt hóa cho các tựa game. Người dùng có thể dễ dàng tải xuống và áp dụng các bản dịch từ kho lưu trữ của launcher. Hệ thống sẽ hỗ trợ nhiều phiên bản bản dịch cho cùng một game, cho phép người dùng lựa chọn phiên bản phù hợp hoặc chuyển đổi giữa chúng. Chức năng cập nhật bản dịch sẽ được tích hợp, cho phép người dùng nhận các bản vá lỗi hoặc cải tiến mới nhất một cách tự động hoặc thủ công. Khi đóng ứng dụng, launcher sẽ kiểm tra và xóa các file tạm hoặc file không cần thiết liên quan đến bản dịch để đảm bảo tính toàn vẹn và bảo mật của hệ thống [2].

#### 2.1.3. Tích hợp Steam

Launcher Client sẽ tận dụng Steamkitv2, một thư viện .NET mạnh mẽ, để tương tác sâu với mạng Steam. Điều này cho phép launcher thực hiện các tác vụ như phát hiện các game đã được cài đặt thông qua Steam, hiển thị thông tin game từ thư viện Steam của người dùng, và cho phép người dùng khởi chạy game trực tiếp từ launcher. Việc tích hợp này đảm bảo rằng người dùng không cần phải chuyển đổi giữa các ứng dụng khác nhau để quản lý và chơi game của họ. Steamkitv2 cung cấp khả năng truy cập vào các depot của Steam, giúp việc quản lý và cập nhật game trở nên hiệu quả hơn [3].

#### 2.1.4. Thư viện game

Thư viện game trong Launcher Client sẽ là nơi tập trung tất cả các game mà người dùng sở hữu hoặc có thể truy cập.
 Nó sẽ hiển thị cả các game có sẵn trên launcher (bao gồm các game miễn phí được cung cấp) và các game từ thư viện Steam của người dùng. 
 Mỗi game sẽ có một trang thông tin chi tiết, bao gồm mô tả, hình ảnh, video (nếu có) qua api của steam
 và các tùy chọn liên quan đến bản dịch sẽ ở một mục riêng     

### 2.2. Web Portal
Hệ thống tài khoản và phân quyền: Đăng ký VIP dưới dạng donate; flow: Frontend gọi API create intent -> redirect gateway -> webhook update status với idempotency handling.

#### 2.2.1. Catalog game

Web Portal sẽ cung cấp một catalog game toàn diện, nơi người dùng có thể duyệt qua tất cả các game có bản dịch Việt hóa, danh sách game trên server. Mỗi game trong catalog sẽ có một trang riêng với thông tin chi tiết, bao gồm mô tả, ảnh chụp màn hình, video giới thiệu, và thông tin về bản dịch (phiên bản, người dịch, ngày cập nhật). Người dùng có thể tìm kiếm game theo tên, lọc theo thể loại, nhà phát triển, hoặc trạng thái bản dịch. Catalog này cũng sẽ là nơi hiển thị các game miễn phí có thể truy cập qua launcher.

#### 2.2.2. Hệ thống tài khoản và phân quyền

Client sẽ có một hệ thống tài khoản người dùng đầy đủ, cho phép đăng ký, đăng nhập, và quản lý hồ sơ cá nhân. Hệ thống phân quyền sẽ được triển khai để quản lý các cấp độ người dùng: Free Users, VIP Subscribers, và Admin/Moderator. Đặc biệt, hệ thống đăng ký VIP sẽ được thiết kế dưới dạng một hệ thống 'donate' hoặc 'ủng hộ' để tuân thủ các quy định họ donate và nhận số dư để mua vip hoặc item và tránh các vấn đề pháp lý liên quan đến việc bán bản dịch. Người dùng VIP sẽ có quyền truy cập vào toàn bộ thư viện patch dịch,game và

#### 2.2.3. Quản lý nội dung (dành cho Admin/Moderator)

Admin và Moderator sẽ có một giao diện quản trị riêng trên Web Portal để thực hiện các tác vụ quản lý hệ thống. Các tính năng chính bao gồm: tải lên các patch dịch mới, quản lý metadata của game (thông tin, hình ảnh, thể loại), quản lý người dùng (duyệt, chỉnh sửa, cấp/thu hồi quyền VIP), và xử lý các giao dịch thanh toán/donate. Ngoài ra, hệ thống sẽ cung cấp các công cụ theo dõi analytics để Admin có thể nắm bắt được số liệu thống kê về người dùng, lượt tải bản dịch, và hiệu suất tổng thể của nền tảng, từ đó đưa ra các quyết định phát triển phù hợp.

## 3. Yêu cầu kỹ thuật

### 3.1. Công nghệ sử dụng

Để đảm bảo hiệu suất, khả năng mở rộng và bảo trì, sản phẩm sẽ sử dụng các công nghệ sau:

- **Frontend (Web Portal):** ReactJS. Đây là một thư viện JavaScript phổ biến để xây dựng giao diện người dùng, nổi tiếng với hiệu suất cao và khả năng tái sử dụng component. ReactJS sẽ giúp xây dựng một Web Portal linh hoạt, tương tác và dễ dàng phát triển các tính năng mới.

- **Backend (Web Portal):** Node.js (hoặc một framework tương tự như Express.js). Node.js là một môi trường runtime JavaScript phía máy chủ, lý tưởng cho việc xây dựng các API nhanh và có khả năng mở rộng. Nó sẽ xử lý các yêu cầu từ Web Portal, quản lý cơ sở dữ liệu, xác thực người dùng, và các logic nghiệp vụ khác. Việc sử dụng JavaScript cho cả frontend và backend sẽ giúp đồng bộ hóa ngôn ngữ phát triển và tối ưu hóa quy trình làm việc.

- **Ứng dụng Desktop (Launcher Client):** C#. C# là một ngôn ngữ lập trình mạnh mẽ và linh hoạt, đặc biệt phù hợp cho việc phát triển ứng dụng Windows. Với .NET framework, C# cung cấp khả năng tương tác tốt với hệ thống, quản lý tài nguyên hiệu quả, và tích hợp dễ dàng với các thư viện như Steamkitv2. Điều này đảm bảo Launcher Client có thể hoạt động ổn định, mượt mà và cung cấp trải nghiệm người dùng tốt nhất trên nền tảng Windows.

### 3.2. Bảo mật và tính toàn vẹn

Bảo mật là yếu tố tối quan trọng đối với sản phẩm này, đặc biệt khi xử lý dữ liệu người dùng và tích hợp với nền tảng bên thứ ba như Steam. Các biện pháp bảo mật sẽ được áp dụng ở cả cấp độ ứng dụng và hệ thống:

- **Xác thực và ủy quyền:** Hệ thống đăng nhập sẽ sử dụng các phương pháp xác thực mạnh mẽ (ví dụ: OAuth2, JWT) và mã hóa mật khẩu. Phân quyền người dùng (Free, VIP, Admin) sẽ được kiểm soát chặt chẽ, đảm bảo mỗi vai trò chỉ có quyền truy cập vào các chức năng và dữ liệu cần thiết. Các API sẽ được bảo vệ bằng token và kiểm tra quyền truy cập cho mỗi yêu cầu.

- **Bảo mật dữ liệu:** Tất cả dữ liệu nhạy cảm (thông tin cá nhân, thông tin thanh toán) sẽ được mã hóa cả khi truyền tải (sử dụng HTTPS/TLS) và khi lưu trữ (encryption at rest). Cơ sở dữ liệu sẽ được bảo vệ khỏi các cuộc tấn công SQL Injection và các lỗ hổng khác.

- **Kiểm tra tính toàn vẹn của ứng dụng:** Launcher Client sẽ có cơ chế kiểm tra tính toàn vẹn để phát hiện và ngăn chặn các hành vi giả mạo hoặc sửa đổi ứng dụng trái phép. Điều này có thể bao gồm việc sử dụng mã hóa, chữ ký số, hoặc các kỹ thuật che giấu mã để bảo vệ ứng dụng khỏi bị reverse engineering hoặc can thiệp. Khi ứng dụng đóng, các file tạm hoặc file không cần thiết sẽ được xóa để giảm thiểu rủi ro rò rỉ thông tin hoặc để lại dấu vết.

- **Quản lý phiên:** Các phiên làm việc của người dùng sẽ được quản lý an toàn, với thời gian hết hạn phiên hợp lý và cơ chế thu hồi phiên khi cần thiết.

- **Bảo mật phía máy khách (Client-side Security):** Đối với ứng dụng desktop, các biện pháp như bảo vệ bộ nhớ, chống debug, và chống giả mạo sẽ được xem xét để tăng cường bảo mật. Đối với Web Portal, các biện pháp chống tấn công XSS (Cross-Site Scripting), CSRF (Cross-Site Request Forgery) sẽ được triển khai.

- **Cập nhật và vá lỗi:** Hệ thống sẽ có khả năng cập nhật bảo mật định kỳ để vá các lỗ hổng mới phát hiện và duy trì mức độ bảo mật cao nhất.

### 3.3. Yêu cầu phi chức năng

Ngoài các tính năng chính, sản phẩm còn phải đáp ứng các yêu cầu phi chức năng sau để đảm bảo chất lượng và trải nghiệm người dùng:

- **Hiệu suất:**
  - **Tốc độ phản hồi:** Launcher Client và Web Portal phải có tốc độ phản hồi nhanh chóng, với thời gian tải trang và thực hiện các thao tác (ví dụ: tải bản dịch, khởi chạy game) dưới 2 giây trong điều kiện mạng bình thường.
  - **Sử dụng tài nguyên:** Ứng dụng desktop phải tối ưu hóa việc sử dụng CPU, RAM và ổ đĩa để không ảnh hưởng đáng kể đến hiệu suất tổng thể của hệ thống người dùng, đặc biệt khi game đang chạy.

- **Khả năng mở rộng:**
  - Hệ thống backend phải có khả năng mở rộng để hỗ trợ hàng trăm nghìn đến hàng triệu người dùng đồng thời và một thư viện game ngày càng lớn. Kiến trúc microservices hoặc các giải pháp tương tự có thể được xem xét để đảm bảo khả năng mở rộng linh hoạt.
  - Cơ sở dữ liệu phải có khả năng xử lý lượng lớn dữ liệu và truy vấn hiệu quả.

- **Độ tin cậy:**
  - Ứng dụng phải hoạt động ổn định, ít gặp lỗi hoặc sự cố. Tỷ lệ lỗi hệ thống mục tiêu dưới 0.1%.
  - Hệ thống phải có khả năng phục hồi sau sự cố (ví dụ: mất kết nối mạng, lỗi máy chủ) và đảm bảo tính toàn vẹn của dữ liệu.
  - Các bản dịch và dữ liệu game phải được lưu trữ an toàn và có cơ chế sao lưu, phục hồi.

- **Khả năng bảo trì:**
  - Mã nguồn phải được viết rõ ràng, có cấu trúc tốt, dễ đọc và dễ hiểu. Tuân thủ các nguyên tắc lập trình sạch và các tiêu chuẩn mã hóa.
  - Tài liệu kỹ thuật đầy đủ và cập nhật để hỗ trợ việc bảo trì và phát triển trong tương lai.
  - Dễ dàng triển khai các bản cập nhật và vá lỗi mà không làm gián đoạn dịch vụ quá lâu.

- **Khả năng sử dụng:**
  - Giao diện người dùng phải trực quan, dễ học và dễ sử dụng cho mọi đối tượng người dùng, từ người mới bắt đầu đến game thủ có kinh nghiệm.
  - Các thông báo lỗi và hướng dẫn phải rõ ràng, dễ hiểu và hữu ích.

- **Khả năng tương thích:**
  - Launcher Client phải tương thích với các phiên bản Windows phổ biến (Windows 10, Windows 11).
  - Web Portal phải tương thích với các trình duyệt web hiện đại (Chrome, Firefox, Edge, Safari) trên cả desktop và mobile.

## 4. Kế hoạch phát triển (Tổng quan)

### 4.1. Giai đoạn 1: Phát triển MVP (Minimum Viable Product)

- **Mục tiêu:** Triển khai các tính năng cốt lõi để chứng minh giá trị sản phẩm và thu hút người dùng ban đầu.

- **Tính năng:**
  - Launcher Client: Giao diện cơ bản, khả năng tải và áp dụng bản dịch cho một số game chọn lọc, tích hợp Steam cơ bản (phát hiện game, khởi chạy game).
  - Web Portal: Catalog game cơ bản, hệ thống đăng ký/đăng nhập tài khoản Free User.
  - Backend: API quản lý bản dịch, API xác thực người dùng.

- **Thời gian dự kiến:** 3-4 tháng.

### 4.2. Giai đoạn 2: Phát triển tính năng nâng cao

- **Mục tiêu:** Mở rộng tính năng, cải thiện trải nghiệm người dùng và triển khai hệ thống phân quyền.

- **Tính năng:**
  - Launcher Client: Cải thiện giao diện, quản lý bản dịch nâng cao (cập nhật tự động), tích hợp sâu hơn với Steam (hiển thị thư viện Steam đầy đủ).
  - Web Portal: Hệ thống đăng ký VIP (donate), quản lý hồ sơ người dùng, giao diện quản trị cho Admin/Moderator (upload patch, quản lý metadata, quản lý user).
  - Backend: API quản lý VIP, API analytics, tăng cường bảo mật.

- **Thời gian dự kiến:** 4-6 tháng.

### 4.3. Giai đoạn 3: Tối ưu hóa và mở rộng

- **Mục tiêu:** Tối ưu hóa hiệu suất, bảo mật, và mở rộng quy mô sản phẩm.

- **Tính năng:**
  - Tối ưu hóa hiệu suất tổng thể của cả Launcher Client và Web Portal.
  - Triển khai các biện pháp bảo mật nâng cao (kiểm tra tính toàn vẹn ứng dụng, chống gian lận).
  - Mở rộng thư viện game, hỗ trợ thêm các nền tảng game khác (nếu có nhu cầu và khả thi).
  - Phát triển các tính năng cộng đồng (diễn đàn, chat) trên Web Portal.

- **Thời gian dự kiến:** 3-5 tháng.

## 5. Các rủi ro tiềm ẩn

- **Vấn đề pháp lý liên quan đến bản quyền game và bản dịch:** Việc cung cấp bản dịch cho các tựa game có thể gặp phải các vấn đề về bản quyền từ các nhà phát triển hoặc nhà phát hành game. Cần nghiên cứu kỹ lưỡng luật pháp liên quan và tìm kiếm lời khuyên pháp lý để giảm thiểu rủi ro này. Việc định hướng hệ thống VIP dưới dạng 'donate' thay vì 'bán' bản dịch là một biện pháp để giảm thiểu rủi ro này.

- **Khó khăn trong việc tích hợp sâu với Steam API:** Mặc dù Steamkitv2 cung cấp khả năng tương tác với Steam, việc tích hợp sâu và duy trì tính tương thích với các bản cập nhật của Steam có thể là một thách thức kỹ thuật. Cần có đội ngũ phát triển có kinh nghiệm về Steamworks API và Steamkitv2.

- **Thách thức về bảo mật và chống gian lận:** Với một ứng dụng tương tác trực tiếp với hệ thống người dùng và liên quan đến game, nguy cơ bị tấn công, giả mạo hoặc gian lận là rất cao. Cần đầu tư mạnh vào các giải pháp bảo mật, kiểm tra tính toàn vẹn ứng dụng, và liên tục cập nhật các biện pháp phòng chống.

- **Cạnh tranh từ các nền tảng launcher hiện có:** Thị trường launcher game đã có nhiều đối thủ lớn như Steam, Epic Games Store, GOG Galaxy. Sản phẩm cần có những điểm khác biệt và giá trị độc đáo để thu hút và giữ chân người dùng.

- **Khả năng duy trì và cập nhật bản dịch:** Việc duy trì một thư viện bản dịch lớn và cập nhật chúng thường xuyên đòi hỏi nguồn lực đáng kể. Cần có một quy trình quản lý cộng đồng dịch giả hiệu quả hoặc một đội ngũ dịch thuật chuyên nghiệp.
  Thêm: Rủi ro integration desktop - đảm bảo API design RESTful, secure auth cho desktop calls.
## 6. Phụ lục

### 6.1. Glossary of Terms

- **PRD (Product Requirements Document):** Tài liệu mô tả chi tiết các yêu cầu về sản phẩm, bao gồm tính năng, chức năng, và các yêu cầu phi chức năng.

- **Launcher Client:** Ứng dụng desktop (Windows) chính của sản phẩm, nơi người dùng tương tác trực tiếp với game và bản dịch.

- **Web Portal:** Cổng thông tin web của sản phẩm, cung cấp catalog game, quản lý tài khoản và các chức năng quản trị.

- **Steamkitv2:** Thư viện .NET cho phép tương tác với mạng Steam.

- **Patch dịch:** Các tệp tin chứa bản dịch Việt hóa cho game.

- **MVP (Minimum Viable Product):** Sản phẩm khả thi tối thiểu, phiên bản đầu tiên của sản phẩm với các tính năng cốt lõi.

- **UI (User Interface):** Giao diện người dùng.

- **UX (User Experience):** Trải nghiệm người dùng.

- **API (Application Programming Interface):** Giao diện lập trình ứng dụng, cho phép các phần mềm khác nhau giao tiếp với nhau.

- **HTTPS (Hypertext Transfer Protocol Secure):** Giao thức truyền tải siêu văn bản an toàn, sử dụng mã hóa để bảo vệ dữ liệu truyền tải trên web.

- **TLS (Transport Layer Security):** Giao thức mã hóa dữ liệu trên mạng máy tính.

- **XSS (Cross-Site Scripting):** Một loại tấn công bảo mật web cho phép kẻ tấn công chèn mã độc vào trang web.

- **CSRF (Cross-Site Request Forgery):** Một loại tấn công bảo mật web lừa người dùng thực hiện các hành động không mong muốn.

### 6.2. References

[1] PC gaming's many launchers, reviewed for 2024: Steam still ... - Reddit. (2024, January 30). Retrieved from [https://www.reddit.com/r/fuckepic/comments/1aeu2bk/pc_gamings_many_launchers_reviewed_for_2024_steam/](https://www.reddit.com/r/fuckepic/comments/1aeu2bk/pc_gamings_many_launchers_reviewed_for_2024_steam/)
[2] OWASP Desktop App Security Top 10. (n.d.). Retrieved from [https://owasp.org/www-project-desktop-app-security-top-10/](https://owasp.org/www-project-desktop-app-security-top-10/)
[3] SteamRE/SteamKit - GitHub. (n.d.). Retrieved from [https://github.com/SteamRE/SteamKit](https://github.com/SteamRE/SteamKit)



## Cập nhật kiến trúc theo Issue (2025-08-29)

Các quyết định kiến trúc/phi chức năng được thống nhất bổ sung cho giai đoạn hiện tại:

- Cơ sở dữ liệu: MongoDB; ORM/ODM: Mongoose.
- API: REST thuần, mô tả bằng OpenAPI/Swagger. Backend chủ yếu chịu trách nhiệm xác thực/ủy quyền và chuyển hướng tới tài nguyên cần thiết.

### Rủi ro & giảm thiểu bổ sung
- Ngăn chặn abuse: validate app_id phía backend, áp dụng rate-limit/captcha cho endpoint công khai.
- Tính toàn vẹn thanh toán: idempotency theo transaction_id và xác minh chữ ký mỗi webhook.
