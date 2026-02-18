"use client";

import { trpc } from "@/lib/trpc";
import { AuctionCard } from "@/components/auctions/auction-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function AuctionsPage() {
    // Mock category filter for now
    const [categoryId, setCategoryId] = useState<string | undefined>(undefined);

    const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
        trpc.auction.getInfinite.useInfiniteQuery(
            {
                limit: 12,
                categoryId: categoryId,
            },
            {
                getNextPageParam: (lastPage) => lastPage.nextCursor,
            }
        );

    return (
        <div className="container mx-auto py-8 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Browse Auctions</h1>
                    <p className="text-muted-foreground">Discover AI assets available for bidding</p>
                </div>
                <div className="flex w-full md:w-auto gap-2">
                    <div className="relative w-full md:w-[300px]">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search auctions..."
                            className="pl-8"
                        />
                    </div>
                    <Button asChild>
                        <Link href="/auctions/create">List Asset</Link>
                    </Button>
                </div>
            </div>

            {/* Categories Mock */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                <Button
                    variant={categoryId === undefined ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCategoryId(undefined)}
                >
                    All
                </Button>
                <Button
                    variant={categoryId === "cat_1" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCategoryId("cat_1")}
                >
                    Micro SaaS
                </Button>
                <Button
                    variant={categoryId === "cat_2" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCategoryId("cat_2")}
                >
                    AI Tools
                </Button>
            </div>

            {/* Grid */}
            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
            ) : (
                <>
                    {data?.pages[0].items.length === 0 ? (
                        <div className="text-center py-20 border border-dashed rounded-lg">
                            <h3 className="text-lg font-semibold">No auctions found</h3>
                            <p className="text-muted-foreground mt-2">Try adjusting your filters or check back later.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {data?.pages.map((page, i) => (
                                <div key={i} className="contents">
                                    {page.items.map((auction) => (
                                        <AuctionCard key={auction.id} auction={auction} />
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Load More */}
                    {hasNextPage && (
                        <div className="flex justify-center pt-8">
                            <Button
                                variant="ghost"
                                onClick={() => fetchNextPage()}
                                disabled={isFetchingNextPage}
                            >
                                {isFetchingNextPage ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Loading...
                                    </>
                                ) : (
                                    "Load More"
                                )}
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
