/**
 * Canvas file loader utility for VueFlow
 * Converts Obsidian Canvas format to VueFlow nodes and edges
 *
 * Usage examples:
 * - Local file: loadCanvasFile('canvas/my-canvas.canvas')
 * - GitHub Gist: loadCanvasFile('https://gist.github.com/username/gist_id')
 * - Raw Gist URL: loadCanvasFile('https://gist.githubusercontent.com/username/gist_id/raw/filename.canvas')
 */

import type { Node, Edge } from '@vue-flow/core'

export interface CanvasNode {
  id: string
  type: string
  text?: string
  file?: string
  x: number
  y: number
  width: number
  height: number
  color?: string
}

export interface CanvasEdge {
  id: string
  fromNode: string
  fromSide: string
  toNode: string
  toSide: string
  color?: string
}

export interface CanvasData {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}

/**
 * Checks if the provided path is a GitHub Gist URL
 * @param path - File path or URL to check
 * @returns True if it's a Gist URL, false otherwise
 */
function isGistUrl(path: string): boolean {
  return path.includes('gist.github.com') || path.includes('gist.githubusercontent.com')
}

/**
 * Converts a GitHub Gist URL to raw content URL
 * @param gistUrl - GitHub Gist URL
 * @returns Raw content URL for the Gist file
 */
function convertGistToRawUrl(gistUrl: string): string {
  // Handle different Gist URL formats
  if (gistUrl.includes('gist.githubusercontent.com')) {
    // Already a raw URL
    return gistUrl
  }

  if (gistUrl.includes('gist.github.com')) {
    // Convert from gist.github.com to raw URL
    // Format: https://gist.github.com/username/gist_id
    // Or: https://gist.github.com/username/gist_id#file-filename-ext
    // To: https://gist.githubusercontent.com/username/gist_id/raw/filename

    // Remove fragment identifier if present
    const cleanUrl = gistUrl.split('#')[0]

    // Extract username and gist ID from URL
    const gistMatch = cleanUrl.match(/gist\.github\.com\/([^\/]+)\/([a-f0-9]+)/i)
    if (gistMatch) {
      const username = gistMatch[1]
      const gistId = gistMatch[2]

      // Check if there's a specific file mentioned in the fragment
      const fragmentMatch = gistUrl.match(/#file-(.+)/)
      if (fragmentMatch) {
        // Convert fragment format to actual filename
        const filename = fragmentMatch[1].replace(/-/g, '.')
        return `https://gist.githubusercontent.com/${username}/${gistId}/raw/${filename}`
      }

      // If no specific file, return the raw URL without filename
      // GitHub will serve the first file in the gist
      return `https://gist.githubusercontent.com/${username}/${gistId}/raw/`
    }
  }

  return gistUrl
}

/**
 * Loads and parses a canvas file from local public directory or GitHub Gist
 * @param filePath - Path to the canvas file (local path relative to public directory or Gist URL)
 * @returns Promise containing parsed canvas data
 */
export async function loadCanvasFile(filePath: string): Promise<CanvasData> {
  try {
    let url: string

    if (isGistUrl(filePath)) {
      // Handle Gist URL
      url = convertGistToRawUrl(filePath)
    } else {
      throw new Error('Invalid file path')
    }

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to load canvas file: ${response.statusText}`)
    }

    const canvasData = await response.json()
    return canvasData as CanvasData
  } catch (error) {
    console.error('Error loading canvas file:', error)
    throw error
  }
}

/**
 * Darkens a color by mixing it with black
 * @param color - Color in hex format (e.g., '#ff0000') or rgb format
 * @param percentage - Percentage of black to mix (0-100)
 * @returns Darkened color in rgb format
 */
function darkenColor(color: string, percentage: number = 20): string {
  // Default color if none provided
  if (!color) {
    return 'rgb(200, 200, 200)' // Medium gray
  }

  // Handle hex colors
  if (color.startsWith('#')) {
    const hex = color.slice(1)
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    
    // Mix with black
    const factor = percentage / 100
    const newR = Math.round(r * (1 - factor))
    const newG = Math.round(g * (1 - factor))
    const newB = Math.round(b * (1 - factor))
    
    return `rgb(${newR}, ${newG}, ${newB})`
  }

  // Handle rgb colors
  if (color.startsWith('rgb')) {
    const matches = color.match(/\d+/g)
    if (matches && matches.length >= 3) {
      const r = parseInt(matches[0])
      const g = parseInt(matches[1])
      const b = parseInt(matches[2])
      
      // Mix with black
      const factor = percentage / 100
      const newR = Math.round(r * (1 - factor))
      const newG = Math.round(g * (1 - factor))
      const newB = Math.round(b * (1 - factor))
      
      return `rgb(${newR}, ${newG}, ${newB})`
    }
  }

  // Fallback for unknown formats
  return 'rgb(200, 200, 200)'
}


/**
 * Converts canvas nodes to VueFlow nodes
 * @param canvasNodes - Array of canvas nodes
 * @returns Array of VueFlow nodes
 */
export function convertNodesToVueFlow(canvasNodes: CanvasNode[]): Node[] {
  // only keep type 'text' and 'file'
  const filteredNodes = canvasNodes.filter((node) => node.type === 'text' || node.type === 'file')

  return filteredNodes.map((node) => {
    const originalBackgroundColor = node.color || '#1c2127'
    const backgroundColor = node.color ? darkenColor(originalBackgroundColor, 70) : '#1c2127'
    const borderColor = node.color ? darkenColor(originalBackgroundColor, 30) : '#a1a1a1'

    return {
      id: node.id,
      type: getVueFlowNodeType(node.type),
      position: { x: node.x, y: node.y },

      data: {
        label: getNodeLabel(node),
        content: node.text || node.file || '',
        originalType: node.type,
        width: node.width,
        height: node.height,
        color: node.color,
      },
      style: {
        backgroundColor: backgroundColor,
        border: `4px solid ${borderColor}`,
        borderRadius: '8px',
        fontSize: '14px',
      },
    }
  })
}

/**
 * Converts canvas edges to VueFlow edges
 * @param canvasEdges - Array of canvas edges
 * @returns Array of VueFlow edges
 */
export function convertEdgesToVueFlow(canvasEdges: CanvasEdge[]): Edge[] {
  return canvasEdges.map((edge) => ({
    id: edge.id,
    source: edge.fromNode,
    target: edge.toNode,
    sourceHandle: edge.fromSide,
    targetHandle: edge.toSide,
    style: {
      stroke: darkenColor(edge.color || '#b1b1b7', 50),
      strokeWidth: 10,
    },
    type: 'default',
  }))
}

/**
 * Maps canvas node types to VueFlow node types
 * @param canvasType - Canvas node type
 * @returns VueFlow node type
 */
function getVueFlowNodeType(canvasType: string): string {
  switch (canvasType) {
    case 'text':
      return 'default'
    case 'file':
      return 'input'
    default:
      return 'default'
  }
}

/**
 * Generates appropriate label for a node based on its content
 * @param node - Canvas node
 * @returns Node label
 */
function getNodeLabel(node: CanvasNode): string {
  if (node.text) {
    // Extract first line or first 50 characters as label
    const firstLine = node.text.split('\n')[0]
    return firstLine.length > 50 ? firstLine.substring(0, 47) + '...' : firstLine
  }

  if (node.file) {
    // Extract filename from path
    return node.file.split('/').pop() || node.file
  }

  return `${node.type} node`
}

/**
 * Main function to load and convert canvas file to VueFlow format
 * @param filePath - Path to canvas file (local path relative to public directory or GitHub Gist URL)
 * @returns Promise with VueFlow nodes and edges
 */
export async function loadCanvasForVueFlow(filePath: string): Promise<{
  nodes: Node[]
  edges: Edge[]
}> {
  const canvasData = await loadCanvasFile(filePath)

  const nodes = convertNodesToVueFlow(canvasData.nodes)
  const edges = convertEdgesToVueFlow(canvasData.edges)

  return { nodes, edges }
}
