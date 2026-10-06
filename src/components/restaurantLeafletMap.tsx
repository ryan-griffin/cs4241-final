import { useEffect } from "react";
import {
    CircleMarker,
    MapContainer,
    TileLayer,
    Tooltip,
    useMap,
} from "react-leaflet";
import type { Restaurant } from "./restaurantMap";

type Props = {
    center: Restaurant["coordinates"];
    restaurants: Restaurant[];
    onSelect: (restaurant: Restaurant) => void;
    fitRestaurants?: boolean;
};

function RestaurantBounds({ restaurants }: { restaurants: Restaurant[] }) {
    const map = useMap();
    const latitudes = restaurants.map(
        ({ coordinates }) => coordinates.latitude,
    );
    const longitudes = restaurants.map(
        ({ coordinates }) => coordinates.longitude,
    );
    const south = Math.min(...latitudes);
    const north = Math.max(...latitudes);
    const west = Math.min(...longitudes);
    const east = Math.max(...longitudes);

    useEffect(() => {
        if (![south, north, west, east].every(Number.isFinite)) return;
        map.fitBounds(
            [
                [south, west],
                [north, east],
            ],
            { padding: [32, 32], maxZoom: 14 },
        );
    }, [map, south, north, west, east]);

    return null;
}

function MapSize() {
    const map = useMap();

    useEffect(() => {
        const observer = new ResizeObserver(() => map.invalidateSize());
        observer.observe(map.getContainer());
        return () => observer.disconnect();
    }, [map]);

    return null;
}

export default function RestaurantLeafletMap({
    center,
    restaurants,
    onSelect,
    fitRestaurants = false,
}: Props) {
    return (
        <MapContainer
            center={[center.latitude, center.longitude]}
            zoom={14}
            minZoom={3}
            maxZoom={19}
            scrollWheelZoom
            className="h-full w-full"
        >
            <MapSize />
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {fitRestaurants && <RestaurantBounds restaurants={restaurants} />}
            {restaurants.map((restaurant, index) => (
                <CircleMarker
                    key={restaurant.id}
                    center={[
                        restaurant.coordinates.latitude,
                        restaurant.coordinates.longitude,
                    ]}
                    radius={12}
                    pathOptions={{
                        color: "var(--primary-foreground)",
                        weight: 2,
                        fillColor: "var(--primary)",
                        fillOpacity: 1,
                    }}
                    eventHandlers={{
                        click: () => onSelect(restaurant),
                    }}
                >
                    <Tooltip
                        permanent
                        direction="center"
                        className="restaurant-marker-label"
                    >
                        {index + 1}
                    </Tooltip>
                </CircleMarker>
            ))}
        </MapContainer>
    );
}
