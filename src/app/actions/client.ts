'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';

// Schema matching the updated ClientProfile and Form Data
const ClientProfileSchema = z.object({
    // Company Identity
    companyName: z.string().min(2, "Company name is required"),
    website: z.string().url("Invalid URL").optional().or(z.literal('')),
    industry: z.string().min(1, "Industry is required"),
    companySize: z.string().min(1, "Company size is required"),
    description: z.string().max(1000, "Description too long"),
    logoUrl: z.string().optional(),
    estYear: z.string().regex(/^\d{4}$/, "Must be a 4-digit year").optional().or(z.literal('')),

    // Employer Profile
    employerRole: z.string().min(2, "Role is required"),

    // Arrays need special handling if passed as JSON strings or raw arrays depending on form submission
    // We'll assume the component sends them as arrays
    languages: z.array(z.string()),
    hiringPreferences: z.array(z.string()),

    // Location
    country: z.string().min(1, "Country is required"),
    city: z.string().optional(),
    timezone: z.string().min(1, "Timezone is required"),

    // Billing
    billingStreet: z.string().optional(),
    billingCity: z.string().optional(),
    billingState: z.string().optional(),
    billingPostalCode: z.string().optional(),
    billingCountry: z.string().optional(),
    taxId: z.string().optional(),
    invoiceEmail: z.string().email("Invalid email").optional().or(z.literal('')),

    // Contact
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().optional(),
});

export type ClientProfileFormData = z.infer<typeof ClientProfileSchema>;

export async function updateClientProfile(data: ClientProfileFormData) {
    // 1. Validate data
    const result = ClientProfileSchema.safeParse(data);

    if (!result.success) {
        return { success: false, error: result.error.flatten() };
    }

    // 2. Simulate DB delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 3. Log the "Saved" data (Simulating persistence)
    console.log('--- UPDATING CLIENT PROFILE ---');
    console.log('Company:', result.data.companyName);
    console.log('Role:', result.data.employerRole);
    console.log('Preferences:', result.data.hiringPreferences);
    console.log('Languages:', result.data.languages);
    console.log('Tax ID:', result.data.taxId);
    console.log('-------------------------------');

    // 4. Revalidate
    revalidatePath('/client/profile');
    revalidatePath('/client/dashboard');

    return { success: true, message: 'Profile updated successfully' };
}
