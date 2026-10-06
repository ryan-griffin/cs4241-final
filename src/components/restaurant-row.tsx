import { ArrowUpRight01Icon, Store01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import type { ReactNode } from "react";
import type { Restaurant } from "@/components/restaurantMap";
import { Card } from "@/components/ui/card";

export type RestaurantSummary = {
    name: string;
    imageUrl?: string | null;
    address?: string | null;
    price?: string | null;
    YelpRating?: number;
    yelpURL?: string | null;
    categories?: string[];
    reviewCount?: number;
    isOpenNow?: boolean;
};

export function toRestaurantSummary(restaurant: Restaurant): RestaurantSummary {
    return {
        name: restaurant.name,
        imageUrl: restaurant.image_url,
        address: restaurant.location.display_address.join(", "),
        price: restaurant.price,
        YelpRating: restaurant.rating,
        yelpURL: restaurant.url,
        categories: [
            ...new Set(
                restaurant.categories?.map((category) => category.title),
            ),
        ],
        reviewCount: restaurant.review_count,
        isOpenNow: restaurant.business_hours?.[0]?.is_open_now,
    };
}

export function RestaurantDetails({
    restaurant,
    rank,
}: {
    restaurant: RestaurantSummary;
    rank?: number;
}) {
    const metadata = [
        restaurant.YelpRating && restaurant.YelpRating > 0
            ? `⭐ ${restaurant.YelpRating}`
            : null,
        restaurant.price,
        restaurant.reviewCount !== undefined
            ? `${restaurant.reviewCount} reviews`
            : null,
    ]
        .filter(Boolean)
        .join(" · ");
    const yelpURL =
        restaurant.yelpURL ||
        `https://www.yelp.com/search?${new URLSearchParams({ find_desc: restaurant.name, find_loc: restaurant.address ?? "" })}`;

    return (
        <div className="flex min-w-0 items-start gap-3">
            {restaurant.imageUrl ? (
                <Image
                    src={restaurant.imageUrl}
                    width={64}
                    height={64}
                    unoptimized
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-lg object-cover"
                />
            ) : (
                <div
                    className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
                    aria-hidden="true"
                >
                    <HugeiconsIcon
                        icon={Store01Icon}
                        className="size-6"
                        strokeWidth={1.5}
                    />
                </div>
            )}
            <div className="min-w-0 flex-1 space-y-1 break-words">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3 className="font-medium">
                        {rank !== undefined && `${rank}. `}
                        {restaurant.name}
                    </h3>
                    <a
                        href={yelpURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
                    >
                        View on Yelp
                        <HugeiconsIcon
                            icon={ArrowUpRight01Icon}
                            className="size-3"
                            strokeWidth={2}
                            aria-hidden="true"
                        />
                    </a>
                </div>
                {restaurant.categories && restaurant.categories.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                        {restaurant.categories.join(", ")}
                    </p>
                )}
                {(metadata || restaurant.isOpenNow !== undefined) && (
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                        {metadata && (
                            <p className="text-muted-foreground">{metadata}</p>
                        )}
                        {restaurant.isOpenNow !== undefined && (
                            <span
                                className={
                                    restaurant.isOpenNow
                                        ? "text-primary"
                                        : "text-destructive"
                                }
                            >
                                {restaurant.isOpenNow
                                    ? "Open now"
                                    : "Closed now"}
                            </span>
                        )}
                    </div>
                )}
                {restaurant.address && (
                    <p className="text-sm text-muted-foreground">
                        {restaurant.address}
                    </p>
                )}
            </div>
        </div>
    );
}

export function RestaurantRow({
    restaurant,
    rank,
    children,
}: {
    restaurant: RestaurantSummary;
    rank?: number;
    children?: ReactNode;
}) {
    return (
        <div className="@container">
            <Card
                className={`grid grid-cols-1 items-center gap-3 p-3 ring-inset ${children ? "@min-[420px]:grid-cols-[minmax(0,1fr)_auto]" : ""}`}
            >
                <RestaurantDetails restaurant={restaurant} rank={rank} />
                {children && <div className="justify-self-end">{children}</div>}
            </Card>
        </div>
    );
}
