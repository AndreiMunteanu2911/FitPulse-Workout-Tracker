import Link from "next/link";
import Button from "@/components/Button";

export default function LandingPage() {
    return (
        <div className="w-full text-white">
            <div className="text-3xl font-semibold mb-6">Welcome</div>
            <div className="flex flex-col gap-3">
                <Link href="/signup">
                    <Button className="w-full" variant="secondary">Sign Up</Button>
                </Link>
                <Link href="/login">
                    <Button className="w-full" variant="primary">Log In</Button>
                </Link>
            </div>
        </div>
    );
}
