import { GroupCardHeader } from "@/components/groups/group-card-header";
import { RestaurantRow } from "@/components/restaurant-row";
import { Card, CardContent } from "@/components/ui/card";
import type { Result } from "@/lib/auth-actions";

export function GroupResults({ results }: { results: Result[] }) {
    return (
        <section
            aria-labelledby="results-title"
            className="flex min-h-0 flex-1 flex-col"
        >
            <Card className="min-h-0 flex-1">
                <CardContent className="flex min-h-0 flex-1 flex-col">
                    <GroupCardHeader id="results-title">
                        Top restaurants
                    </GroupCardHeader>
                    {results.length > 0 ? (
                        <ol className="min-h-0 flex-1 space-y-2 p-1 lg:overflow-y-auto lg:overscroll-contain">
                            {results.map((restaurant) => (
                                <li key={restaurant.restaurantId}>
                                    <RestaurantRow
                                        restaurant={restaurant}
                                        rank={restaurant.place}
                                    >
                                        <p className="whitespace-nowrap text-sm font-medium">
                                            {restaurant.points} points
                                        </p>
                                    </RestaurantRow>
                                </li>
                            ))}
                        </ol>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            No restaurants have eligible votes yet.
                        </p>
                    )}
                </CardContent>
            </Card>
        </section>
    );
}
