import { createNextRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "@/server/uploadthing";

export const { GET, POST } = createNextRouteHandler({
    router: ourFileRouter,
});
