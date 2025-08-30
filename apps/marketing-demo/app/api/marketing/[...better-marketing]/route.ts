import { marketing } from "@/lib/marketing";

export async function GET(request: Request) {
  return marketing.handler(request);
}

export async function POST(request: Request) {
  return marketing.handler(request);
}

export async function PUT(request: Request) {
  return marketing.handler(request);
}

export async function DELETE(request: Request) {
  return marketing.handler(request);
}

export async function PATCH(request: Request) {
  return marketing.handler(request);
}
