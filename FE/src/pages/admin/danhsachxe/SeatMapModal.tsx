import React, { useState, useMemo } from "react";
import { Modal, Tag, Button, Space, Card, Segmented, Tooltip } from "antd";
import {
  CarOutlined,
  EditOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

export interface BusData {
  _id: string;
  name: string;
  licensePlates: string;
  capacity: number;
  type: "Sleeper" | "Seater" | "Limousine" | string;
  hangxe?: string;
  driver?: any;
  status: "hoạt động" | "bảo trì" | "ngừng hoạt động" | string;
}

export interface GeneratedSeat {
  seatCode: string;
  rowIndex: number;
  colIndex: number;
  floor: number;
  status: "AVAILABLE";
  label?: string;
}

interface SeatMapModalProps {
  open: boolean;
  bus: BusData | null;
  onClose: () => void;
}

/**
 * Hàm sinh danh sách vị trí ghế khớp với cấu hình hệ thống NETBUS
 */
export function generateBusSeats(capacity: number, busType: string): GeneratedSeat[] {
  const seats: GeneratedSeat[] = [];

  // 1. Trường hợp xe Limousine VIP / Xe 16 chỗ hoán cải hạ tải (7 đến 9 chỗ)
  if (busType === "Limousine" || (busType === "Seater" && capacity >= 7 && capacity <= 10)) {
    // 2 ghế VIP hàng 1 (ngay sau khoang lái, khoảng để chân rộng rãi)
    seats.push({
      seatCode: "VIP1",
      rowIndex: 1,
      colIndex: 1,
      status: "AVAILABLE",
      floor: 1,
      label: "Ghế VIP Thương gia (Cửa sổ trái)",
    });
    seats.push({
      seatCode: "VIP2",
      rowIndex: 1,
      colIndex: 3,
      status: "AVAILABLE",
      floor: 1,
      label: "Ghế VIP Thương gia (Lối lên phải)",
    });

    // 2 ghế VIP hàng 2 (chức năng ngả sâu / massage)
    seats.push({
      seatCode: "VIP3",
      rowIndex: 2,
      colIndex: 1,
      status: "AVAILABLE",
      floor: 1,
      label: "Ghế VIP Massage (Cửa sổ trái)",
    });
    seats.push({
      seatCode: "VIP4",
      rowIndex: 2,
      colIndex: 3,
      status: "AVAILABLE",
      floor: 1,
      label: "Ghế VIP Massage (Lối lên phải)",
    });

    // Băng ghế sofa 3 chỗ sau cùng
    seats.push({
      seatCode: "VIP5",
      rowIndex: 3,
      colIndex: 1,
      status: "AVAILABLE",
      floor: 1,
      label: "Băng sofa VIP (Góc trái)",
    });
    seats.push({
      seatCode: "VIP6",
      rowIndex: 3,
      colIndex: 2,
      status: "AVAILABLE",
      floor: 1,
      label: "Băng sofa VIP (Chính giữa)",
    });
    seats.push({
      seatCode: "VIP7",
      rowIndex: 3,
      colIndex: 3,
      status: "AVAILABLE",
      floor: 1,
      label: "Băng sofa VIP (Góc phải)",
    });

    // Nếu xe 8 chỗ: có thêm 1 ghế A1 ở khoang đầu (ngồi ngay cạnh tài xế)
    if (capacity >= 8) {
      seats.push({
        seatCode: "A1",
        rowIndex: 0, // rowIndex = 0 để khi render (row + 1) sẽ nằm ở Hàng 1 cạnh tài xế
        colIndex: 2,
        status: "AVAILABLE",
        floor: 1,
        label: "Ghế khoang đầu (Cạnh tài xế)",
      });
    }
    // Nếu xe 9 chỗ: có thêm ghế A2 cạnh cửa phụ khoang đầu
    if (capacity >= 9) {
      seats.push({
        seatCode: "A2",
        rowIndex: 0, // Nằm ở Hàng 1 cạnh ghế A1
        colIndex: 3,
        status: "AVAILABLE",
        floor: 1,
        label: "Ghế khoang đầu (Cửa phụ)",
      });
    }
    return seats;
  }

  if (busType === "Sleeper" && (capacity === 34 || capacity === 38)) {
    // Xe giường nằm 34 chỗ (2 tầng, mỗi tầng 17 giường)
    for (let floor = 1; floor <= 2; floor++) {
      const prefix = floor === 1 ? "A" : "B";

      // Hàng 1 đến 5: mỗi hàng 3 giường (cột 1, 3, 5 - cột 2 và 4 là lối đi)
      for (let row = 1; row <= 5; row++) {
        const baseNum = (row - 1) * 3;

        // Dãy phải (cột 5)
        seats.push({
          seatCode: `${prefix}${baseNum + 1}`,
          rowIndex: row,
          colIndex: 5,
          status: "AVAILABLE",
          floor: floor,
          label: `Dãy phải - Hàng ${row}`,
        });

        // Dãy giữa (cột 3)
        seats.push({
          seatCode: `${prefix}${baseNum + 2}`,
          rowIndex: row,
          colIndex: 3,
          status: "AVAILABLE",
          floor: floor,
          label: `Dãy giữa - Hàng ${row}`,
        });

        // Dãy trái (cột 1)
        seats.push({
          seatCode: `${prefix}${baseNum + 3}`,
          rowIndex: row,
          colIndex: 1,
          status: "AVAILABLE",
          floor: floor,
          label: `Dãy trái - Hàng ${row}`,
        });
      }

      // Hàng 6: 2 giường cuối
      seats.push({
        seatCode: `${prefix}16`,
        rowIndex: 6,
        colIndex: 3,
        status: "AVAILABLE",
        floor: floor,
        label: `Dãy giữa - Cuối xe`,
      });

      seats.push({
        seatCode: `${prefix}17`,
        rowIndex: 6,
        colIndex: 1,
        status: "AVAILABLE",
        floor: floor,
        label: `Dãy trái - Cuối xe`,
      });
    }
    return seats;
  }

  if (busType === "Seater" && capacity === 16) {
    // Xe ghế ngồi 16 chỗ (Ford Transit / Solati)
    for (let row = 1; row <= 4; row++) {
      seats.push({
        seatCode: `A${row}`,
        rowIndex: row,
        colIndex: 1,
        status: "AVAILABLE",
        floor: 1,
        label: `Dãy trái - Hàng ${row}`,
      });
      seats.push({
        seatCode: `B${row}`,
        rowIndex: row,
        colIndex: 3,
        status: "AVAILABLE",
        floor: 1,
        label: `Dãy phải (trong) - Hàng ${row}`,
      });
      seats.push({
        seatCode: `C${row}`,
        rowIndex: row,
        colIndex: 4,
        status: "AVAILABLE",
        floor: 1,
        label: `Dãy phải (cửa) - Hàng ${row}`,
      });
    }

    // Hàng 5: 4 ghế liền kề
    ["A", "B", "C", "D"].forEach((colLetter, index) => {
      seats.push({
        seatCode: `${colLetter}5`,
        rowIndex: 5,
        colIndex: index + 1,
        status: "AVAILABLE",
        floor: 1,
        label: `Băng sau cùng - Vị trí ${index + 1}`,
      });
    });
    return seats;
  }

  if (busType === "Seater" && capacity === 29) {
    // Xe ghế ngồi 29 chỗ (County / Thaco Garden)
    for (let row = 1; row <= 6; row++) {
      seats.push({
        seatCode: `A${row}`,
        rowIndex: row,
        colIndex: 1,
        status: "AVAILABLE",
        floor: 1,
        label: `Dãy trái (cửa sổ) - Hàng ${row}`,
      });
      seats.push({
        seatCode: `B${row}`,
        rowIndex: row,
        colIndex: 2,
        status: "AVAILABLE",
        floor: 1,
        label: `Dãy trái (lối đi) - Hàng ${row}`,
      });
      seats.push({
        seatCode: `C${row}`,
        rowIndex: row,
        colIndex: 4,
        status: "AVAILABLE",
        floor: 1,
        label: `Dãy phải (lối đi) - Hàng ${row}`,
      });
      seats.push({
        seatCode: `D${row}`,
        rowIndex: row,
        colIndex: 5,
        status: "AVAILABLE",
        floor: 1,
        label: `Dãy phải (cửa sổ) - Hàng ${row}`,
      });
    }

    // Hàng 7: 5 ghế sau cùng
    ["A", "B", "C", "D", "E"].forEach((colLetter, index) => {
      seats.push({
        seatCode: `${colLetter}7`,
        rowIndex: 7,
        colIndex: index + 1,
        status: "AVAILABLE",
        floor: 1,
        label: `Băng sau cùng - Ghế ${colLetter}`,
      });
    });
    return seats;
  }

  if (busType === "Seater" && capacity === 45) {
    // Xe ghế ngồi 45 chỗ (Universe / Thaco Bluesky)
    for (let row = 1; row <= 10; row++) {
      seats.push({
        seatCode: `A${row}`,
        rowIndex: row,
        colIndex: 1,
        status: "AVAILABLE",
        floor: 1,
        label: `Dãy trái (cửa sổ) - Hàng ${row}`,
      });
      seats.push({
        seatCode: `B${row}`,
        rowIndex: row,
        colIndex: 2,
        status: "AVAILABLE",
        floor: 1,
        label: `Dãy trái (lối đi) - Hàng ${row}`,
      });
      seats.push({
        seatCode: `C${row}`,
        rowIndex: row,
        colIndex: 4,
        status: "AVAILABLE",
        floor: 1,
        label: `Dãy phải (lối đi) - Hàng ${row}`,
      });
      seats.push({
        seatCode: `D${row}`,
        rowIndex: row,
        colIndex: 5,
        status: "AVAILABLE",
        floor: 1,
        label: `Dãy phải (cửa sổ) - Hàng ${row}`,
      });
    }

    // Hàng 11: 5 ghế liền kề
    ["A", "B", "C", "D", "E"].forEach((colLetter, index) => {
      seats.push({
        seatCode: `${colLetter}11`,
        rowIndex: 11,
        colIndex: index + 1,
        status: "AVAILABLE",
        floor: 1,
        label: `Băng sau cùng - Ghế ${colLetter}`,
      });
    });
    return seats;
  }

  // Fallback thông minh nếu có số chỗ khác:
  if (busType === "Sleeper") {
    const half = Math.ceil(capacity / 2);
    for (let floor = 1; floor <= 2; floor++) {
      const prefix = floor === 1 ? "A" : "B";
      const floorCount = floor === 1 ? half : capacity - half;
      for (let i = 1; i <= floorCount; i++) {
        const row = Math.ceil(i / 3);
        const colMod = (i - 1) % 3;
        const col = colMod === 0 ? 1 : colMod === 1 ? 3 : 5;
        seats.push({
          seatCode: `${prefix}${i}`,
          rowIndex: row,
          colIndex: col,
          status: "AVAILABLE",
          floor: floor,
          label: `Tầng ${floor} - Giường ${i}`,
        });
      }
    }
  } else {
    // Seater fallback
    for (let i = 1; i <= capacity; i++) {
      const row = Math.ceil(i / 4);
      const colMod = (i - 1) % 4;
      const col = colMod < 2 ? colMod + 1 : colMod + 2; // tạo lối đi ở giữa
      const letters = ["A", "B", "C", "D"];
      seats.push({
        seatCode: `${letters[colMod]}${row}`,
        rowIndex: row,
        colIndex: col,
        status: "AVAILABLE",
        floor: 1,
        label: `Hàng ${row} - Ghế ${letters[colMod]}`,
      });
    }
  }

  return seats;
}

export const SeatMapModal: React.FC<SeatMapModalProps> = ({ open, bus, onClose }) => {
  const navigate = useNavigate();
  const [selectedSeat, setSelectedSeat] = useState<GeneratedSeat | null>(null);
  const [viewFloorTab, setViewFloorTab] = useState<string>("all");

  const isSleeper = bus?.type === "Sleeper";
  const capacity = bus?.capacity || 0;

  // Sinh danh sách ghế tương ứng
  const seats = useMemo(() => {
    if (!bus) return [];
    return generateBusSeats(bus.capacity, bus.type);
  }, [bus]);

  // Số cột của grid
  const totalCols = useMemo(() => {
    if (isSleeper) return 5;
    if (capacity <= 10 || bus?.type === "Limousine") return 3; // Limousine 3 cột (Ghế trái - Lối đi - Ghế phải)
    if (capacity === 16) return 4;
    return 5; // 29, 45 chỗ đều là 5 cột (2 ghế - lối đi - 2 ghế)
  }, [isSleeper, capacity, bus?.type]);

  // Render 1 ghế hoặc giường
  const renderSeatItem = (seat: GeneratedSeat, showCockpit: boolean) => {
    const isClicked = selectedSeat?.seatCode === seat.seatCode;
    const gridRow = showCockpit ? seat.rowIndex + 1 : seat.rowIndex;

    if (isSleeper) {
      return (
        <Tooltip
          key={seat.seatCode}
          title={
            <div className="text-xs">
              <p className="font-bold text-emerald-400">Giường: {seat.seatCode}</p>
              <p>Tầng: {seat.floor === 1 ? "Tầng 1 (Dưới)" : "Tầng 2 (Trên)"}</p>
              <p>Vị trí: {seat.label}</p>
              <p className="text-gray-300">Trạng thái: Sẵn sàng</p>
            </div>
          }
        >
          <div
            onClick={() => setSelectedSeat(seat)}
            style={{
              gridColumnStart: seat.colIndex,
              gridRowStart: gridRow,
              cursor: "pointer",
            }}
            className={`group relative h-[62px] w-full rounded-xl transition-all duration-200 transform ${
              isClicked
                ? "ring-2 ring-emerald-500 scale-105 shadow-md z-10"
                : "hover:-translate-y-0.5 hover:shadow-sm"
            }`}
          >
            {/* Khung giường */}
            <div
              className={`absolute inset-0 rounded-xl border-2 transition-colors ${
                isClicked
                  ? "bg-emerald-50/90 border-emerald-500"
                  : "bg-white border-slate-300 group-hover:border-emerald-400 group-hover:bg-slate-50"
              }`}
            />

            {/* Gối đầu */}
            <div
              className={`absolute top-1.5 left-2 right-2 h-2.5 rounded-sm border transition-colors ${
                isClicked
                  ? "bg-emerald-200 border-emerald-400"
                  : "bg-slate-100 border-slate-200 group-hover:bg-emerald-100/60"
              }`}
            />

            {/* Tấm ga đệm chân */}
            <div
              className={`absolute bottom-1.5 left-2 right-2 h-2 rounded-b-sm border-t border-dashed transition-colors ${
                isClicked
                  ? "bg-emerald-100 border-emerald-300"
                  : "bg-slate-50 border-slate-200"
              }`}
            />

            {/* Mã số giường */}
            <div className="relative z-10 h-full flex flex-col items-center justify-center pt-2">
              <span
                className={`text-[12px] font-bold tracking-wide transition-colors ${
                  isClicked
                    ? "text-emerald-700 font-extrabold"
                    : "text-slate-700 group-hover:text-emerald-700"
                }`}
              >
                {seat.seatCode}
              </span>
            </div>
          </div>
        </Tooltip>
      );
    }

    // Xe ghế ngồi (Seater)
    return (
      <Tooltip
        key={seat.seatCode}
        title={
          <div className="text-xs">
            <p className="font-bold text-emerald-400">Ghế: {seat.seatCode}</p>
            <p>Vị trí: {seat.label}</p>
            <p className="text-gray-300">Trạng thái: Sẵn sàng</p>
          </div>
        }
      >
        <div
          onClick={() => setSelectedSeat(seat)}
          style={{
            gridColumnStart: seat.colIndex,
            gridRowStart: gridRow,
            cursor: "pointer",
          }}
          className={`group relative h-[52px] w-full rounded-lg transition-all duration-200 transform ${
            isClicked
              ? "ring-2 ring-emerald-500 scale-105 shadow-md z-10"
              : "hover:-translate-y-0.5 hover:shadow-sm"
          }`}
        >
          {/* Tựa đầu ghế */}
          <div
            className={`absolute top-0.5 left-1/4 right-1/4 h-2 rounded-t border-t-2 border-x-2 transition-colors ${
              isClicked
                ? "bg-emerald-100 border-emerald-500"
                : "bg-slate-100 border-slate-300 group-hover:border-emerald-400"
            }`}
          />

          {/* Thân đệm ghế */}
          <div
            className={`absolute top-2.5 bottom-0 inset-x-1 rounded-lg border-2 transition-colors ${
              isClicked
                ? "bg-emerald-50/90 border-emerald-500"
                : "bg-white border-slate-300 group-hover:border-emerald-400 group-hover:bg-slate-50"
            }`}
          />

          {/* Tay vịn 2 bên */}
          <div
            className={`absolute top-4 bottom-1.5 left-0 w-1 rounded-full transition-colors ${
              isClicked ? "bg-emerald-400" : "bg-slate-300"
            }`}
          />
          <div
            className={`absolute top-4 bottom-1.5 right-0 w-1 rounded-full transition-colors ${
              isClicked ? "bg-emerald-400" : "bg-slate-300"
            }`}
          />

          {/* Mã số ghế */}
          <div className="relative z-10 h-full flex flex-col items-center justify-center pt-2">
            <span
              className={`text-[12px] font-bold tracking-wide transition-colors ${
                isClicked
                  ? "text-emerald-700 font-extrabold"
                  : "text-slate-700 group-hover:text-emerald-700"
              }`}
            >
              {seat.seatCode}
            </span>
          </div>
        </div>
      </Tooltip>
    );
  };

  // Render mô hình thân xe cho từng tầng
  const renderBusFloor = (floorNum: number, floorLabel: string) => {
    const seatsInFloor = seats.filter((s) => s.floor === floorNum);
    const showCockpit = floorNum === 1;

    return (
      <div className="flex flex-col items-center">
        <div className="mb-2 text-center">
          <Tag color="green" className="font-semibold px-3 py-0.5 text-xs rounded-full">
            {floorLabel} ({seatsInFloor.length} {isSleeper ? "giường" : "ghế"})
          </Tag>
        </div>

        {/* Khung thân xe */}
        <div
          className="relative w-full max-w-[270px] bg-white border-[3px] border-slate-300 rounded-t-[36px] rounded-b-[20px] p-4 shadow-sm hover:shadow-md transition-shadow"
          style={{ minHeight: isSleeper ? "460px" : "380px" }}
        >
          {/* Gương chiếu hậu 2 bên */}
          <div className="absolute top-6 -left-2 w-2 h-5 bg-slate-700 rounded-l-md" />
          <div className="absolute top-6 -right-2 w-2 h-5 bg-slate-700 rounded-r-md" />

          {/* Kính chắn gió phía trước */}
          <div className="relative h-4 bg-gradient-to-b from-slate-700 to-slate-900 rounded-t-xl rounded-b-xs mb-4 flex items-center justify-center">
            <div className="w-10 h-0.5 bg-slate-400 rounded-full" />
          </div>

          {/* Grid sơ đồ ghế / giường */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${totalCols}, 1fr)`,
              gap: isSleeper ? "12px 8px" : "10px 6px",
            }}
          >
            {/* Hàng 1: Khoang lái & Cửa lên xuống (Chỉ tầng 1) */}
            {showCockpit && (
              <>
                {/* Vị trí Tài xế */}
                <div
                  style={{ gridColumnStart: 1, gridRowStart: 1 }}
                  className="flex items-center justify-center h-10"
                >
                  <div className="flex flex-col items-center text-slate-500">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      style={{ transform: "rotate(-45deg)" }}
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="2" x2="12" y2="22" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <circle cx="12" cy="12" r="3" fill="currentColor" />
                    </svg>
                    <span className="text-[8px] font-bold mt-0.5 tracking-wider">TÀI XẾ</span>
                  </div>
                </div>

                {/* Khoảng trống táp-lô (chỉ vẽ nếu vị trí đó không có ghế A1) */}
                {Array.from({ length: totalCols - 2 }).map((_, idx) => {
                  const col = idx + 2;
                  const hasSeatHere = seatsInFloor.some(
                    (s) => s.colIndex === col && s.rowIndex === 0
                  );
                  if (hasSeatHere) return null;
                  return (
                    <div
                      key={`cockpit-blank-${idx}`}
                      style={{ gridColumnStart: col, gridRowStart: 1 }}
                    />
                  );
                })}

                {/* Cửa lên xe (chỉ vẽ nếu cột cuối chưa bị ghế A2 chiếm) */}
                {!seatsInFloor.some((s) => s.colIndex === totalCols && s.rowIndex === 0) && (
                  <div
                    style={{ gridColumnStart: totalCols, gridRowStart: 1 }}
                    className="flex items-center justify-center h-10"
                  >
                    <div className="border border-dashed border-emerald-400 bg-emerald-50/60 text-emerald-700 text-[8px] p-1 text-center font-bold rounded-md leading-tight">
                      CỬA
                      <br />
                      LÊN
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Các vị trí ghế thực tế */}
            {seatsInFloor.map((seat) => renderSeatItem(seat, showCockpit))}
          </div>

          {/* Đuôi xe */}
          <div className="mt-5 pt-3 border-t border-dashed border-slate-200 flex justify-between items-center text-[10px] text-slate-400 font-medium px-1">
            <span>Đuôi xe</span>
            {isSleeper && <span>WC / Lối thoát</span>}
            <span>Hàng sau</span>
          </div>
        </div>
      </div>
    );
  };

  // Helper chuẩn hóa hiển thị trạng thái xe (không phân biệt chữ hoa/thường)
  const renderStatusTag = (status?: string) => {
    const s = status?.toLowerCase()?.trim();
    let color = "default";
    let label = status || "Chưa cập nhật";

    if (s === "hoạt động" || s === "active") {
      color = "green";
      label = "Hoạt động";
    } else if (s === "bảo trì" || s === "maintenance") {
      color = "orange";
      label = "Bảo trì";
    } else if (s === "ngừng hoạt động" || s === "inactive") {
      color = "red";
      label = "Ngừng hoạt động";
    }

    return (
      <Tag color={color} className="m-0 font-medium">
        {label}
      </Tag>
    );
  };

  if (!bus) return null;

  return (
    <Modal
      open={open}
      zIndex={2000}
      onCancel={() => {
        setSelectedSeat(null);
        onClose();
      }}
      closable={{
        closeIcon: (
          <span
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
            style={{ cursor: "pointer" }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedSeat(null);
              onClose();
            }}
          >
            <CloseOutlined className="text-base" />
          </span>
        ),
      }}
      width={isSleeper ? 720 : 560}
      centered
      destroyOnClose
      footer={
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {selectedSeat ? (
              <span>
                Đang chọn:{" "}
                <strong className="text-emerald-700 font-bold">{selectedSeat.seatCode}</strong>{" "}
                ({selectedSeat.label})
              </span>
            ) : (
              <span>* Di chuột hoặc bấm vào từng ghế để xem thông tin chi tiết</span>
            )}
          </div>
          <Space>
            <Button
              icon={<EditOutlined />}
              onClick={() => {
                onClose();
                navigate(`/admin/bus/edit/${bus._id}`);
              }}
            >
              Chỉnh sửa thông tin xe
            </Button>
            <Button
              type="primary"
              className="bg-emerald-600 hover:!bg-emerald-700 text-white"
              onClick={() => {
                setSelectedSeat(null);
                onClose();
              }}
            >
              Đóng
            </Button>
          </Space>
        </div>
      }
      title={
        <div className="flex items-center gap-2.5 pb-2 pr-12 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
            <CarOutlined className="text-lg" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-gray-800 text-lg">Sơ đồ ghế: {bus.name}</span>
              <Tag color="blue" className="font-bold font-mono px-2 py-0.5">
                {bus.licensePlates}
              </Tag>
            </div>
            <p className="text-xs text-gray-500 font-normal m-0">
              Mô phỏng sơ đồ bố trí chỗ ngồi thực tế trên phương tiện
            </p>
          </div>
        </div>
      }
    >
      <div className="space-y-4 py-2">
        {/* Thông tin tóm tắt xe */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
          <div>
            <span className="text-gray-400 block">Hãng xe:</span>
            <strong className="text-gray-800 font-semibold">{bus.hangxe || "Chưa cập nhật"}</strong>
          </div>
          <div>
            <span className="text-gray-400 block">Loại xe:</span>
            <strong className="text-gray-800 font-semibold">
              {bus.type === "Sleeper" ? "Xe giường nằm" : "Xe ghế ngồi"}
            </strong>
          </div>
          <div>
            <span className="text-gray-400 block">Sức chứa:</span>
            <strong className="text-emerald-700 font-bold">{bus.capacity} chỗ</strong>
          </div>
          <div>
            <span className="text-gray-400 block">Trạng thái:</span>
            {renderStatusTag(bus.status)}
          </div>
        </div>

        {/* Chú thích sơ đồ ghế */}
        <div className="flex flex-wrap items-center justify-center gap-4 py-1 text-xs text-gray-600 bg-white border border-gray-100 rounded-lg shadow-2xs">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded border-2 border-slate-300 bg-white flex items-center justify-center text-[9px] font-bold text-slate-700">
              A1
            </div>
            <span>{isSleeper ? "Giường tiêu chuẩn" : "Ghế tiêu chuẩn"}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded border-2 border-emerald-500 bg-emerald-50 flex items-center justify-center text-[9px] font-bold text-emerald-700">
              ✓
            </div>
            <span>Ghế đang xem</span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded border border-dashed border-emerald-400 bg-emerald-50/60 flex items-center justify-center text-[7px] font-bold text-emerald-700">
              CỬA
            </div>
            <span>Cửa lên xuống</span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded bg-slate-100 text-slate-600 flex items-center justify-center text-[9px]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="2" x2="12" y2="22" />
                <line x1="2" y1="12" x2="22" y2="12" />
              </svg>
            </div>
            <span>Khoang tài xế</span>
          </div>
        </div>

        {/* Bộ chuyển đổi tầng cho xe giường nằm nếu muốn xem riêng */}
        {isSleeper && (
          <div className="flex justify-center">
            <Segmented
              options={[
                { label: "Cả 2 tầng (Song song)", value: "all" },
                { label: "Tầng 1 (Tầng dưới - Dãy A)", value: "1" },
                { label: "Tầng 2 (Tầng trên - Dãy B)", value: "2" },
              ]}
              value={viewFloorTab}
              onChange={(val) => setViewFloorTab(val as string)}
              className="bg-slate-100 p-1 font-medium text-xs"
            />
          </div>
        )}

        {/* Khu vực sơ đồ ghế */}
        <div className="pt-2">
          {isSleeper ? (
            <div className="flex flex-col md:flex-row justify-center items-start gap-8">
              {(viewFloorTab === "all" || viewFloorTab === "1") && (
                <div className="flex-1 w-full">
                  {renderBusFloor(1, "TẦNG 1 (TẦNG DƯỚI)")}
                </div>
              )}
              {(viewFloorTab === "all" || viewFloorTab === "2") && (
                <div className="flex-1 w-full">
                  {renderBusFloor(2, "TẦNG 2 (TẦNG TRÊN)")}
                </div>
              )}
            </div>
          ) : (
            <div className="flex justify-center">{renderBusFloor(1, "SƠ ĐỒ CHỖ NGỒI")}</div>
          )}
        </div>

        {/* Chi tiết ghế được chọn */}
        {selectedSeat && (
          <Card
            className="border border-emerald-200 bg-emerald-50/40 rounded-xl"
            styles={{ body: { padding: "10px 14px" } }}
          >
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <CheckCircleOutlined className="text-emerald-600 text-sm" />
                <span>
                  Vị trí: <strong className="text-emerald-800 text-sm font-bold">{selectedSeat.seatCode}</strong>
                </span>
                <span className="text-gray-400">|</span>
                <span>{selectedSeat.label}</span>
                {isSleeper && (
                  <>
                    <span className="text-gray-400">|</span>
                    <span>Tầng: {selectedSeat.floor === 1 ? "Tầng dưới (1)" : "Tầng trên (2)"}</span>
                  </>
                )}
              </div>
              <Tag color="green" className="m-0">
                Sẵn sàng hoạt động
              </Tag>
            </div>
          </Card>
        )}
      </div>
    </Modal>
  );
};

export default SeatMapModal;
