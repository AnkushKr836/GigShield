"""Real, recognizable Chennai venues used by the clearly synthetic demo rides.

Coordinates are approximate venue/campus coordinates for mapping and demo
routing; they are not device traces or proof that a rider visited the venue.
"""

RESTAURANTS = [
    {
        "name": "Saravanaa Bhavan, T. Nagar",
        "address": "14 Mahalakshmi Street, T. Nagar, Chennai 600017",
        "lat": 13.0418,
        "lng": 80.2341,
    },
    {
        "name": "Saravanaa Bhavan, Adyar",
        "address": "27 Adyar Bridge Road, Adyar, Chennai 600020",
        "lat": 13.0067,
        "lng": 80.2570,
    },
    {
        "name": "Buhari Hotel",
        "address": "83 Anna Salai, Mount Road, Chennai 600002",
        "lat": 13.0604,
        "lng": 80.2646,
    },
    {
        "name": "Ratna Cafe",
        "address": "255 Triplicane High Road, Triplicane, Chennai 600005",
        "lat": 13.0584,
        "lng": 80.2787,
    },
    {
        "name": "Dindigul Thalappakatti, Porur",
        "address": "21A Arcot Road, Kamala Nagar, Porur, Chennai 600116",
        "lat": 13.0333,
        "lng": 80.1567,
    },
]

# Demo drop-offs use recognizable hotels, corporate campuses and universities.
# Their locations are kept local to make the short prototype rides plausible.
DROP_LOCATIONS = [
    {
        "name": "Taj Coromandel",
        "address": "37 Mahatma Gandhi Road, Nungambakkam, Chennai 600034",
        "lat": 13.0569,
        "lng": 80.2425,
    },
    {
        "name": "Anna University",
        "address": "Sardar Patel Road, Guindy, Chennai 600025",
        "lat": 13.0108,
        "lng": 80.2351,
    },
    {
        "name": "IIT Madras",
        "address": "IIT P.O., Chennai 600036",
        "lat": 13.0067,
        "lng": 80.2206,
    },
    {
        "name": "TIDEL Park",
        "address": "4 Rajiv Gandhi Salai, Taramani, Chennai 600113",
        "lat": 12.9899,
        "lng": 80.2470,
    },
    {
        "name": "Olympia Technology Park",
        "address": "Plot 1, SIDCO Industrial Estate, Guindy, Chennai 600032",
        "lat": 13.0102,
        "lng": 80.2007,
    },
]

MAX_DEMO_RIDE_DISTANCE_KM = 6.0


def display_location(place: dict) -> str:
    """Compact name plus postal address for the current 150-char ride fields."""
    return f"{place['name']} — {place['address']}"


def distance_km(start: dict, end: dict) -> float:
    """Haversine distance between two venue coordinates."""
    from math import asin, cos, radians, sin, sqrt

    lat1, lat2 = radians(start["lat"]), radians(end["lat"])
    delta_lat = lat2 - lat1
    delta_lng = radians(end["lng"] - start["lng"])
    haversine = sin(delta_lat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(delta_lng / 2) ** 2
    return 6371 * 2 * asin(sqrt(haversine))


def nearby_location_pairs() -> list[tuple[dict, dict]]:
    """Return plausible local restaurant-to-campus/office/hotel trips."""
    pairs = [
        (pickup, drop)
        for pickup in RESTAURANTS
        for drop in DROP_LOCATIONS
        if 0.4 <= distance_km(pickup, drop) <= MAX_DEMO_RIDE_DISTANCE_KM
    ]
    return pairs or [(pickup, drop) for pickup in RESTAURANTS for drop in DROP_LOCATIONS]
