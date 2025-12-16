'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  Users,
  Calendar,
  MapPin,
  Heart,
  ArrowRight,
  Sparkles,
  MessageCircle
} from 'lucide-react'
import { Button } from '@/components/ui'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Background decoration */}
      <div className="fixed inset-0 bg-mesh pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 relative">
              <Image
                src="/logo.png"
                alt="Hapien Logo"
                width={40}
                height={40}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-display text-2xl font-bold text-neutral-100">
              Hapien
            </span>
          </Link>
          
          <Link href="/auth/login">
            <Button variant="outline" size="sm">
              Log in
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10">
        <section className="px-4 py-16 lg:py-24">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-3xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-dark-card/80 backdrop-blur border border-dark-border rounded-full text-sm font-medium text-primary-400 mb-6">
                  <Sparkles className="w-4 h-4" />
                  Welcome to the Happy Sapien Network
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-100 leading-tight mb-6"
              >
                Where real connections{' '}
                <span className="gradient-text">flourish</span> through shared
                moments
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-xl text-neutral-400 mb-8 leading-relaxed"
              >
                Hapien is a private, hyperlocal social network that nurtures your
                existing connections and creates new ones within your
                communities through regular hangouts.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Link href="#features">
                  <Button variant="outline" size="lg" className="border-2 border-white text-white hover:bg-white hover:text-dark-bg">
                    Learn more
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="px-4 py-16 lg:py-24">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="font-display text-3xl lg:text-4xl font-bold text-neutral-100 mb-4">
                Everything you need to stay connected
              </h2>
              <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
                Built for real-world connections, not vanity metrics.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-dark-card/80 backdrop-blur border border-dark-border rounded-2xl p-6 hover:shadow-soft hover:border-dark-hover transition-all"
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${feature.color}`}
                  >
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-display text-xl font-semibold text-neutral-100 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-neutral-400">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-4 py-16 lg:py-24">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-gradient-primary rounded-3xl p-8 lg:p-12 text-center text-white shadow-glow"
            >
              <h2 className="font-display text-3xl lg:text-4xl font-bold mb-4">
                Ready to find your tribe?
              </h2>
              <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
                Join thousands of happy sapiens building meaningful connections in
                their local communities.
              </p>
              <Link href="/auth/login">
                <Button
                  size="lg"
                  variant="secondary"
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                >
                  Join Hapien Today
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-4 py-8 border-t border-dark-border">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 relative">
              <Image
                src="/logo.png"
                alt="Hapien Logo"
                width={32}
                height={32}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-display font-semibold text-neutral-100">
              Hapien
            </span>
          </div>
          <p className="text-sm text-neutral-500">
            © {new Date().getFullYear()} Hapien. Made with{' '}
            <Heart className="w-4 h-4 inline text-tertiary-400" /> in India
          </p>
        </div>
      </footer>
    </div>
  )
}

const features = [
  {
    title: 'Private Communities',
    description:
      'Join residential societies, college campuses, or office complexes. Your network stays within your trusted circles.',
    icon: Users,
    color: 'bg-primary-600',
  },
  {
    title: 'Hangouts',
    description:
      'Create and discover local meetups. From sports to food to learning - find your people doing what you love.',
    icon: Calendar,
    color: 'bg-secondary-600',
  },
  {
    title: 'Hyperlocal',
    description:
      'Connect with people in your neighborhood. Real connections happen in real places.',
    icon: MapPin,
    color: 'bg-tertiary-600',
  },
  {
    title: 'Friends Graph',
    description:
      'Build your real friend network. See what your friends are up to and never miss a moment.',
    icon: Heart,
    color: 'bg-category-chill',
  },
  {
    title: 'Personal Wall',
    description:
      'Share life updates with the people who matter. No algorithms, just genuine connections.',
    icon: MessageCircle,
    color: 'bg-category-sports',
  },
  {
    title: 'Made for Happiness',
    description:
      'Designed to nurture real relationships, not engagement. Your happiness is our metric.',
    icon: Sparkles,
    color: 'bg-category-food',
  },
]
