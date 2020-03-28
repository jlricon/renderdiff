addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request));
});
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
  "Access-Control-Allow-Headers": "*"
};

function handleOptions(request) {
  if (
    request.headers.get("Origin") !== null &&
    request.headers.get("Access-Control-Request-Method") !== null &&
    request.headers.get("Access-Control-Request-Headers") !== null
  ) {
    // Handle CORS pre-flight request.
    return new Response(null, {
      headers: corsHeaders
    });
  } else {
    // Handle standard OPTIONS request.
    return new Response(null, {
      headers: {
        Allow: "GET, HEAD, POST, OPTIONS"
      }
    });
  }
}
/**
 * Fetch and log a request
 * @param {Request} request
 */
async function handleRequest(request) {
  if (request.method === "OPTIONS") {
    return handleOptions(request);
  } else if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { url, v1, v2 } = await request.json();

  const headers = new Headers({
    "x-hasura-admin-secret": HASURA_GRAPHQL_ADMIN_SECRET,
    "Content-Type": "application/json"
  });
  let some_data = await fetch("https://hasura-ss.herokuapp.com/v1/graphql", {
    method: "POST",
    headers: headers,
    body: JSON.stringify({
      query: `query MyQuery($url: String!, $rev1: Int!, $rev2: Int!) {
        vox_records(where: {url: {_eq: $url}, revision: {_in: [$rev1,$rev2]}}) {
          content, revision
        }
      }`,
      variables: { url: url, rev1: v1, rev2: v2 }
    })
  })
    .catch(e => console.log(e))
    .then(e => e.json());
  const records = some_data.data.vox_records;
  const wasm = await import("../pkg/index");
  const { diff_text } = wasm;
  // await wasm_bindgen(wasm);
  const content_v1 = records.filter(e => e.revision === v1)[0];
  const content_v2 = records.filter(e => e.revision === v2)[0];
  const diffed_text = diff_text(content_v1.content, content_v2.content);

  let res = new Response(JSON.stringify({ data: diffed_text }), {
    status: 200
  });
  res.headers.append("Access-Control-Allow-Origin", "*");
  res.headers.set("Content-Type", "application/json");
  return res;
}
