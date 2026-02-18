import { publicProcedure, router } from "../trpc";
import { z } from "zod";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";

export const userRouter = router({
    register: publicProcedure
        .input(
            z.object({
                name: z.string().min(2),
                email: z.string().email(),
                password: z.string().min(8),
            })
        )
        .mutation(async ({ input }) => {
            const { name, email, password } = input;

            const existingUser = await db.user.findUnique({
                where: { email },
            });

            if (existingUser) {
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "User already exists",
                });
            }

            const hashedPassword = await bcrypt.hash(password, 12);

            const user = await db.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                },
            });

            return {
                id: user.id,
                name: user.name,
                email: user.email,
            };
        }),
});
