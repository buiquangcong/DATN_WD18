import {
  Button,
  Form,
  Select,
  DatePicker,
  message,
  Spin,
  Tag,
  Divider,
  Input,
} from "antd";
import { useEffect, useState, useMemo } from "react";
import { useCRUD, useDetail } from "../../../hooks/useCRUD";
import axios from "axios";
import { useParams } from "react-router-dom";
import dayjs, { Dayjs } from "dayjs";

type DiemType = {
  _id?: string;
  diaDiem: string;
  offsetMinutes: number;
};

type Journey = {
  _id: string;
  diemDi: string;
  diemDen: string;
  diemDon?: DiemType[];
  diemTra?: DiemType[];
};

type Bus = {
  _id: string;
  name?: string;
  bienSo?: string;
  licensePlates?: string;
  capacity: number;
};

type Driver = {
  _id: string;
  ten: string;
};

type FareRule = {
  _id: string;
  weekdayPrice: number;
  weekendPrice: number;
  holidayPrice: number;
  capacity: number;

  journey?: {
    _id: string;
    diemDi: string;
    diemDen: string;
  };
};

// ======================================================
// LẤY TÊN BẾN XE ĐIỂM ĐÓN & ĐIỂM TRẢ
// ======================================================

const getJourneyStationText = (item?: Journey | null): string => {
  if (!item) return "";
  const pickup = (item.diemDon || [])
    .map((d: any) => d?.diaDiem || d?.dia_diem)
    .filter(Boolean)
    .join(", ");
  const dropoff = (item.diemTra || [])
    .map((d: any) => d?.diaDiem || d?.dia_diem)
    .filter(Boolean)
    .join(", ");

  if (pickup && dropoff) {
    return `${pickup} → ${dropoff}`;
  }
  if (pickup) return `Đón: ${pickup}`;
  if (dropoff) return `Trả: ${dropoff}`;
  return "";
};

function TripEditPage() {
  const [form] = Form.useForm();
  const { id } = useParams();

  const { Edit } = useCRUD("trip");
  const { data: trip, isLoading } = useDetail("trip", id);

  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [fareRules, setFareRules] = useState<FareRule[]>([]);

  const [selectedJourney, setSelectedJourney] =
    useState<Journey | null>(null);

  const [selectedFareRule, setSelectedFareRule] =
    useState<FareRule | null>(null);

  const [departureTime, setDepartureTime] =
    useState<Dayjs | null>(null);

  const [arrivalTime, setArrivalTime] =
    useState<Dayjs | null>(null);

  // =========================
  // XE
  // =========================

  const [availableBuses, setAvailableBuses] =
    useState<Bus[]>([]);

  const [loadingBuses, setLoadingBuses] =
    useState(false);

  // =========================
  // TÀI XẾ
  // =========================

  const [availableDrivers, setAvailableDrivers] =
    useState<Driver[]>([]);

  const [loadingDrivers, setLoadingDrivers] =
    useState(false);

  // =========================
  // PHỤ XE
  // =========================

  const [availableAssistantDrivers, setAvailableAssistantDrivers] =
    useState<Driver[]>([]);

  const [loadingAssistantDrivers, setLoadingAssistantDrivers] =
    useState(false);

  // =========================================================
  // TRẠNG THÁI
  // =========================================================

  const statusOptions = useMemo(() => {
    if (!trip) return [];

    if (trip.status === "đang chạy") {
      return [
        {
          value: "đang chạy",
          label: "Đang chạy",
        },
        {
          value: "hoàn thành",
          label: "Hoàn thành",
        },
      ];
    }

    if (trip.status === "hoàn thành") {
      return [
        {
          value: "hoàn thành",
          label: "Hoàn thành",
        },
      ];
    }

    if (trip.status === "huỷ") {
      return [
        {
          value: "huỷ",
          label: "Huỷ",
        },
      ];
    }

    return [
      {
        value: "sắp chạy",
        label: "Sắp chạy",
      },
      {
        value: "đang chạy",
        label: "Đang chạy",
      },
      {
        value: "hoàn thành",
        label: "Hoàn thành",
      },
      {
        value: "huỷ",
        label: "Huỷ",
      },
    ];
  }, [trip]);

  // Xe + tài xế + phụ xe chỉ sửa khi chuyến chưa chạy
  const isEditable =
    trip?.status === "sắp chạy" ||
    trip?.status === "đang chạy";

  // =========================================================
  // LOAD JOURNEY + FARE RULE
  // =========================================================

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [j, f] = await Promise.all([
          axios.get(
            "http://localhost:3000/api/journey"
          ),
          axios.get(
            "http://localhost:3000/api/giave"
          ),
        ]);

        setJourneys(j.data);
        setFareRules(f.data);
      } catch {
        message.error("Load dữ liệu thất bại");
      }
    };

    fetchData();
  }, []);

  // =========================================================
  // LOAD DỮ LIỆU CHUYẾN CŨ VÀO FORM
  // =========================================================

  useEffect(() => {
    if (!trip) return;

    form.setFieldsValue({
      journey: trip.journey?._id,

      bus: trip.bus?._id,

      staff: trip.staff?._id,

      // PHỤ XE
      assistantDriver: trip.assistantDriver?._id || undefined,

      fareRule: trip.fareRule?._id,

      status: trip.status,

      departureTime: trip.departureTime
        ? dayjs(trip.departureTime)
        : undefined,

      arrivalTime: trip.arrivalTime
        ? dayjs(trip.arrivalTime)
        : undefined,
    });

    if (trip.departureTime) {
      setDepartureTime(
        dayjs(trip.departureTime)
      );
    }

    if (trip.arrivalTime) {
      setArrivalTime(
        dayjs(trip.arrivalTime)
      );
    }

    if (trip.fareRule) {
      setSelectedFareRule(trip.fareRule);
    }
  }, [trip, form]);

  // =========================================================
  // XÁC ĐỊNH JOURNEY
  // =========================================================

  useEffect(() => {
    if (
      !trip?.journey?._id ||
      journeys.length === 0
    ) {
      return;
    }

    const journey =
      journeys.find(
        (j) => j._id === trip.journey._id
      ) || null;

    setSelectedJourney(journey);
  }, [trip, journeys]);

  // =========================================================
  // CHECK XE RẢNH
  // =========================================================

  useEffect(() => {
    if (
      !departureTime ||
      !arrivalTime ||
      !id ||
      !selectedJourney
    ) {
      setAvailableBuses([]);
      return;
    }

    const fetchAvailableBuses = async () => {
      setLoadingBuses(true);

      try {
        const dateStr =
          departureTime.format("YYYY-MM-DD");

        const weekday =
          departureTime.day();

        const res = await axios.get(
          "http://localhost:3000/api/trip/available-buses",
          {
            params: {
              weekdays: String(weekday),

              startDate: dateStr,

              endDate: dateStr,

              departureHour:
                departureTime.format("HH:mm"),

              arrivalHour:
                arrivalTime.format("HH:mm"),

              journey: selectedJourney._id,

              excludeTripId: id,
            },
          }
        );

        const originalCapacity =
          trip?.bus?.capacity;

        const filteredBuses =
          originalCapacity
            ? res.data.filter(
                (b: Bus) =>
                  b.capacity ===
                  originalCapacity
              )
            : res.data;

        setAvailableBuses(
          filteredBuses
        );

        // Giữ xe hiện tại nếu API không trả về
        const currentBusId =
          trip?.bus?._id;

        if (
          currentBusId &&
          !filteredBuses.some(
            (b: Bus) =>
              b._id === currentBusId
          ) &&
          trip?.bus
        ) {
          setAvailableBuses(
            (prev) => [
              trip.bus,
              ...prev,
            ]
          );
        }
      } catch {
        message.error(
          "Không thể kiểm tra xe rảnh"
        );

        setAvailableBuses([]);
      } finally {
        setLoadingBuses(false);
      }
    };

    fetchAvailableBuses();
  }, [
    departureTime,
    arrivalTime,
    id,
    trip,
    selectedJourney,
  ]);

  // =========================================================
  // TÌM BẢNG GIÁ THEO XE
  // =========================================================

useEffect(() => {
  if (isLoading) return;

  const currentBusId =
    form.getFieldValue("bus");

  if (
    !currentBusId ||
    availableBuses.length === 0 ||
    !selectedJourney
  ) {
    return;
  }

  handleFindFareRule(currentBusId);
}, [
  isLoading,
  availableBuses,
  selectedJourney,
  fareRules,
]);

  // =========================================================
  // CHECK TÀI XẾ RẢNH
  // =========================================================

  useEffect(() => {
    if (
      !departureTime ||
      !arrivalTime ||
      !id ||
      !selectedJourney
    ) {
      setAvailableDrivers([]);
      return;
    }

    const fetchAvailableDrivers =
      async () => {
        setLoadingDrivers(true);

        try {
          const dateStr =
            departureTime.format(
              "YYYY-MM-DD"
            );

          const weekday =
            departureTime.day();

          const res = await axios.get(
            "http://localhost:3000/api/trip/available-drivers",
            {
              params: {
                weekdays:
                  String(weekday),

                startDate: dateStr,

                endDate: dateStr,

                departureHour:
                  departureTime.format(
                    "HH:mm"
                  ),

                arrivalHour:
                  arrivalTime.format(
                    "HH:mm"
                  ),

                journey:
                  selectedJourney._id,

                excludeTripId: id,
              },
            }
          );

          setAvailableDrivers(
            res.data
          );

          // Giữ tài xế hiện tại
          const currentStaffId =
            trip?.staff?._id;

          if (
            currentStaffId &&
            !res.data.some(
              (d: Driver) =>
                d._id ===
                currentStaffId
            ) &&
            trip?.staff
          ) {
            setAvailableDrivers(
              (prev) => [
                trip.staff,
                ...prev,
              ]
            );
          }
        } catch {
          message.error(
            "Không thể kiểm tra tài xế rảnh"
          );

          setAvailableDrivers([]);
        } finally {
          setLoadingDrivers(false);
        }
      };

    fetchAvailableDrivers();
  }, [
    departureTime,
    arrivalTime,
    id,
    trip,
    selectedJourney,
  ]);

  // =========================================================
  // CHECK PHỤ XE RẢNH
  // =========================================================

  useEffect(() => {
    if (
      !departureTime ||
      !arrivalTime ||
      !id ||
      !selectedJourney
    ) {
      setAvailableAssistantDrivers(
        []
      );

      return;
    }

    const fetchAvailableAssistantDrivers =
      async () => {
        setLoadingAssistantDrivers(
          true
        );

        try {
          const dateStr =
            departureTime.format(
              "YYYY-MM-DD"
            );

          const weekday =
            departureTime.day();

          const res = await axios.get(
            "http://localhost:3000/api/trip/available-assistants",
            {
              params: {
                weekdays:
                  String(weekday),

                startDate: dateStr,

                endDate: dateStr,

                departureHour:
                  departureTime.format(
                    "HH:mm"
                  ),

                arrivalHour:
                  arrivalTime.format(
                    "HH:mm"
                  ),

                journey:
                  selectedJourney._id,

                excludeTripId: id,
              },
            }
          );

          let assistantList =
            res.data;

          // Không cho phụ xe trùng với tài xế hiện tại
          const currentStaffId =
            form.getFieldValue(
              "staff"
            );

          assistantList =
            assistantList.filter(
              (d: Driver) =>
                d._id !==
                currentStaffId
            );

          // Giữ phụ xe hiện tại
          // nếu API không trả về vì đang là chuyến hiện tại
          const currentAssistantId =
            trip?.assistantDriver?._id;

          if (
            currentAssistantId &&
            !assistantList.some(
              (d: Driver) =>
                d._id ===
                currentAssistantId
            ) &&
            trip?.assistantDriver
          ) {
            assistantList = [
              trip.assistantDriver,
              ...assistantList,
            ];
          }

          setAvailableAssistantDrivers(
            assistantList
          );
        } catch (error) {
          console.error(
            "Lỗi kiểm tra phụ xe:",
            error
          );

          message.error(
            "Không thể kiểm tra phụ xe rảnh"
          );

          setAvailableAssistantDrivers(
            []
          );
        } finally {
          setLoadingAssistantDrivers(
            false
          );
        }
      };

    fetchAvailableAssistantDrivers();
  }, [
    departureTime,
    arrivalTime,
    id,
    trip,
    selectedJourney,
    form,
  ]);

  // =========================================================
  // TÌM BẢNG GIÁ
  // =========================================================

  const handleFindFareRule = (
    busId: string
  ) => {
    const bus =
      availableBuses.find(
        (x) => x._id === busId
      );

    if (
      !bus ||
      !selectedJourney
    ) {
      return;
    }

    const rule =
      fareRules.find(
        (f) =>
          f.journey?._id ===
            selectedJourney._id &&
          f.capacity ===
            bus.capacity
      );

    if (rule) {
      setSelectedFareRule(
        rule
      );

      form.setFieldValue(
        "fareRule",
        rule._id
      );
    } else {
      setSelectedFareRule(
        null
      );

      form.setFieldValue(
        "fareRule",
        undefined
      );

      message.warning(
        "Không tìm thấy bảng giá phù hợp với xe này"
      );
    }
  };

  // =========================================================
  // ĐỔI TUYẾN
  // =========================================================

  const handleJourneyChange = (
    journeyId: string
  ) => {
    const journey =
      journeys.find(
        (j) =>
          j._id === journeyId
      ) || null;

    setSelectedJourney(
      journey
    );

    const currentBusId =
      form.getFieldValue(
        "bus"
      );

    if (currentBusId) {
      handleFindFareRule(
        currentBusId
      );
    }
  };

  // =========================================================
  // ĐỔI TÀI XẾ
  // =========================================================

  const handleStaffChange = (
    staffId: string
  ) => {
    const currentAssistantId =
      form.getFieldValue(
        "assistantDriver"
      );

    if (
      staffId &&
      currentAssistantId &&
      staffId ===
        currentAssistantId
    ) {
      message.warning(
        "Tài xế và phụ xe không được là cùng một người"
      );

      form.setFieldValue(
        "staff",
        undefined
      );
    }
  };

  // =========================================================
  // ĐỔI PHỤ XE
  // =========================================================

  const handleAssistantDriverChange =
    (
      assistantDriverId: string
    ) => {
      const currentStaffId =
        form.getFieldValue(
          "staff"
        );

      if (
        assistantDriverId &&
        currentStaffId &&
        assistantDriverId ===
          currentStaffId
      ) {
        message.warning(
          "Tài xế và phụ xe không được là cùng một người"
        );

        form.setFieldValue(
          "assistantDriver",
          undefined
        );
      }
    };

  // =========================================================
  // DISABLE NGÀY QUÁ KHỨ
  // =========================================================

  const disabledPastDate = (
    current: any
  ) => {
    return (
      current &&
      current <
        dayjs().startOf("day")
    );
  };

  // =========================================================
  // SUBMIT
  // =========================================================

  const onFinish = (
    values: any
  ) => {
    if (!selectedFareRule) {
      message.error(
        "Chưa xác định được bảng giá phù hợp cho xe này"
      );

      return;
    }

    Edit({
      _id: id,

      journey:
        values.journey,

      bus:
        values.bus,

      staff:
        values.staff,

      // PHỤ XE
      assistantDriver:
        values.assistantDriver ||
        null,

      fareRule:
        values.fareRule,

      status:
        values.status,

      departureTime:
        values.departureTime
          ?.toDate()
          .toISOString(),

      arrivalTime:
        values.arrivalTime
          ?.toDate()
          .toISOString(),
    });
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (isLoading) {
    return (
      <div className="p-10 flex justify-center">
        <Spin />
      </div>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-bold mb-6">
        Sửa chuyến xe
      </h1>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
      >
        {/* ================================================= */}
        {/* TUYẾN ĐƯỜNG */}
        {/* ================================================= */}

        <Form.Item
          name="journey"
          label="Tuyến đường"
        >
          <Select disabled optionLabelProp="label">
            {journeys.map((j) => {
              const stationText = getJourneyStationText(j);
              return (
                <Select.Option
                  key={j._id}
                  value={j._id}
                  label={`${j.diemDi} → ${j.diemDen}${stationText ? ` (${stationText})` : ""}`}
                >
                  <div className="flex items-center gap-2 py-0.5 flex-wrap">
                    <span className="font-medium text-gray-800">
                      {j.diemDi} → {j.diemDen}
                    </span>
                    {stationText && (
                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-normal">
                        ({stationText})
                      </span>
                    )}
                  </div>
                </Select.Option>
              );
            })}
          </Select>
        </Form.Item>

        {/* ================================================= */}
        {/* KHỞI HÀNH */}
        {/* ================================================= */}

        <Form.Item
          name="departureTime"
          label="Thời gian khởi hành"
        >
          <DatePicker
            showTime
            className="w-full"
            format="YYYY-MM-DD HH:mm"
            disabledDate={
              disabledPastDate
            }
            disabled
          />
        </Form.Item>

        {/* ================================================= */}
        {/* ĐẾN */}
        {/* ================================================= */}

        <Form.Item
          name="arrivalTime"
          label="Thời gian đến"
        >
          <DatePicker
            showTime
            className="w-full"
            format="YYYY-MM-DD HH:mm"
            disabledDate={
              disabledPastDate
            }
            disabled
          />
        </Form.Item>

        {/* ================================================= */}
        {/* PREVIEW GIỜ ĐÓN / TRẢ */}
        {/* ================================================= */}

        {selectedJourney &&
          departureTime &&
          arrivalTime && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="font-medium mb-2">
                Giờ đón/trả dự kiến
              </p>

              {selectedJourney.diemDon &&
                selectedJourney
                  .diemDon.length >
                  0 && (
                  <>
                    <p className="text-sm text-gray-500 mb-1">
                      Điểm đón
                    </p>

                    <div className="space-y-1 mb-3">
                      {selectedJourney.diemDon.map(
                        (
                          diem,
                          idx
                        ) => (
                          <div
                            key={
                              diem._id ||
                              idx
                            }
                            className="flex items-center gap-3"
                          >
                            <Tag color="blue">
                              {departureTime
                                .add(
                                  diem.offsetMinutes,
                                  "minute"
                                )
                                .format(
                                  "DD/MM/YYYY HH:mm"
                                )}
                            </Tag>

                            <span className="text-gray-700">
                              {
                                diem.diaDiem
                              }
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </>
                )}

              {selectedJourney.diemTra &&
                selectedJourney
                  .diemTra.length >
                  0 && (
                  <>
                    <Divider className="my-2" />

                    <p className="text-sm text-gray-500 mb-1">
                      Điểm trả
                    </p>

                    <div className="space-y-1">
                      {selectedJourney.diemTra.map(
                        (
                          diem,
                          idx
                        ) => (
                          <div
                            key={
                              diem._id ||
                              idx
                            }
                            className="flex items-center gap-3"
                          >
                            <Tag color="orange">
                              {arrivalTime
                                .subtract(
                                  diem.offsetMinutes,
                                  "minute"
                                )
                                .format(
                                  "DD/MM/YYYY HH:mm"
                                )}
                            </Tag>

                            <span className="text-gray-700">
                              {
                                diem.diaDiem
                              }
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </>
                )}
            </div>
          )}

        {/* ================================================= */}
        {/* XE */}
        {/* ================================================= */}

        <Form.Item
          name="bus"
          label="Xe"
          rules={[
            {
              required: true,
              message:
                "Chọn xe",
            },
          ]}
          extra={
            !isEditable
              ? "Chuyến đã hoàn thành hoặc huỷ, không thể đổi xe"
              : trip?.bus?.capacity
              ? `Chỉ hiện xe cùng ${trip.bus.capacity} chỗ với xe ban đầu`
              : undefined
          }
        >
          {loadingBuses ? (
            <div className="flex items-center gap-2">
              <Spin size="small" />

              <span className="text-gray-500 text-sm">
                Đang kiểm tra xe
                rảnh...
              </span>
            </div>
          ) : (
            <Select
              placeholder="Chọn xe đang rảnh"
              disabled={
                !isEditable ||
                availableBuses.length ===
                  0
              }
              notFoundContent="Không có xe nào rảnh vào khung giờ này"
              onChange={
                handleFindFareRule
              }
            >
              {availableBuses.map(
                (b) => (
                  <Select.Option
                    key={b._id}
                    value={b._id}
                  >
                    {b.name ||
                      b.bienSo ||
                      "Xe"}

                    {b.licensePlates
                      ? ` - ${b.licensePlates}`
                      : ""}

                    {` (${b.capacity} chỗ)`}
                  </Select.Option>
                )
              )}
            </Select>
          )}
        </Form.Item>

        {/* ================================================= */}
        {/* BẢNG GIÁ */}
        {/* ================================================= */}

        <Form.Item
          name="fareRule"
          hidden
        >
          <Input />
        </Form.Item>

        <Form.Item label="Giá vé áp dụng">
          <Input
            disabled
            value={
              selectedFareRule
                ? `${selectedFareRule.weekdayPrice.toLocaleString(
                    "vi-VN"
                  )} đ`
                : "Chưa xác định - chọn xe để tự động tính"
            }
          />
        </Form.Item>

        {/* ================================================= */}
        {/* TÀI XẾ */}
        {/* ================================================= */}

        <Form.Item
          name="staff"
          label="Tài xế"
          rules={[
            {
              required: true,
              message:
                "Chọn tài xế",
            },
          ]}
          extra={
            !isEditable
              ? "Chuyến đã hoàn thành hoặc huỷ, không thể đổi tài xế"
              : undefined
          }
        >
          {loadingDrivers ? (
            <div className="flex items-center gap-2">
              <Spin size="small" />

              <span className="text-gray-500 text-sm">
                Đang kiểm tra tài
                xế rảnh...
              </span>
            </div>
          ) : (
            <Select
              placeholder="Chọn tài xế đang rảnh"
              disabled={
                !isEditable ||
                availableDrivers.length ===
                  0
              }
              notFoundContent="Không có tài xế nào rảnh vào khung giờ này"
              onChange={
                handleStaffChange
              }
            >
              {availableDrivers.map(
                (d) => (
                  <Select.Option
                    key={d._id}
                    value={d._id}
                  >
                    {d.ten}
                  </Select.Option>
                )
              )}
            </Select>
          )}
        </Form.Item>

        {/* ================================================= */}
        {/* PHỤ XE */}
        {/* ================================================= */}

        <Form.Item
          name="assistantDriver"
          label="Phụ xe"
          rules={[
            {
              required: true,
              message:
                "Chọn phụ xe",
            },
          ]}
          extra={
            !isEditable
              ? "Chuyến đã hoàn thành hoặc huỷ, không thể đổi phụ xe"
              : "Chỉ hiện phụ xe đang rảnh trong khung giờ của chuyến"
          }
        >
          {loadingAssistantDrivers ? (
            <div className="flex items-center gap-2">
              <Spin size="small" />

              <span className="text-gray-500 text-sm">
                Đang kiểm tra phụ
                xe rảnh...
              </span>
            </div>
          ) : (
            <Select
              placeholder="Chọn phụ xe đang rảnh"
              disabled={
                !isEditable ||
                availableAssistantDrivers.length ===
                  0
              }
              notFoundContent="Không có phụ xe nào rảnh vào khung giờ này"
              onChange={
                handleAssistantDriverChange
              }
            >
              {availableAssistantDrivers.map(
                (d) => (
                  <Select.Option
                    key={d._id}
                    value={d._id}
                  >
                    {d.ten}
                  </Select.Option>
                )
              )}
            </Select>
          )}
        </Form.Item>

        {/* ================================================= */}
        {/* TRẠNG THÁI */}
        {/* ================================================= */}

        <Form.Item
          name="status"
          label="Trạng thái"
        >
          <Select
            disabled={
              trip?.status ===
              "hoàn thành"
            }
            options={
              statusOptions
            }
          />
        </Form.Item>

        {/* ================================================= */}
        {/* BUTTON */}
        {/* ================================================= */}

        {trip?.status !==
          "hoàn thành" && (
          <Button
            type="primary"
            htmlType="submit"
          >
            Cập nhật chuyến xe
          </Button>
        )}
      </Form>
    </div>
  );
}

export default TripEditPage;