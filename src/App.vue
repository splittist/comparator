<script setup lang="ts">
import { ref, computed } from 'vue';
import FileDropzone from './components/FileDropzone.vue';
import PairBuilder from './components/PairBuilder.vue';
import DiffViewer from './components/DiffViewer.vue';
import { computeDiff } from './lib/diff-engine';
import type { ComparisonPair, DiffResult } from './lib/types';

type Step = 'upload' | 'configure' | 'results';

const step = ref<Step>('upload');
const uploadedFiles = ref<File[]>([]);
const diffResults = ref<DiffResult[]>([]);

function onFilesAdded(files: File[]) {
  uploadedFiles.value = files;
}

function goToConfigure() {
  if (uploadedFiles.value.length >= 2) {
    step.value = 'configure';
  }
}

function goBack() {
  if (step.value === 'configure') {
    step.value = 'upload';
  } else if (step.value === 'results') {
    step.value = 'configure';
  }
}

async function onCompare(pairs: ComparisonPair[]) {
  // Initialise all results as pending
  diffResults.value = pairs.map((p) => ({
    id: p.id,
    resultBlob: null,
    oldFileName: p.oldFile.name,
    newFileName: p.newFile.name,
    status: 'computing' as const,
  }));

  step.value = 'results';

  // Run diffs sequentially to avoid overwhelming the browser
  for (const pair of pairs) {
    const idx = diffResults.value.findIndex((r) => r.id === pair.id);
    const result = await computeDiff(pair);
    diffResults.value[idx] = result;
  }
}

const canProceed = computed(() => uploadedFiles.value.length >= 2);
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="header-inner">
        <h1 class="app-title">
          <span class="logo">🔀</span> DOCX Comparator
        </h1>
        <p class="app-subtitle">Compare Word documents and review tracked changes</p>
      </div>
    </header>

    <!-- Step indicator -->
    <div class="steps-bar">
      <div class="steps-inner">
        <div
          v-for="(label, i) in ['Upload', 'Configure', 'Results']"
          :key="label"
          class="step"
          :class="{
            active: ['upload', 'configure', 'results'][i] === step,
            done:
              (i === 0 && (step === 'configure' || step === 'results')) ||
              (i === 1 && step === 'results'),
          }"
        >
          <div class="step-dot">{{ i + 1 }}</div>
          <span>{{ label }}</span>
        </div>
      </div>
    </div>

    <main class="main-content">
      <!-- Upload step -->
      <section v-if="step === 'upload'">
        <FileDropzone @files-added="onFilesAdded" />
        <div class="step-actions">
          <button
            class="btn-primary"
            :disabled="!canProceed"
            @click="goToConfigure"
          >
            Next: Configure Pairs →
          </button>
          <p v-if="uploadedFiles.length === 1" class="hint">
            Add at least one more file to continue.
          </p>
        </div>
      </section>

      <!-- Configure step -->
      <section v-else-if="step === 'configure'">
        <PairBuilder :files="uploadedFiles" @compare="onCompare" />
        <div class="step-actions">
          <button class="btn-ghost" @click="goBack">← Back to Upload</button>
        </div>
      </section>

      <!-- Results step -->
      <section v-else-if="step === 'results'">
        <div class="results-header">
          <h2>Comparison Results</h2>
          <button class="btn-ghost" @click="goBack">← Back to Configure</button>
        </div>
        <div class="results-list">
          <DiffViewer
            v-for="result in diffResults"
            :key="result.id"
            :result="result"
          />
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f1f5f9;
}

.app-header {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 20px 0;
}

.header-inner {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 24px;
}

.app-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo {
  font-size: 1.4rem;
}

.app-subtitle {
  font-size: 0.875rem;
  color: #64748b;
  margin-top: 4px;
}

.steps-bar {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 14px 0;
}

.steps-inner {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  gap: 32px;
}

.step {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  color: #94a3b8;
  font-weight: 500;
}

.step.active {
  color: #3b82f6;
}

.step.done {
  color: #10b981;
}

.step-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
}

.step.active .step-dot {
  background: #3b82f6;
  color: white;
}

.step.done .step-dot {
  background: #10b981;
  color: white;
}

.main-content {
  max-width: 900px;
  margin: 0 auto;
  padding: 32px 24px;
  width: 100%;
  flex: 1;
}

.step-actions {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.hint {
  font-size: 0.8rem;
  color: #94a3b8;
}

.btn-primary {
  padding: 10px 28px;
  background: #3b82f6;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
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

.btn-ghost {
  padding: 8px 18px;
  background: none;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #64748b;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-ghost:hover {
  background: #f8fafc;
}

.results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.results-header h2 {
  font-size: 1.2rem;
  font-weight: 600;
  color: #1e293b;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
</style>
