import {
  faChartBar,
  faPenToSquare,
  faSun,
} from '@fortawesome/free-regular-svg-icons'
import { faBookOpen } from '@fortawesome/free-solid-svg-icons'

export const NAV_ITEMS = [
  {
    href: '/',
    label: 'Diário Terapêutico',
    icon: faPenToSquare,
  },
  {
    href: '/historico',
    label: 'Histórico',
    icon: faBookOpen,
  },
  {
    href: '/foco',
    label: 'Foco',
    icon: faSun,
  },
  {
    href: '/resumo',
    label: 'Síntese',
    icon: faChartBar,
  },
]

