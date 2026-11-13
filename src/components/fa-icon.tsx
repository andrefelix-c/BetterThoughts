'use client'

import { config } from '@fortawesome/fontawesome-svg-core'
import {
  FontAwesomeIcon,
  type FontAwesomeIconProps,
} from '@fortawesome/react-fontawesome'

config.autoAddCss = false

export default function FaIcon(props: FontAwesomeIconProps) {
  return <FontAwesomeIcon {...props} />
}

