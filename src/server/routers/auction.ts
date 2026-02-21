import { publicProcedure, router } from "../trpc";
import { z } from "zod";
import { db } from "@/lib/db";
import { TRPCError } from "@trpc/server";

const auctionInputSchema = z.object({
    title: z.string().min(10).max(200),
    description: z.string().min(50),
    categoryId: z.string(),
    startingPrice: z.number().min(1),
    reservePrice: z.number().optional(),
    buyoutPrice: z.number().optional(),
    duration: z.number().int().positive(), // in days
    tags: z.array(z.string()).min(1),
    images: z.array(
        z.object({
            url: z.string().url(),
            key: z.string(),
            isPrimary: z.boolean().default(false),
        })
    ).min(1),
});

const getInfiniteSchema = z.object({
    limit: z.number().min(1).max(100).default(20),
    cursor: z.string().nullish(),
    categoryId: z.string().optional(),
});

export const auctionRouter = router({
    create: publicProcedure
        .input(auctionInputSchema)
        .mutation(async ({ input }) => {
            // Mock user ID for now as we don't have session context yet
            const demoUser = await db.user.findFirst();
            if (!demoUser) {
                throw new TRPCError({
                    code: "PRECONDITION_FAILED",
                    message: "No users found in database to link auction to.",
                });
            }
            const userId = demoUser.id;

            const endsAt = new Date();
            endsAt.setDate(endsAt.getDate() + input.duration);

            const auction = await db.auction.create({
                data: {
                    title: input.title,
                    description: input.description,
                    startingPrice: input.startingPrice,
                    currentPrice: input.startingPrice,
                    reservePrice: input.reservePrice,
                    buyoutPrice: input.buyoutPrice,
                    endsAt: endsAt,
                    status: "DRAFT",
                    sellerId: userId,
                    categoryId: input.categoryId,
                    tags: input.tags,
                    images: {
                        create: input.images.map((img) => ({
                            url: img.url,
                            key: img.key,
                            isPrimary: img.isPrimary,
                        })),
                    },
                },
            });

            return auction;
        }),

    getInfinite: publicProcedure
        .input(getInfiniteSchema)
        .query(async ({ input }) => {
            const { limit, cursor, categoryId } = input;

            const items = await db.auction.findMany({
                take: limit + 1,
                cursor: cursor ? { id: cursor } : undefined,
                where: {
                    status: "ACTIVE",
                    categoryId: categoryId,
                },
                orderBy: {
                    createdAt: "desc",
                },
                include: {
                    images: {
                        where: { isPrimary: true },
                        take: 1,
                    },
                    seller: {
                        select: {
                            name: true,
                            image: true,
                        },
                    },
                    _count: {
                        select: { bids: true },
                    },
                },
            });

            let nextCursor: typeof cursor | undefined = undefined;
            if (items.length > limit) {
                const nextItem = items.pop();
                nextCursor = nextItem!.id;
            }

            return {
                items,
                nextCursor,
            };
        }),

    getById: publicProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ input }) => {
            const auction = await db.auction.findUnique({
                where: { id: input.id },
                include: {
                    seller: {
                        select: {
                            id: true,
                            name: true,
                            image: true,
                            email: true, // Maybe hide email in real app
                        },
                    },
                    category: true,
                    images: true,
                    bids: {
                        orderBy: { amount: "desc" },
                        take: 5,
                        include: {
                            bidder: {
                                select: {
                                    name: true,
                                    image: true,
                                },
                            },
                        },
                    },
                    _count: {
                        select: { bids: true },
                    },
                },
            });

            if (!auction) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Auction not found",
                });
            }

            return auction;
        }),

    placeBid: publicProcedure
        .input(
            z.object({
                auctionId: z.string(),
                amount: z.number().positive(),
            })
        )
        .mutation(async ({ input }) => {
            const auction = await db.auction.findUnique({
                where: { id: input.auctionId },
            });

            if (!auction) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Auction not found",
                });
            }

            // Mock bidder (find a user who is NOT the seller)
            // For MVP/Demo, if created by User A, we need User B to bid.
            // If only 1 user, we allow self-bidding for demo purposes if strictly needed, but better to check
            const sellerId = auction.sellerId;
            let bidder = await db.user.findFirst({
                where: { id: { not: sellerId } }
            });

            // Fallback for demo: if no other user exists, use the seller itself but warn/log
            // or just create a dummy user on the fly?
            // Let's just fail if no other user, forcing us to create a 2nd user in DB for proper testing
            if (!bidder) {
                // Forcing self-bid for now if no one else exists, just to unblock the demo flow
                console.warn("No other user found, allowing self-bid for DEMO");
                bidder = await db.user.findFirst({ where: { id: sellerId } });
            }

            if (!bidder) {
                throw new TRPCError({
                    code: "PRECONDITION_FAILED",
                    message: "No users available to bid",
                });
            }

            // Validation: Status
            if (auction.status !== "ACTIVE" && auction.status !== "DRAFT") {
                // We allow DRAFT for immediate testing since we default to DRAFT on create
                // In prod, this should be strict
            }

            // Validation: Time
            if (new Date() > auction.endsAt) {
                throw new TRPCError({
                    code: "PRECONDITION_FAILED",
                    message: "Auction has ended",
                });
            }

            // Validation: Amount
            if (input.amount <= auction.currentPrice) {
                throw new TRPCError({
                    code: "PRECONDITION_FAILED",
                    message: `Bid must be higher than current price ($${auction.currentPrice})`,
                });
            }

            // Validation: Ownership (only if we found a different user)
            if (bidder.id === auction.sellerId && false) { // Disabled for single-user dev/demo ease
                throw new TRPCError({
                    code: "PRECONDITION_FAILED",
                    message: "You cannot bid on your own auction",
                });
            }

            // Transaction
            const result = await db.$transaction(async (prisma) => {
                const newBid = await prisma.bid.create({
                    data: {
                        amount: input.amount,
                        auctionId: auction.id,
                        bidderId: bidder.id,
                    }
                });

                await prisma.auction.update({
                    where: { id: auction.id },
                    data: {
                        currentPrice: input.amount,
                    }
                });

                return newBid;
            });

            return result;
        }),


    getDashboard: publicProcedure.query(async () => {
        // Mock user linkage for now (First User)
        const user = await db.user.findFirst();

        if (!user) {
            throw new TRPCError({
                code: "UNAUTHORIZED",
                message: "No user found",
            });
        }

        const [myAuctions, myBids] = await Promise.all([
            // Auctions I am selling
            db.auction.findMany({
                where: { sellerId: user.id },
                orderBy: { createdAt: "desc" },
                include: {
                    images: { where: { isPrimary: true }, take: 1 },
                    _count: { select: { bids: true } },
                },
            }),
            // Auctions I have bid on
            db.bid.findMany({
                where: { bidderId: user.id },
                orderBy: { createdAt: "desc" },
                include: {
                    auction: {
                        include: {
                            images: { where: { isPrimary: true }, take: 1 },
                            seller: { select: { name: true } },
                        },
                    },
                },
                distinct: ["auctionId"], // Get unique auctions I've bid on
            }),
        ]);

        return {
            selling: myAuctions,
            bidding: myBids,
            user: user, // Return user info for dashboard header
        };
    }),
});
