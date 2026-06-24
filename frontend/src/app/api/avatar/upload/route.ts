import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".glb")) {
      return NextResponse.json({ error: "Only .glb files are allowed" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), "public", "models", "avatars");
    await mkdir(uploadDir, { recursive: true });

    // Use a clean filename to avoid filesystem issues
    const cleanFileName = path.basename(file.name).replace(/[^a-zA-Z0-9._-]/g, "_");
    const finalPath = path.join(uploadDir, cleanFileName);
    await writeFile(finalPath, buffer);

    const publicUrl = `/models/avatars/${cleanFileName}`;
    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error("Upload error", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
