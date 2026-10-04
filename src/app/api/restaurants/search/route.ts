import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);

    const location = searchParams.get("location");
    const latitude = searchParams.get("latitude");
    const longitude = searchParams.get("longitude");

    if (!location && (!latitude || !longitude)) {
        return NextResponse.json(
            {
                error: "Please Provide a location or both latitude or longitude,.",
            },
            { status: 400 },
        );
    }

    const params = new URLSearchParams({
        term: "restaurant",
        limit: "50",
        sort_by: "distance",
    });

    if (location) {
        params.set("location", location);
    } else {
        params.set("latitude", latitude!);
        params.set("longitude", longitude!);
        params.set("radius", "5000");
    }
    const response = await fetch(
        `https://api.yelp.com/v3/businesses/search?${params.toString()}`,
        {
            headers: {
                Authorization: `Bearer ${process.env.YELP_API_KEY}`,
                Accept: "application/json",
            },
        },
    );

    if (!response.ok) {
        const error = await response.text();

        return NextResponse.json(
            {
                error: "Yelp API request failed",
                details: error,
            },
            { status: response.status },
        );
    }
    const data = await response.json();
    return NextResponse.json(data);
}
