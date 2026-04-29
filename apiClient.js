const API_KEY = process.env.OMDB_API_KEY;
const BASE_URL = "https://www.omdbapi.com/";

async function apiClient(endpoint) {
  const url = new URL(BASE_URL);

  const query = endpoint.startsWith("?")
    ? endpoint.slice(1)
    : endpoint.replace(/^[/?]/, "");

  url.search = query;
  url.searchParams.set("apikey", API_KEY);

  const res = await fetch(url.toString());

  if (!res.ok) {
    throw new Error("Ошибка запроса");
  }

  const data = await res.json();

  if (data.Response === "False") {
    throw new Error(data.Error);
  }

  return data;
}

module.exports = apiClient;