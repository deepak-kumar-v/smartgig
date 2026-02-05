'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { signIn } from '@/lib/auth';
import { AuthError } from 'next-auth';

const RegisterSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
    name: z.string().min(1, { message: "Name is required" }),
    role: z.string().default("FREELANCER"),
});

const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1)
});

export async function registerUser(formData: FormData) {
    const validatedFields = RegisterSchema.safeParse({
        email: formData.get('email'),
        password: formData.get('password'),
        name: formData.get('name'),
        role: formData.get('role'),
    });

    if (!validatedFields.success) {
        return { error: "Invalid fields" };
    }

    const { email, password, name, role } = validatedFields.data;

    try {
        // Check if user exists
        const existingUser = await db.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return { error: "Email already in use!" };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role,
                // Create associated profile based on role
                ...(role === "FREELANCER" && {
                    freelancerProfile: {
                        create: {
                            title: "New Freelancer",
                            bio: "Bio not updated yet.",
                            hourlyRate: 0,
                        }
                    }
                }),
                ...(role === "CLIENT" && {
                    clientProfile: {
                        create: {
                            companyName: "Individual",
                        }
                    }
                })
            },
        });
    } catch (error) {
        console.error("Registration error:", error);
        return { error: "Service temporarily unavailable. Please try again later." };
    }

    // Automatically sign in after registration (optional, but good UX)
    /* 
    try {
      await signIn('credentials', {
        email,
        password,
        redirectTo: '/dashboard',
      });
    } catch (error) {
      if (error instanceof AuthError) {
          return { error: "Something went wrong during auto-login." }
      }
      throw error;
    }
    */

    return { success: "User created!" };
}

export async function loginUser(prevState: string | undefined, formData: FormData) {
    const validatedFields = LoginSchema.safeParse({ // Fixed: Use LoginSchema instead of manual object
        email: formData.get('email'),
        password: formData.get('password'),
    });

    if (!validatedFields.success) {
        return "Invalid fields";
    }

    const { email, password } = validatedFields.data;

    try {
        await signIn('credentials', {
            email,
            password,
            redirectTo: '/dashboard',
        });
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Invalid credentials.';
                default:
                    return 'Something went wrong.';
            }
        }
        throw error;
    }
}

export async function loginWithGoogle() {
    await signIn('google', { redirectTo: '/dashboard' });
}

export async function loginWithGithub() {
    await signIn('github', { redirectTo: '/dashboard' });
}
