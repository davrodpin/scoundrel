export function createIndexRedirect(): Response {
  return new Response(null, {
    status: 302,
    headers: { Location: "/play" },
  });
}
