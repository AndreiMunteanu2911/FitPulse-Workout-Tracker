import type {Metadata} from "next";
import "@/app/globals.css";
import Navbar from "@/components/Navbar";

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
       <body className={`antialiased min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)] overflow-x-hidden`}>
         <div className="flex min-h-screen w-full">
             <Navbar />
            <main className="flex-1 min-h-screen p-4 md:p-8 page-shell bg-white text-[var(--color-foreground)] pb-16 md:pb-0">
                {children}
            </main>
        </div>
        </body>
        </html>
    );
}
