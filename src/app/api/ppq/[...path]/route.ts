import { NextRequest, NextResponse } from "next/server";

const PPQ_BASE = process.env.PPQ_BASE_URL || "https://api.ppq.ai";
const PPQ_KEY = process.env.PPQ_API_KEY || "";

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const targetUrl = `${PPQ_BASE}/${path.join("/")}${request.nextUrl.search}`;
  const res = await fetch(targetUrl, {
    headers: { Authorization: `Bearer ${PPQ_KEY}` },
  });
  const data = await res.text();
  return new NextResponse(data, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" },
  });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const targetUrl = `${PPQ_BASE}/${path.join("/")}${request.nextUrl.search}`;
  const body = await request.text();
  const res = await fetch(targetUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${PPQ_KEY}`,
    },
    body,
  });
  const data = await res.text();
  return new NextResponse(data, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" },
  });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const targetUrl = `${PPQ_BASE}/${path.join("/")}${request.nextUrl.search}`;
  const res = await fetch(targetUrl, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${PPQ_KEY}` },
  });
  const data = await res.text();
  return new NextResponse(data, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" },
  });
}
