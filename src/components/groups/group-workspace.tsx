"use client";

import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { GroupCardHeader } from "@/components/groups/group-card-header";
import { GroupStatusBadge } from "@/components/groups/group-status-badge";
import { type Restaurant, RestaurantMap } from "@/components/restaurantMap";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    type AuthResult,
    addMember,
    calculateResults,
    completeVoting,
    deleteGroup,
    type Group,
    getGroup,
    groupToVoting,
    type RestaurantInput,
    type Result,
    rateRestaurant,
    removeMember,
    renameGroup,
    setGroupRestaurants,
} from "@/lib/auth-actions";
import { GroupActions } from "./group-actions";
import { GroupMembers } from "./group-members";
import { GroupRestaurants } from "./group-restaurants";
import { GroupResults } from "./group-results";
import { RestaurantRatingList } from "./restaurant-rating-list";

function toRestaurantInput(restaurant: Restaurant): RestaurantInput {
    return {
        yelpID: restaurant.id,
        name: restaurant.name,
        imageUrl: restaurant.image_url ?? null,
        address: restaurant.location.display_address.join(", "),
        latitude: restaurant.coordinates.latitude,
        longitude: restaurant.coordinates.longitude,
        price: restaurant.price ?? null,
        YelpRating: restaurant.rating ?? 0,
        yelpURL: restaurant.url,
    };
}

export function GroupWorkspace({
    initialGroup,
    initialResults,
    initialError,
    user,
}: {
    initialGroup: Group;
    initialResults: Result[] | null;
    initialError: string;
    user: string;
}) {
    const router = useRouter();
    const [lastServerGroup, setLastServerGroup] = useState(initialGroup);
    const [group, setGroup] = useState(initialGroup);
    const [name, setName] = useState(initialGroup.name);
    const [error, setError] = useState(initialError);
    const [busy, setBusy] = useState(false);
    const [savingName, setSavingName] = useState(false);
    const [results, setResults] = useState<Result[] | null>(initialResults);
    const [calculating, setCalculating] = useState(false);
    const [nearbyRestaurants, setNearbyRestaurants] = useState<Restaurant[]>(
        [],
    );

    if (initialGroup !== lastServerGroup) {
        setLastServerGroup(initialGroup);
        setGroup(initialGroup);
        setResults(initialResults);
        setError(initialError);
        if (name === lastServerGroup.name) setName(initialGroup.name);
    }

    const isOwner = user === group.ownerId;
    const isDraft = group.status === "DRAFT";
    const canSelectRestaurants = isOwner && isDraft;

    async function refreshGroup(completedResults?: Result[]) {
        const updated = await getGroup(group.id);
        if (!updated) {
            router.replace("/");
            router.refresh();
            return;
        }
        setGroup(updated);
        if (updated.status === "COMPLETE") {
            if (completedResults !== undefined) {
                setResults(completedResults);
            } else {
                const outcome = await calculateResults(updated.id);
                if ("error" in outcome) {
                    setError(outcome.error);
                } else {
                    setResults(outcome.results);
                }
            }
        } else {
            setResults(null);
        }
        router.refresh();
    }

    async function runAction(
        action: () => Promise<AuthResult>,
        failureMessage: string,
        returnToGroups = false,
    ) {
        if (busy) return;
        setBusy(true);
        setError("");
        try {
            const result = await action();
            if (result?.error) {
                setError(result.error);
                return;
            }
            if (returnToGroups) {
                router.replace("/");
                router.refresh();
            } else {
                await refreshGroup();
            }
        } catch {
            setError(failureMessage);
        } finally {
            setBusy(false);
        }
    }

    async function saveName(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!name.trim() || name.trim() === group.name) return;
        setSavingName(true);
        try {
            await runAction(
                () => renameGroup(group.id, name),
                "Unable to rename the group.",
            );
        } finally {
            setSavingName(false);
        }
    }

    async function finishVoting() {
        if (calculating) return;
        setCalculating(true);
        setError("");
        try {
            const result = await completeVoting(group.id);
            if ("error" in result) {
                await refreshGroup();
                setError(result.error);
                return;
            }
            await refreshGroup(result.results);
        } catch {
            setError("Unable to calculate results.");
        } finally {
            setCalculating(false);
        }
    }

    async function saveRestaurants(
        selectedIds: Set<string>,
    ): Promise<string | null> {
        if (busy) return "A group update is already in progress.";
        setBusy(true);
        try {
            const result = await setGroupRestaurants(
                group.id,
                [...selectedIds],
                nearbyRestaurants
                    .filter((restaurant) => selectedIds.has(restaurant.id))
                    .map(toRestaurantInput),
            );
            if (result?.error) return result.error;
            await refreshGroup();
            return null;
        } catch {
            return "Unable to save restaurant selection.";
        } finally {
            setBusy(false);
        }
    }

    const selectedRestaurants: Restaurant[] = group.restaurants.flatMap(
        (restaurant) => {
            if (
                restaurant.latitude === null ||
                restaurant.longitude === null ||
                !Number.isFinite(restaurant.latitude) ||
                !Number.isFinite(restaurant.longitude)
            ) {
                return [];
            }
            return [
                {
                    id: restaurant.yelpID,
                    name: restaurant.name,
                    coordinates: {
                        latitude: restaurant.latitude,
                        longitude: restaurant.longitude,
                    },
                    image_url: restaurant.imageUrl ?? undefined,
                    rating: restaurant.YelpRating,
                    price: restaurant.price ?? undefined,
                    url: restaurant.yelpURL ?? "",
                    location: {
                        display_address: restaurant.address
                            ? [restaurant.address]
                            : [],
                    },
                },
            ];
        },
    );

    return (
        <main className="flex min-h-dvh flex-col gap-6 p-6 lg:h-dvh lg:overflow-hidden">
            <header className="shrink-0 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 basis-64 space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                            <Link
                                href="/"
                                aria-label="Back to groups"
                                title="Back to groups"
                                className={buttonVariants({
                                    variant: "ghost",
                                    size: "icon-sm",
                                })}
                            >
                                <HugeiconsIcon
                                    icon={ArrowLeft01Icon}
                                    strokeWidth={2}
                                    aria-hidden="true"
                                />
                            </Link>
                            <h1 className="text-3xl font-semibold wrap-break-word">
                                {group.name}
                            </h1>
                            <GroupStatusBadge status={group.status} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {group.members.length} members · Owned by{" "}
                            {group.ownerId}
                        </p>
                    </div>
                    <fieldset
                        disabled={busy || calculating}
                        className="relative ml-auto flex max-w-full flex-wrap items-center justify-end gap-2"
                        aria-busy={busy || calculating}
                    >
                        <legend className="sr-only">Group actions</legend>
                        <GroupActions
                            group={group}
                            user={user}
                            calculating={calculating}
                            onCompleteVoting={finishVoting}
                            onLeaveMember={() =>
                                runAction(
                                    () => removeMember(group.id, user),
                                    "Unable to leave the group.",
                                    true,
                                )
                            }
                            onMoveToVoting={() =>
                                runAction(
                                    () => groupToVoting(group.id),
                                    "Unable to start voting.",
                                )
                            }
                            onDelete={() =>
                                runAction(
                                    () => deleteGroup(group.id),
                                    "Unable to delete the group.",
                                    true,
                                )
                            }
                        />
                    </fieldset>
                </div>
            </header>
            {error && (
                <Alert variant="destructive" className="shrink-0">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            <fieldset
                disabled={busy || calculating}
                className="min-w-0 lg:min-h-0 lg:flex-1"
            >
                <legend className="sr-only">Manage {group.name}</legend>
                <div className="grid items-start gap-6 lg:h-full lg:min-h-0 lg:grid-cols-2">
                    <div className="flex min-w-0 flex-col gap-6 lg:h-full lg:min-h-0">
                        <Card className="shrink-0">
                            <CardContent>
                                <GroupCardHeader>Group details</GroupCardHeader>
                                <div className="space-y-6">
                                    {isOwner && (
                                        <form
                                            onSubmit={saveName}
                                            className="space-y-2"
                                        >
                                            <Label htmlFor="edit-group-name">
                                                Group name
                                            </Label>
                                            <div className="flex flex-wrap gap-2">
                                                <Input
                                                    id="edit-group-name"
                                                    className="min-w-40 flex-1"
                                                    maxLength={60}
                                                    required
                                                    value={name}
                                                    onChange={(event) =>
                                                        setName(
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                                <Button
                                                    type="submit"
                                                    variant="outline"
                                                    className="min-w-24"
                                                    aria-busy={savingName}
                                                    disabled={
                                                        !name.trim() ||
                                                        name.trim() ===
                                                            group.name
                                                    }
                                                >
                                                    {savingName
                                                        ? "Saving..."
                                                        : "Save name"}
                                                </Button>
                                            </div>
                                        </form>
                                    )}
                                    <GroupMembers
                                        groupId={group.id}
                                        members={group.members}
                                        ownerId={group.ownerId}
                                        user={user}
                                        onRemoveMember={(username) =>
                                            runAction(
                                                () =>
                                                    removeMember(
                                                        group.id,
                                                        username,
                                                    ),
                                                "Unable to remove the member.",
                                                username === user,
                                            )
                                        }
                                        onPickMember={(username) =>
                                            runAction(
                                                () =>
                                                    addMember(
                                                        group.id,
                                                        username,
                                                    ),
                                                "Unable to add the member.",
                                            )
                                        }
                                    />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="relative z-0 isolate min-h-130 lg:min-h-0 lg:flex-1">
                            <CardContent className="flex min-h-0 flex-1 flex-col">
                                <GroupCardHeader>
                                    {isDraft
                                        ? "Nearby restaurants"
                                        : "Selected restaurants"}
                                </GroupCardHeader>
                                <RestaurantMap
                                    fillHeight
                                    key={isDraft ? "nearby" : "selected"}
                                    restaurants={
                                        isDraft
                                            ? undefined
                                            : selectedRestaurants
                                    }
                                    onRestaurantsLoaded={
                                        isDraft
                                            ? setNearbyRestaurants
                                            : undefined
                                    }
                                />
                                {!isDraft &&
                                    selectedRestaurants.length <
                                        group.restaurants.length && (
                                        <p className="mt-2 text-sm text-muted-foreground">
                                            Some selected restaurants have no
                                            coordinates and appear only in the
                                            restaurant list.
                                        </p>
                                    )}
                            </CardContent>
                        </Card>
                    </div>
                    <div className="flex min-h-0 min-w-0 flex-col gap-6 lg:h-full">
                        {results !== null && <GroupResults results={results} />}
                        <Card
                            className={
                                results !== null ? "min-h-0 flex-1" : "min-h-0"
                            }
                        >
                            <CardContent className="flex min-h-0 flex-1 flex-col">
                                {group.status === "VOTING" ? (
                                    <RestaurantRatingList
                                        groupId={group.id}
                                        restaurants={group.restaurants}
                                        onRate={(restaurantId, score) =>
                                            runAction(
                                                () =>
                                                    rateRestaurant(
                                                        group.id,
                                                        restaurantId,
                                                        score,
                                                    ),
                                                "Unable to save your rating.",
                                            )
                                        }
                                    />
                                ) : (
                                    <GroupRestaurants
                                        key={group.status}
                                        restaurants={group.restaurants}
                                        nearbyRestaurants={nearbyRestaurants}
                                        onSave={
                                            canSelectRestaurants
                                                ? saveRestaurants
                                                : undefined
                                        }
                                    />
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </fieldset>
        </main>
    );
}
