import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/utils/helpers'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'surface' | 'elevated' | 'outlined' | 'glass' | 'intimate' | 'safe' | 'premium'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'cozy' | 'spacious'
  hoverable?: boolean
  breathing?: boolean
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      className,
      variant = 'default',
      padding = 'md',
      hoverable = false,
      breathing = false,
      ...props
    },
    ref
  ) => {
    const variants = {
      // Legacy dark mode variant (for backwards compatibility)
      default: 'bg-white border border-stone-200 shadow-soft-sm',
      // New warm variants
      surface: 'bg-white/80 backdrop-blur-sm border border-stone-200/50',
      elevated: 'bg-white shadow-soft-lg border border-stone-100',
      outlined: 'bg-white border-2 border-stone-200',
      glass: 'bg-white/70 backdrop-blur-lg border border-stone-200/30',
      // Intimate connection variant (rose tint)
      intimate: 'bg-gradient-to-br from-rose-50 to-white border border-rose-200/50 shadow-intimate',
      // Safe space variant (sage tint)
      safe: 'bg-gradient-to-br from-sage-50 to-white border border-sage-200/50 shadow-safe',
      // Premium variant (subtle luxury)
      premium: 'bg-gradient-to-br from-stone-50 to-white border border-stone-200/50 shadow-premium overflow-hidden',
    }

    const paddings = {
      none: '',
      sm: 'p-3',
      md: 'p-5',
      lg: 'p-7',
      cozy: 'p-4',
      spacious: 'p-8',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl transition-all duration-300',
          variants[variant],
          paddings[padding],
          hoverable && 'hover:shadow-soft-lg hover:-translate-y-0.5 cursor-pointer ease-soft-out',
          breathing && 'animate-breathe-slow',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center justify-between mb-4', className)}
      {...props}
    />
  )
)

CardHeader.displayName = 'CardHeader'

const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-lg font-semibold text-stone-900', className)}
      {...props}
    />
  )
)

CardTitle.displayName = 'CardTitle'

interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {}

const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-stone-500 mt-1', className)}
      {...props}
    />
  )
)

CardDescription.displayName = 'CardDescription'

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('', className)} {...props} />
  )
)

CardContent.displayName = 'CardContent'

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center mt-4 pt-4 border-t border-stone-100', className)}
      {...props}
    />
  )
)

CardFooter.displayName = 'CardFooter'

// Premium card with gold accent line
const CardPremiumAccent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('', className)} {...props}>
      {/* Subtle gold accent line at top */}
      <div className="h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent mb-4" />
      {children}
    </div>
  )
)

CardPremiumAccent.displayName = 'CardPremiumAccent'

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardPremiumAccent }
