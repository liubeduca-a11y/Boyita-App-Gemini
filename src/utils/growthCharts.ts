export const WEIGHT_GIRLS: Record<number, number[]> = {
  0: [2.4, 3.2, 4.2, 4.8], // [-2SD, Median, +2SD, +3SD]
  1: [3.2, 4.2, 5.5, 6.2],
  2: [3.9, 5.1, 6.6, 7.5],
  3: [4.5, 5.8, 7.5, 8.5],
  4: [5.0, 6.4, 8.2, 9.3],
  5: [5.4, 6.9, 8.8, 10.0],
  6: [5.7, 7.3, 9.3, 10.6],
  7: [6.0, 7.6, 9.8, 11.1],
  8: [6.3, 7.9, 10.2, 11.6],
  9: [6.5, 8.2, 10.5, 11.9],
  10: [6.7, 8.5, 10.9, 12.3],
  11: [6.9, 8.7, 11.2, 12.7],
  12: [7.0, 8.9, 11.5, 13.0],
  18: [9.1, 10.2, 11.6, 13.2],
  24: [10.2, 11.5, 13.0, 14.8],
  30: [11.2, 12.7, 14.4, 16.5],
  36: [12.2, 13.9, 15.8, 18.1],
  42: [13.1, 15.0, 17.2, 19.8],
  48: [14.0, 16.1, 18.5, 21.5],
  54: [14.9, 17.2, 19.9, 23.2],
  60: [15.8, 18.2, 21.2, 24.9]
};

export const HEIGHT_GIRLS: Record<number, number[]> = {
  0: [45.4, 49.1], // [-2SD, Median]
  1: [49.8, 53.7],
  2: [53.0, 57.1],
  3: [55.6, 59.8],
  4: [57.8, 62.1],
  5: [59.6, 64.0],
  6: [61.2, 65.7],
  7: [62.7, 67.3],
  8: [64.0, 68.7],
  9: [65.3, 70.1],
  10: [66.5, 71.5],
  11: [67.7, 72.8],
  12: [68.9, 74.0],
  18: [74.9, 80.7],
  24: [80.0, 85.7],
  30: [84.8, 90.7],
  36: [89.4, 95.1],
  42: [93.5, 99.0],
  48: [97.3, 102.7],
  54: [100.0, 106.2],
  60: [103.3, 109.4]
};

export const WEIGHT_BOYS: Record<number, number[]> = {
  0: [2.5, 3.3, 4.4, 5.0], // [-2SD, Median, +2SD, +3SD]
  1: [3.4, 4.5, 5.8, 6.6],
  2: [4.3, 5.6, 7.1, 8.0],
  3: [5.0, 6.4, 8.0, 9.0],
  4: [5.6, 7.0, 8.7, 9.7],
  5: [6.0, 7.5, 9.3, 10.4],
  6: [6.4, 7.9, 9.8, 10.9],
  7: [6.7, 8.3, 10.3, 11.4],
  8: [6.9, 8.6, 10.7, 11.9],
  9: [7.1, 8.9, 11.0, 12.3],
  10: [7.4, 9.2, 11.4, 12.7],
  11: [7.6, 9.4, 11.7, 13.0],
  12: [7.7, 9.6, 12.0, 13.3],
  18: [9.8, 10.9, 12.2, 13.7],
  24: [10.8, 12.2, 13.6, 15.3],
  30: [11.8, 13.3, 15.0, 16.9],
  36: [12.7, 14.3, 16.2, 18.3],
  42: [13.6, 15.3, 17.4, 19.7],
  48: [14.4, 16.3, 18.6, 21.2],
  54: [15.2, 17.3, 19.8, 22.7],
  60: [16.0, 18.3, 21.0, 24.2]
};

export const HEIGHT_BOYS: Record<number, number[]> = {
  0: [46.1, 49.9], // [-2SD, Median]
  1: [50.8, 54.7],
  2: [54.4, 58.4],
  3: [57.3, 61.4],
  4: [59.7, 63.9],
  5: [61.7, 65.9],
  6: [63.3, 67.6],
  7: [64.8, 69.2],
  8: [66.2, 70.6],
  9: [67.5, 72.0],
  10: [68.7, 73.3],
  11: [69.9, 74.5],
  12: [71.0, 75.7],
  18: [76.9, 82.3],
  24: [81.7, 87.1],
  30: [86.4, 91.9],
  36: [90.5, 96.1],
  42: [94.0, 99.9],
  48: [97.3, 103.3],
  54: [100.3, 106.7],
  60: [103.3, 110.0]
};

/**
 * Gets the closest available age period in the table.
 * If age is exactly a key, it returns it.
 * Otherwise it finds the closest key below or above (we will round to nearest).
 * Wait, the table uses specific intervals: 0-12m (monthly), then 18m, 24m...
 * Let's just find the closest key in the chart.
 */
function getClosestMonth(chartMonths: number[], ageInMonths: number): number {
  return chartMonths.reduce((prev, curr) => {
    return (Math.abs(curr - ageInMonths) < Math.abs(prev - ageInMonths) ? curr : prev);
  });
}

export type GrowthStatus = {
  status: 'green' | 'yellow' | 'red' | 'gray';
  label: string;
  description: string;
};

/**
 * Returns color status and label for Weight based on WHO standards
 */
export function getWeightStatus(gender: 'girl' | 'boy', ageInMonths: number, weight: number): GrowthStatus {
  const chart = gender === 'boy' ? WEIGHT_BOYS : WEIGHT_GIRLS;
  const closestMonth = getClosestMonth(Object.keys(chart).map(Number), ageInMonths);
  const bounds = chart[closestMonth as keyof typeof chart];
  
  if (!bounds) return { status: 'gray', label: 'Sin datos', description: 'No hay datos de referencia para esta edad.' };

  const [minNormal, median, highNormal, overweightLimit] = bounds;

  if (weight < minNormal) {
    return { status: 'yellow', label: 'Bajo peso', description: 'El peso está por debajo del rango ideal para su edad.' };
  }
  if (weight >= overweightLimit) {
    return { status: 'red', label: 'Sobrepeso/Obesidad', description: 'El peso está significativamente por encima del rango ideal.' };
  }
  if (weight >= highNormal) {
    return { status: 'yellow', label: 'Riesgo de sobrepeso', description: 'El peso está en el límite superior del rango normal.' };
  }
  
  return { status: 'green', label: 'Peso saludable', description: 'El peso se encuentra dentro del rango ideal para su edad.' };
}

/**
 * Returns color status and label for Height based on WHO standards
 */
export function getHeightStatus(gender: 'girl' | 'boy', ageInMonths: number, height: number): GrowthStatus {
  const chart = gender === 'boy' ? HEIGHT_BOYS : HEIGHT_GIRLS;
  const closestMonth = getClosestMonth(Object.keys(chart).map(Number), ageInMonths);
  const bounds = chart[closestMonth as keyof typeof chart];
  
  if (!bounds) return { status: 'gray', label: 'Sin datos', description: 'No hay datos de referencia para esta edad.' };

  const [minHeight, medianHeight] = bounds;

  if (height < minHeight) {
    return { status: 'yellow', label: 'Talla baja', description: 'La estatura está por debajo del rango esperado para su edad.' };
  }
  
  return { status: 'green', label: 'Talla saludable', description: 'La estatura es adecuada para su edad.' };
}

// Keep the old functions for backward compatibility if needed, but they are now wrapper around the new ones
export function getWeightColor(gender: 'girl' | 'boy', ageInMonths: number, weight: number): 'green' | 'yellow' | 'red' | 'gray' {
  return getWeightStatus(gender, ageInMonths, weight).status;
}

export function getHeightColor(gender: 'girl' | 'boy', ageInMonths: number, height: number): 'green' | 'yellow' | 'red' | 'gray' {
  return getHeightStatus(gender, ageInMonths, height).status;
}
