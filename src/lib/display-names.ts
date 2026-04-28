function middleTruncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  if (maxLength <= 3) return value.slice(0, maxLength);

  const charsToShow = maxLength - 3;
  const startLength = Math.ceil(charsToShow / 2);
  const endLength = Math.floor(charsToShow / 2);

  return `${value.slice(0, startLength)}...${value.slice(value.length - endLength)}`;
}

function isUnique(values: string[]): boolean {
  return new Set(values).size === values.length;
}

function getMinimalUniqueSuffixLength(values: string[]): number | null {
  const lowerValues = values.map((value) => value.toLowerCase());
  const maxLength = Math.max(...lowerValues.map((value) => value.length));

  for (let suffixLength = 1; suffixLength <= maxLength; suffixLength += 1) {
    const suffixes = lowerValues.map((value) => value.slice(-suffixLength));
    if (isUnique(suffixes)) {
      return suffixLength;
    }
  }

  return null;
}

export function buildDisambiguatedLabels(names: string[], maxLength = 48): string[] {
  const labels = names.map((name) => middleTruncate(name, maxLength));
  const indicesByLabel = new Map<string, number[]>();

  labels.forEach((label, idx) => {
    const key = label.toLowerCase();
    const existing = indicesByLabel.get(key) ?? [];
    existing.push(idx);
    indicesByLabel.set(key, existing);
  });

  for (const collidingIndices of indicesByLabel.values()) {
    if (collidingIndices.length <= 1) continue;

    const collidingNames = collidingIndices.map((idx) => names[idx]);
    const suffixLength = getMinimalUniqueSuffixLength(collidingNames);

    if (suffixLength !== null) {
      collidingIndices.forEach((idx) => {
        const suffix = names[idx].slice(-suffixLength);
        const token = `[${suffix}]`;
        const baseLength = Math.max(8, maxLength - token.length - 1);
        labels[idx] = `${middleTruncate(names[idx], baseLength)} ${token}`;
      });
      continue;
    }

    // Fully duplicate names cannot be disambiguated by text alone, so add a stable index token.
    collidingIndices.forEach((idx, dupIdx) => {
      const token = `(#${dupIdx + 1})`;
      const baseLength = Math.max(8, maxLength - token.length - 1);
      labels[idx] = `${middleTruncate(names[idx], baseLength)} ${token}`;
    });
  }

  return labels;
}
