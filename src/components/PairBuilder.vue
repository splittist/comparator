<script setup lang="ts">
import { ref, computed } from 'vue';
import type { ComparisonPair } from '../lib/types';

const props = defineProps<{
  files: File[];
}>();

const emit = defineEmits<{
  compare: [pairs: ComparisonPair[]];
}>();

interface PairEntry {
  id: string;
  oldFileIndex: number | null;
  newFileIndex: number | null;
  label: string;
}

const pairs = ref<PairEntry[]>([{ id: crypto.randomUUID(), oldFileIndex: null, newFileIndex: null, label: '' }]);

function addPair() {
  pairs.value.push({ id: crypto.randomUUID(), oldFileIndex: null, newFileIndex: null, label: '' });
}

function removePair(idx: number) {
  pairs.value = pairs.value.filter((_, i) => i !== idx);
}

const canCompare = computed(() =>
  pairs.value.length > 0 &&
  pairs.value.every(
    (p) =>
      p.oldFileIndex !== null &&
      p.newFileIndex !== null &&
      p.oldFileIndex !== p.newFileIndex,
  ),
);

function startCompare() {
  const result: ComparisonPair[] = pairs.value
    .filter((p) => p.oldFileIndex !== null && p.newFileIndex !== null)
    .map((p) => ({
      id: p.id,
      oldFile: props.files[p.oldFileIndex!],
      newFile: props.files[p.newFileIndex!],
      label: p.label || `${props.files[p.oldFileIndex!].name} → ${props.files[p.newFileIndex!].name}`,
    }));
  emit('compare', result);
}

function getFileName(index: number | null): string {
  if (index === null) return '';
  return props.files[index]?.name ?? '';
}
</script>

<template>
  <div class="pair-builder">
    <div class="section-header">
      <h2>Configure Comparisons</h2>
      <p class="hint">Select an "old" and "new" file for each comparison pair.</p>
    </div>

    <div v-if="files.length < 2" class="empty-notice">
      Upload at least 2 files to create comparison pairs.
    </div>

    <template v-else>
      <div v-for="(pair, idx) in pairs" :key="pair.id" class="pair-card">
        <div class="pair-number">Pair {{ idx + 1 }}</div>

        <div class="pair-fields">
          <div class="pair-field">
            <label>Old (base) document</label>
            <select
              :value="pair.oldFileIndex ?? ''"
              @change="pair.oldFileIndex = ($event.target as HTMLSelectElement).value === '' ? null : Number(($event.target as HTMLSelectElement).value)"
            >
              <option value="">-- Select file --</option>
              <option
                v-for="(file, fi) in files"
                :key="fi"
                :value="fi"
                :disabled="fi === pair.newFileIndex"
              >
                {{ file.name }}
              </option>
            </select>
          </div>

          <div class="pair-arrow">→</div>

          <div class="pair-field">
            <label>New (revised) document</label>
            <select
              :value="pair.newFileIndex ?? ''"
              @change="pair.newFileIndex = ($event.target as HTMLSelectElement).value === '' ? null : Number(($event.target as HTMLSelectElement).value)"
            >
              <option value="">-- Select file --</option>
              <option
                v-for="(file, fi) in files"
                :key="fi"
                :value="fi"
                :disabled="fi === pair.oldFileIndex"
              >
                {{ file.name }}
              </option>
            </select>
          </div>
        </div>

        <div class="pair-label-row">
          <input
            v-model="pair.label"
            type="text"
            placeholder="Optional label (e.g. Contract v1 vs v2)"
            class="label-input"
          />
          <button
            v-if="pairs.length > 1"
            class="remove-pair-btn"
            title="Remove pair"
            @click="removePair(idx)"
          >
            Remove
          </button>
        </div>

        <div
          v-if="pair.oldFileIndex !== null && pair.newFileIndex !== null && pair.oldFileIndex === pair.newFileIndex"
          class="pair-error"
        >
          Old and new files must be different.
        </div>
      </div>

      <div class="actions">
        <button class="btn-secondary" @click="addPair">+ Add another pair</button>
        <button class="btn-primary" :disabled="!canCompare" @click="startCompare">
          Compare All
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.pair-builder {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
}

.hint {
  font-size: 0.875rem;
  color: #64748b;
  margin-top: 4px;
}

.empty-notice {
  padding: 20px;
  text-align: center;
  color: #94a3b8;
  font-style: italic;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
}

.pair-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.pair-number {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #3b82f6;
}

.pair-fields {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.pair-field {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pair-field label {
  font-size: 0.8rem;
  font-weight: 500;
  color: #475569;
}

.pair-field select {
  padding: 8px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
  color: #1e293b;
  appearance: auto;
}

.pair-arrow {
  font-size: 1.25rem;
  color: #94a3b8;
  padding-bottom: 10px;
}

.pair-label-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.label-input {
  flex: 1;
  padding: 7px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #374151;
  background: #f8fafc;
}

.label-input:focus {
  outline: none;
  border-color: #3b82f6;
  background: white;
}

.remove-pair-btn {
  padding: 6px 14px;
  background: none;
  border: 1px solid #fca5a5;
  border-radius: 6px;
  color: #ef4444;
  font-size: 0.8rem;
  transition: background 0.15s;
}

.remove-pair-btn:hover {
  background: #fee2e2;
}

.pair-error {
  font-size: 0.8rem;
  color: #ef4444;
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-secondary {
  padding: 9px 20px;
  background: white;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-secondary:hover {
  background: #f1f5f9;
}

.btn-primary {
  padding: 9px 24px;
  background: #3b82f6;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  color: white;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  background: #93c5fd;
  cursor: not-allowed;
}
</style>
