<script setup lang="ts">
import { ref } from 'vue';

const emit = defineEmits<{
  'files-added': [files: File[]];
}>();

const isDragging = ref(false);
const files = ref<File[]>([]);

function handleDrop(event: DragEvent) {
  isDragging.value = false;
  const dropped = Array.from(event.dataTransfer?.files ?? []).filter((f) =>
    f.name.toLowerCase().endsWith('.docx'),
  );
  addFiles(dropped);
}

function handleFileInput(event: Event) {
  const input = event.target as HTMLInputElement;
  const selected = Array.from(input.files ?? []).filter((f) =>
    f.name.toLowerCase().endsWith('.docx'),
  );
  addFiles(selected);
  input.value = '';
}

function addFiles(newFiles: File[]) {
  const unique = newFiles.filter(
    (nf) => !files.value.some((ef) => ef.name === nf.name && ef.size === nf.size),
  );
  if (unique.length === 0) return;
  files.value = [...files.value, ...unique];
  emit('files-added', files.value);
}

function removeFile(index: number) {
  files.value = files.value.filter((_, i) => i !== index);
  emit('files-added', files.value);
}
</script>

<template>
  <div class="dropzone-wrapper">
    <div
      class="dropzone"
      :class="{ dragging: isDragging }"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
    >
      <div class="dropzone-inner">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <p class="dropzone-text">Drag &amp; drop <strong>.docx</strong> files here</p>
        <p class="dropzone-subtext">or</p>
        <label class="btn-secondary">
          Browse files
          <input
            type="file"
            accept=".docx"
            multiple
            style="display: none"
            @change="handleFileInput"
          />
        </label>
      </div>
    </div>

    <ul v-if="files.length > 0" class="file-list">
      <li v-for="(file, idx) in files" :key="file.name + file.size" class="file-item">
        <span class="file-icon">📄</span>
        <span class="file-name">{{ file.name }}</span>
        <span class="file-size">{{ (file.size / 1024).toFixed(1) }} KB</span>
        <button class="remove-btn" title="Remove file" @click="removeFile(idx)">✕</button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.dropzone-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dropzone {
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  padding: 40px 24px;
  background: #f8fafc;
  transition: border-color 0.2s, background 0.2s;
  cursor: default;
}

.dropzone.dragging {
  border-color: #3b82f6;
  background: #eff6ff;
}

.dropzone-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #64748b;
}

.dropzone-text {
  font-size: 1rem;
  color: #475569;
}

.dropzone-subtext {
  font-size: 0.875rem;
  color: #94a3b8;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  padding: 8px 20px;
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

.file-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.875rem;
}

.file-icon {
  font-size: 1.1rem;
}

.file-name {
  flex: 1;
  font-weight: 500;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  color: #94a3b8;
  white-space: nowrap;
}

.remove-btn {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 0.875rem;
  padding: 2px 6px;
  border-radius: 4px;
  transition: color 0.15s, background 0.15s;
}

.remove-btn:hover {
  color: #ef4444;
  background: #fee2e2;
}
</style>
