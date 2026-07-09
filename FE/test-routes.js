import axios from 'axios';
async function test() {
  const response = await axios.get("http://localhost:3000/api/trip");
  let data = [];
  if (response.data && "data" in response.data && Array.isArray(response.data.data)) {
    data = response.data.data;
  } else if (Array.isArray(response.data)) {
    data = response.data;
  }
  
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
        price: t.journey.price || t.price || 0,
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
