"""
Real-time ecological data for Atlantic Canada cities.
Sources (all free, no API key):
  - Open-Meteo weather API    (temperature, wind, precipitation, UV, humidity)
  - Open-Meteo air quality API (PM2.5, PM10, ozone, NO2, AQI)
  - Open-Meteo marine API     (sea surface temperature, wave height)
"""

import time
import asyncio
import httpx
from fastapi import APIRouter

router = APIRouter()

# Atlantic Canada cities with coordinates
CITIES = {
    "moncton":       {"lat": 46.0878, "lon": -64.7782, "province": "New Brunswick"},
    "halifax":       {"lat": 44.6488, "lon": -63.5752, "province": "Nova Scotia"},
    "charlottetown": {"lat": 46.2382, "lon": -63.1311, "province": "Prince Edward Island"},
    "st-johns":      {"lat": 47.5615, "lon": -52.7126, "province": "Newfoundland"},
}

# Cache: hold data for 5 minutes to avoid hammering free APIs
_cache: dict = {"data": None, "ts": 0}
CACHE_TTL = 300  # seconds


async def fetch_city(client: httpx.AsyncClient, city_id: str, city: dict) -> dict:
    lat, lon = city["lat"], city["lon"]
    tz = "America/Halifax"

    weather_url = (
        f"https://api.open-meteo.com/v1/forecast"
        f"?latitude={lat}&longitude={lon}"
        f"&current=temperature_2m,apparent_temperature,wind_speed_10m,"
        f"precipitation,uv_index,relative_humidity_2m,weather_code"
        f"&timezone={tz}"
    )
    aq_url = (
        f"https://air-quality-api.open-meteo.com/v1/air-quality"
        f"?latitude={lat}&longitude={lon}"
        f"&current=pm2_5,pm10,ozone,nitrogen_dioxide,european_aqi"
        f"&timezone={tz}"
    )
    marine_url = (
        f"https://marine-api.open-meteo.com/v1/marine"
        f"?latitude={lat}&longitude={lon}"
        f"&current=sea_surface_temperature,wave_height"
        f"&timezone={tz}"
    )

    weather_res, aq_res, marine_res = await asyncio.gather(
        client.get(weather_url, timeout=8),
        client.get(aq_url, timeout=8),
        client.get(marine_url, timeout=8),
        return_exceptions=True,
    )

    def safe_current(res, key):
        if isinstance(res, Exception): return None
        try: return res.json()["current"].get(key)
        except Exception: return None

    temp     = safe_current(weather_res, "temperature_2m")
    feels    = safe_current(weather_res, "apparent_temperature")
    wind     = safe_current(weather_res, "wind_speed_10m")
    precip   = safe_current(weather_res, "precipitation")
    uv       = safe_current(weather_res, "uv_index")
    humidity = safe_current(weather_res, "relative_humidity_2m")
    wcode    = safe_current(weather_res, "weather_code")

    pm25     = safe_current(aq_res, "pm2_5")
    pm10     = safe_current(aq_res, "pm10")
    ozone    = safe_current(aq_res, "ozone")
    no2      = safe_current(aq_res, "nitrogen_dioxide")
    aqi      = safe_current(aq_res, "european_aqi")

    sst      = safe_current(marine_res, "sea_surface_temperature")
    wave_h   = safe_current(marine_res, "wave_height")

    # Derive a simple eco-nudge (-1 to +1): bad air/heat pushes eco-score down
    eco_nudge = 0.0
    if aqi is not None:
        eco_nudge -= min(aqi / 100, 0.5)
    if temp is not None and temp > 28:
        eco_nudge -= (temp - 28) * 0.05
    if precip is not None and precip > 5:
        eco_nudge -= 0.1  # heavy rain event

    return {
        "city_id":        city_id,
        "province":       city["province"],
        # Weather
        "temperature_c":  round(temp, 1)  if temp    is not None else None,
        "feels_like_c":   round(feels, 1) if feels   is not None else None,
        "wind_kmh":       round(wind, 1)  if wind    is not None else None,
        "precipitation_mm": round(precip, 1) if precip is not None else None,
        "uv_index":       round(uv, 1)    if uv      is not None else None,
        "humidity_pct":   humidity,
        "weather_code":   wcode,
        # Air quality
        "pm25":           round(pm25, 1)  if pm25    is not None else None,
        "pm10":           round(pm10, 1)  if pm10    is not None else None,
        "ozone_ppb":      round(ozone, 1) if ozone   is not None else None,
        "no2_ppb":        round(no2, 1)   if no2     is not None else None,
        "aqi":            aqi,
        # Marine
        "sea_surface_temp_c": round(sst, 1) if sst   is not None else None,
        "wave_height_m":  round(wave_h, 2) if wave_h is not None else None,
        # Derived
        "eco_nudge":      round(eco_nudge, 3),
    }


@router.get("/realtime")
async def get_realtime():
    global _cache
    now = time.time()

    if _cache["data"] and (now - _cache["ts"]) < CACHE_TTL:
        return {**_cache["data"], "cached": True}

    async with httpx.AsyncClient() as client:
        results = await asyncio.gather(
            *[fetch_city(client, cid, cdata) for cid, cdata in CITIES.items()],
            return_exceptions=True,
        )

    cities_out = {}
    for r in results:
        if isinstance(r, Exception):
            continue
        cities_out[r["city_id"]] = r

    # Build province-level aggregates (average of city readings per province)
    provinces_out = {}
    for city_data in cities_out.values():
        prov = city_data["province"]
        if prov not in provinces_out:
            provinces_out[prov] = {k: [] for k in ["temperature_c", "pm25", "aqi", "sea_surface_temp_c", "ozone_ppb", "no2_ppb", "humidity_pct"]}
        for key in provinces_out[prov]:
            if city_data.get(key) is not None:
                provinces_out[prov][key].append(city_data[key])

    provinces_avg = {}
    for prov, vals in provinces_out.items():
        provinces_avg[prov] = {
            k: round(sum(v) / len(v), 2) if v else None
            for k, v in vals.items()
        }

    payload = {
        "cities":       cities_out,
        "provinces":    provinces_avg,
        "fetched_at":   now,
        "cached":       False,
    }
    _cache = {"data": payload, "ts": now}
    return payload
