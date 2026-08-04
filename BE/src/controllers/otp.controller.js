import asyncHandler from "../utils/asyncHandler.js";
import Otp from "../models/otp.model.js";
import User from "../models/user.model.js";
import sendMail from "../utils/sendMail.js";
import ticketEventEmitter from "../utils/ticketEvent.js";

// ==========================================
// 1. API: GỬI MÃ OTP VỀ EMAIL ĐĂNG KÝ
// ==========================================
export const sendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Vui lòng cung cấp Email!" });
  }

  // Tạo mã OTP ngẫu nhiên gồm 6 chữ số
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

  // Lưu OTP vào Database (Nếu email đã có OTP cũ thì xóa đi rồi tạo mới)
  await Otp.deleteMany({ email });
  await Otp.create({ email, otp: otpCode });

  // Tiến hành gửi email qua Nodemailer chuẩn thương hiệu NetBus
  await sendMail({
    email: email,
    subject: "[NetBus] Mã xác thực OTP của bạn",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #2E7D32; text-align: center;">XÁC THỰC EMAIL</h2>
        <p>Chào bạn,</p>
        <p>Bạn đang thực hiện thao tác xác thực trên hệ thống mạng lưới vận tải thông minh <b>NetBus</b>. Mã OTP của bạn là:</p>
        <div style="text-align: center; margin: 20px 0;">
          <span style="font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #fff; background: #2E7D32; padding: 10px 20px; border-radius: 5px; display: inline-block;">
            ${otpCode}
          </span>
        </div>
        <p style="color: #ff5722; font-size: 13px;">* Mã OTP này có hiệu lực trong vòng 5 phút. Vui lòng tuyệt đối không chia sẻ mã này với bất kỳ ai.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="text-align: center; color: #2E7D32; font-weight: bold; font-size: 13px;">NetBus - Chạm là đi</p>
      </div>
    `,
  });

  return res.status(200).json({
    success: true,
    message: "Mã OTP đã được gửi thành công, vui lòng kiểm tra hộp thư!",
  });
});

// ==========================================
// 2. API: XÁC THỰC MÃ OTP (VALIDATE ĐẦU VÀO)
// ==========================================
export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otpInput } = req.body;

  if (!email || !otpInput) {
    return res.status(400).json({ message: "Vui lòng nhập đủ email và mã OTP!" });
  }

  // Tìm mã OTP mới nhất của email này trong Database
  const otpRecord = await Otp.findOne({ email }).sort({ createdAt: -1 });

  if (!otpRecord) {
    return res.status(400).json({
      success: false,
      message: "Mã OTP đã hết hạn hoặc không tồn tại. Vui lòng lấy mã mới!",
    });
  }

  // Đối chiếu mã người dùng nhập với mã trong DB
  if (otpRecord.otp !== otpInput) {
    return res.status(400).json({
      success: false,
      message: "Mã OTP nhập vào không chính xác!",
    });
  }

  // Xác thực đúng -> Xóa OTP này đi để tránh dùng lại nhiều lần
  await Otp.deleteOne({ _id: otpRecord._id });

  return res.status(200).json({
    success: true,
    message: "Xác thực Email thành công! Bạn có thể tiếp tục thao tác.",
  });
});

// ==========================================
// 3. API: GỬI VÉ XE ONLINE CHỦ ĐỘNG QUA HTTP REQUEST
// ==========================================
export const sendTicket = asyncHandler(async (req, res) => {
  const { email, customerName, ticketId, route, departureTime, seatNumber, totalPrice, busType, licensePlate } = req.body;

  if (!email || !ticketId) {
    return res.status(400).json({ message: "Thiếu thông tin gửi vé xe!" });
  }

  let departureDate = "---";
  let departureTimeOnly = "---";
  try {
    const d = new Date(departureTime);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      departureDate = `${day}/${month}/${year}`;
      
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      departureTimeOnly = `${hours}:${minutes}`;
    } else {
      const prts = departureTime.split(" ");
      if (prts.length === 2) {
        departureTimeOnly = prts[0];
        departureDate = prts[1];
      }
    }
  } catch (e) {}

  const parts = (route || "").split("→");
  const diemDi = parts[0]?.trim() || "Điểm đi";
  const diemDen = parts[1]?.trim() || "Điểm đến";
  const routeDisplay = `${diemDi} - ${diemDen}`.toUpperCase();
  const formattedPrice = totalPrice ? totalPrice.toLocaleString("vi-VN") : "0";

  const qrValue = `--- VÉ ĐIỆN TỬ NETBUS ---
Mã vé: ${ticketId}
Mã Code: ${ticketId}
Hành khách: ${customerName}
Chuyến xe: ${busType || 'Xe NETBUS Luxury'} (${diemDi} → ${diemDen})
BKS: ${licensePlate || "29B-123.45"}
Vị trí ghế: ${seatNumber}
Khởi hành: ${departureTime}`;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${encodeURIComponent(qrValue)}`;

  await sendMail({
    email: email,
    subject: `[NetBus] Vé xe điện tử của bạn - Mã vé: ${ticketId}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; padding: 40px 0;">
        <div style="max-width: 720px; margin: 0 auto; padding: 0 16px;">
          
          <div style="text-align: center; padding-bottom: 24px;">
            <div style="font-size: 36px; line-height: 1; margin-bottom: 8px;">✅</div>
            <h2 style="margin: 0; color: #16a34a; font-size: 20px; font-weight: 600; letter-spacing: 0.5px;">ĐẶT VÉ THÀNH CÔNG!</h2>
            <p style="margin: 4px 0 0 0; color: #475569; font-size: 14px;">Cảm ơn bạn đã lựa chọn NETBUS</p>
          </div>

          <!-- KHỐI VÉ TOÀN DIỆN -->
          <table style="width: 100%; border: 1px solid #e2e8f0; border-radius: 20px; border-collapse: separate; background-color: #ffffff; overflow: hidden; margin: 0 auto; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);" cellpadding="0" cellspacing="0">
            <tr>
              <!-- LEFT QR PANEL (22%) -->
              <td style="width: 22%; padding: 20px; text-align: center; vertical-align: middle; background-color: #ffffff; border-right: 2px dashed #16a34a;">
                <div style="padding: 4px; border: 1px solid #16a34a; border-radius: 10px; background: #ffffff; display: inline-block;">
                  <img src="${qrImageUrl}" alt="Mã QR Vé" style="width: 80px; height: 80px; display: block;" />
                </div>
                <div style="font-size: 9px; color: #16a34a; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 10px;">
                  Quét check-in
                </div>
              </td>

              <!-- MAIN TICKET PANEL (58%) -->
              <td style="width: 58%; padding: 24px; vertical-align: top; background: radial-gradient(circle at -10% 50%, rgba(22, 163, 74, 0.06) 0%, transparent 60%), radial-gradient(circle at 100% 100%, rgba(22, 163, 74, 0.08) 0%, transparent 50%);">
                
                <!-- Header -->
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                  <tr>
                    <td style="vertical-align: middle;">
                      <img src="https://img.icons8.com/fluency/96/bus.png" alt="NETBUS" style="height: 28px; width: 28px; vertical-align: middle; margin-right: 8px;" />
                      <span style="font-size: 18px; font-weight: bold; color: #14532d; vertical-align: middle; letter-spacing: 0.5px;">NetBus</span>
                    </td>
                    <td style="text-align: right; vertical-align: middle;">
                      <span style="font-size: 11px; font-weight: bold; color: #16a34a; letter-spacing: 1px;">NETBUS - CHẠM LÀ ĐI</span>
                    </td>
                  </tr>
                </table>

                <!-- Fields -->
                <table style="width: 100%; border: 1px solid #16a34a; border-radius: 8px; border-collapse: separate; margin-bottom: 12px; background-color: #ffffff;" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background-color: #0f2d1e; color: #ffffff; padding: 8px 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; border-radius: 6px 0 0 6px; width: 100px; text-align: center; letter-spacing: 0.5px;">
                      Hành khách
                    </td>
                    <td style="padding: 8px 16px; font-size: 13px; font-weight: bold; color: #1e293b; text-transform: uppercase;">
                      ${customerName}
                    </td>
                  </tr>
                </table>

                <table style="width: 100%; border: 1px solid #16a34a; border-radius: 8px; border-collapse: separate; margin-bottom: 12px; background-color: #ffffff;" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background-color: #0f2d1e; color: #ffffff; padding: 8px 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; border-radius: 6px 0 0 6px; width: 100px; text-align: center; letter-spacing: 0.5px;">
                      Tuyến đường
                    </td>
                    <td style="padding: 8px 16px; font-size: 13px; font-weight: bold; color: #14532d;">
                      ${routeDisplay}
                    </td>
                  </tr>
                </table>

                <!-- Bus Name & License Plate -->
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
                  <tr>
                    <td style="width: 48%;">
                      <table style="width: 100%; border: 1px solid #16a34a; border-radius: 8px; border-collapse: separate; background-color: #ffffff;" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="background-color: #0f2d1e; color: #ffffff; padding: 8px 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; border-radius: 6px 0 0 6px; width: 70px; text-align: center; letter-spacing: 0.5px;">
                            Tên xe
                          </td>
                          <td style="padding: 8px 12px; font-size: 13px; font-weight: bold; color: #1e293b;">
                            ${busType || "Xe NETBUS Luxury"}
                          </td>
                        </tr>
                      </table>
                    </td>
                    <td style="width: 4%;">&nbsp;</td>
                    <td style="width: 48%;">
                      <table style="width: 100%; border: 1px solid #16a34a; border-radius: 8px; border-collapse: separate; background-color: #ffffff;" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="background-color: #0f2d1e; color: #ffffff; padding: 8px 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; border-radius: 6px 0 0 6px; width: 55px; text-align: center; letter-spacing: 0.5px;">
                            BKS
                          </td>
                          <td style="padding: 8px 12px; font-size: 13px; font-weight: bold; color: #14532d;">
                            ${licensePlate || "29B-123.45"}
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- Date & Departs -->
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
                  <tr>
                    <td style="width: 48%;">
                      <table style="width: 100%; border: 1px solid #16a34a; border-radius: 8px; border-collapse: separate; background-color: #ffffff;" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="background-color: #0f2d1e; color: #ffffff; padding: 8px 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; border-radius: 6px 0 0 6px; width: 70px; text-align: center; letter-spacing: 0.5px;">
                            Ngày đi
                          </td>
                          <td style="padding: 8px 12px; font-size: 13px; font-weight: bold; color: #1e293b;">
                            ${departureDate}
                          </td>
                        </tr>
                      </table>
                    </td>
                    <td style="width: 4%;">&nbsp;</td>
                    <td style="width: 48%;">
                      <table style="width: 100%; border: 1px solid #16a34a; border-radius: 8px; border-collapse: separate; background-color: #ffffff;" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="background-color: #0f2d1e; color: #ffffff; padding: 8px 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; border-radius: 6px 0 0 6px; width: 70px; text-align: center; letter-spacing: 0.5px;">
                            Giờ chạy
                          </td>
                          <td style="padding: 8px 12px; font-size: 13px; font-weight: bold; color: #1e293b;">
                            ${departureTimeOnly}
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- Seat & Price -->
                <table style="width: 100%; margin-bottom: 12px; border-collapse: collapse;">
                  <tr>
                    <td style="width: 48%;">
                      <table style="width: 100%; border: 1px solid #16a34a; border-radius: 8px; border-collapse: separate; background-color: #ffffff;" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="background-color: #0f2d1e; color: #ffffff; padding: 8px 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; border-radius: 6px 0 0 6px; width: 70px; text-align: center; letter-spacing: 0.5px;">
                            Số ghế
                          </td>
                          <td style="padding: 8px 12px; font-size: 13px; font-weight: bold; color: #0284c7;">
                            ${seatNumber}
                          </td>
                        </tr>
                      </table>
                    </td>
                    <td style="width: 4%;">&nbsp;</td>
                    <td style="width: 48%;">
                      <table style="width: 100%; border: 1px solid #16a34a; border-radius: 8px; border-collapse: separate; background-color: #ffffff;" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="background-color: #0f2d1e; color: #ffffff; padding: 8px 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; border-radius: 6px 0 0 6px; width: 70px; text-align: center; letter-spacing: 0.5px;">
                            Giá vé
                          </td>
                          <td style="padding: 8px 12px; font-size: 13px; font-weight: bold; color: #ef4444;">
                            ${formattedPrice} VNĐ
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- Footer -->
                <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
                  <tr>
                    <td style="vertical-align: middle;">
                      <div style="display: inline-block; width: 38px; height: 38px; border-radius: 50%; background-color: #e8f5e9; border: 2px solid #a5d6a7; text-align: center; vertical-align: middle; line-height: 38px;">
                        <span style="font-size: 16px;">🌿</span>
                      </div>
                    </td>
                    <td style="text-align: right; vertical-align: middle; font-size: 10px; color: #94a3b8;">
                      * Vui lòng xuất trình email này khi lên xe.
                    </td>
                  </tr>
                </table>

              </td>
              
              <!-- STUB PANEL (CUỐNG VÉ) (20%) -->
              <td style="width: 20%; padding: 20px 10px; text-align: center; vertical-align: middle; background-color: #f4fbf7; border-left: 2px dashed #16a34a;">
                <div style="font-size: 10px; color: #16a34a; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 6px;">
                  Cuống vé
                </div>
                <div style="font-size: 16px; font-weight: 800; color: #14532d; margin-bottom: 6px; letter-spacing: 1px;">
                  NetBus
                </div>
                <div style="font-size: 10px; color: #64748b; margin-bottom: 2px;">
                  VÉ SỐ:
                </div>
                <div style="font-size: 11px; font-weight: bold; color: #0f172a; margin-bottom: 12px; word-break: break-all;">
                  ${ticketId}
                </div>
                <div style="font-size: 9px; color: #16a34a; font-weight: bold; margin-top: 10px; letter-spacing: 1px;">
                  KHÁCH HÀNG GIỮ
                </div>
              </td>
            </tr>
          </table>

        </div>
      </div>
    `,
  });

  return res.status(200).json({
    success: true,
    message: "Đã xuất vé và gửi email hóa đơn thành công cho khách hàng!",
  });
});

// ==========================================
// 4. EVENT LISTENER: TỰ ĐỘNG GỬI VÉ XE (MÔ HÌNH EVENT-DRIVEN)
// ==========================================
ticketEventEmitter.on("ticket.success", async (ticketData) => {
  console.log("=== [NETBUS Event] Phát hiện đơn hàng mới! Đang xử lý gửi vé điện tử... ===");
  
  // Xử lý tách chuỗi hành trình giống hệt logic trên Web khách hàng
  const routeString = ticketData.route || "Hà Nội → Phú Thọ";
  const parts = routeString.split("→");
  const diemDi = parts[0]?.trim() || "Điểm đi";
  const diemDen = parts[1]?.trim() || "Điểm đến";

  try {
    let departureDate = "---";
    let departureTimeOnly = "---";
    try {
      const d = new Date(ticketData.departureTime);
      if (!isNaN(d.getTime())) {
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();
        departureDate = `${day}/${month}/${year}`;
        
        const hours = String(d.getHours()).padStart(2, "0");
        const minutes = String(d.getMinutes()).padStart(2, "0");
        departureTimeOnly = `${hours}:${minutes}`;
      } else {
        const prts = ticketData.departureTime.split(" ");
        if (prts.length === 2) {
          departureTimeOnly = prts[0];
          departureDate = prts[1];
        }
      }
    } catch (e) {}

    const routeDisplay = `${diemDi} - ${diemDen}`.toUpperCase();
    const formattedPrice = ticketData.totalPrice ? ticketData.totalPrice.toLocaleString("vi-VN") : "0";

    const qrValue = `--- VÉ ĐIỆN TỬ NETBUS ---
Mã vé: ${ticketData.ticketId}
Mã Code: ${ticketData.ticketId}
Hành khách: ${ticketData.customerName || "Hành khách NETBUS"}
Chuyến xe: ${ticketData.busType || 'Xe NETBUS Luxury'} (${diemDi} → ${diemDen})
BKS: ${ticketData.licensePlate || "29B-123.45"}
Vị trí ghế: ${ticketData.seatNumber || "Chưa chọn"}
Khởi hành: ${ticketData.departureTime}`;

    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${encodeURIComponent(qrValue)}`;

    await sendMail({
      email: ticketData.email,
      subject: `[NetBus] Vé xe điện tử của bạn - Mã vé: ${ticketData.ticketId}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; padding: 40px 0;">
          <div style="max-width: 720px; margin: 0 auto; padding: 0 16px;">
            
            <div style="text-align: center; padding-bottom: 24px;">
              <div style="font-size: 36px; line-height: 1; margin-bottom: 8px;">✅</div>
              <h2 style="margin: 0; color: #16a34a; font-size: 20px; font-weight: 600; letter-spacing: 0.5px;">ĐẶT VÉ THÀNH CÔNG!</h2>
              <p style="margin: 4px 0 0 0; color: #475569; font-size: 14px;">Cảm ơn bạn đã lựa chọn NETBUS</p>
            </div>

            <!-- KHỐI VÉ TOÀN DIỆN -->
            <table style="width: 100%; border: 1px solid #e2e8f0; border-radius: 20px; border-collapse: separate; background-color: #ffffff; overflow: hidden; margin: 0 auto; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);" cellpadding="0" cellspacing="0">
              <tr>
                <!-- LEFT QR PANEL (22%) -->
                <td style="width: 22%; padding: 20px; text-align: center; vertical-align: middle; background-color: #ffffff; border-right: 2px dashed #16a34a;">
                  <div style="padding: 4px; border: 1px solid #16a34a; border-radius: 10px; background: #ffffff; display: inline-block;">
                    <img src="${qrImageUrl}" alt="Mã QR Vé" style="width: 80px; height: 80px; display: block;" />
                  </div>
                  <div style="font-size: 9px; color: #16a34a; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 10px;">
                    Quét check-in
                  </div>
                </td>

                <!-- MAIN TICKET PANEL (58%) -->
                <td style="width: 58%; padding: 24px; vertical-align: top; background: radial-gradient(circle at -10% 50%, rgba(22, 163, 74, 0.06) 0%, transparent 60%), radial-gradient(circle at 100% 100%, rgba(22, 163, 74, 0.08) 0%, transparent 50%);">
                  
                  <!-- Header -->
                  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <tr>
                      <td style="vertical-align: middle;">
                        <img src="https://img.icons8.com/fluency/96/bus.png" alt="NETBUS" style="height: 28px; width: 28px; vertical-align: middle; margin-right: 8px;" />
                        <span style="font-size: 18px; font-weight: bold; color: #14532d; vertical-align: middle; letter-spacing: 0.5px;">NetBus</span>
                      </td>
                      <td style="text-align: right; vertical-align: middle;">
                        <span style="font-size: 11px; font-weight: bold; color: #16a34a; letter-spacing: 1px;">NETBUS - CHẠM LÀ ĐI</span>
                      </td>
                    </tr>
                  </table>

                  <!-- Fields -->
                  <table style="width: 100%; border: 1px solid #16a34a; border-radius: 8px; border-collapse: separate; margin-bottom: 12px; background-color: #ffffff;" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="background-color: #0f2d1e; color: #ffffff; padding: 8px 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; border-radius: 6px 0 0 6px; width: 100px; text-align: center; letter-spacing: 0.5px;">
                        Hành khách
                      </td>
                      <td style="padding: 8px 16px; font-size: 13px; font-weight: bold; color: #1e293b; text-transform: uppercase;">
                        ${ticketData.customerName || "Hành khách NETBUS"}
                      </td>
                    </tr>
                  </table>

                  <table style="width: 100%; border: 1px solid #16a34a; border-radius: 8px; border-collapse: separate; margin-bottom: 12px; background-color: #ffffff;" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="background-color: #0f2d1e; color: #ffffff; padding: 8px 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; border-radius: 6px 0 0 6px; width: 100px; text-align: center; letter-spacing: 0.5px;">
                        Tuyến đường
                      </td>
                      <td style="padding: 8px 16px; font-size: 13px; font-weight: bold; color: #14532d;">
                        ${routeDisplay}
                      </td>
                    </tr>
                  </table>

                  <!-- Bus Name & License Plate -->
                  <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
                    <tr>
                      <td style="width: 48%;">
                        <table style="width: 100%; border: 1px solid #16a34a; border-radius: 8px; border-collapse: separate; background-color: #ffffff;" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="background-color: #0f2d1e; color: #ffffff; padding: 8px 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; border-radius: 6px 0 0 6px; width: 70px; text-align: center; letter-spacing: 0.5px;">
                              Tên xe
                            </td>
                            <td style="padding: 8px 12px; font-size: 13px; font-weight: bold; color: #1e293b;">
                              ${ticketData.busType || "Xe NETBUS Luxury"}
                            </td>
                          </tr>
                        </table>
                      </td>
                      <td style="width: 4%;">&nbsp;</td>
                      <td style="width: 48%;">
                        <table style="width: 100%; border: 1px solid #16a34a; border-radius: 8px; border-collapse: separate; background-color: #ffffff;" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="background-color: #0f2d1e; color: #ffffff; padding: 8px 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; border-radius: 6px 0 0 6px; width: 55px; text-align: center; letter-spacing: 0.5px;">
                              BKS
                            </td>
                            <td style="padding: 8px 12px; font-size: 13px; font-weight: bold; color: #14532d;">
                              ${ticketData.licensePlate || "29B-123.45"}
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Date & Departs -->
                  <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
                    <tr>
                      <td style="width: 48%;">
                        <table style="width: 100%; border: 1px solid #16a34a; border-radius: 8px; border-collapse: separate; background-color: #ffffff;" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="background-color: #0f2d1e; color: #ffffff; padding: 8px 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; border-radius: 6px 0 0 6px; width: 70px; text-align: center; letter-spacing: 0.5px;">
                              Ngày đi
                            </td>
                            <td style="padding: 8px 12px; font-size: 13px; font-weight: bold; color: #1e293b;">
                              ${departureDate}
                            </td>
                          </tr>
                        </table>
                      </td>
                      <td style="width: 4%;">&nbsp;</td>
                      <td style="width: 48%;">
                        <table style="width: 100%; border: 1px solid #16a34a; border-radius: 8px; border-collapse: separate; background-color: #ffffff;" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="background-color: #0f2d1e; color: #ffffff; padding: 8px 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; border-radius: 6px 0 0 6px; width: 70px; text-align: center; letter-spacing: 0.5px;">
                              Giờ chạy
                            </td>
                            <td style="padding: 8px 12px; font-size: 13px; font-weight: bold; color: #1e293b;">
                              ${departureTimeOnly}
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Seat & Price -->
                  <table style="width: 100%; margin-bottom: 12px; border-collapse: collapse;">
                    <tr>
                      <td style="width: 48%;">
                        <table style="width: 100%; border: 1px solid #16a34a; border-radius: 8px; border-collapse: separate; background-color: #ffffff;" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="background-color: #0f2d1e; color: #ffffff; padding: 8px 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; border-radius: 6px 0 0 6px; width: 70px; text-align: center; letter-spacing: 0.5px;">
                              Số ghế
                            </td>
                            <td style="padding: 8px 12px; font-size: 13px; font-weight: bold; color: #0284c7;">
                              ${ticketData.seatNumber || "Chưa chọn"}
                            </td>
                          </tr>
                        </table>
                      </td>
                      <td style="width: 4%;">&nbsp;</td>
                      <td style="width: 48%;">
                        <table style="width: 100%; border: 1px solid #16a34a; border-radius: 8px; border-collapse: separate; background-color: #ffffff;" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="background-color: #0f2d1e; color: #ffffff; padding: 8px 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; border-radius: 6px 0 0 6px; width: 70px; text-align: center; letter-spacing: 0.5px;">
                              Giá vé
                            </td>
                            <td style="padding: 8px 12px; font-size: 13px; font-weight: bold; color: #ef4444;">
                              ${formattedPrice} VNĐ
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Footer -->
                  <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
                    <tr>
                      <td style="vertical-align: middle;">
                        <div style="display: inline-block; width: 38px; height: 38px; border-radius: 50%; background-color: #e8f5e9; border: 2px solid #a5d6a7; text-align: center; vertical-align: middle; line-height: 38px;">
                          <span style="font-size: 16px;">🌿</span>
                        </div>
                      </td>
                      <td style="text-align: right; vertical-align: middle; font-size: 10px; color: #94a3b8;">
                        * Vui lòng xuất trình email này khi lên xe.
                      </td>
                    </tr>
                  </table>

                </td>
                
                <!-- STUB PANEL (CUỐNG VÉ) (20%) -->
                <td style="width: 20%; padding: 20px 10px; text-align: center; vertical-align: middle; background-color: #f4fbf7; border-left: 2px dashed #16a34a;">
                  <div style="font-size: 10px; color: #16a34a; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 6px;">
                    Cuống vé
                  </div>
                  <div style="font-size: 16px; font-weight: 800; color: #14532d; margin-bottom: 6px; letter-spacing: 1px;">
                    NetBus
                  </div>
                  <div style="font-size: 10px; color: #64748b; margin-bottom: 2px;">
                    VÉ SỐ:
                  </div>
                  <div style="font-size: 11px; font-weight: bold; color: #0f172a; margin-bottom: 12px; word-break: break-all;">
                    ${ticketData.ticketId}
                  </div>
                  <div style="font-size: 9px; color: #16a34a; font-weight: bold; margin-top: 10px; letter-spacing: 1px;">
                    KHÁCH HÀNG GIỮ
                  </div>
                </td>
              </tr>
            </table>

          </div>
        </div>
      `,
    });
    console.log(`=== [NETBUS Event] Đã tự động xuất vé điện tử chuẩn UI Web gửi tới: ${ticketData.email} ===`);
  } catch (error) {
    console.error("=== [NETBUS Event LỖI] Không thể gửi mail vé xe:", error.message);
  }
}); 