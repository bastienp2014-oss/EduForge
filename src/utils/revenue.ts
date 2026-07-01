export interface RevenueSplits {
  platformPercentage: number;
  creatorPercentage: number;
  platformAmount: number;
  creatorAmount: number;
}

export function calculateRevenueSplits(
  amount: number,
  platformPercentage: number = 30
): RevenueSplits {
  if (amount < 0) {
    throw new Error("Le montant ne peut pas être négatif");
  }
  if (platformPercentage < 0 || platformPercentage > 100) {
    throw new Error("Le pourcentage de la plateforme doit être entre 0 et 100");
  }

  const creatorPercentage = 100 - platformPercentage;
  const platformAmount = (amount * platformPercentage) / 100;
  const creatorAmount = (amount * creatorPercentage) / 100;

  return {
    platformPercentage,
    creatorPercentage,
    platformAmount,
    creatorAmount,
  };
}
