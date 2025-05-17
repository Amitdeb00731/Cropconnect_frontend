const WEATHER_API_KEY = "e1de6d7f7ec048afaf0175855251605";

export const fetchWeather = async (lat, lon) => {
  try {
    const res = await fetch(
      `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${lat},${lon}`
    );
    if (!res.ok) throw new Error("Weather API failed");
    return await res.json();
  } catch (err) {
    console.error("❌ Weather fetch error:", err);
    return null;
  }
};
