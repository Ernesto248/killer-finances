export interface PersonaSearchOption {
  id: string;
  nombre: string;
  alias: string | null;
}

export function calculateUpdatedPersonaBalances({
  deudaFinalCup,
}: {
  currentBalanceUsd: number;
  deudaFinalCup: number;
  totalZelleUsd: number;
}) {
  return {
    balanceCup: deudaFinalCup,
  };
}

export function filterPersonaOptions(
  personas: PersonaSearchOption[],
  search: string
) {
  const term = search.trim().toLowerCase();

  if (!term) {
    return personas;
  }

  return personas.filter((persona) => {
    const nombre = persona.nombre.toLowerCase();
    const alias = persona.alias?.toLowerCase() ?? "";
    return nombre.includes(term) || alias.includes(term);
  });
}
