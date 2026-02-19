import { NextResponse } from "next/server";

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function apiUnauthorized(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function apiForbidden(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function apiNotFound(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}
