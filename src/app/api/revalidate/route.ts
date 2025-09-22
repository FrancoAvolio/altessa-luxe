import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { path, tag } = body as { path?: string; tag?: string };

    if (!path && !tag) {
      return NextResponse.json(
        { ok: false, error: "Debe indicar path o tag" },
        { status: 400 }
      );
    }

    if (path) revalidatePath(path);
    if (tag) revalidateTag(tag);

    return NextResponse.json({ ok: true, revalidated: { path, tag } });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error)?.message ?? "Error" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path");
  const tag = searchParams.get("tag");

  if (!path && !tag) {
    return NextResponse.json(
      { ok: false, error: "Debe indicar path o tag" },
      { status: 400 }
    );
  }

  if (path) revalidatePath(path);
  if (tag) revalidateTag(tag);

  return NextResponse.json({ ok: true, revalidated: { path, tag } });
}
