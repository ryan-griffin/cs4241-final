import { RestaurantMap } from "@/components/restaurantMap";

export function RestaurantMapCard() {
    return (
        <section className="relative z-0 isolate flex min-h-[520px] flex-col overflow-hidden rounded-3xl border border-[#E4E6DC] bg-white shadow-sm">
            <div className="shrink-0 px-5 pt-4 pb-3">
                <h2 className="text-xl font-semibold text-[#26352A]">
                    Nearby Restaurants
                </h2>
            </div>

            <div className="min-h-0 flex-1 px-5 pb-5">
                <div className="h-full overflow-hidden rounded-2xl">
                    <RestaurantMap fillHeight />
                </div>
            </div>
        </section>
    );
}
