import { marketing } from "@/lib/marketing";

async function forwardToMarketing(request: Request) {
  // Ensure the marketing handler receives an Authorization header (server-side)
  const secret = process.env.MARKETING_SECRET;

  const incomingHeaders = new Headers(request.headers);
  if (!incomingHeaders.get("authorization") && secret) {
    incomingHeaders.set("authorization", `Bearer ${secret}`);
  }

  // Read body if present (so we can forward it)
  let body: string | undefined = undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    try {
      body = await request.text();
    } catch (e) {
      // ignore if body can't be read
    }
  }

  const forwarded = new Request(request.url, {
    method: request.method,
    headers: incomingHeaders,
    body,
  });

  return marketing.handler(forwarded);
}

export async function GET(request: Request) {
  return forwardToMarketing(request);
}

export async function POST(request: Request) {
  return forwardToMarketing(request);
}

export async function PUT(request: Request) {
  return forwardToMarketing(request);
}

export async function DELETE(request: Request) {
  return forwardToMarketing(request);
}

export async function PATCH(request: Request) {
  return forwardToMarketing(request);
}
