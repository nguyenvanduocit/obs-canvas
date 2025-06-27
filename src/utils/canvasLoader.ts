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
 * Darkens a color by mixing it with black and shifts hue to the left
 * @param color - Color in hex format (e.g., '#ff0000') or rgb format
 * @param darkenPercentage - Percentage of darkening to apply (0-100)
 * @param hueShiftDegrees - Degrees to shift hue to the left (0-360)
 * @returns Darkened color with hue shift in rgb format
 */
function darkenColor(
  color: string,
  darkenPercentage: number = 20,
  hueShiftDegrees: number = 30,
): string {
  // Default color if none provided
  if (!color) {
    return 'rgb(200, 200, 200)' // Medium gray
  }

  let r: number, g: number, b: number

  // Handle hex colors
  if (color.startsWith('#')) {
    const hex = color.slice(1)
    r = parseInt(hex.slice(0, 2), 16)
    g = parseInt(hex.slice(2, 4), 16)
    b = parseInt(hex.slice(4, 6), 16)
  }
  // Handle rgb colors
  else if (color.startsWith('rgb')) {
    const matches = color.match(/\d+/g)
    if (matches && matches.length >= 3) {
      r = parseInt(matches[0])
      g = parseInt(matches[1])
      b = parseInt(matches[2])
    } else {
      return 'rgb(200, 200, 200)'
    }
  }
  // Fallback for unknown formats
  else {
    return 'rgb(200, 200, 200)'
  }

  // Convert RGB to HSL for hue manipulation
  const rNorm = r / 255
  const gNorm = g / 255
  const bNorm = b / 255

  const max = Math.max(rNorm, gNorm, bNorm)
  const min = Math.min(rNorm, gNorm, bNorm)
  const diff = max - min

  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (diff !== 0) {
    s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min)

    switch (max) {
      case rNorm:
        h = (gNorm - bNorm) / diff + (gNorm < bNorm ? 6 : 0)
        break
      case gNorm:
        h = (bNorm - rNorm) / diff + 2
        break
      case bNorm:
        h = (rNorm - gNorm) / diff + 4
        break
    }
    h /= 6
  }

  // Shift hue to the left (subtract from hue) and darken
  const hueShift = hueShiftDegrees / 360 // Convert degrees to normalized value (0-1)
  const newH = (h - hueShift + 1) % 1 // Ensure hue stays in [0, 1] range
  const darkenFactor = darkenPercentage / 100
  const newL = Math.max(0, l * (1 - darkenFactor)) // Darken by reducing lightness

  // Convert HSL back to RGB
  const hue2rgb = (p: number, q: number, t: number): number => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }

  let newR: number, newG: number, newB: number

  if (s === 0) {
    newR = newG = newB = newL // achromatic
  } else {
    const q = newL < 0.5 ? newL * (1 + s) : newL + s - newL * s
    const p = 2 * newL - q
    newR = hue2rgb(p, q, newH + 1 / 3)
    newG = hue2rgb(p, q, newH)
    newB = hue2rgb(p, q, newH - 1 / 3)
  }

  // Convert back to 0-255 range
  const finalR = Math.round(newR * 255)
  const finalG = Math.round(newG * 255)
  const finalB = Math.round(newB * 255)

  return `rgb(${finalR}, ${finalG}, ${finalB})`
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
      stroke: edge.color,
      strokeWidth: 8,
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
 * Converts canvas nodes to VueFlow nodes
 * @param canvasNodes - Array of canvas nodes
 * @returns Array of VueFlow nodes
 */
export function convertNodesToVueFlow(canvasNodes: CanvasNode[]): Node[] {
  // only keep type 'text' and 'file'
  const filteredNodes = canvasNodes.filter((node) => node.type === 'text' || node.type === 'file')

  return filteredNodes.map((node) => {
    const originalBackgroundColor = node.color || '#1c2127'
    const backgroundColor = node.color
      ? darkenColor(originalBackgroundColor, 80, 5)
      : '#1c2127'
    const borderColor = darkenColor(originalBackgroundColor, 10, 10)

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
