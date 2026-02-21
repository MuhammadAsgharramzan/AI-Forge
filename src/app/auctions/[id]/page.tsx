"use client";

import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft, Clock, User, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

export default function AuctionDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();
    const { data: session } = useSession();

    // Fetch auction details with polling
    const { data: auction, isLoading, error, refetch } = trpc.auction.getById.useQuery(
        { id },
        { refetchInterval: 5000 }
    );

    // Mutation
    const placeBidMutation = trpc.auction.placeBid.useMutation({
        onSuccess: () => {
            toast.success("Bid placed successfully!");
            setBidAmount("");
            refetch();
        },
        onError: (err) => {
            toast.error(err.message);
        }
    });

    // State
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [bidAmount, setBidAmount] = useState<string>("");

    const handleBid = () => {
        if (!bidAmount) return;
        const amount = parseFloat(bidAmount);
        if (isNaN(amount)) {
            toast.error("Invalid bid amount");
            return;
        }

        placeBidMutation.mutate({
            auctionId: id,
            amount: amount,
        });
    };

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !auction) {
        return (
            <div className="container mx-auto py-20 text-center">
                <h2 className="text-2xl font-bold">Auction not found</h2>
                <Button asChild className="mt-4">
                    <Link href="/auctions">Back to Browse</Link>
                </Button>
            </div>
        );
    }

    const primaryImage = auction.images[selectedImageIndex] || auction.images[0];
    const timeLeft = formatDistanceToNow(new Date(auction.endsAt), { addSuffix: true });
    const isEnded = new Date(auction.endsAt) < new Date();
    const minBid = auction.currentPrice + 1;

    return (
        <div className="container mx-auto py-8 space-y-8">
            <Button variant="ghost" size="sm" asChild className="mb-4">
                <Link href="/auctions">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Auctions
                </Link>
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Gallery & Info */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Gallery */}
                    <div className="space-y-4">
                        <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
                            {primaryImage ? (
                                <Image
                                    src={primaryImage.url}
                                    alt={auction.title}
                                    fill
                                    className="object-cover"
                                    priority
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center text-muted-foreground">
                                    No Image
                                </div>
                            )}
                        </div>
                        {auction.images.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {auction.images.map((img: any, i: number) => (
                                    <button
                                        key={img.id}
                                        className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border-2 ${i === selectedImageIndex ? "border-primary" : "border-transparent"
                                            }`}
                                        onClick={() => setSelectedImageIndex(i)}
                                    >
                                        <Image src={img.url} alt="Thumbnail" fill className="object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Details */}
                    <div className="space-y-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Badge variant="secondary">{auction.category.name}</Badge>
                                {isEnded && <Badge variant="destructive">Ended</Badge>}
                            </div>
                            <h1 className="text-3xl font-bold">{auction.title}</h1>
                            <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <User className="h-4 w-4" />
                                    <span>Selling by <span className="font-semibold text-foreground">{auction.seller.name}</span></span>
                                </div>
                                <span>•</span>
                                <div>Created {new Date(auction.createdAt).toLocaleDateString()}</div>
                            </div>
                        </div>

                        <div className="prose dark:prose-invert max-w-none">
                            <h3>Description</h3>
                            <p className="whitespace-pre-wrap">{auction.description}</p>
                        </div>

                        <div className="border-t pt-4">
                            <h3 className="font-semibold mb-2">Tags</h3>
                            <div className="flex flex-wrap gap-2">
                                {auction.tags.map((tag: string) => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                        #{tag}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Bidding & Seller */}
                <div className="space-y-6">
                    {/* Bidding Card */}
                    <Card className="border-2 border-primary/10 shadow-lg">
                        <CardHeader>
                            <CardTitle>Current Bid</CardTitle>
                            <CardDescription>
                                {auction._count.bids > 0 ? `${auction._count.bids} bids placed` : "No bids yet"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <div className="text-4xl font-bold text-primary">
                                    ${auction.currentPrice.toLocaleString()}
                                </div>
                                <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    <span>Ends {timeLeft}</span>
                                </div>
                            </div>

                            {!isEnded ? (
                                <div className="space-y-4">
                                    <div className="flex gap-2">
                                        <Input
                                            type="number"
                                            placeholder={`Min $${minBid}`}
                                            value={bidAmount}
                                            onChange={(e) => setBidAmount(e.target.value)}
                                            min={minBid}
                                            disabled={placeBidMutation.isPending}
                                        />
                                        <Button onClick={handleBid} disabled={placeBidMutation.isPending}>
                                            {placeBidMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Bid
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground text-center">
                                        Enter ${minBid} or more
                                    </p>
                                </div>
                            ) : (
                                <div className="p-4 bg-muted rounded-md text-center font-medium">
                                    Auction Ended
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Seller Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Seller Information</CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center gap-4">
                            <div className="relative h-12 w-12 rounded-full overflow-hidden bg-muted">
                                {auction.seller.image ? (
                                    <Image src={auction.seller.image} alt={auction.seller.name || "Seller"} fill className="object-cover" />
                                ) : (
                                    <User className="h-6 w-6 m-auto mt-3 text-muted-foreground" />
                                )}
                            </div>
                            <div>
                                <div className="font-semibold flex items-center gap-1">
                                    {auction.seller.name}
                                    <ShieldCheck className="h-3 w-3 text-green-500" />
                                </div>
                                <div className="text-xs text-muted-foreground">Verified Seller</div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Bid History (Simplified) */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Bid History</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {auction.bids.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">No bids history</p>
                            ) : (
                                auction.bids.map((bid: any) => (
                                    <div key={bid.id} className="flex justify-between items-center text-sm border-b last:border-0 pb-2 last:pb-0">
                                        <div className="flex items-center gap-2">
                                            <div className="h-6 w-6 rounded-full bg-muted overflow-hidden relative">
                                                {bid.bidder.image && <Image src={bid.bidder.image} alt="Bidder" fill />}
                                            </div>
                                            <span className="font-medium">{bid.bidder.name || "Anonymous"}</span>
                                        </div>
                                        <div className="text-muted-foreground">
                                            ${bid.amount.toLocaleString()}
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
