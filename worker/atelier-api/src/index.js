const BODY_TYPES = {
  "slim": "slim slender build, lean toned frame, balanced proportions",
  "average": "average natural build, balanced everyday proportions",
  "curvy": "curvy figure with proportionally fuller hips and bust, soft natural shape, realistic curvy body, flat stomach",
  "plus-size": "plus-size body with fuller frame all over, soft rounded shape, flat stomach, realistic plus-size proportions",
  "athletic": "athletic toned build, defined frame, strong shoulders, lean musculature, flat stomach",
};

const COMPLEXIONS = {
  "fair": "very fair skin, porcelain light complexion, soft cool undertones",
  "light": "light skin, warm beige complexion, soft natural skin tone",
  "medium": "medium brown skin, rich warm tan complexion, golden brown undertones, saturated skin colour",
  "tan": "warm tan brown skin, deep caramel complexion, rich sun-kissed brown",
  "deep": "deep dark brown skin, rich dark complexion, dark skin tone",
};

const AESTHETICS = {
  "indian-traditional": "traditional Indian fashion, drape, embroidery, ethnic silhouette",
  "indo-western-fusion": "Indo-western fusion fashion, modern silhouette with Indian elements, contemporary drape",
  "western-contemporary": "contemporary western fashion, modern minimal silhouette",
  "minimalist": "minimalist clean fashion, refined silhouette",
  "maximalist": "maximalist bold fashion, dramatic silhouette and detailing",
};

const HAIR_CLAUSE = "long flowing hair, natural hair texture, neatly styled";

const STYLE_SUFFIX = [
  "fashion design illustration, single full-body sketch,",
  "one woman only, solo portrait, centered front-facing composition,",
  "facing forward, front view, standing pose,",
  "flat toned stomach, NOT pregnant, NOT pregnancy, slim midsection,",
  "clean line drawing on plain white background,",
  "elegant pose, realistic proportions, dignified pose, modest styling,",
  "no duplicate figures, no shadow copies, no secondary sketches,",
  "no design plate, no multiple poses, isolated subject"
].join(" ");


function buildSketchPrompt({ description, body_type, complexion, aesthetic }) {
  const bodyFragment = BODY_TYPES[body_type] || "average natural build";
  const complexionFragment = COMPLEXIONS[complexion] || "medium skin tone";
  const aestheticFragment = AESTHETICS[aesthetic] || "contemporary fashion";

  return (
    `A single woman, ${bodyFragment}, ${complexionFragment}, ${HAIR_CLAUSE}, ` +
    `wearing ${description}, ` +
    `${aestheticFragment}, ` +
    `${STYLE_SUFFIX}`
  );
}


const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
    },
  });
}


const HF_MODEL = "black-forest-labs/FLUX.1-schnell";
const HF_ROUTER_URL = `https://router.huggingface.co/hf-inference/models/${HF_MODEL}`;


async function generateSketch(prompt, hfToken) {
  const response = await fetch(HF_ROUTER_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${hfToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs: prompt }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Hugging Face error ${response.status}: ${errorText}`);
  }

  const imageBuffer = await response.arrayBuffer();
  return imageBuffer;
}


function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}


export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== "POST") {
      return jsonResponse(
        { error: "Method not allowed. Use POST." },
        405
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return jsonResponse({ error: "Invalid JSON body." }, 400);
    }

    const { description, body_type, complexion, aesthetic } = body;
    if (!description || !body_type || !complexion || !aesthetic) {
      return jsonResponse(
        {
          error: "Missing required field. Need: description, body_type, complexion, aesthetic.",
        },
        400
      );
    }

    const refinedPrompt = buildSketchPrompt(body);

    if (!env.HF_TOKEN) {
      return jsonResponse(
        { error: "Server misconfigured: HF_TOKEN not set." },
        500
      );
    }

    try {
      const imageBuffer = await generateSketch(refinedPrompt, env.HF_TOKEN);
      const imageBase64 = arrayBufferToBase64(imageBuffer);

      return jsonResponse({
        refined_prompt: refinedPrompt,
        image_base64: imageBase64,
      });
    } catch (err) {
      return jsonResponse(
        { error: `Sketch generation failed: ${err.message}` },
        500
      );
    }
  },
};
