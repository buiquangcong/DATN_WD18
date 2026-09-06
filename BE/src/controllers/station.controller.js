import asyncHandler from "../utils/asyncHandler.js";
import Station from "../models/station.model.js";
import Journey from "../models/journey.model.js";

// Dữ liệu mẫu ban đầu cho các bến xe miền Bắc
const INITIAL_STATIONS = [
  { tinh: "Thành phố Hà Nội", tenBenXe: "Bến xe Mỹ Đình", diaChi: "Số 20 Phạm Hùng, Mỹ Đình, Nam Từ Liêm, Hà Nội" },
  { tinh: "Thành phố Hà Nội", tenBenXe: "Bến xe Giáp Bát", diaChi: "Km6 Đường Giải Phóng, Giáp Bát, Hoàng Mai, Hà Nội" },
  { tinh: "Thành phố Hà Nội", tenBenXe: "Bến xe Nước Ngầm", diaChi: "Số 01 Ngọc Hồi, Hoàng Liệt, Hoàng Mai, Hà Nội" },
  { tinh: "Thành phố Hà Nội", tenBenXe: "Bến xe Gia Lâm", diaChi: "Số 9 Ngô Gia Khảm, Long Biên, Hà Nội" },
  { tinh: "Thành phố Hà Nội", tenBenXe: "Bến xe Yên Nghĩa", diaChi: "QL6, Yên Nghĩa, Hà Đông, Hà Nội" },

  { tinh: "Thành phố Hải Phòng", tenBenXe: "Bến xe Thượng Lý", diaChi: "Số 52 đường Hà Nội, Sở Dầu, Hồng Bàng, Hải Phòng" },
  { tinh: "Thành phố Hải Phòng", tenBenXe: "Bến xe Vĩnh Niệm", diaChi: "Bùi Viện, Vĩnh Niệm, Lê Chân, Hải Phòng" },
  { tinh: "Thành phố Hải Phòng", tenBenXe: "Bến xe Niệm Nghĩa", diaChi: "Số 275 Trần Nguyên Hãn, Niệm Nghĩa, Lê Chân, Hải Phòng" },

  { tinh: "Tỉnh Quảng Ninh", tenBenXe: "Bến xe Bãi Cháy", diaChi: "Số 17 đường 279, Bãi Cháy, Hạ Long, Quảng Ninh" },
  { tinh: "Tỉnh Quảng Ninh", tenBenXe: "Bến xe Cửa Ông", diaChi: "Cửa Ông, Cẩm Phả, Quảng Ninh" },
  { tinh: "Tỉnh Quảng Ninh", tenBenXe: "Bến xe Móng Cái", diaChi: "Đường Hùng Vương, Ka Long, Móng Cái, Quảng Ninh" },

  { tinh: "Tỉnh Hải Dương", tenBenXe: "Bến xe Hải Dương", diaChi: "Hồng Quang, TP. Hải Dương, Hải Dương" },
  { tinh: "Tỉnh Vĩnh Phúc", tenBenXe: "Bến xe Vĩnh Yên", diaChi: "Đường Mê Linh, Khai Quang, Vĩnh Yên, Vĩnh Phúc" },
  { tinh: "Tỉnh Bắc Ninh", tenBenXe: "Bến xe Bắc Ninh", diaChi: "Đường Nguyễn Du, Ninh Xá, TP. Bắc Ninh" },
  { tinh: "Tỉnh Nam Định", tenBenXe: "Bến xe Nam Định", diaChi: "Đường Điện Biên, Lộc Hòa, TP. Nam Định" },
  { tinh: "Tỉnh Thái Bình", tenBenXe: "Bến xe Thái Bình", diaChi: "Phố Lý Bôn, Tiền Phong, TP. Thái Bình" },
  { tinh: "Tỉnh Ninh Bình", tenBenXe: "Bến xe Ninh Bình", diaChi: "Số 207 Lê Đại Hành, Thanh Bình, TP. Ninh Bình" },
  { tinh: "Tỉnh Phú Thọ", tenBenXe: "Bến xe Việt Trì", diaChi: "Đường Hùng Vương, Gia Cẩm, Việt Trì, Phú Thọ" },
  { tinh: "Tỉnh Thái Nguyên", tenBenXe: "Bến xe Thái Nguyên", diaChi: "Tổ 21, Quang Trung, TP. Thái Nguyên" },
  { tinh: "Tỉnh Lào Cai", tenBenXe: "Bến xe Trung tâm Lào Cai", diaChi: "Tổ 19, Phường Bình Minh, TP. Lào Cai" },
  { tinh: "Tỉnh Lào Cai", tenBenXe: "Bến xe Sa Pa", diaChi: "Đường Điện Biên Phủ, TX. Sa Pa, Lào Cai" },
];

// =======================
// Lấy danh sách bến xe
// =======================
export const getAll = asyncHandler(async (req, res) => {
  // Tự động gieo dữ liệu mẫu ban đầu nếu cơ sở dữ liệu chưa có bến xe nào
  const count = await Station.countDocuments();
  if (count === 0) {
    await Station.insertMany(INITIAL_STATIONS);
  }

  const { tinh } = req.query;
  const filter = {};

  if (tinh) {
    filter.tinh = tinh;
  }

  const stations = await Station.find(filter).sort({ tinh: 1, tenBenXe: 1 });
  return res.json(stations);
});

// =======================
// Lấy chi tiết một bến xe
// =======================
export const getOne = asyncHandler(async (req, res) => {
  const station = await Station.findById(req.params.id);

  if (!station) {
    return res.status(404).json({
      message: "Không tìm thấy bến xe",
    });
  }

  return res.json(station);
});

// =======================
// Thêm mới bến xe
// =======================
export const createOne = asyncHandler(async (req, res) => {
  const { tinh, tenBenXe, diaChi, trangThai } = req.body;

  if (!tinh || !tinh.trim()) {
    return res.status(400).json({
      message: "Vui lòng chọn tỉnh/thành phố",
    });
  }

  if (!tenBenXe || !tenBenXe.trim()) {
    return res.status(400).json({
      message: "Vui lòng nhập tên bến xe",
    });
  }

  const trimmedTinh = tinh.trim();
  const trimmedTenBenXe = tenBenXe.trim();

  // Kiểm tra trùng tên bến xe trong cùng một tỉnh
  const existed = await Station.findOne({
    tinh: trimmedTinh,
    tenBenXe: { $regex: new RegExp(`^${trimmedTenBenXe}$`, "i") },
  });

  if (existed) {
    return res.status(400).json({
      message: `Bến xe "${trimmedTenBenXe}" đã tồn tại ở ${trimmedTinh}`,
    });
  }

  const newStation = await Station.create({
    tinh: trimmedTinh,
    tenBenXe: trimmedTenBenXe,
    diaChi: diaChi ? diaChi.trim() : "",
    trangThai: trangThai !== undefined ? trangThai : true,
  });

  return res.status(201).json({
    message: "Thêm bến xe thành công",
    data: newStation,
  });
});

// =======================
// Cập nhật bến xe
// =======================
export const updateOne = asyncHandler(async (req, res) => {
  const { tinh, tenBenXe, diaChi, trangThai } = req.body;
  const currentStation = await Station.findById(req.params.id);

  if (!currentStation) {
    return res.status(404).json({
      message: "Không tìm thấy bến xe",
    });
  }

  const updatedTinh = tinh ? tinh.trim() : currentStation.tinh;
  const updatedTenBenXe = tenBenXe ? tenBenXe.trim() : currentStation.tenBenXe;

  // Kiểm tra trùng với bến xe khác cùng tỉnh
  const existed = await Station.findOne({
    tinh: updatedTinh,
    tenBenXe: { $regex: new RegExp(`^${updatedTenBenXe}$`, "i") },
    _id: { $ne: req.params.id },
  });

  if (existed) {
    return res.status(400).json({
      message: `Bến xe "${updatedTenBenXe}" đã tồn tại ở ${updatedTinh}`,
    });
  }

  const updatedStation = await Station.findByIdAndUpdate(
    req.params.id,
    {
      tinh: updatedTinh,
      tenBenXe: updatedTenBenXe,
      diaChi: diaChi !== undefined ? diaChi.trim() : currentStation.diaChi,
      trangThai: trangThai !== undefined ? trangThai : currentStation.trangThai,
    },
    { new: true }
  );

  return res.json({
    message: "Cập nhật bến xe thành công",
    data: updatedStation,
  });
});

// =======================
// Xóa bến xe
// =======================
export const deleteOne = asyncHandler(async (req, res) => {
  const station = await Station.findById(req.params.id);

  if (!station) {
    return res.status(404).json({
      message: "Không tìm thấy bến xe",
    });
  }

  // Kiểm tra bến xe có đang được sử dụng trong điểm đón hoặc điểm trả của Tuyến đường không
  const inUseJourney = await Journey.findOne({
    $or: [
      { "diemDon.diaDiem": station.tenBenXe },
      { "diemTra.diaDiem": station.tenBenXe },
    ],
  });

  if (inUseJourney) {
    return res.status(400).json({
      message: `Bến xe "${station.tenBenXe}" đang được dùng trong tuyến đường ${inUseJourney.diemDi} - ${inUseJourney.diemDen}, không thể xóa!`,
    });
  }

  await Station.findByIdAndDelete(req.params.id);

  return res.json({
    message: "Xóa bến xe thành công",
  });
});
