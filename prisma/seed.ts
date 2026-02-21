import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
    console.log("🌱 Seeding database...");

    // --- Seed Categories ---
    const categories = [
        { name: "Micro SaaS", slug: "micro-saas", description: "Small Software-as-a-Service products powered by AI" },
        { name: "AI Tools", slug: "ai-tools", description: "Tools and utilities built with artificial intelligence" },
        { name: "Datasets", slug: "datasets", description: "Curated datasets for training AI models" },
        { name: "AI Models", slug: "ai-models", description: "Pre-trained models ready for deployment" },
        { name: "Chatbots", slug: "chatbots", description: "Conversational AI bots for various use cases" },
        { name: "Automation", slug: "automation", description: "AI-powered automation scripts and workflows" },
    ];

    for (const cat of categories) {
        await db.category.upsert({
            where: { slug: cat.slug },
            update: {},
            create: cat,
        });
    }
    console.log("✅ Categories seeded");

    // --- Seed Demo User ---
    const user = await db.user.upsert({
        where: { email: "demo@aiforge.com" },
        update: {},
        create: {
            name: "Demo User",
            email: "demo@aiforge.com",
            emailVerified: new Date(),
            role: "USER",
        },
    });
    console.log("✅ Demo user seeded:", user.email);

    // --- Seed Demo Auctions ---
    const microSaasCat = await db.category.findUnique({ where: { slug: "micro-saas" } });
    const aiToolsCat = await db.category.findUnique({ where: { slug: "ai-tools" } });

    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    if (microSaasCat && aiToolsCat) {
        const auctionsData = [
            {
                title: "AI Resume Builder SaaS",
                description:
                    "A complete SaaS application that uses GPT-4 to automatically generate professional resumes from user input. Includes subscription billing, PDF export, and a polished React frontend. 200+ active users, $800/month MRR.",
                startingPrice: 5000,
                currentPrice: 5000,
                endsAt: in7Days,
                categoryId: microSaasCat.id,
                tags: ["saas", "ai", "resume", "gpt4", "react"],
                status: "ACTIVE" as const,
            },
            {
                title: "SEO Content Generator Tool",
                description:
                    "AI-powered content generation tool that produces SEO-optimized blog posts, meta descriptions, and social media copy. Integrates with WordPress and Webflow. 50 paying customers.",
                startingPrice: 2500,
                currentPrice: 2500,
                endsAt: in3Days,
                categoryId: aiToolsCat.id,
                tags: ["seo", "content", "ai", "wordpress"],
                status: "ACTIVE" as const,
            },
            {
                title: "Customer Support AI Bot",
                description:
                    "Pre-trained chatbot fine-tuned for e-commerce customer support. Handles returns, order tracking, FAQs, and escalations. Integrates with Shopify and WooCommerce. Plug-and-play setup.",
                startingPrice: 1500,
                currentPrice: 1500,
                endsAt: in14Days,
                categoryId: aiToolsCat.id,
                tags: ["chatbot", "customer-support", "shopify", "ecommerce"],
                status: "ACTIVE" as const,
            },
        ];

        for (const auctionData of auctionsData) {
            const existing = await db.auction.findFirst({
                where: { title: auctionData.title },
            });
            if (!existing) {
                await db.auction.create({
                    data: {
                        ...auctionData,
                        sellerId: user.id,
                    },
                });
            }
        }
        console.log("✅ Demo auctions seeded");
    }

    console.log("🎉 Database seeded successfully!");
}

main()
    .catch((e) => {
        console.error("❌ Seed error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
    });
