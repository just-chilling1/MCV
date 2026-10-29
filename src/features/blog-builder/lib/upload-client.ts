/** Upload an image file to Supabase Storage via the server and return its public URL. */
export async function uploadBlogImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/blog/upload-image", { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Upload failed");
  return data.url as string;
}
