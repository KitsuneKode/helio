import { cn } from '@/lib/utils'
import { type HugeiconsProps, HugeiconsIcon } from '@hugeicons/react-native'
import { withUniwind } from 'uniwind'

type IconProps = HugeiconsProps & {}

const StyledIcon = withUniwind(HugeiconsIcon, {
  size: {
    fromClassName: 'className',
    styleProperty: 'width',
  },
  color: {
    fromClassName: 'className',
    styleProperty: 'color',
  },
})

/**
 * A wrapper component for HugeIcons icons with Uniwind `className` support via `withUniwind`.
 *
 * This component allows you to render any HugeIcons icon while applying utility classes
 * using `uniwind`. It avoids the need to wrap or configure each icon individually.
 *
 * @component
 * @example
 * ```tsx
 * import { ArrowRight } from '@hugeicons/core-free-icons';
 * import { Icon } from '@/registry/components/ui/icon';
 *
 * <Icon icon={ArrowRight} className="text-red-500 size-4" />
 * ```
 *
 * @param {HugeiconsIconComponent} as - The HugeIcons icon component to render.
 * @param {string} className - Utility classes to style the icon using Uniwind.
 * @param {number} size - Icon size (overrides the size class).
 * @param {...HugeiconsProps} ...props - Additional HugeIcons icon props passed to the "as" icon.
 */
function Icon({ className, ...props }: IconProps) {
  return <StyledIcon className={cn('text-foreground size-5', className)} {...props} />
}

export { Icon }
