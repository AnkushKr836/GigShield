import requests

from app.core.config import settings

CURRENT_WEATHER_URL = "https://api.openweathermap.org/data/2.5/weather"

# OpenWeatherMap "current weather" condition codes: any code in these
# ranges corresponds to a genuine environmental disruption. See
# https://openweathermap.org/weather-conditions for the full table.
# 2xx = thunderstorm, 3xx = drizzle, 5xx = rain, 6xx = snow, 781 = tornado
DISRUPTIVE_CONDITION_RANGES = [(200, 299), (300, 399), (500, 599), (600, 699)]
EXTREME_HEAT_THRESHOLD_C = 42.0


def is_disruptive_condition(condition_code: int, temp_c: float | None) -> bool:
    for lo, hi in DISRUPTIVE_CONDITION_RANGES:
        if lo <= condition_code <= hi:
            return True
    if temp_c is not None and temp_c >= EXTREME_HEAT_THRESHOLD_C:
        return True
    return False


def get_current_weather(lat: float, lng: float) -> dict | None:
    """
    Real, live call to OpenWeatherMap's free current-weather endpoint (no
    credit card required, unlike the historical One Call 3.0 timemachine
    endpoint). Only tells you conditions RIGHT NOW, not at some point in
    the past — this is a deliberate, documented tradeoff, not an oversight.

    Returns None on any failure (missing key, network error, bad response)
    rather than raising — callers must treat a real weather check as
    optional supporting evidence, never a hard dependency, since a claim
    still needs to be assessable when this API is unreachable.
    """
    if not settings.OPENWEATHERMAP_API_KEY:
        return None
    try:
        resp = requests.get(
            CURRENT_WEATHER_URL,
            params={
                "lat": lat,
                "lon": lng,
                "appid": settings.OPENWEATHERMAP_API_KEY,
                "units": "metric",
            },
            timeout=5,
        )
        resp.raise_for_status()
        data = resp.json()

        weather_list = data.get("weather", [])
        condition_code = weather_list[0]["id"] if weather_list else None
        description = weather_list[0]["description"] if weather_list else None
        temp_c = data.get("main", {}).get("temp")

        if condition_code is None:
            return None

        return {
            "condition_code": condition_code,
            "description": description,
            "temp_c": temp_c,
            "is_disruptive": is_disruptive_condition(condition_code, temp_c),
        }
    except (requests.RequestException, KeyError, ValueError, IndexError):
        return None
