import { Property } from '../contexts/AppContext';

const getVerificationScore = (property: Property) => {
  let score = 0;

  if (property.sellerVerified) {
    score += 2;
  }

  if (property.verified) {
    score += 2;
  }

  return score;
};

export const sortPropertiesByTrust = (properties: Property[]) =>
  [...properties].sort((left, right) => getVerificationScore(right) - getVerificationScore(left));
