"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    type Group,
    getGroups,
    logout,
    rateRestaurant,
} from "@/lib/auth-actions";

export default function VotingPage() {
    const [groups, setGroups] = useState<Group[]>([]);
    const [openGroupId, setOpenGroupId] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [savingRating, setSavingRating] = useState<string | null>(null);

    useEffect(() => {
        let isActive = true;

        getGroups()
            .then((loadedGroups) => {
                if (isActive) {
                    setGroups(loadedGroups);
                }
            })
            .catch(() => {
                if (isActive) {
                    setError("unable to load groups");
                }
            });

        return () => {
            isActive = false;
        };
    }, []);

    async function saveRating(
        groupId: string,
        restaurantId: string,
        score: number,
    ) {
        const key = `${groupId}:${restaurantId}`;
        setSavingRating(key);
        setError("");
        try {
            const result = await rateRestaurant(groupId, restaurantId, score);
            if (result?.error) {
                setError(result.error);
                return;
            }
            setGroups((currentGroups) =>
                currentGroups.map((group) =>
                    group.id === groupId
                        ? {
                              ...group,
                              restaurants: group.restaurants.map(
                                  (restaurant) =>
                                      restaurant.id === restaurantId
                                          ? { ...restaurant, userRating: score }
                                          : restaurant,
                              ),
                          }
                        : group,
                ),
            );
        } catch {
            setError("unable to save your rating");
        } finally {
            setSavingRating(null);
        }
    }

    return (
        <main>
            <div className="border-b border-gray-200 mb-4 flex justify-between items-center flex-wrap gap-2">
                <div className="flex items-center gap-2">
                    <Link href="/">
                        <Button
                            className="mt-2 mr-2 mb-2 ml-2"
                            variant="outline"
                        >
                            Home
                        </Button>
                    </Link>
                </div>
                <form action={logout}>
                    <Button
                        type="submit"
                        variant="outline"
                        className="border rounded px-2 py-1 mt-2 ml-2 mr-2 border-gray-300"
                    >
                        Log Out
                    </Button>
                </form>
            </div>
            <div className="grid gap-6 p-4 lg:grid-cols-2">
                <ul className="flex flex-row flex-wrap content-start gap-2 mt-2 ml-2">
                    {groups
                        .filter((group) => group.status === "VOTING")
                        .map((group) => (
                            <li key={group.id}>
                                <Button
                                    variant="outline"
                                    className="flex flex-col items-start justify-between w-full h-auto min-h-[140px] rounded-xl bg-white p-5 text-black shadow-sm text-left align-top"
                                    onClick={() => setOpenGroupId(group.id)}
                                >
                                    <div className="w-full">
                                        <h3 className="font-semibold text-lg">
                                            {group.name}
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            {group.members?.length} members
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-gray-600">
                                            {group.members?.join(", ")}
                                        </p>
                                    </div>
                                </Button>
                            </li>
                        ))}
                </ul>
            </div>
            {error && !openGroupId && (
                <p className="mx-4 text-sm text-red-600" role="alert">
                    {error}
                </p>
            )}
            {groups.map(
                (group) =>
                    openGroupId === group.id && (
                        <div
                            key={group.id}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
                        >
                            <section
                                className="relative w-full max-w-2xl rounded-lg bg-white p-6 text-black shadow-xl"
                                role="dialog"
                            >
                                <div className="flex items-center justify-between border-b pb-4 mb-4">
                                    <h2 className="text-xl font-bold">
                                        {group.name}
                                    </h2>
                                    <Button
                                        variant="secondary"
                                        onClick={() => setOpenGroupId(null)}
                                    >
                                        Close
                                    </Button>
                                </div>
                                {error && (
                                    <p
                                        className="mb-3 text-sm text-red-600"
                                        role="alert"
                                    >
                                        {error}
                                    </p>
                                )}
                                <h3 className="mb-3 text-lg font-semibold">
                                    Rate the selected restaurants
                                </h3>
                                <div className="max-h-[70vh] space-y-3 overflow-y-auto">
                                    {group.restaurants.length > 0 ? (
                                        group.restaurants.map((restaurant) => {
                                            const ratingKey = `${group.id}:${restaurant.id}`;
                                            return (
                                                <article
                                                    key={restaurant.id}
                                                    className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-3"
                                                >
                                                    <div className="flex min-w-0 items-center gap-3">
                                                        {restaurant.imageUrl && (
                                                            <img
                                                                src={
                                                                    restaurant.imageUrl
                                                                }
                                                                alt=""
                                                                className="h-16 w-16 rounded-lg object-cover"
                                                            />
                                                        )}
                                                        <div className="min-w-0">
                                                            <h4 className="font-medium">
                                                                {
                                                                    restaurant.name
                                                                }
                                                            </h4>
                                                            <p className="text-sm text-gray-600">
                                                                {restaurant.YelpRating >
                                                                    0 &&
                                                                    `⭐ ${restaurant.YelpRating}`}
                                                                {restaurant.price &&
                                                                    ` · ${restaurant.price}`}
                                                            </p>
                                                            {restaurant.address && (
                                                                <p className="text-sm text-gray-500">
                                                                    {
                                                                        restaurant.address
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <fieldset
                                                        disabled={
                                                            savingRating ===
                                                            ratingKey
                                                        }
                                                        className="flex items-center gap-2"
                                                    >
                                                        <legend className="sr-only">
                                                            Rate{" "}
                                                            {restaurant.name}
                                                        </legend>
                                                        {[1, 2, 3, 4, 5].map(
                                                            (score) => (
                                                                <label
                                                                    key={score}
                                                                    className="flex cursor-pointer items-center gap-1 text-sm"
                                                                >
                                                                    <input
                                                                        type="radio"
                                                                        name={`rating-${group.id}-${restaurant.id}`}
                                                                        value={
                                                                            score
                                                                        }
                                                                        checked={
                                                                            restaurant.userRating ===
                                                                            score
                                                                        }
                                                                        onChange={() =>
                                                                            saveRating(
                                                                                group.id,
                                                                                restaurant.id,
                                                                                score,
                                                                            )
                                                                        }
                                                                    />
                                                                    {score}
                                                                </label>
                                                            ),
                                                        )}
                                                    </fieldset>
                                                </article>
                                            );
                                        })
                                    ) : (
                                        <p className="text-sm text-gray-600">
                                            No restaurants have been selected
                                            for this group.
                                        </p>
                                    )}
                                </div>
                            </section>
                        </div>
                    ),
            )}
        </main>
    );
}
