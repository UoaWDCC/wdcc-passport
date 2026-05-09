export type PokemonInfo = {
  name: string;
  spriteUrl: string | null;
  types: string[];
};

type PokemonApiResponse = {
  name: string;
  sprites: {
    front_default: string | null;
    other?: {
      "official-artwork"?: { front_default: string | null };
    };
  };
  types: { type: { name: string } }[];
};

export async function fetchPokemon(name: string): Promise<PokemonInfo | null> {
  const slug = name.trim().toLowerCase().replace(/\s+/g, "-");
  if (!slug) return null;

  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${slug}`, {
      next: { revalidate: 60 * 60 * 24 },
    });

    if (!res.ok) return null;

    const data = (await res.json()) as PokemonApiResponse;
    const spriteUrl =
      data.sprites.other?.["official-artwork"]?.front_default ??
      data.sprites.front_default ??
      null;

    return {
      name: data.name,
      spriteUrl,
      types: data.types.map((t) => t.type.name),
    };
  } catch {
    return null;
  }
}
