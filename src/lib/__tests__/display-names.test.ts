import { describe, expect, it } from 'vitest';
import { buildDisambiguatedLabels } from '../display-names';

describe('buildDisambiguatedLabels', () => {
  it('keeps short names unchanged', () => {
    const result = buildDisambiguatedLabels(['a.docx', 'b.docx'], 24);
    expect(result).toEqual(['a.docx', 'b.docx']);
  });

  it('middle-truncates long names when there is no collision', () => {
    const [label] = buildDisambiguatedLabels(
      ['Company X Sale and Purchase Agreement Final Draft.docx'],
      24,
    );

    expect(label.length).toBeLessThanOrEqual(24);
    expect(label.includes('...')).toBe(true);
    expect(label.startsWith('Company')).toBe(true);
    expect(label.endsWith('.docx')).toBe(true);
  });

  it('disambiguates colliding truncated names with minimal unique suffix token', () => {
    const labels = buildDisambiguatedLabels(
      [
        'Company X Sale and Purchase Agreement VERSION_ALPHA_2026.docx',
        'Company X Sale and Purchase Agreement VERSION_BETA_2026.docx',
      ],
      24,
    );

    expect(labels[0]).not.toEqual(labels[1]);
    expect(labels[0]).toContain('[');
    expect(labels[0]).toContain(']');
    expect(labels[1]).toContain('[');
    expect(labels[1]).toContain(']');
  });

  it('disambiguates fully identical duplicate names with index token', () => {
    const labels = buildDisambiguatedLabels(
      ['Duplicate Name.docx', 'Duplicate Name.docx'],
      24,
    );

    expect(labels[0]).toContain('(#1)');
    expect(labels[1]).toContain('(#2)');
    expect(labels[0]).not.toEqual(labels[1]);
  });
});
