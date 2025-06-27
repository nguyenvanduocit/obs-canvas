<script setup lang="ts">
import { VueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { ref, onMounted } from 'vue'
import { useVueFlow } from '@vue-flow/core'
import type { Node, Edge } from '@vue-flow/core'
import CanvasNode from './components/CanvasNode.vue'
import { loadCanvasForVueFlow } from './utils/canvasLoader'

const { onInit, fitView } = useVueFlow()

const nodes = ref<Node[]>([])
const edges = ref<Edge[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)
const gistInfo = ref<{ username: string; gistId: string } | null>(null)

// Register custom node types
const nodeTypes = {
  canvas: CanvasNode
}

/**
 * Parses the current URL to extract username and gist ID
 * @returns Object with username and gistId, or null if invalid format
 */
function parseUrlForGistInfo(): { username: string; gistId: string } | null {
  const pathname = window.location.pathname

  // Remove leading slash and split by slash
  const parts = pathname.replace(/^\//, '').split('/')

  // Expected format: /{username}/{gistId}
  if (parts.length === 2 && parts[0] && parts[1]) {
    return {
      username: parts[0],
      gistId: parts[1]
    }
  }

  return null
}

/**
 * Constructs Gist URL from username and gist ID
 * @param username - GitHub username
 * @param gistId - The Gist ID
 * @returns Full Gist URL
 */
function constructGistUrl(username: string, gistId: string): string {
  return `https://gist.github.com/${username}/${gistId}`
}

/**
 * Loads the canvas file from Gist and converts it to VueFlow format
 */
async function loadCanvas() {
  try {
    isLoading.value = true
    error.value = null

    const parsedGistInfo = parseUrlForGistInfo()
    if (!parsedGistInfo) {
      throw new Error('Invalid URL format. Expected: /{username}/{gistId}')
    }

    gistInfo.value = parsedGistInfo
    console.log(`Loading canvas from Gist: ${parsedGistInfo.username}/${parsedGistInfo.gistId}`)

    const gistUrl = constructGistUrl(parsedGistInfo.username, parsedGistInfo.gistId)
    const { nodes: canvasNodes, edges: canvasEdges } = await loadCanvasForVueFlow(gistUrl)

    // Convert all nodes to use our custom canvas node type
    nodes.value = canvasNodes.map(node => ({
      ...node,
      type: 'canvas'
    }))

    edges.value = canvasEdges

    console.log(`Loaded ${nodes.value.length} nodes and ${edges.value.length} edges from Gist`)
  } catch (err) {
    console.error('Failed to load canvas from Gist:', err)
    error.value = err instanceof Error ? err.message : 'Failed to load canvas file from Gist'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadCanvas()
})

onInit((instance) => {
  // Fit view after nodes are loaded
  setTimeout(() => {
    fitView({ padding: 50 })
  }, 100)
})
</script>

<template>
  <div class="app-container">
    <!-- Loading state -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-content">
        <div class="spinner"></div>
        <p>Loading canvas from Gist...</p>
        <p class="gist-info" v-if="gistInfo">
          {{ gistInfo.username }}/{{ gistInfo.gistId }}
        </p>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-overlay">
      <div class="error-content">
        <h3>Error Loading Canvas</h3>
        <p>{{ error }}</p>
        <p class="gist-info" v-if="gistInfo">
          {{ gistInfo.username }}/{{ gistInfo.gistId }}
        </p>
        <div class="url-help">
          <p><strong>URL Format:</strong></p>
          <code>https://canvas.aiocean.app/{username}/{gistId}</code>
          <p><strong>Example:</strong></p>
          <code>https://canvas.aiocean.app/nguyenvanduocit/66b2cc8bbef5f299772fb486a9b36a11</code>
        </div>
        <button @click="loadCanvas" class="retry-button">Retry</button>
      </div>
    </div>

    <!-- VueFlow canvas -->
    <VueFlow v-else class="vue-flow" :nodes="nodes" :edges="edges" :node-types="nodeTypes" :min-zoom="0.1" :max-zoom="2"
      fit-view-on-init>
      <Background :size="4" :gap="35" />
    </VueFlow>
  </div>
</template>

<style scoped>
.app-container {
  width: 100vw;
  height: 100vh;
  position: relative;
}

.vue-flow {
  width: 100%;
  height: 100%;
}

.loading-overlay,
.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  z-index: 1000;
}

.loading-content,
.error-content {
  text-align: center;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-width: 500px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.error-content h3 {
  color: #e74c3c;
  margin: 0 0 1rem 0;
}

.error-content p {
  color: #666;
  margin: 0 0 1rem 0;
}

.gist-info {
  font-size: 12px;
  color: #888;
  font-family: monospace;
  margin: 0.5rem 0;
}

.url-help {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
  margin: 1rem 0;
  text-align: left;
}

.url-help p {
  margin: 0.5rem 0;
  font-size: 14px;
}

.url-help code {
  background: #e9ecef;
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  font-family: monospace;
  font-size: 12px;
  display: block;
  margin: 0.25rem 0;
  word-break: break-all;
}

.retry-button {
  background: #3498db;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  margin-top: 1rem;
}

.retry-button:hover {
  background: #2980b9;
}

</style>