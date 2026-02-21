"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShieldCheck, User } from "lucide-react";

export function Header() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center">
                <div className="mr-4 hidden md:flex">
                    <Link href="/" className="mr-6 flex items-center space-x-2">
                        <ShieldCheck className="h-6 w-6" />
                        <span className="hidden font-bold sm:inline-block">
                            AI Forge
                        </span>
                    </Link>
                    <nav className="flex items-center space-x-6 text-sm font-medium">
                        <Link
                            href="/auctions"
                            className={isActive("/auctions") ? "text-foreground" : "text-foreground/60 transition-colors hover:text-foreground"}
                        >
                            Browse
                        </Link>
                        <Link
                            href="/auctions/create"
                            className={isActive("/auctions/create") ? "text-foreground" : "text-foreground/60 transition-colors hover:text-foreground"}
                        >
                            Sell
                        </Link>
                        <Link
                            href="/dashboard"
                            className={isActive("/dashboard") ? "text-foreground" : "text-foreground/60 transition-colors hover:text-foreground"}
                        >
                            Dashboard
                        </Link>
                    </nav>
                </div>

                <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                    <div className="w-full flex-1 md:w-auto md:flex-none">
                        {/* Search could go here */}
                    </div>
                    <nav className="flex items-center">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/dashboard">
                                <User className="h-5 w-5" />
                                <span className="sr-only">Toggle user menu</span>
                            </Link>
                        </Button>
                    </nav>
                </div>
            </div>
        </header>
    );
}
