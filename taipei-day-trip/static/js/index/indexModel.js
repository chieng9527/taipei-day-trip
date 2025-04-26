const API = {
  ATTRACTIONS: "/api/attractions",
  MRTS: "/api/mrts"
};

export async function fetchAttractionsAPI(page, keyword) {
  const url = `${API.ATTRACTIONS}?page=${page}${keyword ? `&keyword=${encodeURIComponent(keyword.trim())}` : ""}`;
  const response = await fetch(url);
  return await response.json();
}

export async function fetchMRTStationsAPI() {
  const response = await fetch(API.MRTS);
  return await response.json();
}