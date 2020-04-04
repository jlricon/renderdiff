addEventListener("fetch", event => {
  event.respondWith(
    handle(event)
      // For ease of debugging, we return exception stack
      // traces in response bodies. You are advised to
      // remove this .catch() in production.
      .catch(
        (
          e //e.stack
        ) =>
          new Response("Server error of some kind...", {
            status: 500,
            statusText: "Internal Server Error"
          })
      )
  );
});

async function handle(event) {
  const request = event.request;
  // const wasm = await import("../pkg/index");

  if (request.method === "OPTIONS") {
    return handleOptions(request);
  } else if (request.method === "POST") {
    let cache = caches.default;
    // Get hash of the request
    const hash = await sha256(await request.clone().text());
    let cacheUrl = new URL(request.url);
    cacheUrl.pathname = "/" + cacheUrl.pathname + hash;
    let cacheKey = new Request(cacheUrl, {
      // headers: request.headers,
      method: "GET"
    });
    let response = await cache.match(cacheKey);
    if (!response) {
      const was = wasm_bindgen;
      await wasm_bindgen(wasm);
      response = await handlePost(request, was);
      if (response.ok) {
        response.headers.append("Cache-Control", "max-age=600");
        event.waitUntil(cache.put(cacheKey, response.clone()));
      }
    } else {
    }
    return response;
  } else {
    return new Response(null, {
      status: 405,
      statusText: "Method Not Allowed"
    });
  }
}

// We support the GET, POST, HEAD, and OPTIONS methods from any origin,
// and accept the Content-Type header on requests. These headers must be
// present on all responses to all CORS requests. In practice, this means
// all responses to OPTIONS or POST requests.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
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

async function handlePost(request, wasm) {
  if (request.headers.get("Content-Type") !== "application/json") {
    return new Response(null, {
      status: 415,
      statusText: "Unsupported Media Type",
      headers: corsHeaders
    });
  }
  // Detect parse failures by setting `json` to null.
  let json = await request.json().catch(e => null);
  if (json === null) {
    return new Response("JSON parse failure", {
      status: 400,
      statusText: "Bad Request",
      headers: corsHeaders
    });
  }
  // Actually generate the response
  const resp = JSON.stringify(await handle_request(json, wasm));
  return new Response(resp, {
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders
    }
  });
}
const hasuraHeaders = new Headers({
  "x-hasura-admin-secret": HASURA_GRAPHQL_ADMIN_SECRET,
  "Content-Type": "application/json"
});

async function handle_request(request, wasm) {
  const { kind, params } = request;

  let ret;
  if (kind === "diff_two") {
    ret = await getDiffForUrlAndRevisions(
      params.url,
      params.v1,
      params.v2,
      wasm
    );
  } else if (kind === "last_diffs") {
    ret = await getLastDiffs(wasm, params.n, params.offset);
  } else {
    return new Response({}, { status: 500 });
  }

  return { data: ret };
}

async function getDiffForUrlAndRevisions(url, v1, v2, wasm) {
  let some_data = await fetch("https://hasura-ss.herokuapp.com/v1/graphql", {
    method: "POST",
    headers: hasuraHeaders,
    body: JSON.stringify({
      query: `query MyQuery($url: String!, $rev1: Int!, $rev2: Int!) {
          vox_records(where: {url: {_eq: $url}, revision: {_in: [$rev1,$rev2]}}) {
            content, revision, date_seen
          }
        }`,
      variables: { url: url, rev1: v1, rev2: v2 }
    })
  })
    .catch(e => console.log(e))
    .then(e => e.json());
  console.log(JSON.stringify(some_data.data));
  const records = some_data.data.vox_records;
  if (records.length == 0) {
    return {};
  }
  const { diff_text } = wasm;
  const content_v1 = records.filter(e => e.revision === v1)[0];
  const content_v2 = records.filter(e => e.revision === v2)[0];
  const diffed_text = diff_text(content_v1.content, content_v2.content);
  return {
    diff: diffed_text,
    date_rev1: content_v1.date_seen,
    date_rev2: content_v2.date_seen
  };
}
// Returns the diffs of the last 20 changes wrt their previous changes
async function getLastDiffs(wasm, n, offset) {
  let some_data = await fetch("https://hasura-ss.herokuapp.com/v1/graphql", {
    method: "POST",
    headers: hasuraHeaders,
    body: JSON.stringify({
      query: `query MyQuery($lim: Int!, $offset: Int!) {last_diffs(args: {lim: $lim, offs: $offset}) {
            url
            revision
            date_seen
            content
            latest
          }}`,
      variables: { lim: n, offset: offset }
    })
  })
    .catch(e => console.log(e))
    .then(e => e.json());
  const records = some_data.data.last_diffs;
  const { diff_text } = wasm;
  const new_records = records.filter(r => r.latest);
  const old_records = records.filter(r => !r.latest);
  new_records.sort((a, b) => compare(a.url, b.url));
  old_records.sort((a, b) => compare(a.url, b.url));
  let res = [];
  for (i = 0; i < new_records.length; i += 1) {
    const one_diff = diff_text(old_records[i].content, new_records[i].content);
    res.push({
      diff: one_diff,
      url: old_records[i].url,
      last_revision: new_records[i].revision,
      prev_revision: old_records[i].revision,
      date_seen1: old_records[i].date_seen,
      date_seen2: new_records[i].date_seen
    });
  }
  res.sort((a, b) => compare(b.date_seen2, a.date_seen2));

  // Returns [(url,last_revision,site,diff,date_seen1,date_seen2)]
  return res;
}
// Query last 10 edits
function compare(a, b) {
  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }
  // a must be equal to b
  return 0;
}
async function sha256(message) {
  // encode as UTF-8
  const msgBuffer = new TextEncoder().encode(message);
  // hash the message
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  // convert ArrayBuffer to Array
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  // convert bytes to hex string
  const hashHex = hashArray
    .map(b => ("00" + b.toString(16)).slice(-2))
    .join("");
  return hashHex;
}
