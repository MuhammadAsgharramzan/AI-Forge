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
});
