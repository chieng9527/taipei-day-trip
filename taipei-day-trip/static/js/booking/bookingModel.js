const API = {
  BOOKING: "/api/booking",
  USER_AUTH: "/api/user/auth",
  ORDER: "/api/orders"
};

export async function fetchBooking(token) {
  const response = await fetch(API.BOOKING, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("取得預定資料失敗");
  const { data } = await response.json();
  return data;
}

export async function deleteBooking(token) {
  const response = await fetch(API.BOOKING, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("刪除失敗");
}

export async function sendOrder(token, prime, order) {
  const response = await fetch(API.ORDER, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ prime, order })
  });
  return await response.json();
}

export async function fetchUser(token) {
  const response = await fetch(API.USER_AUTH, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return await response.json();
}