import { GroupCardHeader } from "@/components/groups/group-card-header";
import { RestaurantRow } from "@/components/restaurant-row";
import type { Group } from "@/lib/auth-actions";

const ratingLabels: Record<number, string> = {
    1: "Won't go",
    2: "Don't want but would go",
    3: "Neutral",
    4: "Want",
    5: "Top choice",
};

type Props = {
    groupId: string;
    restaurants: Group["restaurants"];
    onRate: (restaurantId: string, score: number) => void;
};

export function RestaurantRatingList({ groupId, restaurants, onRate }: Props) {
    return (
        <section className="flex min-h-0 flex-1 flex-col">
            <GroupCardHeader>Selected restaurants</GroupCardHeader>
            <div className="mb-4 flex shrink-0 flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {[1, 2, 3, 4, 5].map((score) => (
                    <span key={score} className="whitespace-nowrap">
                        {score} = {ratingLabels[score]}
                    </span>
                ))}
            </div>
            <div className="min-h-0 flex-1 space-y-3 lg:overflow-y-auto lg:overscroll-contain">
                {restaurants.length > 0 ? (
                    restaurants.map((restaurant) => (
                        <RestaurantRow
                            key={restaurant.id}
                            restaurant={restaurant}
                        >
                            <fieldset className="relative flex items-center gap-2">
                                <legend className="sr-only">
                                    Rate {restaurant.name}
                                </legend>
                                {[1, 2, 3, 4, 5].map((score) => (
                                    <label
                                        key={score}
                                        className="flex cursor-pointer items-center gap-1 text-sm"
                                        title={ratingLabels[score]}
                                    >
                                        <input
                                            type="radio"
                                            name={`rating-${groupId}-${restaurant.id}`}
                                            value={score}
                                            checked={
                                                restaurant.userRating === score
                                            }
                                            aria-label={`${score} - ${ratingLabels[score]}`}
                                            onChange={() =>
                                                onRate(restaurant.id, score)
                                            }
                                        />
                                        <span>{score}</span>
                                    </label>
                                ))}
                            </fieldset>
                        </RestaurantRow>
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground">
                        No restaurants have been selected for this group.
                    </p>
                )}
            </div>
        </section>
    );
}
