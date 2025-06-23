// supabase/functions/fetch_rag_data/index.ts

import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "supabase";

serve(async (req) => {
  const { prompt, make, model } = await req.json();

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: prompt
    })
  });

  const embeddingData = await embeddingResponse.json();
  const embedding = embeddingData.data[0].embedding;

  // 🔍 Search in manual_snippets
  const { data, error } = await supabase.rpc("match_manual_snippets", {
    query_embedding: embedding,
    match_threshold: 0.75,
    match_count: 5
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" }
  });
});
