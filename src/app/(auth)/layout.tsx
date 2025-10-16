import type {Metadata} from "next";
import {Geist, Geist_Mono} from "next/font/google";
import "@/app/globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Workout Tracker",
    description: "Track your workouts and progress with ease.",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}>
        <div className="min-h-screen w-full flex items-center justify-center bg-[var(--primary-700)] text-white">
            <main className="w-full max-w-md p-6 md:p-8">
                {children}
            </main>
        </div>
        </body>


        </html>
    );
}
