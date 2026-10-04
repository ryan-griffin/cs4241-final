import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
    title: "cs4241-final",
    description: "Final project for CS4241",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
    return (
        <html lang="en" className={cn("font-sans antialiased", inter.variable)}>
            <body className={cn("bg-background text-foreground")}>
                {children}
            </body>
        </html>
    );
}
