import asyncHandler from "../utils/asyncHandler";
import Otp from "../models/otp.model";
import User from "../models/user.model";
import sendMail from "../utils/sendMail";

// ==========================================
// 1. API GỬI MÃ OTP VỀ EMAIL
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

  // Tiến hành gửi email qua Nodemailer
  await sendMail({
    email: email,
    subject: "[Bee Green] Mã xác thực OTP của bạn",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #2E7D32; text-align: center;">XÁC THỰC EMAIL</h2>
        <p>Chào bạn,</p>
        <p>Bạn đang thực hiện thao tác xác thực trên hệ thống Bee Green. Mã OTP của bạn là:</p>
        <div style="text-align: center; margin: 20px 0;">
          <span style="font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #fff; background: #2E7D32; padding: 10px 20px; border-radius: 5px; display: inline-block;">
            ${otpCode}
          </span>
        </div>
        <p style="color: #ff5722; font-size: 13px;">* Mã OTP này có hiệu lực trong vòng 5 phút. Vui lòng tuyệt đối không chia sẻ mã này với bất kỳ ai.</p>
      </div>
    `,
  });

  return res.status(200).json({
    success: true,
    message: "Mã OTP đã được gửi thành công, vui lòng kiểm tra hộp thư!",
  });
});

// ==========================================
// 2. API XÁC THỰC MÃ OTP (VALIDATE ĐẦU VÀO)
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
// 3. API GỬI VÉ XE ONLINE VỀ MAIL KHÁCH HÀNG
// ==========================================
export const sendTicket = asyncHandler(async (req, res) => {
  const { email, customerName, ticketId, route, departureTime, seatNumber, totalPrice } = req.body;

  if (!email || !ticketId) {
    return res.status(400).json({ message: "Thiếu thông tin gửi vé xe!" });
  }

  await sendMail({
    email: email,
    subject: `[Bee Green] Vé xe điện tử của bạn - Mã vé: ${ticketId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #dadada; border-radius: 8px; overflow: hidden;">
        <div style="background: #2E7D32; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">VÉ XE ĐIỆN TỬ ONLINE</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.8;">Hệ thống đặt vé thông minh Bee Green</p>
        </div>
        
        <div style="padding: 25px; background: #fff; line-height: 1.6;">
          <h3 style="color: #2E7D32; margin-top: 0; border-bottom: 2px dashed #eee; padding-bottom: 10px;">THÔNG TIN HÀNH KHÁCH</h3>
          <p><b>Họ và tên:</b> ${customerName || "Khách hàng"}</p>
          <p><b>Email nhận vé:</b> ${email}</p>
          
          <h3 style="color: #2E7D32; margin-top: 20px; border-bottom: 2px dashed #eee; padding-bottom: 10px;">CHI TIẾT CHUYẾN ĐI</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 5px 0;"><b>Mã số vé:</b></td>
              <td style="text-align: right; color: #d32f2f; font-weight: bold;">${ticketId}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0;"><b>Tuyến xe:</b></td>
              <td style="text-align: right;">${route}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0;"><b>Giờ khởi hành:</b></td>
              <td style="text-align: right; color: #333;"><b>${departureTime}</b></td>
            </tr>
            <tr>
              <td style="padding: 5px 0;"><b>Vị trí ghế:</b></td>
              <td style="text-align: right; font-weight: bold; color: #1976D2;">${seatNumber}</td>
            </tr>
            <tr style="border-top: 1px solid #eee;">
              <td style="padding: 15px 0 0 0; font-size: 16px;"><b>Tổng tiền thanh toán:</b></td>
              <td style="text-align: right; padding: 15px 0 0 0; font-size: 16px; color: #d32f2f; font-weight: bold;">${totalPrice} VNĐ</td>
            </tr>
          </table>
        </div>
        
        <div style="background: #f9f9f9; padding: 15px; text-align: center; border-top: 1px solid #eee; font-size: 12px; color: #666;">
          <p style="margin: 0;">Vui lòng xuất trình email này cho tài xế hoặc nhân viên soát vé trước khi lên xe.</p>
          <p style="margin: 5px 0 0 0; font-weight: bold; color: #2E7D32;">Bee Green chúc bạn có một hành trình an toàn và vui vẻ!</p>
        </div>
      </div>
    `,
  });

  return res.status(200).json({
    success: true,
    message: "Đã xuất vé và gửi email hóa đơn thành công cho khách hàng!",
  });
});