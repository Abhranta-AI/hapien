'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CreditCard, Lock, Check } from 'lucide-react'
import { formatPriceINR } from '@/types/database'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  amount: number  // in paisa
  itemName: string
  itemDescription?: string
}

export function PaymentModal({
  isOpen,
  onClose,
  onSuccess,
  amount,
  itemName,
  itemDescription
}: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentComplete, setPaymentComplete] = useState(false)

  const handlePayment = async () => {
    setIsProcessing(true)

    // TODO: Integrate with Razorpay
    // For now, simulate a payment flow
    await new Promise(resolve => setTimeout(resolve, 2000))

    setIsProcessing(false)
    setPaymentComplete(true)

    // Call success after showing confirmation
    setTimeout(() => {
      onSuccess()
      setPaymentComplete(false)
    }, 1500)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-md mx-auto"
          >
            <div className="card-dark-elevated p-6 rounded-2xl">
              {/* Close button */}
              {!isProcessing && !paymentComplete && (
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 text-text-muted hover:text-text-primary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}

              {paymentComplete ? (
                // Success state
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                    className="w-16 h-16 bg-jade-500 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <Check className="w-8 h-8 text-white" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-text-primary mb-2">Payment Successful!</h3>
                  <p className="text-text-secondary">Creating your hangout...</p>
                </motion.div>
              ) : (
                // Payment form
                <div>
                  {/* Header */}
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <CreditCard className="w-6 h-6 text-pink-500" />
                    </div>
                    <h2 className="text-xl font-bold text-text-primary mb-1">Complete Payment</h2>
                    <p className="text-sm text-text-muted">Secure payment powered by Razorpay</p>
                  </div>

                  {/* Item details */}
                  <div className="bg-dark-surface rounded-xl p-4 mb-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-text-primary">{itemName}</p>
                        {itemDescription && (
                          <p className="text-sm text-text-muted">{itemDescription}</p>
                        )}
                      </div>
                      <p className="text-xl font-bold text-pink-500">{formatPriceINR(amount)}</p>
                    </div>
                  </div>

                  {/* Security notice */}
                  <div className="flex items-center gap-2 text-xs text-text-muted mb-6 justify-center">
                    <Lock className="w-3 h-3" />
                    <span>Your payment is secure and encrypted</span>
                  </div>

                  {/* Pay button */}
                  <button
                    onClick={handlePayment}
                    disabled={isProcessing}
                    className="w-full py-4 px-6 bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Pay {formatPriceINR(amount)}
                      </>
                    )}
                  </button>

                  {/* Cancel link */}
                  {!isProcessing && (
                    <button
                      onClick={onClose}
                      className="w-full mt-3 py-2 text-text-muted hover:text-text-primary transition-colors text-sm"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
