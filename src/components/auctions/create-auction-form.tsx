"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Steps } from "@/components/ui/steps";
import { UploadDropzone } from "@/lib/uploadthing";
import { Loader2, X } from "lucide-react";
import Image from "next/image";

// Schema for the FORM (UI state)
const formSchema = z.object({
    title: z.string().min(10, "Title must be at least 10 characters").max(200),
    description: z.string().min(50, "Description must be at least 50 characters"),
    categoryId: z.string().min(1, "Category is required"),
    startingPrice: z.coerce.number().min(1, "Starting price must be at least $1"),
    reservePrice: z.coerce.number().optional(),
    buyoutPrice: z.coerce.number().optional(),
    duration: z.coerce.number().int().positive(), // in days
    tags: z.string().min(1, "At least one tag is required"), // Keep as string for input
    images: z.array(
        z.object({
            url: z.string().url(),
            key: z.string(),
            isPrimary: z.boolean().default(false),
        })
    ).min(1, "At least one image is required"),
});

type FormValues = z.infer<typeof formSchema>;

const STEPS = ["Details", "Pricing", "Media", "Review"];

// Mock Categories for MVP
const CATEGORIES = [
    { id: "cat_1", name: "Micro SaaS" },
    { id: "cat_2", name: "AI Tools" },
    { id: "cat_3", name: "AI Models" },
    { id: "cat_4", name: "Datasets" },
];

export function CreateAuctionForm() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const createAuctionMutation = trpc.auction.create.useMutation();

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        trigger,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            duration: 7,
            images: [],
            categoryId: "",
            tags: "",
        },
        mode: "onChange",
    });

    const formValues = watch();

    const handleNext = async () => {
        let fieldsToValidate: (keyof FormValues)[] = [];

        if (currentStep === 0) {
            fieldsToValidate = ["title", "description", "categoryId", "tags"];
        } else if (currentStep === 1) {
            fieldsToValidate = ["startingPrice", "reservePrice", "buyoutPrice", "duration"];
        } else if (currentStep === 2) {
            fieldsToValidate = ["images"];
        }

        const isValid = await trigger(fieldsToValidate);
        if (isValid) {
            setCurrentStep((prev) => prev + 1);
        }
    };

    const handleBack = () => {
        setCurrentStep((prev) => prev - 1);
    };

    const onSubmit = async (data: FormValues) => {
        setIsSubmitting(true);
        try {
            // Transform tags string to array for API
            const tagsArray = data.tags.split(",").map((t) => t.trim()).filter(Boolean);

            const apiData = {
                ...data,
                tags: tagsArray,
            };

            const result = await createAuctionMutation.mutateAsync(apiData);

            router.push(`/auctions/${result.id}`);
        } catch (error) {
            console.error("Failed to create auction", error);
            // Handle error (show toast)
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mx-auto max-w-3xl space-y-8">
            {/* Steps Indicator */}
            <Steps steps={STEPS} currentStep={currentStep} className="mb-8" />

            <Card>
                <CardContent className="pt-6">
                    <form className="space-y-6">
                        {/* STEP 1: Details */}
                        {currentStep === 0 && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Title</Label>
                                    <Input id="title" placeholder="E.g. AI Image Generator SaaS" {...register("title")} />
                                    {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="categoryId">Category</Label>
                                    <Select id="categoryId" {...register("categoryId")}>
                                        <option value="">Select a category</option>
                                        {CATEGORIES.map((cat) => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </option>
                                        ))}
                                    </Select>
                                    {errors.categoryId && <p className="text-sm text-red-500">{errors.categoryId.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        rows={5}
                                        placeholder="Describe your asset in detail..."
                                        {...register("description")}
                                    />
                                    {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="tags">Tags (comma separated)</Label>
                                    <Input id="tags" placeholder="react, nextjs, ai, saas" {...register("tags")} />
                                    { /* @ts-ignore */}
                                    {errors.tags && <p className="text-sm text-red-500">{errors.tags.message}</p>}
                                </div>
                            </div>
                        )}

                        {/* STEP 2: Pricing */}
                        {currentStep === 1 && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="startingPrice">Starting Price ($)</Label>
                                        <Input id="startingPrice" type="number" min="0" step="0.01" {...register("startingPrice")} />
                                        {errors.startingPrice && <p className="text-sm text-red-500">{errors.startingPrice.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="duration">Duration (Days)</Label>
                                        <Select id="duration" {...register("duration")}>
                                            <option value="3">3 Days</option>
                                            <option value="5">5 Days</option>
                                            <option value="7">7 Days</option>
                                            <option value="14">14 Days</option>
                                            <option value="30">30 Days</option>
                                        </Select>
                                        {errors.duration && <p className="text-sm text-red-500">{errors.duration.message}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="reservePrice">Reserve Price ($) (Optional)</Label>
                                        <Input id="reservePrice" type="number" min="0" step="0.01" {...register("reservePrice")} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="buyoutPrice">Buyout Price ($) (Optional)</Label>
                                        <Input id="buyoutPrice" type="number" min="0" step="0.01" {...register("buyoutPrice")} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: Media */}
                        {currentStep === 2 && (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label>Product Images</Label>
                                    <div className="border border-dashed rounded-lg p-6 flex flex-col items-center justify-center bg-muted/50">
                                        <UploadDropzone
                                            endpoint="imageUploader"
                                            onClientUploadComplete={(res) => {
                                                if (res) {
                                                    const newImages = res.map(file => ({
                                                        url: file.url,
                                                        key: file.key,
                                                        isPrimary: formValues.images?.length === 0 // Make first image primary
                                                    }));
                                                    setValue("images", [...(formValues.images || []), ...newImages]);
                                                    trigger("images");
                                                }
                                            }}
                                            onUploadError={(error: Error) => {
                                                alert(`ERROR! ${error.message}`);
                                            }}
                                        />
                                    </div>
                                    {errors.images && <p className="text-sm text-red-500">{errors.images.message}</p>}
                                </div>

                                {formValues.images && formValues.images.length > 0 && (
                                    <div className="grid grid-cols-4 gap-4">
                                        {formValues.images.map((img, idx) => (
                                            <div key={img.key} className="relative aspect-square rounded-md overflow-hidden border bg-background group">
                                                <Image src={img.url} alt="Product image" fill className="object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newImages = formValues.images.filter((_, i) => i !== idx);
                                                        setValue("images", newImages);
                                                    }}
                                                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                                {img.isPrimary && (
                                                    <div className="absolute bottom-0 left-0 right-0 bg-primary/80 text-white text-[10px] text-center py-1">
                                                        Primary
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* STEP 4: Review */}
                        {currentStep === 3 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold border-b pb-2">Review Details</h3>
                                <div className="grid grid-cols-2 gap-y-4 text-sm">
                                    <div>
                                        <span className="text-muted-foreground block">Title</span>
                                        <span className="font-medium">{formValues.title}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block">Category</span>
                                        <span className="font-medium">{CATEGORIES.find(c => c.id === formValues.categoryId)?.name || formValues.categoryId}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block">Starting Price</span>
                                        <span className="font-medium">${formValues.startingPrice}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block">Duration</span>
                                        <span className="font-medium">{formValues.duration} Days</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block">Images</span>
                                        <span className="font-medium">{formValues.images?.length || 0} uploaded</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </form>
                </CardContent>
                <CardFooter className="flex justify-between border-t p-6">
                    <Button
                        variant="outline"
                        onClick={handleBack}
                        disabled={currentStep === 0 || isSubmitting}
                    >
                        Back
                    </Button>

                    {currentStep === STEPS.length - 1 ? (
                        <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Auction
                        </Button>
                    ) : (
                        <Button onClick={handleNext}>
                            Next
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
