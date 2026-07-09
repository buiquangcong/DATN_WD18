import axios from 'axios';
async function test() {
  const response = await axios.get("http://localhost:3000/api/trip");
  let data = [];
  if (response.data && "data" in response.data && Array.isArray(response.data.data)) {
    data = response.data.data;
  } else if (Array.isArray(response.data)) {
    data = response.data;
  }
  
  const getTicketPrice = (item) => {
    if (!item.departureTime) return item.journey?.price || item.price || 0;
    const departureDate = new Date(item.departureTime);
    if (item.fareRule) {
      if (departureDate.getDay() === 0 || departureDate.getDay() === 6) {
        return item.fareRule.weekendPrice;
      } else {
        return item.fareRule.weekdayPrice;
      }
    }
    return item.journey?.price || item.price || 0;
  };

  const routeMap = new Map();
  data.forEach((t) => {
    if (!t.journey?.diemDi || !t.journey?.diemDen) return;
    const key = `${t.journey.diemDi} - ${t.journey.diemDen}`;
    if (routeMap.has(key)) {
      routeMap.get(key).count += 1;
    } else {
      routeMap.set(key, {
        diemDi: t.journey.diemDi,
        diemDen: t.journey.diemDen,
        thoiGianDiChuyen: t.journey.thoiGianDiChuyen || "Không rõ",
        price: getTicketPrice(t),
        busType: t.bus?.type || "Ghế ngồi",
        count: 1
      });
    }
  });
  const sortedRoutes = Array.from(routeMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
  console.log(sortedRoutes);
}
test();
