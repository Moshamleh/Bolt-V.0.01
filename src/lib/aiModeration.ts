export async function moderateContent({ type, content, user_id, part_id }) {
  try {
    const res = await fetch("https://vneaijpccgheumkrvgim.supabase.co/functions/v1/moderate-content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, content, user_id, part_id }),
    })

    if (!res.ok) {
      throw new Error("Failed to call moderation function")
    }

    const data = await res.json()
    return data.decision || "unknown"
  } catch (error) {
    console.error("Moderation error:", error)
    return "error"
  }
}