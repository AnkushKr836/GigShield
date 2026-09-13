"""
Real, named Chennai locations with real approximate coordinates — used so
fabricated rides have a genuine pickup/drop pair that can be mapped and
checked against a real weather API, rather than a made-up string like
"MG Road" with no actual position.

Coordinates are approximate (rounded to ~4 decimal places, i.e. within
roughly 10m) — accurate enough for a route map and a weather lookup, not
claimed to be exact street addresses.
"""

RESTAURANTS = [
    {"name": "Saravana Bhavan, T Nagar", "lat": 13.0418, "lng": 80.2341},
    {"name": "Murugan Idli Shop, Adyar", "lat": 13.0067, "lng": 80.2570},
    {"name": "Buhari Hotel, Anna Salai", "lat": 13.0604, "lng": 80.2646},
    {"name": "Ponnusamy Hotel, Egmore", "lat": 13.0732, "lng": 80.2609},
    {"name": "A2B, Velachery", "lat": 12.9791, "lng": 80.2183},
    {"name": "Sangeetha, Nungambakkam", "lat": 13.0603, "lng": 80.2434},
    {"name": "Junior Kuppanna, Alwarpet", "lat": 13.0332, "lng": 80.2544},
    {"name": "Dindigul Thalappakatti, Porur", "lat": 13.0333, "lng": 80.1567},
    {"name": "Hotel Saravana Bhavan, Mylapore", "lat": 13.0339, "lng": 80.2695},
    {"name": "Ratna Cafe, T Nagar", "lat": 13.0402, "lng": 80.2337},
]

DROP_LOCATIONS = [
    {"name": "Anna Nagar West", "lat": 13.0850, "lng": 80.2101},
    {"name": "Velachery Main Road", "lat": 12.9750, "lng": 80.2209},
    {"name": "Guindy Industrial Estate", "lat": 13.0067, "lng": 80.2206},
    {"name": "Tambaram East", "lat": 12.9229, "lng": 80.1275},
    {"name": "Nungambakkam High Road", "lat": 13.0569, "lng": 80.2425},
    {"name": "Adyar Besant Nagar", "lat": 13.0002, "lng": 80.2668},
    {"name": "Porur Junction", "lat": 13.0357, "lng": 80.1580},
    {"name": "Mylapore Tank", "lat": 13.0337, "lng": 80.2694},
    {"name": "Egmore Station Area", "lat": 13.0778, "lng": 80.2610},
    {"name": "T Nagar Panagal Park", "lat": 13.0410, "lng": 80.2338},
]
