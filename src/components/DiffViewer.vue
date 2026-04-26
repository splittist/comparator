<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';
import type { DiffResult } from '../lib/types';

const props = defineProps<{
  result: DiffResult;
}>();

const containerRef = ref<HTMLDivElement | null>(null);
let superdocInstance: unknown = null;

async function mountViewer(blob: Blob) {
  if (!containerRef.value) return;

  // Destroy any previous instance
  destroyViewer();

  try {
    const { SuperDoc } = await import('superdoc');
    const { default: superDocStyles } = await import('superdoc/style.css?inline').catch(() => ({
      default: '',
    }));

    if (superDocStyles && !document.querySelector('#superdoc-styles')) {
      const style = document.createElement('style');
      style.id = 'superdoc-styles';
      style.textContent = superDocStyles;
      document.head.appendChild(style);
    }

    const sd = new SuperDoc({
      selector: containerRef.value,
      document: {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        data: blob,
      },
      documentMode: 'viewing',
      modules: {
        trackChanges: { visible: true },
      },
    });

    superdocInstance = sd;
  } catch (err) {
    console.error('Failed to mount SuperDoc viewer:', err);
  }
}

function destroyViewer() {
  if (superdocInstance && typeof (superdocInstance as { destroy?: () => void }).destroy === 'function') {
    (superdocInstance as { destroy: () => void }).destroy();
  }
  superdocInstance = null;
  if (containerRef.value) {
    containerRef.value.innerHTML = '';
  }
}

watch(
  () => props.result,
  (result) => {
    if (result.status === 'done' && result.resultBlob) {
      mountViewer(result.resultBlob);
    }
  },
  { immediate: true },
);

onUnmounted(() => {
  destroyViewer();
});

function downloadResult() {
  if (!props.result.resultBlob) return;
  const url = URL.createObjectURL(props.result.resultBlob);
  const a = document.createElement('a');
  a.href = url;
  const base = props.result.oldFileName.replace(/\.docx$/i, '');
  a.download = `${base}_diff.docx`;
  a.click();
  URL.revokeObjectURL(url);
}
</script>

<template>
  <div class="diff-viewer">
    <div class="viewer-header">
      <div class="viewer-title">
        <span class="old-name">{{ result.oldFileName }}</span>
        <span class="arrow">→</span>
        <span class="new-name">{{ result.newFileName }}</span>
      </div>
      <button
        v-if="result.status === 'done'"
        class="btn-download"
        @click="downloadResult"
      >
        ⬇ Download DOCX
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="result.status === 'computing' || result.status === 'pending'" class="state-box loading">
      <div class="spinner" />
      <span>Computing diff…</span>
    </div>

    <!-- Error state -->
    <div v-else-if="result.status === 'error'" class="state-box error">
      <span class="error-icon">⚠</span>
      <div>
        <strong>Diff failed</strong>
        <p>{{ result.error }}</p>
      </div>
    </div>

    <!-- Viewer -->
    <div v-else-if="result.status === 'done'" ref="containerRef" class="superdoc-container" />
  </div>
</template>

<style scoped>
.diff-viewer {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
}

.viewer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.viewer-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9rem;
  overflow: hidden;
}

.old-name,
.new-name {
  font-weight: 500;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

.arrow {
  color: #94a3b8;
  flex-shrink: 0;
}

.btn-download {
  padding: 8px 18px;
  background: #10b981;
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
}

.btn-download:hover {
  background: #059669;
}

.state-box {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 32px 24px;
  margin: 20px;
  border-radius: 8px;
}

.state-box.loading {
  background: #f0f9ff;
  color: #0369a1;
}

.state-box.error {
  background: #fef2f2;
  color: #b91c1c;
}

.error-icon {
  font-size: 1.5rem;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #bae6fd;
  border-top-color: #0284c7;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.superdoc-container {
  min-height: 400px;
  width: 100%;
}
</style>
