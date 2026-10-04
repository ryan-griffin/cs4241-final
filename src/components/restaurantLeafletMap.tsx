"use client";

import { CircleMarker, MapContainer, TileLayer, Tooltip } from "react-leaflet";
import type { Restaurant } from "./restaurantMap";

type Props = {
    center: { latitude: number; longitude: number };
    restaurants: Restaurant[];
    onSelect: (restaurant: Restaurant) => void;
};

export default function RestaurantLeafletMap({
    center,
    restaurants,
    onSelect,
}: Props) {
    return (
        <MapContainer
            center={[center.latitude, center.longitude]}
            zoom={14}
            minZoom={3}
            maxZoom={19}
            scrollWheelZoom
            className="h-full min-h-[360px] w-full"
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {restaurants.map((restaurant, index) => (
                <CircleMarker
                    key={restaurant.id}
                    center={[
                        restaurant.coordinates.latitude,
                        restaurant.coordinates.longitude,
                    ]}
                    radius={12}
                    pathOptions={{
                        color: "#ffffff",
                        weight: 2,
                        fillColor: "#FF1A1A",
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
