# Setting up the Auth Client in a Next.js Application

This guide shows how to set up and use the Better Marketing auth client in a Next.js application.

## Step 1: Create the auth client

Create a file `lib/auth-client.ts` with the following content:

```typescript
import { createReactAuthClient } from "better-marketing/client";

export const authClient = createReactAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
  apiKey: process.env.NEXT_PUBLIC_API_KEY || "",
});
```

## Step 2: Using the auth client for sign up

Create a sign-up form component that uses the auth client:

```tsx
// components/SignUpForm.tsx
"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function SignUpForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await authClient.signUp.email(
      {
        email,
        password,
        name,
        callbackURL: "/dashboard",
      },
      {
        onRequest: () => {
          setLoading(true);
        },
        onSuccess: () => {
          // Redirect to dashboard or confirmation page
          window.location.href = "/dashboard";
        },
        onError: (ctx) => {
          setError(ctx.error.message);
          setLoading(false);
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          required
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          required
          minLength={8}
        />
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-blue-300"
      >
        {loading ? "Creating account..." : "Sign Up"}
      </button>
    </form>
  );
}
```

## Step 3: Create a Protected Route Component

Create a component to protect routes that require authentication:

```tsx
// components/ProtectedRoute.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
}
```

## Step 4: Using the Protected Route

Use the protected route component in your dashboard or any other page that requires authentication:

```tsx
// app/dashboard/page.tsx
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardContent } from "@/components/DashboardContent";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
```

## Step 5: Displaying User Information

Create a component to display user information:

```tsx
// components/UserProfile.tsx
"use client";

import { authClient } from "@/lib/auth-client";

export function UserProfile() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <div>Loading user data...</div>;
  }

  if (!session) {
    return <div>Not logged in</div>;
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <h2 className="text-xl font-bold">Your Profile</h2>
      <div className="mt-4">
        <div className="mb-2">
          <span className="font-semibold">Name:</span>{" "}
          {session.name || "Not provided"}
        </div>
        <div className="mb-2">
          <span className="font-semibold">Email:</span> {session.email}
        </div>
        <div className="mb-2">
          <span className="font-semibold">User ID:</span> {session.id}
        </div>
      </div>
    </div>
  );
}
```

## Step 6: Adding Sign Out Functionality

Create a sign-out button component:

```tsx
// components/SignOutButton.tsx
"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    setLoading(true);
    try {
      // Assuming there's a signOut method on the authClient
      await authClient.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:bg-red-300"
    >
      {loading ? "Signing out..." : "Sign Out"}
    </button>
  );
}
```

## Complete Example

This setup provides a complete authentication flow with sign-up, protected routes, and user profile display. You can extend it with additional features like sign-in, password reset, and more as needed.

The auth client is designed to work similarly to the Better Auth client, making it easy to integrate into your existing applications.
