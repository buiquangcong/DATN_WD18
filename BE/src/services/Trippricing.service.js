import Holiday from "../models/holiday.model.js";

export const isHoliday = async (date) => {
  const d = new Date(date);
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const holiday = await Holiday.findOne({
    day,
    month,
    status: true,
  });

  return !!holiday;
};

export const calculateTicketPrice = async (fare, date) => {
  const day = new Date(date).getDay();

  let ticketPrice = fare.weekdayPrice;

  if (day === 0 || day === 6) {
    ticketPrice = fare.weekendPrice;
  }

  const holidayToday = await isHoliday(date);

  if (holidayToday) {
    ticketPrice = fare.holidayPrice;
  }

  return ticketPrice;
};