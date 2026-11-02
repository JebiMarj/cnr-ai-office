export type OutfitId = 'suit' | 'vp' | 'blazer' | 'workjacket' | 'cardigan' | 'hoodie' | 'polo' | 'creative'

export type Look = {
  outfit: OutfitId
  skin: string
  hair: string
  top: string
  shirt: string
  pants: string
  shoes: string
  accent: string
  tie?: boolean
  glasses?: boolean
  headset?: boolean
  tablet?: boolean
}

export const LOOKS: Record<string, Look> = {
  jv: { outfit: 'suit', skin: '#e4b48f', hair: '#2a241c', top: '#2a2832', shirt: '#f4efe6', pants: '#1a1822', shoes: '#141218', accent: '#FDBE6A', tie: true },
  marj: { outfit: 'vp', skin: '#d9a07a', hair: '#1c120e', top: '#6e2448', shirt: '#f7f1ea', pants: '#2a1830', shoes: '#241018', accent: '#FDBE6A' },
  alex: { outfit: 'blazer', skin: '#c68642', hair: '#1a120e', top: '#2c3348', shirt: '#f4efe6', pants: '#243044', shoes: '#1a1c24', accent: '#F6F1E8', tablet: true },
  mechanicus: { outfit: 'workjacket', skin: '#8d5524', hair: '#16110e', top: '#c46a22', shirt: '#2a211c', pants: '#2c261c', shoes: '#3a2a18', accent: '#1a120e' },
  sage: { outfit: 'cardigan', skin: '#f0d2c0', hair: '#5c534a', top: '#c9a06a', shirt: '#f7f3ec', pants: '#3e382f', shoes: '#2a2420', accent: '#2a241c', glasses: true },
  dev: { outfit: 'hoodie', skin: '#d4a574', hair: '#241818', top: '#3a2030', shirt: '#E4386E', pants: '#2a2030', shoes: '#1a141c', accent: '#E4386E' },
  tech: { outfit: 'polo', skin: '#a86b45', hair: '#3a2a22', top: '#e7a27a', shirt: '#f3e6dc', pants: '#243040', shoes: '#1a1c20', accent: '#1a2830', headset: true },
  gia: { outfit: 'creative', skin: '#f1c7b0', hair: '#6b2148', top: '#E4386E', shirt: '#f6e2c4', pants: '#1e4552', shoes: '#e7b84a', accent: '#FDBE6A' },
}

export function lookFor(slug: string): Look {
  return LOOKS[slug] ?? LOOKS.alex!
}
