import { publicProcedure, router } from "../trpc";
import { userRouter } from "./user";
import { auctionRouter } from "./auction";

export const appRouter = router({
    health: publicProcedure.query(() => {
        return "ok";
    }),
    user: userRouter,
    auction: auctionRouter,
});

export type AppRouter = typeof appRouter;
