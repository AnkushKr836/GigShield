import requests

from app.core.config import settings


def get_historical_route(ride) -> dict:
    """Return an estimated TomTom road route for a demo ride's endpoints.

    The current demo records contain venue coordinates, not a GPS breadcrumb
    trace, so this is a route estimate for the ride time, not a reconstruction
    of the road actually driven.
    """
    if not settings.TOMTOM_ROUTING_API_KEY:
        return {
            "available": False,
            "source": "tomtom_routing",
            "reason": "Set TOMTOM_ROUTING_API_KEY in backend/.env to request a TomTom route estimate.",
        }
    if ride.pickup_lat is None or ride.pickup_lng is None or ride.drop_lat is None or ride.drop_lng is None:
        return {"available": False, "source": "tomtom_routing", "reason": "Ride endpoints have no coordinates."}

    url = "https://api.tomtom.com/maps/orbis/routing/routes/calculate"
    body = {
        "routePlanningLocations": {
            "origin": {"type": "Point", "coordinates": [ride.pickup_lng, ride.pickup_lat]},
            "destination": {"type": "Point", "coordinates": [ride.drop_lng, ride.drop_lat]},
        },
        "departureDateTime": ride.start_time.isoformat(),
        "traffic": "historical",
        "routeType": "fast",
    }
    try:
        response = requests.post(
            url,
            params={"apiVersion": 3},
            headers={
                "Content-Type": "application/json",
                "TomTom-Api-Version": "3",
                "TomTom-Api-Key": settings.TOMTOM_ROUTING_API_KEY,
                "Attributes": "routes.legs.path,routes.legs.summary",
            },
            json=body,
            timeout=10,
        )
        response.raise_for_status()
        routes = response.json().get("routes") or []
        if not routes:
            return {"available": False, "source": "tomtom_routing", "reason": "TomTom returned no route."}

        route = routes[0]
        coordinates = []
        distance_meters = 0
        duration_seconds = 0
        for leg in route.get("legs", []):
            path = leg.get("path") or {}
            coordinates.extend(path.get("coordinates") or [])
            summary = leg.get("summary") or {}
            distance_meters += summary.get("lengthInMeters", 0)
            duration_seconds += summary.get("travelDurationInSeconds", 0)

        points = [[coordinate[1], coordinate[0]] for coordinate in coordinates if len(coordinate) >= 2]
        if len(points) < 2:
            return {"available": False, "source": "tomtom_routing", "reason": "TomTom returned no drawable route geometry."}

        return {
            "available": True,
            "source": "tomtom_historical_route_estimate",
            "points": points,
            "distance_meters": distance_meters,
            "duration_seconds": duration_seconds,
            "disclaimer": "Estimated road route from pickup/drop-off coordinates; this is not a recorded GPS trace.",
        }
    except (requests.RequestException, ValueError, KeyError, TypeError):
        return {
            "available": False,
            "source": "tomtom_routing",
            "reason": "TomTom route lookup is unavailable. Check the routing key and try again.",
        }
