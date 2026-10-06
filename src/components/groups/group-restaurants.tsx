import { useState } from "react";
import { GroupCardHeader } from "@/components/groups/group-card-header";
import {
    RestaurantRow,
    type RestaurantSummary,
    toRestaurantSummary,
} from "@/components/restaurant-row";
import type { Restaurant } from "@/components/restaurantMap";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { Group } from "@/lib/auth-actions";

type Props = {
    restaurants: Group["restaurants"];
    nearbyRestaurants: Restaurant[];
    onSave?: (selectedIds: Set<string>) => Promise<string | null>;
};

export function GroupRestaurants({
    restaurants,
    nearbyRestaurants,
    onSave,
}: Props) {
    const [editing, setEditing] = useState(false);
    const [pending, setPending] = useState<Set<string>>(new Set());
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const available = new Map<string, RestaurantSummary>(
        restaurants.map((restaurant) => [restaurant.yelpID, restaurant]),
    );
    if (editing) {
        for (const restaurant of nearbyRestaurants) {
            available.set(restaurant.id, toRestaurantSummary(restaurant));
        }
    }

    function edit() {
        setPending(new Set(restaurants.map((restaurant) => restaurant.yelpID)));
        setError(null);
        setEditing(true);
    }

    function toggle(id: string) {
        setPending((current) => {
            const next = new Set(current);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    async function done() {
        if (!onSave || saving) return;
        setSaving(true);
        setError(null);
        try {
            const saveError = await onSave(pending);
            if (saveError) {
                setError(saveError);
            } else {
                setEditing(false);
            }
        } catch {
            setError("Unable to save restaurant selection.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <GroupCardHeader
                action={
                    onSave && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="min-w-20"
                            disabled={saving}
                            aria-busy={saving}
                            onClick={editing ? done : edit}
                        >
                            {saving ? "Saving..." : editing ? "Done" : "Edit"}
                        </Button>
                    )
                }
            >
                Selected restaurants
            </GroupCardHeader>
            {error && (
                <Alert variant="destructive" className="mb-2 shrink-0">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            {available.size > 0 ? (
                <div className="min-h-0 flex-1 space-y-2 p-1 lg:overflow-y-auto lg:overscroll-contain">
                    {[...available].map(([id, restaurant]) => (
                        <RestaurantRow key={id} restaurant={restaurant}>
                            {editing && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={saving}
                                    aria-pressed={pending.has(id)}
                                    onClick={() => toggle(id)}
                                >
                                    {pending.has(id) ? "Unselect" : "Select"}
                                </Button>
                            )}
                        </RestaurantRow>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-muted-foreground">
                    {editing
                        ? "No restaurants available yet."
                        : "No restaurants selected yet."}
                </p>
            )}
        </div>
    );
}
