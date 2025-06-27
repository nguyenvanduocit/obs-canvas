<template>
  <div class="canvas-node" @mouseenter="onNodeEnter" @mouseleave="onNodeLeave">
    <div class="node-header" v-if="data.originalType === 'file'">
      <svg class="file-icon" viewBox="0 0 24 24" width="16" height="16">
        <path fill="currentColor"
          d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
      </svg>
      <span class="file-name">{{ data.label }}</span>
    </div>

    <div ref="nodeContentRef" class="node-content" :class="{ 'with-header': data.originalType === 'file' }"
      @wheel="handleWheel">
      <div v-if="data.originalType === 'text'" class="text-content" v-html="formattedContent"></div>
      <div v-else-if="data.originalType === 'file'" class="file-content">
        <p class="file-path">{{ data.content }}</p>
      </div>
    </div>
  </div>
  <!-- Connection handles -->
  <Handle id="top" type="target" :position="Position.Top" class="handle-top" />
  <Handle id="bottom" type="source" :position="Position.Bottom" class="handle-bottom" />
  <Handle id="left" type="target" :position="Position.Left" class="handle-left" />
  <Handle id="right" type="source" :position="Position.Right" class="handle-right" />
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'
import { computed, ref } from 'vue'
import { marked } from 'marked'

interface CanvasNodeData {
  id: string
  label: string
  content: string
  originalType: string
  width: number
  height: number
  color?: string
}

// Extend NodeProps with our custom data type
interface Props extends NodeProps<CanvasNodeData> { }

const props = defineProps<Props>()

const nodeContentRef = ref<HTMLElement>()
const isHovered = ref(false)

/**
 * Formats text content using the marked library for complete markdown support
 * Converts markdown syntax to HTML with proper parsing and sanitization
 */
const formattedContent = computed(() => {
  if (!props.data.content) return ''

  try {
    // Configure marked options for better rendering
    marked.setOptions({
      breaks: true, // Convert line breaks to <br>
      gfm: true, // Enable GitHub Flavored Markdown
    })

    // Parse markdown to HTML
    return marked.parse(props.data.content)
  } catch (error) {
    console.error('Error parsing markdown:', error)
    // Fallback to plain text with line breaks
    return props.data.content.replace(/\n/g, '<br>')
  }
})

/**
 * Handles mouse enter event on the node
 * Sets hover state to enable scroll interception
 */
function onNodeEnter() {
  isHovered.value = true
}

/**
 * Handles mouse leave event on the node
 * Disables hover state to restore normal canvas scroll
 */
function onNodeLeave() {
  isHovered.value = false
}

/**
 * Handles wheel events on the node content
 * Prevents scroll propagation to canvas when content is scrollable
 * @param event - The wheel event
 */
function handleWheel(event: WheelEvent) {
  if (!nodeContentRef.value || !isHovered.value) return

  const element = nodeContentRef.value
  const { scrollTop, scrollHeight, clientHeight } = element

  // Check if content is scrollable
  const isScrollable = scrollHeight > clientHeight

  if (!isScrollable) {
    // If content is not scrollable, allow canvas scroll
    return
  }

  // Check scroll boundaries
  const isScrollingUp = event.deltaY < 0
  const isScrollingDown = event.deltaY > 0
  const isAtTop = scrollTop === 0
  const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1

  // Prevent canvas scroll if we're scrolling within the node boundaries
  // && !isAtTop
  // !isAtBottom
  if ((isScrollingUp) || (isScrollingDown)) {
    event.stopPropagation()
  }

  // Allow normal scroll behavior within the node
  // The browser will handle the actual scrolling
}
</script>

<style scoped>
.canvas-node {
  overflow: hidden;
  position: relative;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  width: 100%;
  height: 100%;
  /* Add transition for smooth hover effects */
    transition: box-shadow 0.2s ease;
  }
  
  /* Visual feedback when hovering over scrollable content */
  .canvas-node:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.node-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.05);
  border-bottom: 1px solid #eee;
  font-size: 12px;
  font-weight: 500;
  color: #666;
}

.file-icon {
  flex-shrink: 0;
}

.file-name {
  truncate: true;
  overflow: hidden;
  white-space: nowrap;
}

.node-content {
  padding: 12px;
  height: 100%;
  overflow: auto;
  font-size: 13px;
  line-height: 1.4;
  /* Improve scroll behavior */
    scroll-behavior: smooth;
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 0, 0, 0.3) transparent;
  }
  
  /* Custom scrollbar for webkit browsers */
  .node-content::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  
  .node-content::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .node-content::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
  }
  
  .node-content::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.4);
  }
  
  /* Show scrollbar on hover */
  .canvas-node:hover .node-content::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.3);
}

.node-content.with-header {
  height: calc(100% - 45px);
}

.text-content {
  color: #333;
  box-sizing: border-box;
  cursor: default;
  display: block;
  font-family: Helvetica, -apple-system, "system-ui", sans-serif;
  font-size: 18px;
  font-style: normal;
  line-height: 27px;
  margin-block-end: 18px;
  margin-block-start: 0px;
  margin-inline-end: 0px;
  margin-inline-start: 0px;
  margin-top: 0px;
  overflow-wrap: break-word;
  pointer-events: auto;
  tab-size: 4;
  text-rendering: optimizelegibility;
  unicode-bidi: plaintext;
  user-select: text;
  -webkit-tap-highlight-color: rgba(255, 255, 255, 0);
}

.text-content :deep(h1) {
  box-sizing: border-box;
  color-scheme: dark;
  cursor: default;
  display: block;
  font-family: Helvetica, -apple-system, "system-ui", sans-serif;
  font-size: 30.6px;
  font-style: normal;
  font-variant-alternates: normal;
  font-variant-caps: normal;
  font-variant-east-asian: normal;
  font-variant-emoji: normal;
  font-variant-ligatures: normal;
  font-variant-numeric: normal;
  font-variant-position: normal;
  font-weight: 700;
  height: 73.4062px;
  letter-spacing: -1.53px;
  line-height: 36.72px;
  margin-block-end: 18px;
  margin-block-start: 0px;
  margin-inline-end: 0px;
  margin-inline-start: 0px;
  margin-top: 0px;
  overflow-wrap: break-word;
  pointer-events: auto;
  tab-size: 4;
  text-rendering: optimizelegibility;
  unicode-bidi: isolate;
  user-select: text;
  width: 514px;
  -webkit-tap-highlight-color: rgba(255, 255, 255, 0);
}

.text-content :deep(h2) {
  box-sizing: border-box;
  color-scheme: dark;
  cursor: default;
  display: block;
  font-family: Helvetica, -apple-system, "system-ui", sans-serif;
  font-size: 24px;
  font-style: normal;
  font-variant-alternates: normal;
  font-variant-caps: normal;
  font-variant-east-asian: normal;
  font-variant-emoji: normal;
  font-variant-ligatures: normal;
  font-variant-numeric: normal;
  font-variant-position: normal;
  font-weight: 600;
  letter-spacing: -0.8px;
  line-height: 28.8px;
  margin-block-end: 16px;
  margin-block-start: 0px;
  margin-inline-end: 0px;
  margin-inline-start: 0px;
  margin-top: 0px;
  overflow-wrap: break-word;
  pointer-events: auto;
  tab-size: 4;
  text-rendering: optimizelegibility;
  unicode-bidi: isolate;
  user-select: text;
  -webkit-tap-highlight-color: rgba(255, 255, 255, 0);
}

.text-content :deep(h3) {
  box-sizing: border-box;
  color-scheme: dark;
  cursor: default;
  display: block;
  font-family: Helvetica, -apple-system, "system-ui", sans-serif;
  font-size: 20px;
  font-style: normal;
  font-variant-alternates: normal;
  font-variant-caps: normal;
  font-variant-east-asian: normal;
  font-variant-emoji: normal;
  font-variant-ligatures: normal;
  font-variant-numeric: normal;
  font-variant-position: normal;
  font-weight: 600;
  letter-spacing: -0.5px;
  line-height: 24px;
  margin-block-end: 14px;
  margin-block-start: 0px;
  margin-inline-end: 0px;
  margin-inline-start: 0px;
  margin-top: 0px;
  overflow-wrap: break-word;
  pointer-events: auto;
  tab-size: 4;
  text-rendering: optimizelegibility;
  unicode-bidi: isolate;
  user-select: text;
  -webkit-tap-highlight-color: rgba(255, 255, 255, 0);
}

.text-content :deep(h4) {
  box-sizing: border-box;
  color-scheme: dark;
  cursor: default;
  display: block;
  font-family: Helvetica, -apple-system, "system-ui", sans-serif;
  font-size: 18px;
  font-style: normal;
  font-variant-alternates: normal;
  font-variant-caps: normal;
  font-variant-east-asian: normal;
  font-variant-emoji: normal;
  font-variant-ligatures: normal;
  font-variant-numeric: normal;
  font-variant-position: normal;
  font-weight: 600;
  letter-spacing: -0.3px;
  line-height: 21.6px;
  margin-block-end: 12px;
  margin-block-start: 0px;
  margin-inline-end: 0px;
  margin-inline-start: 0px;
  margin-top: 0px;
  overflow-wrap: break-word;
  pointer-events: auto;
  tab-size: 4;
  text-rendering: optimizelegibility;
  unicode-bidi: isolate;
  user-select: text;
  -webkit-tap-highlight-color: rgba(255, 255, 255, 0);
}

.file-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
  text-align: center;
}

.file-path {
  font-size: 12px;
  color: #888;
  margin: 0;
  word-break: break-all;
}

/* Connection handles */
.handle-top {
  top: -4px;
  left: 50%;
  transform: translateX(-50%);
}

.handle-bottom {
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
}

.handle-left {
  left: -4px;
  top: 50%;
  transform: translateY(-50%);
}

.handle-right {
  right: -4px;
  top: 50%;
  transform: translateY(-50%);
}

:deep(.vue-flow__handle) {
  width: 8px;
  height: 8px;
  background: #555;
  border: 2px solid white;
  border-radius: 50%;
}

:deep(.vue-flow__handle:hover) {
  background: #333;
}
</style>