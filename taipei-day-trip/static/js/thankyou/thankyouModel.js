export async function fetchOrderData(orderNumber, token) {
  const response = await fetch(`/api/order/${orderNumber}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response;
}