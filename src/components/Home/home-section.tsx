import Link from "next/link";

type HomeSectionProps = {
    username?: string;
};

export function HomeSection({ username }: HomeSectionProps) {
    return (
        <section className="w-full">
            <div className="relative grid min-h-screen w-full overflow-hidden bg-[#DDE4D5] lg:grid-cols-2">
                <div className="flex flex-col items-start justify-center px-8 py-16 sm:px-12 lg:px-16">
                    <div className="-mt-24 mb-10">
                        <img
                            src="/logo 2.png"
                            alt="logo"
                            className="mb-1 h-16 w-auto object-contain"
                        />

                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#69765F]">
                            Where2eat
                        </p>
                    </div>

                    <h1 className="max-w-xl text-5xl font-bold leading-[1.05] tracking-tight text-[#26352A] sm:text-6xl lg:text-7xl">
                        Good Food.
                        <br />
                        Better Decisions.
                    </h1>

                    <p className="mt-7 max-w-lg text-base leading-7 text-[#596256] sm:text-lg">
                        Create a group, find restaurants nearby, and let
                        everyone have a say. Decide where to eat together.
                    </p>
                    <div className="mt-10">
                        <Link
                            href={username ? "#dashboard" : "/login"}
                            className="inline-flex h-12 items-center justify-center rounded-full bg-[#26352A] px-8 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#3B4B3D]"
                        >
                            {username ? "Explore your groups" : "Get Started"}
                            <span className="ml-2">→</span>
                        </Link>
                    </div>

                    <p className="mt-6 text-sm text-[#697268]">
                        {username ? (
                            <>
                                Welcome,{" "}
                                <span className="font-semibold text-[#52604E]">
                                    {username}!
                                </span>
                            </>
                        ) : (
                            <>Welcome!</>
                        )}
                    </p>
                </div>

                <div className="relative min-h-[360px] overflow-hidden lg:min-h-full">
                    <img
                        src="/food2.png"
                        alt="Restaurant food"
                        className="absolute inset-0 h-full w-full object-cover"
                    />

                    <div className="absolute inset-y-0 left-0 hidden w-1/3 bg-gradient-to-r from-[#DDE4D5] to-transparent lg:block" />
                </div>

                {username && (
                    <Link
                        href="#dashboard"
                        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 items-center gap-2 text-lg font-medium text-[#69765F] transition hover:text-[#26352A] lg:flex"
                    >
                        <span>Scroll to explore</span>
                        <span className="animate-bounce">↓</span>
                    </Link>
                )}
            </div>
        </section>
    );
}
