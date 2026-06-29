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
  const { email, customerName, ticketId, route, departureTime, seatNumber, totalPrice, busType } = req.body;

  if (!email || !ticketId) {
    return res.status(400).json({ message: "Thiếu thông tin gửi vé xe!" });
  }

  await sendMail({
    email: email,
    subject: `[NetBus] Vé xe điện tử của bạn - Mã vé: ${ticketId}`,
    html: `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 500px; margin: 20px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid #eef2f5;">
        <div style="padding: 20px 10px; text-align: center; background-color: #f8fafc;">
          <h2 style="margin: 0; color: #2E7D32; font-size: 22px; font-weight: 700; letter-spacing: 0.5px;">ĐẶT VÉ THÀNH CÔNG!</h2>
          <p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;">Cảm ơn bạn đã lựa chọn NetBus</p>
        </div>

        <div style="background-color: #1e293b; color: #ffffff; padding: 24px; position: relative;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td>
                <div style="display: inline-flex; align-items: center; gap: 6px;">
                  <span style="background-color: #2E7D32; color: white; font-size: 11px; font-weight: bold; padding: 3px 8px; border-radius: 4px;">NETBUS</span>
                </div>
              </td>
              <td style="text-align: right;">
                <span style="background-color: #2e7d32; color: #ffffff; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px;">Đã xác nhận</span>
              </td>
            </tr>
          </table>

          <table style="width: 100%; margin-top: 24px; border-collapse: collapse;">
            <tr>
              <td style="width: 40%;">
                <span style="color: #94a3b8; font-size: 12px; text-transform: uppercase; font-weight: 600;">Điểm đi</span>
                <h2 style="margin: 4px 0 0 0; font-size: 24px; font-weight: 700; color: #ffffff;">${route?.split("→")[0]?.trim() || "Hà Nội"}</h2>
              </td>
              <td style="width: 20%; text-align: center; vertical-align: middle;">
                <span style="font-size: 20px; color: #64748b;">➔</span>
              </td>
              <td style="width: 40%; text-align: right;">
                <span style="color: #94a3b8; font-size: 12px; text-transform: uppercase; font-weight: 600;">Điểm đến</span>
                <h2 style="margin: 4px 0 0 0; font-size: 24px; font-weight: 700; color: #ffffff;">${route?.split("→")[1]?.trim() || "Phú Thọ"}</h2>
              </td>
            </tr>
          </table>

          <div style="margin-top: 16px; font-size: 13px; color: #cbd5e1; border-top: 1px solid #334155; padding-top: 12px;">
            📍 <b>Dịch vụ:</b> ${busType || "Xe giường nằm VIP-12 Express"}
          </div>
        </div>

        <div style="background-color: #1e293b; height: 4px; position: relative;">
          <div style="border-top: 2px dashed #ffffff; opacity: 0.2; margin: 0 12px;"></div>
        </div>

        <div style="padding: 24px; background-color: #ffffff;">
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="width: 50%; padding-bottom: 16px;">
                <span style="color: #94a3b8; font-size: 11px; text-transform: uppercase; font-weight: 600; display:block;">Hành khách</span>
                <strong style="color: #334155; font-size: 14px; display:block; margin-top: 4px;">👤 ${customerName}</strong>
              </td>
              <td style="width: 50%; padding-bottom: 16px; padding-left: 10px;">
                <span style="color: #94a3b8; font-size: 11px; text-transform: uppercase; font-weight: 600; display:block;">Thời gian đi</span>
                <strong style="color: #334155; font-size: 14px; display:block; margin-top: 4px;">🕒 ${departureTime}</strong>
              </td>
            </tr>
            <tr>
              <td style="width: 50%;">
                <span style="color: #94a3b8; font-size: 11px; text-transform: uppercase; font-weight: 600; display:block;">Vị trí giường</span>
                <strong style="color: #1976D2; font-size: 16px; display:block; margin-top: 4px;">${seatNumber}</strong>
              </td>
              <td style="width: 50%; padding-left: 10px;">
                <span style="color: #94a3b8; font-size: 11px; text-transform: uppercase; font-weight: 600; display:block;">Mã vé điện tử</span>
                <strong style="color: #334155; font-size: 15px; display:block; margin-top: 4px; letter-spacing: 0.5px;">${ticketId}</strong>
              </td>
            </tr>
          </table>

          <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 10px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="vertical-align: middle;">
                  <span style="color: #94a3b8; font-size: 12px; font-weight: 600; text-transform: uppercase; display:block;">Tổng tiền thanh toán</span>
                  <span style="color: #dc2626; font-size: 24px; font-weight: 800; display:block; margin-top: 4px;">${totalPrice?.toLocaleString()}đ</span>
                </td>
                <td style="text-align: right; width: 80px; vertical-align: middle;">
                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${ticketId}" alt="Mã QR Vé" style="width: 70px; height: 70px; border: 1px solid #e2e8f0; padding: 4px; border-radius: 8px;" />
                </td>
              </tr>
            </table>
          </div>
        </div>
        
        <div style="background-color: #f8fafc; padding: 12px; text-align: center; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8;">
          Vui lòng xuất trình email này cho tài xế hoặc nhân viên soát vé khi lên xe. NetBus chúc bạn một chuyến đi an toàn!
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
    await sendMail({
      email: ticketData.email,
      subject: `[NetBus] Vé xe điện tử của bạn - Mã vé: ${ticketData.ticketId}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; padding: 40px 0;">
          <div style="max-width: 450px; margin: 0 auto; padding: 0 16px;">
            
            <div style="text-align: center; padding-bottom: 24px;">
              <div style="font-size: 36px; line-height: 1; margin-bottom: 8px;">✅</div>
              <h2 style="margin: 0; color: #16a34a; font-size: 20px; font-weight: 600; letter-spacing: 0.5px;">ĐẶT VÉ THÀNH CÔNG!</h2>
              <p style="margin: 4px 0 0 0; color: #475569; font-size: 14px;">Cảm ơn bạn đã lựa chọn NETBUS</p>
            </div>

            <div style="border-radius: 30px; box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08); overflow: hidden; background: #ffffff;">
              
              <div style="background: #1e293b; padding: 28px 24px 24px 24px; color: #ffffff;">
                
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                  <tr>
                    <td style="vertical-align: middle;">
                      <span style="color: #ffffff; font-size: 16px; font-weight: bold; letter-spacing: 1px;">NETBUS</span>
                    </td>
                    <td style="text-align: right; vertical-align: middle;">
                      <span style="display: inline-block; border-radius: 20px; background-color: #16a34a; color: #ffffff; font-size: 12px; font-weight: 600; padding: 4px 12px; border: none;">
                        Đã xác nhận
                      </span>
                    </td>
                  </tr>
                </table>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
                  <tr>
                    <td style="width: 40%; vertical-align: top;">
                      <div style="color: #cbd5e1; font-size: 12px; text-transform: uppercase; margin-bottom: 2px;">Điểm đi</div>
                      <div style="color: #ffffff; font-size: 20px; font-weight: bold;">${diemDi}</div>
                    </td>
                    <td style="width: 20%; text-align: center; vertical-align: middle; color: #64748b; font-size: 20px;">
                      ➔
                    </td>
                    <td style="width: 40%; text-align: right; vertical-align: top;">
                      <div style="color: #cbd5e1; font-size: 12px; text-transform: uppercase; margin-bottom: 2px;">Điểm đến</div>
                      <div style="color: #ffffff; font-size: 20px; font-weight: bold;">${diemDen}</div>
                    </td>
                  </tr>
                </table>

                <div style="color: #cbd5e1; font-size: 13px; display: flex; align-items: center;">
                  <span style="color: #38bdf8; margin-right: 6px;">📍</span> 
                  Dịch vụ: <span style="color: #ffffff; font-weight: 500; margin-left: 4px;">${ticketData.busType || "Xe NETBUS Luxury"}</span>
                </div>
              </div>

              <table style="width: 100%; background: #ffffff; border-collapse: collapse; height: 24px; overflow: hidden;" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width: 12px; background: #f1f5f9; border-radius: 0 12px 12px 0;"></td>
                  <td style="vertical-align: middle; padding: 0 8px;">
                    <div style="border-top: 2px dashed #e2e8f0; width: 100%; height: 1px;"></div>
                  </td>
                  <td style="width: 12px; background: #f1f5f9; border-radius: 12px 0 0 12px;"></td>
                </tr>
              </table>

              <div style="background: #ffffff; padding: 4px 24px 28px 24px;">
                
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width: 50%; padding-bottom: 20px; vertical-align: top;">
                      <div style="color: #64748b; font-size: 11px; text-transform: uppercase; margin-bottom: 4px;">Hành khách</div>
                      <div style="color: #0f172a; font-size: 14px; font-weight: bold;">👤 ${ticketData.customerName || "Hành khách NETBUS"}</div>
                    </td>
                    <td style="width: 50%; padding-bottom: 20px; vertical-align: top; padding-left: 10px;">
                      <div style="color: #64748b; font-size: 11px; text-transform: uppercase; margin-bottom: 4px;">Thời gian đi</div>
                      <div style="color: #0f172a; font-size: 14px; font-weight: bold;">🕒 ${ticketData.departureTime}</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="width: 50%; vertical-align: top;">
                      <div style="color: #64748b; font-size: 11px; text-transform: uppercase; margin-bottom: 4px;">Vị trí giường</div>
                      <div style="color: #0284c7; font-size: 15px; font-weight: bold;">${ticketData.seatNumber || "Chưa chọn"}</div>
                    </td>
                    <td style="width: 50%; vertical-align: top; padding-left: 10px;">
                      <div style="color: #64748b; font-size: 11px; text-transform: uppercase; margin-bottom: 4px;">Mã vé điện tử</div>
                      <div style="color: #334155; font-size: 14px; font-weight: bold;">${ticketData.ticketId}</div>
                    </td>
                  </tr>
                </table>

                <div style="height: 1px; background: #f1f5f9; margin: 24px 0 16px 0;"></div>

                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="vertical-align: middle;">
                      <div style="color: #64748b; font-size: 11px; text-transform: uppercase; margin-bottom: 4px;">Tổng tiền thanh toán</div>
                      <div style="color: #ef4444; font-size: 24px; font-weight: 800; margin: 0;">
                        ${ticketData.totalPrice ? ticketData.totalPrice.toLocaleString("vi-VN") : "0"}đ
                      </div>
                    </td>
                    <td style="text-align: right; width: 62px; vertical-align: middle;">
                      <div style="padding: 6px; border: 1px solid #e2e8f0; border-radius: 14px; background: #f8fafc; display: inline-block;">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=50x50&data=${ticketData.ticketId}" alt="Mã QR Vé" style="width: 50px; height: 50px; display: block;" />
                      </div>
                    </td>
                  </tr>
                </table>

              </div>
            </div>

          </div>
        </div>
      `,
    });
    console.log(`=== [NETBUS Event] Đã tự động xuất vé điện tử chuẩn UI Web gửi tới: ${ticketData.email} ===`);
  } catch (error) {
    console.error("=== [NETBUS Event LỖI] Không thể gửi mail vé xe:", error.message);
  }
}); 