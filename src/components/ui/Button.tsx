import { forwardRef, ButtonHTMLAttributes } from 'react'
import { cn } from '@/utils/helpers'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'intimate' | 'safe'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = cn(
      'inline-flex items-center justify-center font-medium',
      'transition-all duration-300 ease-soft-out',
      'rounded-xl',
      'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-stone-50',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none'
    )

    const variants = {
      // Primary - Warm amber gradient
      primary: cn(
        'bg-gradient-to-r from-amber-500 to-amber-600',
        'text-white font-medium',
        'hover:from-amber-600 hover:to-amber-700',
        'hover:shadow-warm active:scale-[0.98]',
        'focus:ring-amber-500/50'
      ),
      // Secondary - Soft stone
      secondary: cn(
        'bg-stone-100 text-stone-700',
        'hover:bg-stone-200',
        'border border-stone-200',
        'focus:ring-stone-400/50'
      ),
      // Ghost - Transparent
      ghost: cn(
        'bg-transparent text-stone-600',
        'hover:bg-stone-100 hover:text-stone-900',
        'focus:ring-stone-400/50'
      ),
      // Outline - Bordered
      outline: cn(
        'border-2 border-amber-500 text-amber-600',
        'bg-transparent',
        'hover:bg-amber-50',
        'focus:ring-amber-500/50'
      ),
      // Danger - Rose red
      danger: cn(
        'bg-gradient-to-r from-rose-500 to-rose-600',
        'text-white',
        'hover:from-rose-600 hover:to-rose-700',
        'hover:shadow-intimate active:scale-[0.98]',
        'focus:ring-rose-500/50'
      ),
      // Intimate - Rose gradient for connection actions
      intimate: cn(
        'bg-gradient-to-r from-rose-500 to-rose-600',
        'text-white font-medium',
        'hover:from-rose-600 hover:to-rose-700',
        'hover:shadow-intimate-lg active:scale-[0.98]',
        'focus:ring-rose-500/50'
      ),
      // Safe - Sage green for trust/safety actions
      safe: cn(
        'bg-gradient-to-r from-sage-500 to-sage-600',
        'text-white font-medium',
        'hover:from-sage-600 hover:to-sage-700',
        'hover:shadow-safe active:scale-[0.98]',
        'focus:ring-sage-500/50'
      ),
    }

    const sizes = {
      sm: 'text-sm px-3 py-1.5 gap-1.5',
      md: 'text-base px-5 py-2.5 gap-2',
      lg: 'text-lg px-7 py-3.5 gap-2.5',
    }

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    )
  }
)

Button.displayName = 'Button'

// Icon-only button variant
interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'intimate' | 'safe'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  'aria-label': string
}

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      children,
      className,
      variant = 'ghost',
      size = 'md',
      isLoading = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = cn(
      'inline-flex items-center justify-center',
      'transition-all duration-300 ease-soft-out',
      'rounded-full',
      'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-stone-50',
      'disabled:opacity-50 disabled:cursor-not-allowed'
    )

    const variants = {
      primary: cn(
        'bg-gradient-to-r from-amber-500 to-amber-600',
        'text-white',
        'hover:from-amber-600 hover:to-amber-700 hover:shadow-warm',
        'focus:ring-amber-500/50'
      ),
      secondary: cn(
        'bg-stone-100 text-stone-600',
        'hover:bg-stone-200 hover:text-stone-900',
        'focus:ring-stone-400/50'
      ),
      ghost: cn(
        'bg-transparent text-stone-500',
        'hover:bg-stone-100 hover:text-stone-700',
        'focus:ring-stone-400/50'
      ),
      outline: cn(
        'border border-stone-200 text-stone-600',
        'bg-transparent',
        'hover:bg-stone-50 hover:border-stone-300',
        'focus:ring-stone-400/50'
      ),
      intimate: cn(
        'bg-rose-50 text-rose-600',
        'hover:bg-rose-100 hover:text-rose-700',
        'focus:ring-rose-500/50'
      ),
      safe: cn(
        'bg-sage-50 text-sage-600',
        'hover:bg-sage-100 hover:text-sage-700',
        'focus:ring-sage-500/50'
      ),
    }

    const sizes = {
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-12 h-12',
    }

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          children
        )}
      </button>
    )
  }
)

IconButton.displayName = 'IconButton'

export { Button, IconButton }
