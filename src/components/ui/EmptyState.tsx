import { ReactNode, ComponentType, ReactElement, isValidElement } from 'react'
import Link from 'next/link'
import { cn } from '@/utils/helpers'
import { LucideProps } from 'lucide-react'

interface ActionLink {
  label: string
  href?: string
  onClick?: () => void
}

interface EmptyStateProps {
  icon?: ReactNode | ComponentType<LucideProps>
  title: string
  description?: string
  action?: ActionLink | ReactElement
  className?: string
}

function isActionLink(action: ActionLink | ReactElement): action is ActionLink {
  return typeof action === 'object' && action !== null && 'label' in action
}

// Check if something is a React component (including forwardRef)
function isReactComponent(value: unknown): value is ComponentType<any> {
  if (typeof value === 'function') return true
  // forwardRef components are objects with $$typeof and render properties
  if (typeof value === 'object' && value !== null) {
    const obj = value as any
    return obj.$$typeof !== undefined && typeof obj.render === 'function'
  }
  return false
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const renderAction = (): ReactNode => {
    if (!action) return null

    if (isActionLink(action)) {
      if (action.href) {
        return (
          <Link
            href={action.href}
            className="px-6 py-2.5 bg-primary-900/300 text-white font-medium rounded-xl hover:bg-primary-600 transition-colors"
          >
            {action.label}
          </Link>
        )
      }
      if (action.onClick) {
        return (
          <button
            onClick={action.onClick}
            className="px-6 py-2.5 bg-primary-900/300 text-white font-medium rounded-xl hover:bg-primary-600 transition-colors"
          >
            {action.label}
          </button>
        )
      }
      return null
    }

    return action
  }

  const renderIcon = () => {
    if (!Icon) return null

    // If it's already a valid React element, render it directly
    if (isValidElement(Icon)) {
      return Icon
    }

    // If it's a component (function or forwardRef), render it as JSX
    if (isReactComponent(Icon)) {
      const IconComponent = Icon as ComponentType<{ className?: string }>
      return <IconComponent className="w-12 h-12" />
    }

    // Fallback: try to render as-is (for other ReactNode types)
    return Icon
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-12 px-4',
        className
      )}
    >
      {Icon && (
        <div className="mb-4 text-neutral-300">
          {renderIcon()}
        </div>
      )}
      <h3 className="text-lg font-semibold text-neutral-100 mb-2">{title}</h3>
      {description && (
        <p className="text-neutral-500 max-w-sm mb-6">{description}</p>
      )}
      {renderAction()}
    </div>
  )
}
