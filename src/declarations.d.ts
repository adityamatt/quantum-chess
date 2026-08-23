declare module '*.css' {
  const content: Record<string, string>
  export default content
}

import { MeshLineGeometry, MeshLineMaterial } from 'meshline'

declare module '@react-three/fiber' {
  interface ThreeElements {
    meshLineGeometry: JSX.IntrinsicElements['mesh'] & { points?: number[] }
    meshLineMaterial: JSX.IntrinsicElements['meshStandardMaterial'] & {
      lineWidth?: number
      color?: string
      depthTest?: boolean
      transparent?: boolean
      opacity?: number
    }
  }
}