import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { faBolt, faCloud, faLeaf, faSeedling } from '@fortawesome/free-solid-svg-icons'
import {
  faFaceAngry,
  faFaceFlushed,
  faFaceFrownOpen,
  faFaceMeh,
  faFaceSadTear,
  faFaceSmile,
  faFaceTired,
  faHeart,
  faNoteSticky,
} from '@fortawesome/free-regular-svg-icons'

export interface EmotionConfig {
  id: string
  label: string
  icon: IconDefinition
  badgeClass: string
  dotClass: string
  selectedPillClass: string
}

export const EMOTIONS: EmotionConfig[] = [
  {
    id: 'Alegria',
    label: 'Alegria',
    icon: faFaceSmile,
    badgeClass:
      'bg-[#7B907E]/15 text-[#445646] border-[#7B907E]/35',
    dotClass: 'bg-[#7B907E]',
    selectedPillClass:
      'bg-[#7B907E] text-[#F7F5F0] border-[#7B907E]',
  },
  {
    id: 'Calma',
    label: 'Calma',
    icon: faLeaf,
    badgeClass:
      'bg-[#6D8C82]/15 text-[#3B544C] border-[#6D8C82]/35',
    dotClass: 'bg-[#6D8C82]',
    selectedPillClass:
      'bg-[#6D8C82] text-[#F7F5F0] border-[#6D8C82]',
  },
  {
    id: 'Gratidão',
    label: 'Gratidão',
    icon: faHeart,
    badgeClass:
      'bg-[#B97A6B]/18 text-[#6E3E33] border-[#B97A6B]/35',
    dotClass: 'bg-[#B97A6B]',
    selectedPillClass:
      'bg-[#B97A6B] text-[#F7F5F0] border-[#B97A6B]',
  },
  {
    id: 'Esperança',
    label: 'Esperança',
    icon: faSeedling,
    badgeClass:
      'bg-[#738D67]/15 text-[#415338] border-[#738D67]/35',
    dotClass: 'bg-[#738D67]',
    selectedPillClass:
      'bg-[#738D67] text-[#F7F5F0] border-[#738D67]',
  },
  {
    id: 'Tristeza',
    label: 'Tristeza',
    icon: faFaceSadTear,
    badgeClass:
      'bg-[#6E8594]/15 text-[#3F525E] border-[#6E8594]/35',
    dotClass: 'bg-[#6E8594]',
    selectedPillClass:
      'bg-[#6E8594] text-[#F7F5F0] border-[#6E8594]',
  },
  {
    id: 'Cansaço',
    label: 'Cansaço',
    icon: faFaceTired,
    badgeClass:
      'bg-[#857D73]/15 text-[#4F4942] border-[#857D73]/35',
    dotClass: 'bg-[#857D73]',
    selectedPillClass:
      'bg-[#857D73] text-[#F7F5F0] border-[#857D73]',
  },
  {
    id: 'Ansiedade',
    label: 'Ansiedade',
    icon: faBolt,
    badgeClass:
      'bg-[#C79B59]/20 text-[#6E5124] border-[#C79B59]/40',
    dotClass: 'bg-[#C79B59]',
    selectedPillClass:
      'bg-[#C79B59] text-[#F7F5F0] border-[#C79B59]',
  },
  {
    id: 'Sobrecarga',
    label: 'Sobrecarga',
    icon: faCloud,
    badgeClass:
      'bg-[#7A7D8C]/18 text-[#464956] border-[#7A7D8C]/35',
    dotClass: 'bg-[#7A7D8C]',
    selectedPillClass:
      'bg-[#7A7D8C] text-[#F7F5F0] border-[#7A7D8C]',
  },
  {
    id: 'Frustração',
    label: 'Frustração',
    icon: faFaceFrownOpen,
    badgeClass:
      'bg-[#B67B5B]/18 text-[#6D412B] border-[#B67B5B]/35',
    dotClass: 'bg-[#B67B5B]',
    selectedPillClass:
      'bg-[#B67B5B] text-[#F7F5F0] border-[#B67B5B]',
  },
  {
    id: 'Raiva',
    label: 'Raiva',
    icon: faFaceAngry,
    badgeClass:
      'bg-[#C98A74]/20 text-[#7C4836] border-[#C98A74]/40',
    dotClass: 'bg-[#C98A74]',
    selectedPillClass:
      'bg-[#C98A74] text-[#F7F5F0] border-[#C98A74]',
  },
  {
    id: 'Medo',
    label: 'Medo',
    icon: faFaceFlushed,
    badgeClass:
      'bg-[#8B7B94]/18 text-[#4E4156] border-[#8B7B94]/35',
    dotClass: 'bg-[#8B7B94]',
    selectedPillClass:
      'bg-[#8B7B94] text-[#F7F5F0] border-[#8B7B94]',
  },
  {
    id: 'Neutro',
    label: 'Neutro',
    icon: faFaceMeh,
    badgeClass:
      'bg-[#F7F5F0] text-[#2F3530] border-[#D7CFC2]',
    dotClass: 'bg-[#7B907E]',
    selectedPillClass:
      'bg-[#2F3530] text-[#F7F5F0] border-[#2F3530]',
  },
]

export function getEmotionConfig(emotion: string | null): EmotionConfig {
  const found = EMOTIONS.find((e) => e.id === emotion)
  return (
    found ?? {
      id: emotion || 'Relato',
      label: emotion || 'Relato',
      icon: faNoteSticky,
      badgeClass:
        'bg-[#F7F5F0] text-[#2F3530] border-[#D7CFC2]',
      dotClass: 'bg-[#7B907E]',
      selectedPillClass: 'bg-[#2F3530] text-[#F7F5F0]',
    }
  )
}
