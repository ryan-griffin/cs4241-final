"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";

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

type Coordinates = {
    latitude: number;
    longitude: number;
};

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
}: {
    onRestaurantsLoaded: (restaurants: Restaurant[]) => void;
}) {
    const [center, setCenter] = useState<Coordinates | null>(null);
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [selected, setSelected] = useState<Restaurant | null>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const hasRequestedLocation = useRef(false);

    const search = useCallback(
        async (coordinates: Coordinates) => {
            setLoading(true);
            setError("");
            setSelected(null);
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
                const nearbyRestaurants = data.businesses ?? [];
                setRestaurants(nearbyRestaurants);
                onRestaurantsLoaded(nearbyRestaurants);
            } catch (cause) {
                setRestaurants([]);
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
        if (hasRequestedLocation.current) {
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
    }, [search]);

    return (
        <section className="flex h-full min-h-[420px] flex-col gap-3">
            {error && (
                <p role="alert" className="text-sm text-red-600">
                    {error}
                </p>
            )}
            {loading && (
                <p className="text-sm text-slate-500">Searching Yelp</p>
            )}
            <section className="relative min-h-[360px] flex-1 overflow-hidden rounded-xl bg-slate-100">
                {center ? (
                    <RestaurantLeafletMap
                        center={center}
                        restaurants={restaurants}
                        onSelect={setSelected}
                    />
                ) : (
                    <div className="flex h-full min-h-[360px] items-center justify-center p-8 text-center text-sm text-slate-500">
                        location access needed to show nearby restaurants.
                    </div>
                )}
                {selected && (
                    <article className="absolute bottom-4 left-4 z-[1000] max-w-xs rounded-xl bg-white p-4 shadow-xl">
                        <button
                            type="button"
                            onClick={() => setSelected(null)}
                            className="absolute right-3 top-2 text-lg text-slate-500"
                        >
                            x
                        </button>
                        <h2 className="pr-5 font-semibold">
                            {selected.name}{" "}
                            {selected.business_hours?.[0]?.is_open_now === false
                                ? " (Closed)"
                                : ""}
                        </h2>
                        <p className="mt-1 text-sm text-slate-600">
                            {selected.rating
                                ? `${selected.rating} stars · ${selected.review_count} reviews`
                                : ""}
                            {selected.price ? ` · ${selected.price}` : ""}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                            {[
                                ...new Set(
                                    selected.categories?.map(
                                        (category) => category.title,
                                    ),
                                ),
                            ].join(", ")}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                            {selected.location.display_address.join(", ")}
                        </p>
                        <a
                            href={selected.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-block text-sm text-blue-600 underline"
                        >
                            View on Yelp
                        </a>
                    </article>
                )}
            </section>
        </section>
    );
}
