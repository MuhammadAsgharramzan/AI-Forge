import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Tag } from "lucide-react";
// import { type RouterOutputs } from "@/lib/trpc"; // If needed for types

// Mock type for MVP until we have router outputs exported or shared types
type AuctionItem = {
    id: string;
    title: string;
    currentPrice: number;
    description: string;
    endsAt: Date | string;
    status: string;
    images: { url: string; isPrimary: boolean }[];
    _count?: { bids: number };
    seller?: { name: string | null; image: string | null };
};

interface AuctionCardProps {
    auction: AuctionItem;
}

export function AuctionCard({ auction }: AuctionCardProps) {
    const primaryImage = auction.images.find((img) => img.isPrimary) || auction.images[0];
    const timeLeft = formatDistanceToNow(new Date(auction.endsAt), { addSuffix: true });
    const isEnded = new Date(auction.endsAt) < new Date();

    return (
        <Card className="overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
            <div className="relative aspect-video w-full bg-muted">
                {primaryImage ? (
                    <Image
                        src={primaryImage.url}
                        alt={auction.title}
                        fill
                        className="object-cover transition-transform hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                        No Image
                    </div>
                )}
                <div className="absolute top-2 right-2">
                    <Badge variant={isEnded ? "secondary" : "default"}>
                        {isEnded ? "Ended" : "Active"}
                    </Badge>
                </div>
            </div>

            <CardHeader className="p-4 pb-2">
                <CardTitle className="line-clamp-1 text-lg">
                    <Link href={`/auctions/${auction.id}`} className="hover:underline">
                        {auction.title}
                    </Link>
                </CardTitle>
            </CardHeader>

            <CardContent className="p-4 pt-0 flex-1">
                <p className="line-clamp-2 text-sm text-muted-foreground mb-4">
                    {auction.description}
                </p>

                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-muted-foreground">
                        <Clock className="mr-1 h-4 w-4" />
                        <span>{timeLeft}</span>
                    </div>
                    <div className="font-semibold text-primary">
                        ${auction.currentPrice.toLocaleString()}
                    </div>
                </div>
            </CardContent>

            <CardFooter className="p-4 border-t bg-muted/50 flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                    {auction._count?.bids || 0} Bids
                </div>
                <Button asChild size="sm" variant="outline">
                    <Link href={`/auctions/${auction.id}`}>
                        View Auction
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
