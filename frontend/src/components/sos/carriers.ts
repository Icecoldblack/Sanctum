export interface Carrier {
  id: string
  label: string
  src: string
  alt: string
}

export const carriers: Carrier[] = [
  {
    id: 'fern',
    label: 'Fern leaves',
    src: '/carriers/fern.png',
    alt: 'a peaceful close-up of lush green fern leaves with soft morning dew and natural lighting',
  },
  {
    id: 'forest',
    label: 'Forest canopy',
    src: '/carriers/forest.png',
    alt: 'sunlight streaming through a dense canopy of tall forest trees creating a warm ethereal atmosphere',
  },
  {
    id: 'mountains',
    label: 'Misty mountains',
    src: '/carriers/mountains.png',
    alt: 'misty mountain peaks during dawn with soft blue and grey tones and a serene mood',
  },
]
