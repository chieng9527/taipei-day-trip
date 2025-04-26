const API = {
  BASE_URL: "/api",
  ATTRACTION: "/api/attraction",
  BOOKING: "/api/booking",
  USER_AUTH: "/api/user/auth"
};

export async function fetchAttractionData(attractionId) {
  const response = await fetch(`${API.ATTRACTION}/${attractionId}`);
  const { data } = await response.json();
  if (!data) throw new Error("景點資料載入失敗");
  return data;
}

export async function fetchBookingStatus(token) {
  const response = await fetch(API.BOOKING, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return await response.json();
}

export async function createBooking(token, payload) {
  const response = await fetch(API.BOOKING, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  return await response.json();
}

export async function fetchUserAuth(token) {
  const response = await fetch(API.USER_AUTH, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const result = await response.json();
  return result.data !== null;
}