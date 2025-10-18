// server.js
const express = require("express");
const fetch = require("node-fetch");
const fs = require("fs");

const app = express();
const PORT = 3000;

// ----------- REST API FUNCTION -----------
async function fetchFromREST(pokemonName) {
  const url = `https://pokeapi.co/api/v2/pokemon/${pokemonName}`;
  console.log("🔹 REST API call started...");
  const response = await fetch(url);
  console.log(`REST Status Code: ${response.status}`);

  if (!response.ok) {
    console.log("❌ REST Error: Pokémon not found.\n");
    return { error: "Pokémon not found", status: response.status };
  }

  const data = await response.json();

  const filtered = {
    name: data.name,
    height: data.height,
    weight: data.weight,
    abilities: data.abilities.map((a) => a.ability.name),
  };

  fs.writeFileSync("rest_output.json", JSON.stringify(filtered, null, 2));
  console.log("✅ REST data saved to rest_output.json\n");
  return filtered;
}

// ----------- GRAPHQL FUNCTION -----------
async function fetchFromGraphQL(pokemonName) {
  const url = "https://beta.pokeapi.co/graphql/v1beta";

  const query = `
    query getPokemon($name: String!) {
      pokemon_v2_pokemon(where: {name: {_eq: $name}}) {
        name
        height
        weight
        pokemon_v2_pokemonabilities {
          pokemon_v2_ability { name }
        }
      }
    }
  `;

  console.log("🔸 GraphQL call started...");
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: { name: pokemonName } }),
  });

  console.log(`GraphQL Status Code: ${response.status}`);

  if (!response.ok) {
    console.log("❌ GraphQL Error.\n");
    return { error: "GraphQL fetch failed", status: response.status };
  }

  const result = await response.json();
  const pokemon = result.data.pokemon_v2_pokemon[0];

  if (!pokemon) {
    console.log("❌ Pokémon not found in GraphQL.\n");
    return { error: "Pokémon not found" };
  }

  const filtered = {
    name: pokemon.name,
    height: pokemon.height,
    weight: pokemon.weight,
    abilities: pokemon.pokemon_v2_pokemonabilities.map(
      (a) => a.pokemon_v2_ability.name
    ),
  };

  fs.writeFileSync("graphql_output.json", JSON.stringify(filtered, null, 2));
  console.log("✅ GraphQL data saved to graphql_output.json\n");
  return filtered;
}

// ----------- EXPRESS ROUTES -----------
app.get("/", (req, res) => {
  res.send(`
    <h2>Pokémon API Comparison</h2>
    <p>Use these routes:</p>
    <ul>
      <li><a href="/pokemon/pikachu">/pokemon/pikachu</a> → Fetch Pikachu data (REST + GraphQL)</li>
      <li><a href="/pokemon/charmander">/pokemon/charmander</a> → Fetch Charmander data</li>
      <li><a href="/pokemon/xyzwrong">/pokemon/xyzwrong</a> → Test wrong Pokémon</li>
    </ul>
  `);
});

app.get("/pokemon/:name", async (req, res) => {
  const name = req.params.name.toLowerCase();

  const restData = await fetchFromREST(name);
  const gqlData = await fetchFromGraphQL(name);

  res.json({
    REST_API: restData,
    GraphQL_API: gqlData,
    note: "Filtered outputs also saved to rest_output.json and graphql_output.json",
  });
});

// ----------- START SERVER -----------
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log("Open your browser and go to that URL.\n");
});
