import { CreateAuctionForm } from "@/components/auctions/create-auction-form";

export default function CreateAuctionPage() {
    return (
        <div className="container mx-auto py-10">
            <div className="mx-auto max-w-2xl text-center mb-10">
                <h1 className="text-3xl font-bold tracking-tight">List Your Asset</h1>
                <p className="text-muted-foreground mt-2">
                    Create a new auction to sell your AI product, model, or dataset to the highest bidder.
                </p>
            </div>
            <CreateAuctionForm />
        </div>
    );
}
