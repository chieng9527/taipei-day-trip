export function renderAttractions(attractions) {
  const container = document.getElementById("attractions-container");
  const fragment = document.createDocumentFragment();

  attractions.forEach(({ name, images, id, mrt = "無捷運資訊", category = "未分類" }) => {
    if (!name) return;
    const card = document.createElement("div");
    card.className = "attraction-card";
    card.innerHTML = `
      <a href="/attraction/${id}">
        <img src="${images[0]}" alt="${name}">
        <h3>${name}</h3>
        <div>
          <p class='attraction-mrt'>${mrt}</p>
          <p class='attraction-category'>${category}</p>
        </div>
      </a>`;
    fragment.appendChild(card);
  });

  container.appendChild(fragment);
}

export function renderMRTStations(stations, onClick) {
  const mrtList = document.getElementById("mrtList");
  mrtList.innerHTML = "";
  const fragment = document.createDocumentFragment();

  stations.forEach(station => {
    const stationElement = document.createElement("div");
    stationElement.className = "mrt-item";
    stationElement.textContent = station;
    stationElement.addEventListener("click", () => onClick(station));
    fragment.appendChild(stationElement);
  });

  mrtList.appendChild(fragment);
}