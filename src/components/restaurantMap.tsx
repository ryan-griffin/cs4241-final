"use client";

import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    RestaurantDetails,
    toRestaurantSummary,
} from "@/components/restaurant-row";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export type Restaurant = {
    id: string;
    name: string;
    image_url?: string;
    coordinates: { latitude: number; longitude: number };
    distance?: number;
    rating?: number;
    review_count?: number;
    price?: string;
    business_hours?: { is_open_now: boolean }[];
    categories?: { title: string }[];
    url: string;
    location: { display_address: string[] };
};

type Coordinates = Restaurant["coordinates"];

const RestaurantLeafletMap = dynamic(() => import("./restaurantLeafletMap"), {
    ssr: false,
    loading: () => (
        <div className="flex h-full min-h-[360px] items-center justify-center text-sm text-slate-500">
            Loading map
        </div>
    ),
});

export function RestaurantMap({
    onRestaurantsLoaded,
    restaurants: suppliedRestaurants,
    fillHeight = false,
}: {
    onRestaurantsLoaded?: (restaurants: Restaurant[]) => void;
    restaurants?: Restaurant[];
    fillHeight?: boolean;
}) {
    const [center, setCenter] = useState<Coordinates | null>(null);
    const [nearbyRestaurants, setNearbyRestaurants] = useState<Restaurant[]>(
        [],
    );
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const hasRequestedLocation = useRef(false);

    const search = useCallback(
        async (coordinates: Coordinates) => {
            setLoading(true);
            setError("");
            setSelectedId(null);
            try {
                const params = new URLSearchParams({
                    latitude: String(coordinates.latitude),
                    longitude: String(coordinates.longitude),
                });
                const response = await fetch(
                    `/api/restaurants/search?${params.toString()}`,
                );
                const data: {
                    businesses?: Restaurant[];
                    error?: string;
                    details?: string;
                } = await response.json();
                if (!response.ok) {
                    throw new Error(
                        [data.error, data.details].filter(Boolean).join(": ") ||
                            "Could not load restaurants.",
                    );
                }
                const loadedRestaurants = data.businesses ?? [];
                setNearbyRestaurants(loadedRestaurants);
                onRestaurantsLoaded?.(loadedRestaurants);
            } catch (cause) {
                setNearbyRestaurants([]);
                onRestaurantsLoaded?.([]);
                setError(
                    cause instanceof Error
                        ? cause.message
                        : "could not load restaurants.",
                );
            } finally {
                setLoading(false);
            }
        },
        [onRestaurantsLoaded],
    );

    useEffect(() => {
        if (suppliedRestaurants !== undefined || hasRequestedLocation.current) {
            return;
        }
        hasRequestedLocation.current = true;

        if (!navigator.geolocation) {
            setError("location access needed to find nearby restaurants.");
            return;
        }
        navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
                const coordinates = {
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                };
                setCenter(coordinates);
                void search(coordinates);
            },
            () => setError("allow location access to find nearby restaurants."),
        );
    }, [search, suppliedRestaurants]);

    const restaurants = suppliedRestaurants ?? nearbyRestaurants;
    const mapCenter =
        suppliedRestaurants !== undefined
            ? suppliedRestaurants[0]?.coordinates
            : center;
    const selectedRestaurant = restaurants.find(
        (restaurant) => restaurant.id === selectedId,
    );

    return (
        <section
            className={`flex h-full min-h-[420px] flex-col gap-3 ${fillHeight ? "lg:min-h-0 lg:flex-1" : ""}`}
        >
            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            {loading && (
                <p className="text-sm text-muted-foreground">Searching Yelp</p>
            )}
            <section
                className={`relative min-h-[360px] flex-1 overflow-hidden rounded-xl bg-slate-100 ${fillHeight ? "lg:min-h-0" : ""}`}
            >
                {mapCenter ? (
                    <RestaurantLeafletMap
                        center={mapCenter}
                        restaurants={restaurants}
                        onSelect={(restaurant) => setSelectedId(restaurant.id)}
                        fitRestaurants={suppliedRestaurants !== undefined}
                    />
                ) : (
                    <div className="flex h-full items-center justify-center p-8 text-center text-sm text-muted-foreground">
                        {suppliedRestaurants !== undefined
                            ? "No selected restaurants have map coordinates."
                            : "Location access needed to show nearby restaurants."}
                    </div>
                )}
                {selectedRestaurant && (
                    <Card className="absolute bottom-4 left-4 z-[1000] max-w-xs">
                        <CardContent className="pr-12">
                            <RestaurantDetails
                                restaurant={toRestaurantSummary(
                                    selectedRestaurant,
                                )}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => setSelectedId(null)}
                                className="absolute right-3 top-3"
                                aria-label="Close restaurant details"
                            >
                                <HugeiconsIcon
                                    icon={Cancel01Icon}
                                    strokeWidth={2}
                                    aria-hidden="true"
                                />
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </section>
        </section>
    );
}
