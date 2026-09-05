import { Button, Form, Select, DatePicker, message, Input, Checkbox, Card, Tag, Divider, Spin, } from "antd";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

type DiemType = {
  _id?: string;
  diaDiem: string;
  offsetMinutes: number;
};

type Journey = {
  _id: string;
  diemDi: string;
  diemDen: string;
  thoiGianDiChuyen?: string;
  diemDon?: DiemType[];
  diemTra?: DiemType[];
};

type Bus = {
  _id: string;
  name: string;
  licensePlates: string;
  capacity: number;
};

type Staff = {
  _id: string;
  ten: string;
  chucVu: string;
};

type FareRule = {
  _id: string;
  capacity: number;
  weekdayPrice: number;
  weekendPrice: number;
  holidayPrice: number;
  journey?: {
    _id: string;
    diemDi: string;
    diemDen: string;
  };
};

// ======================================================
// CỘNG PHÚT VÀO GIỜ
// ======================================================

const addMinutesToTime = (
  time: string,
  minutesToAdd: number
) => {
  if (!time) return "";

  const [h, m] = time.split(":").map(Number);

  if (
    Number.isNaN(h) ||
    Number.isNaN(m)
  ) {
    return "";
  }

  const total =
    h * 60 +
    m +
    minutesToAdd;

  const normalized =
    ((total % 1440) + 1440) % 1440;

  const hh = String(
    Math.floor(normalized / 60)
  ).padStart(2, "0");

  const mm = String(
    normalized % 60
  ).padStart(2, "0");

  const dayOffset =
    Math.floor(total / 1440);

  if (dayOffset !== 0) {
    return `${hh}:${mm} (${dayOffset > 0
        ? "+1 ngày"
        : "-1 ngày"
      })`;
  }

  return `${hh}:${mm}`;
};

// ======================================================
// CỘNG PHÚT VÀO GIỜ - CHỈ TRẢ HH:mm
// ======================================================

const addMinutesPlain = (
  time: string,
  minutesToAdd: number
) => {
  if (!time) return "";

  const [h, m] =
    time.split(":").map(Number);

  if (
    Number.isNaN(h) ||
    Number.isNaN(m)
  ) {
    return "";
  }

  const total =
    h * 60 +
    m +
    minutesToAdd;

  const normalized =
    ((total % 1440) + 1440) % 1440;

  const hh = String(
    Math.floor(normalized / 60)
  ).padStart(2, "0");

  const mm = String(
    normalized % 60
  ).padStart(2, "0");

  return `${hh}:${mm}`;
};

// ======================================================
// ĐỌC THỜI GIAN DI CHUYỂN
// ======================================================

const parseDurationToMinutes = (
  text?: string
): number => {
  if (!text) return 0;

  const hourMatch = text.match(
    /(\d+)\s*(?:giờ|gio|h)/i
  );

  const minuteMatch = text.match(
    /(\d+)\s*(?:phút|phut|p)/i
  );

  const hours = hourMatch
    ? parseInt(hourMatch[1], 10)
    : 0;

  const minutes = minuteMatch
    ? parseInt(minuteMatch[1], 10)
    : 0;

  return (
    hours * 60 +
    minutes
  );
};

function TripAddPage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  // ====================================================
  // DATA
  // ====================================================

  const [journeys, setJourneys] =
    useState<Journey[]>([]);

  const [fareRules, setFareRules] =
    useState<FareRule[]>([]);

  // ====================================================
  // LỰA CHỌN
  // ====================================================

  const [selectedJourney, setSelectedJourney] =
    useState<Journey | null>(null);

  const [selectedFareRule, setSelectedFareRule] =
    useState<FareRule | null>(null);

  // ====================================================
  // THỜI GIAN
  // ====================================================

  const [departureHour, setDepartureHour] =
    useState("");

  const [arrivalHour, setArrivalHour] =
    useState("");

  const [weekdays, setWeekdays] =
    useState<number[]>([]);

  const [startDate, setStartDate] =
    useState<dayjs.Dayjs | null>(null);

  const [endDate, setEndDate] =
    useState<dayjs.Dayjs | null>(null);

  // ====================================================
  // XE
  // ====================================================

  const [availableBuses, setAvailableBuses] =
    useState<Bus[]>([]);

  const [loadingBuses, setLoadingBuses] =
    useState(false);

  // ====================================================
  // TÀI XẾ
  // ====================================================

  const [availableStaffs, setAvailableStaffs] =
    useState<Staff[]>([]);

  const [loadingDrivers, setLoadingDrivers] =
    useState(false);


  // ====================================================
  // phụ xe
  // ====================================================
  const [availableAssistants, setAvailableAssistants] =
    useState<Staff[]>([]);

  const [loadingAssistants, setLoadingAssistants] =
    useState(false);

  const assistantRequestRef =
    useRef<AbortController | null>(null);

  // ====================================================
  // DÙNG ĐỂ HỦY REQUEST CŨ
  // ====================================================

  const busRequestRef =
    useRef<AbortController | null>(null);

  const driverRequestRef =
    useRef<AbortController | null>(null);

  // ====================================================
  // LOAD JOURNEY + FARE RULE
  // ====================================================

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          journeyResponse,
          fareResponse,
        ] = await Promise.all([
          axios.get(
            "http://localhost:3000/api/journey"
          ),

          axios.get(
            "http://localhost:3000/api/giave"
          ),
        ]);

        setJourneys(
          journeyResponse.data
        );

        setFareRules(
          fareResponse.data
        );
      } catch (error) {
        console.error(error);

        message.error(
          "Không thể tải dữ liệu"
        );
      }
    };

    fetchData();
  }, []);

  // ====================================================
  // TỰ ĐỘNG TÍNH GIỜ ĐẾN
  // ====================================================

  useEffect(() => {
    if (
      !selectedJourney?.thoiGianDiChuyen
    ) {
      return;
    }

    if (
      !/^([01]\d|2[0-3]):([0-5]\d)$/.test(
        departureHour
      )
    ) {
      return;
    }

    const durationMinutes =
      parseDurationToMinutes(
        selectedJourney.thoiGianDiChuyen
      );

    if (durationMinutes <= 0) {
      return;
    }

    const computedArrival =
      addMinutesPlain(
        departureHour,
        durationMinutes
      );

    if (!computedArrival) {
      return;
    }

    form.setFieldValue(
      "arrivalHour",
      computedArrival
    );

    setArrivalHour(
      computedArrival
    );
  }, [
    selectedJourney,
    departureHour,
    form,
  ]);

  // ====================================================
  // ĐỦ ĐIỀU KIỆN ĐỂ CHECK XE/TÀI XẾ
  // ====================================================

  const readyToCheckSchedule =
    weekdays.length > 0 &&
    !!startDate &&
    !!endDate &&
    !!selectedJourney &&
    /^([01]\d|2[0-3]):([0-5]\d)$/.test(
      departureHour
    ) &&
    /^([01]\d|2[0-3]):([0-5]\d)$/.test(
      arrivalHour
    );

  // ====================================================
  // CHECK XE RẢNH
  // ====================================================

  useEffect(() => {
    // --------------------------------------------------
    // Nếu chưa đủ dữ liệu
    // --------------------------------------------------

    if (!readyToCheckSchedule) {
      setAvailableBuses([]);

      setLoadingBuses(false);

      return;
    }

    // --------------------------------------------------
    // HỦY REQUEST XE CŨ
    // --------------------------------------------------

    if (busRequestRef.current) {
      busRequestRef.current.abort();
    }

    const controller =
      new AbortController();

    busRequestRef.current =
      controller;

    // --------------------------------------------------
    // XÓA XE ĐANG CHỌN
    // --------------------------------------------------

    form.setFieldValue(
      "bus",
      undefined
    );

    form.setFieldValue(
      "fareRule",
      undefined
    );

    setSelectedFareRule(null);

    // --------------------------------------------------
    // GỌI API
    // --------------------------------------------------

    const fetchAvailableBuses =
      async () => {
        setLoadingBuses(true);

        try {
          const response =
            await axios.get(
              "http://localhost:3000/api/trip/available-buses",
              {
                params: {
                  weekdays:
                    weekdays.join(","),

                  startDate:
                    startDate!.format(
                      "YYYY-MM-DD"
                    ),

                  endDate:
                    endDate!.format(
                      "YYYY-MM-DD"
                    ),

                  departureHour,

                  arrivalHour,

                  journey:
                    selectedJourney!._id,
                },

                signal:
                  controller.signal,
              }
            );

          // ------------------------------------------------
          // REQUEST NÀY CÒN HỢP LỆ THÌ MỚI SET DATA
          // ------------------------------------------------

          if (
            !controller.signal.aborted
          ) {
            const buses =
              Array.isArray(
                response.data
              )
                ? response.data
                : [];

            setAvailableBuses(
              buses
            );

            if (
              buses.length === 0
            ) {
              message.warning(
                "Không có xe nào rảnh trong khoảng lịch này"
              );
            }
          }
        } catch (error: any) {
          // ----------------------------------------------
          // BỎ QUA REQUEST BỊ HỦY
          // ----------------------------------------------

          if (
            axios.isCancel(error) ||
            error?.code ===
            "ERR_CANCELED"
          ) {
            return;
          }

          console.error(
            "Lỗi check xe:",
            error
          );

          setAvailableBuses([]);

          message.error(
            "Không thể kiểm tra xe rảnh"
          );
        } finally {
          if (
            !controller.signal.aborted
          ) {
            setLoadingBuses(false);
          }
        }
      };

    fetchAvailableBuses();

    // --------------------------------------------------
    // CLEANUP
    // --------------------------------------------------

    return () => {
      controller.abort();
    };
  }, [
    weekdays,
    startDate,
    endDate,
    departureHour,
    arrivalHour,
    selectedJourney,
    readyToCheckSchedule,
    form,
  ]);

  // ====================================================
  // CHECK TÀI XẾ RẢNH
  // ====================================================

  useEffect(() => {
    if (!readyToCheckSchedule) {
      setAvailableStaffs([]);

      setLoadingDrivers(false);

      return;
    }

    // --------------------------------------------------
    // HỦY REQUEST TÀI XẾ CŨ
    // --------------------------------------------------

    if (driverRequestRef.current) {
      driverRequestRef.current.abort();
    }

    const controller =
      new AbortController();

    driverRequestRef.current =
      controller;

    // --------------------------------------------------
    // RESET TÀI XẾ
    // --------------------------------------------------

    form.setFieldValue(
      "staff",
      undefined
    );

    const fetchAvailableDrivers =
      async () => {
        setLoadingDrivers(true);

        try {
          const response =
            await axios.get(
              "http://localhost:3000/api/trip/available-drivers",
              {
                params: {
                  weekdays:
                    weekdays.join(","),

                  startDate:
                    startDate!.format(
                      "YYYY-MM-DD"
                    ),

                  endDate:
                    endDate!.format(
                      "YYYY-MM-DD"
                    ),

                  departureHour,

                  arrivalHour,

                  journey:
                    selectedJourney!._id,
                },

                signal:
                  controller.signal,
              }
            );

          if (
            !controller.signal.aborted
          ) {
            const staffs =
              Array.isArray(
                response.data
              )
                ? response.data
                : [];

            setAvailableStaffs(
              staffs
            );

            if (
              staffs.length === 0
            ) {
              message.warning(
                "Không có tài xế nào rảnh trong khoảng lịch này"
              );
            }
          }
        } catch (error: any) {
          if (
            axios.isCancel(error) ||
            error?.code ===
            "ERR_CANCELED"
          ) {
            return;
          }

          console.error(
            "Lỗi check tài xế:",
            error
          );

          setAvailableStaffs([]);

          message.error(
            "Không thể kiểm tra tài xế rảnh"
          );
        } finally {
          if (
            !controller.signal.aborted
          ) {
            setLoadingDrivers(false);
          }
        }
      };

    fetchAvailableDrivers();

    return () => {
      controller.abort();
    };
  }, [
    weekdays,
    startDate,
    endDate,
    departureHour,
    arrivalHour,
    selectedJourney,
    readyToCheckSchedule,
    form,
  ]);


  // ====================================================
// CHECK PHỤ XE RẢNH
// ====================================================

useEffect(() => {
  if (!readyToCheckSchedule) {
    setAvailableAssistants([]);
    setLoadingAssistants(false);
    return;
  }

  // Hủy request cũ
  if (assistantRequestRef.current) {
    assistantRequestRef.current.abort();
  }

  const controller = new AbortController();

  assistantRequestRef.current = controller;

  // Reset phụ xe đang chọn
  form.setFieldValue("assistant", undefined);

  const fetchAvailableAssistants = async () => {
    setLoadingAssistants(true);

    try {
      const response = await axios.get(
        "http://localhost:3000/api/trip/available-assistants",
        {
          params: {
            weekdays: weekdays.join(","),

            startDate:
              startDate!.format("YYYY-MM-DD"),

            endDate:
              endDate!.format("YYYY-MM-DD"),

            departureHour,

            arrivalHour,

            journey:
              selectedJourney!._id,
          },

          signal: controller.signal,
        }
      );
     console.log("PHỤ XE API:", response.data);
      if (!controller.signal.aborted) {
        const assistants =
          Array.isArray(response.data)
            ? response.data
            : [];

        setAvailableAssistants(assistants);

        if (assistants.length === 0) {
          message.warning(
            "Không có phụ xe nào rảnh trong khoảng lịch này"
          );
        }
      }
    } catch (error: any) {
      if (
        axios.isCancel(error) ||
        error?.code === "ERR_CANCELED"
      ) {
        return;
      }

      console.error(
        "Lỗi check phụ xe:",
        error
      );

      setAvailableAssistants([]);

      message.error(
        "Không thể kiểm tra phụ xe rảnh"
      );
    } finally {
      if (!controller.signal.aborted) {
        setLoadingAssistants(false);
      }
    }
  };

  fetchAvailableAssistants();

  return () => {
    controller.abort();
  };
}, [
  weekdays,
  startDate,
  endDate,
  departureHour,
  arrivalHour,
  selectedJourney,
  readyToCheckSchedule,
  form,
]);
  // ====================================================
  // KHI CHỌN TUYẾN
  // ====================================================

  const handleJourneyChange = (
    journeyId: string
  ) => {
    const journey =
      journeys.find(
        (item) =>
          item._id === journeyId
      ) || null;

    setSelectedJourney(
      journey
    );

    // Tuyến đổi -> bỏ xe + giá cũ
    form.setFieldValue(
      "bus",
      undefined
    );

    form.setFieldValue(
      "fareRule",
      undefined
    );

    setSelectedFareRule(null);

    setAvailableBuses([]);

    setAvailableStaffs([]);
    setAvailableAssistants([]);
  };

  // ====================================================
  // TÌM BẢNG GIÁ
  // ====================================================

  const handleBusChange = (
    busId: string
  ) => {
    const journeyId =
      form.getFieldValue(
        "journey"
      );

    if (
      !journeyId ||
      !busId
    ) {
      setSelectedFareRule(null);

      form.setFieldValue(
        "fareRule",
        undefined
      );

      return;
    }

    const bus =
      availableBuses.find(
        (item) =>
          item._id === busId
      );

    if (!bus) {
      setSelectedFareRule(null);

      form.setFieldValue(
        "fareRule",
        undefined
      );

      return;
    }

    const rule =
      fareRules.find(
        (item) =>
          item.journey?._id ===
          journeyId &&
          item.capacity ===
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
        "Không tìm thấy bảng giá phù hợp với tuyến và số chỗ của xe"
      );
    }
  };

  // ====================================================
  // SUBMIT
  // ====================================================

  const onFinish = async (
    values: any
  ) => {
    // --------------------------------------------------
    // CHECK GIỜ HÔM NAY
    // --------------------------------------------------

    const start =
      values.startDate;

    const today =
      dayjs().startOf("day");

    if (
      start &&
      dayjs(start)
        .startOf("day")
        .isSame(today)
    ) {
      const [h, m] =
        values.departureHour
          .split(":")
          .map(Number);

      const depTime =
        dayjs()
          .hour(h)
          .minute(m)
          .second(0);

      if (
        depTime.isBefore(
          dayjs()
        )
      ) {
        message.error(
          "Giờ khởi hành không được ở quá khứ"
        );

        return;
      }
    }

    // --------------------------------------------------
    // BẮT BUỘC CÓ XE
    // --------------------------------------------------

    if (!values.bus) {
      message.error(
        "Vui lòng chọn xe"
      );

      return;
    }

    // --------------------------------------------------
    // BẮT BUỘC CÓ TÀI XẾ
    // --------------------------------------------------

    if (!values.staff) {
      message.error(
        "Vui lòng chọn tài xế"
      );

      return;
    }
// --------------------------------------------------
// PHỤ XE
// Xe 16 chỗ không bắt buộc
// Xe khác 16 chỗ bắt buộc
// --------------------------------------------------

const selectedBus = availableBuses.find(
  (item) => item._id === values.bus
);

if (
  selectedBus &&
  selectedBus.capacity !== 16 &&
  !values.assistant
) {
  message.error(
    "Xe này bắt buộc phải có phụ xe"
  );

  return;
}
    // --------------------------------------------------
    // BẮT BUỘC CÓ BẢNG GIÁ
    // --------------------------------------------------

    if (!values.fareRule) {
      message.error(
        "Không tìm thấy bảng giá phù hợp"
      );

      return;
    }

    try {
      const payload = {
  journey: values.journey,
  bus: values.bus,
  staff: values.staff,
  assistantDriver: values.assistant,
  fareRule: values.fareRule,

  departureHour: values.departureHour,
  arrivalHour: values.arrivalHour,
  weekdays: values.weekdays,

  startDate:
    values.startDate?.format("YYYY-MM-DD"),

  endDate:
    values.endDate?.format("YYYY-MM-DD"),

  status: values.status,
};

      const response =
        await axios.post(
          "http://localhost:3000/api/trip/generate",
          payload
        );

      message.success(
        response.data.message
      );

      navigate(
        "/admin/trip/list"
      );
    } catch (error: any) {
      console.error(error);

      message.error(
        error.response?.data
          ?.message ||
        "Tạo lịch thất bại"
      );
    }
  };

  // ====================================================
  // DISABLE NGÀY QUÁ KHỨ
  // ====================================================

  const disabledPastDate = (
    current: any
  ) => {
    return (
      current &&
      current <
      dayjs().startOf("day")
    );
  };

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <div className="p-6">
      <Card>
        <h1 className="text-2xl font-semibold mb-6">
          Thêm lịch chạy xe
        </h1>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
        >
          {/* ==================================================
              TUYẾN ĐƯỜNG
          ================================================== */}

          <Form.Item
            label="Tuyến đường"
            name="journey"
            rules={[
              {
                required: true,
                message:
                  "Chọn tuyến đường",
              },
            ]}
          >
            <Select
              placeholder="Chọn tuyến"
              onChange={
                handleJourneyChange
              }
              allowClear
            >
              {journeys.map(
                (item) => (
                  <Select.Option
                    key={
                      item._id
                    }
                    value={
                      item._id
                    }
                  >
                    {item.diemDi} →{" "}
                    {
                      item.diemDen
                    }
                  </Select.Option>
                )
              )}
            </Select>
          </Form.Item>

          {/* ==================================================
              GIỜ KHỞI HÀNH
          ================================================== */}

          <Form.Item
            label="Giờ khởi hành"
            name="departureHour"
            dependencies={[
              "startDate",
            ]}
            rules={[
              {
                required: true,
                message:
                  "Nhập giờ khởi hành",
              },
              {
                pattern:
                  /^([01]\d|2[0-3]):([0-5]\d)$/,
                message:
                  "Định dạng HH:mm",
              },
              ({
                getFieldValue,
              }) => ({
                validator(
                  _,
                  value
                ) {
                  const start =
                    getFieldValue(
                      "startDate"
                    );

                  if (
                    !start ||
                    !value ||
                    !/^([01]\d|2[0-3]):([0-5]\d)$/.test(
                      value
                    )
                  ) {
                    return Promise.resolve();
                  }

                  const startDateObj =
                    dayjs(
                      start
                    ).startOf(
                      "day"
                    );

                  const today =
                    dayjs().startOf(
                      "day"
                    );

                  if (
                    startDateObj.isAfter(
                      today
                    )
                  ) {
                    return Promise.resolve();
                  }

                  const [h, m] =
                    value
                      .split(":")
                      .map(
                        Number
                      );

                  const depTime =
                    dayjs()
                      .hour(h)
                      .minute(m)
                      .second(0);

                  if (
                    depTime.isBefore(
                      dayjs()
                    )
                  ) {
                    return Promise.reject(
                      new Error(
                        "Giờ khởi hành không được ở quá khứ"
                      )
                    );
                  }

                  return Promise.resolve();
                },
              }),
            ]}
          >
            <Input
              placeholder="07:00"
              value={
                departureHour
              }
              onChange={(e) =>
                setDepartureHour(
                  e.target.value
                )
              }
            />
          </Form.Item>

          {/* ==================================================
              GIỜ ĐẾN
          ================================================== */}

          <Form.Item
            label="Giờ đến"
            name="arrivalHour"
            dependencies={[
              "departureHour",
            ]}
            rules={[
              {
                required: true,
                message:
                  "Nhập giờ đến",
              },
              {
                pattern:
                  /^([01]\d|2[0-3]):([0-5]\d)$/,
                message:
                  "Định dạng HH:mm",
              },
              ({
                getFieldValue,
              }) => ({
                validator(
                  _,
                  value
                ) {
                  const departure =
                    getFieldValue(
                      "departureHour"
                    );

                  if (
                    !departure ||
                    !value ||
                    !/^([01]\d|2[0-3]):([0-5]\d)$/.test(
                      departure
                    ) ||
                    !/^([01]\d|2[0-3]):([0-5]\d)$/.test(
                      value
                    )
                  ) {
                    return Promise.resolve();
                  }

                  const [depH, depM] =
                    departure
                      .split(":")
                      .map(
                        Number
                      );

                  const [arrH, arrM] =
                    value
                      .split(":")
                      .map(
                        Number
                      );

                  if (
                    arrH * 60 +
                    arrM >
                    depH * 60 +
                    depM
                  ) {
                    return Promise.resolve();
                  }

                  return Promise.reject(
                    new Error(
                      "Giờ đến phải sau giờ khởi hành trong cùng ngày"
                    )
                  );
                },
              }),
            ]}
          >
            <Input
              placeholder="11:30"
              value={
                arrivalHour
              }
              onChange={(e) =>
                setArrivalHour(
                  e.target.value
                )
              }
            />
          </Form.Item>

          {/* ==================================================
              PREVIEW ĐIỂM ĐÓN / TRẢ
          ================================================== */}

          {selectedJourney &&
            departureHour &&
            arrivalHour && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="font-medium mb-2">
                  Giờ đón/trả dự kiến
                  theo lịch này
                </p>

                {selectedJourney.diemDon &&
                  selectedJourney
                    .diemDon
                    .length >
                  0 && (
                    <>
                      <p className="text-sm text-gray-500 mb-1">
                        Điểm đón
                      </p>

                      <div className="space-y-1 mb-3">
                        {selectedJourney.diemDon.map(
                          (
                            diem,
                            index
                          ) => (
                            <div
                              key={
                                diem._id ||
                                index
                              }
                              className="flex items-center gap-3"
                            >
                              <Tag color="blue">
                                {addMinutesToTime(
                                  departureHour,
                                  diem.offsetMinutes
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
                    .diemTra
                    .length >
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
                            index
                          ) => (
                            <div
                              key={
                                diem._id ||
                                index
                              }
                              className="flex items-center gap-3"
                            >
                              <Tag color="orange">
                                {addMinutesToTime(
                                  arrivalHour,
                                  -diem.offsetMinutes
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

          {/* ==================================================
              NGÀY CHẠY
          ================================================== */}

          <Form.Item
            label="Các ngày chạy"
            name="weekdays"
            rules={[
              {
                required: true,
                message:
                  "Chọn ít nhất 1 ngày",
              },
            ]}
          >
            <Checkbox.Group
              options={[
                {
                  label: "Thứ 2",
                  value: 1,
                },
                {
                  label: "Thứ 3",
                  value: 2,
                },
                {
                  label: "Thứ 4",
                  value: 3,
                },
                {
                  label: "Thứ 5",
                  value: 4,
                },
                {
                  label: "Thứ 6",
                  value: 5,
                },
                {
                  label: "Thứ 7",
                  value: 6,
                },
                {
                  label: "CN",
                  value: 0,
                },
              ]}
              onChange={(
                checked
              ) => {
                setWeekdays(
                  checked as number[]
                );
              }}
            />
          </Form.Item>

          {/* ==================================================
              TỪ NGÀY
          ================================================== */}

          <Form.Item
            label="Từ ngày"
            name="startDate"
            rules={[
              {
                required: true,
                message:
                  "Chọn ngày bắt đầu",
              },
            ]}
          >
            <DatePicker
              className="w-full"
              disabledDate={
                disabledPastDate
              }
              onChange={(
                value
              ) => {
                setStartDate(
                  value
                );

                // Nếu đổi ngày bắt đầu
                // lớn hơn ngày kết thúc
                // thì xóa ngày kết thúc
                const currentEnd =
                  form.getFieldValue(
                    "endDate"
                  );

                if (
                  value &&
                  currentEnd &&
                  dayjs(
                    currentEnd
                  ).isBefore(
                    value,
                    "day"
                  )
                ) {
                  form.setFieldValue(
                    "endDate",
                    undefined
                  );

                  setEndDate(
                    null
                  );
                }
              }}
            />
          </Form.Item>

          {/* ==================================================
              ĐẾN NGÀY
          ================================================== */}

          <Form.Item
            label="Đến ngày"
            name="endDate"
            rules={[
              {
                required: true,
                message:
                  "Chọn ngày kết thúc",
              },
            ]}
          >
            <DatePicker
              className="w-full"
              disabledDate={(
                current
              ) => {
                const sd =
                  form.getFieldValue(
                    "startDate"
                  );

                if (!sd) {
                  return (
                    current &&
                    current.isBefore(
                      dayjs().startOf(
                        "day"
                      )
                    )
                  );
                }

                return (
                  current &&
                  current.isBefore(
                    dayjs(
                      sd
                    ).startOf(
                      "day"
                    )
                  )
                );
              }}
              onChange={(
                value
              ) => {
                setEndDate(
                  value
                );
              }}
            />
          </Form.Item>

          {/* ==================================================
              XE
          ================================================== */}

          <Form.Item
            label="Xe"
            name="bus"
            rules={[
              {
                required: true,
                message:
                  "Chọn xe",
              },
            ]}
            extra={
              !readyToCheckSchedule
                ? "Chọn đủ tuyến đường, ngày chạy, khoảng ngày và giờ khởi hành/đến để xem xe đang rảnh"
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
                  !readyToCheckSchedule ||
                  availableBuses.length ===
                  0
                }
                notFoundContent="Không có xe nào rảnh trong khoảng lịch này"
                onChange={
                  handleBusChange
                }
                value={form.getFieldValue(
                  "bus"
                )}
              >
                {availableBuses.map(
                  (item) => (
                    <Select.Option
                      key={
                        item._id
                      }
                      value={
                        item._id
                      }
                    >
                      {item.name} -{" "}
                      {
                        item.licensePlates
                      }{" "}
                      (
                      {
                        item.capacity
                      }{" "}
                      chỗ)
                    </Select.Option>
                  )
                )}
              </Select>
            )}
          </Form.Item>

          {/* ==================================================
              BẢNG GIÁ
          ================================================== */}

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
                  : ""
              }
            />
          </Form.Item>

          {/* ==================================================
              TÀI XẾ
          ================================================== */}

          <Form.Item
            label="Tài xế"
            name="staff"
            rules={[
              {
                required: true,
                message:
                  "Chọn tài xế",
              },
            ]}
            extra={
              !readyToCheckSchedule
                ? "Chọn đủ tuyến đường, ngày chạy, khoảng ngày và giờ khởi hành/đến để xem tài xế đang rảnh"
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
                  !readyToCheckSchedule ||
                  availableStaffs.length ===
                  0
                }
                notFoundContent="Không có tài xế nào rảnh trong khoảng lịch này"
              >
                {availableStaffs.map(
                  (item) => (
                    <Select.Option
                      key={
                        item._id
                      }
                      value={
                        item._id
                      }
                    >
                      {
                        item.ten
                      }
                    </Select.Option>
                  )
                )}
              </Select>
            )}
          </Form.Item>

{/* ==================================================
    PHỤ XE
================================================== */}

<Form.Item
  label="Phụ xe"
  name="assistant"
  rules={[
  ({ getFieldValue }) => ({
    validator(_, value) {
      const busId = getFieldValue("bus");

      const bus = availableBuses.find(
        (item) => item._id === busId
      );

      // Xe 16 chỗ -> không cần phụ xe
      if (bus?.capacity === 16) {
        return Promise.resolve();
      }

      // Xe khác 16 chỗ -> bắt buộc phụ xe
      if (!value) {
        return Promise.reject(
          new Error("Xe này bắt buộc phải có phụ xe")
        );
      }

      return Promise.resolve();
    },
  }),
]}
  extra={
    !readyToCheckSchedule
      ? "Chọn đủ tuyến đường, ngày chạy, khoảng ngày và giờ khởi hành/đến để xem phụ xe đang rảnh"
      : undefined
  }
>
  {loadingAssistants ? (
    <div className="flex items-center gap-2">
      <Spin size="small" />

      <span className="text-gray-500 text-sm">
        Đang kiểm tra phụ xe rảnh...
      </span>
    </div>
  ) : (
    <Select
      placeholder="Chọn phụ xe đang rảnh"
      disabled={
        !readyToCheckSchedule ||
        availableAssistants.length === 0
      }
      notFoundContent="Không có phụ xe nào rảnh trong khoảng lịch này"
    >
      {availableAssistants.map((item) => (
        <Select.Option
          key={item._id}
          value={item._id}
        >
          {item.ten}
        </Select.Option>
      ))}
    </Select>
  )}
</Form.Item>
          {/* ==================================================
              TRẠNG THÁI
          ================================================== */}

          <Form.Item
            label="Trạng thái"
            name="status"
            initialValue="sắp chạy"
          >
            <Select
              options={[
                {
                  value:
                    "sắp chạy",
                  label:
                    "Sắp chạy",
                },
                {
                  value:
                    "đang chạy",
                  label:
                    "Đang chạy",
                },
                {
                  value:
                    "hoàn thành",
                  label:
                    "Hoàn thành",
                },
                {
                  value: "huỷ",
                  label: "Huỷ",
                },
              ]}
            />
          </Form.Item>

          {/* ==================================================
              SUBMIT
          ================================================== */}

          <Button
            type="primary"
            htmlType="submit"
            disabled={
              loadingBuses ||
              loadingDrivers ||
              loadingAssistants ||
              !readyToCheckSchedule ||
              availableBuses.length ===
              0 ||
              availableStaffs.length ===
              0
            }
          >
            Tạo lịch chạy
          </Button>
        </Form>
      </Card>
    </div>
  );
}

export default TripAddPage;