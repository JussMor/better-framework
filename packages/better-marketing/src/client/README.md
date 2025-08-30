# Better Marketing Client

This is the client-side SDK for Better Marketing. It provides a simple interface for interacting with the Better Marketing API, as well as React-specific hooks for managing state.

## Usage Example

### Creating an auth client for React

```tsx
// lib/auth-client.ts
import { createReactAuthClient } from "better-marketing/client";

export const authClient = createReactAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
  apiKey: process.env.NEXT_PUBLIC_API_KEY || "",
});
```

### Using the auth client for sign up

```tsx
import { authClient } from "@/lib/auth-client";
import { useState } from "react";

export function SignUpForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await authClient.signUp.email(
      {
        email,
        password,
        name,
        callbackURL: "/dashboard",
      },
      {
        onRequest: () => {
          // Show loading indicator
          setLoading(true);
        },
        onSuccess: () => {
          // Redirect or show success message
          window.location.href = "/dashboard";
        },
        onError: (ctx) => {
          // Display error message
          alert(ctx.error.message);
          setLoading(false);
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields here */}
      <button type="submit" disabled={loading}>
        Sign Up
      </button>
    </form>
  );
}
```

### Accessing session data

```tsx
import { authClient } from "@/lib/auth-client";

export function Profile() {
  const { data, isPending, error } = authClient.useSession();

  if (isPending) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return <div>Not logged in</div>;

  return (
    <div>
      <h1>Hello, {data.name || data.email}</h1>
      <p>Email: {data.email}</p>
    </div>
  );
}
```

## API Reference

The auth client provides the following methods:

- `signUp.email()` - Sign up with email and password
- `useSession()` - React hook to access the current session
- `track()` - Track an event
- `identify()` - Identify a user
