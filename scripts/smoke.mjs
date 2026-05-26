const target = process.env.SMOKE_URL ?? "http://127.0.0.1:3000";

const response = await fetch(target, { redirect: "manual" });

if (!response.ok && (response.status < 300 || response.status >= 400)) {
  throw new Error(`Unexpected response from ${target}: ${response.status}`);
}

console.log(`Smoke check reached ${target} with status ${response.status}`);
