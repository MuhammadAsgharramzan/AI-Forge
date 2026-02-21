"use client";

import { trpc } from "@/lib/trpc";
import { AuctionCard } from "@/components/auctions/auction-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Gavel, Package } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
    const { data, isLoading, error } = trpc.auction.getDashboard.useQuery();

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto py-20 text-center">
                <h2 className="text-2xl font-bold text-destructive">Error loading dashboard</h2>
                <p className="text-muted-foreground">{error.message}</p>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="container mx-auto py-8 space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">
                    Welcome back, <span className="font-semibold text-foreground">{data.user.name}</span>
                </p>
            </div>

            <Tabs defaultValue="selling" className="w-full">
                <TabsList className="grid w-full max-w-[400px] grid-cols-2">
                    <TabsTrigger value="selling">
                        <Package className="mr-2 h-4 w-4" />
                        Selling ({data.selling.length})
                    </TabsTrigger>
                    <TabsTrigger value="bidding">
                        <Gavel className="mr-2 h-4 w-4" />
                        Bidding ({data.bidding.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="selling" className="mt-6">
                    {data.selling.length === 0 ? (
                        <div className="text-center py-12 border border-dashed rounded-lg bg-muted/10">
                            <h3 className="text-lg font-semibold">You haven't listed any auctions yet</h3>
                            <p className="text-muted-foreground mt-2 mb-4">Start selling your AI assets today.</p>
                            <Button asChild>
                                <Link href="/auctions/create">Create Listing</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {data.selling.map((auction: any) => (
                                <AuctionCard key={auction.id} auction={auction} />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="bidding" className="mt-6">
                    {data.bidding.length === 0 ? (
                        <div className="text-center py-12 border border-dashed rounded-lg bg-muted/10">
                            <h3 className="text-lg font-semibold">No active bids</h3>
                            <p className="text-muted-foreground mt-2 mb-4">Browse auctions and place your first bid.</p>
                            <Button variant="outline" asChild>
                                <Link href="/auctions">Browse Auctions</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {data.bidding.map((bid: any) => (
                                <AuctionCard key={bid.auction.id} auction={bid.auction} />
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
