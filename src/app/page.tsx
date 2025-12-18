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
  MessageCircle,
  Shield,
  Zap,
  Check
} from 'lucide-react'
import { Button } from '@/components/ui'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-stone-900">
      {/* Background decoration */}
      <div className="fixed inset-0 bg-mesh-dark pointer-events-none" />

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
            <span className="font-display text-2xl font-bold text-stone-50">
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
        <section className="px-4 pt-12 pb-16 sm:pt-16 sm:pb-20 lg:pt-20 lg:pb-28">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-3xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, type: "spring" }}
                className="mb-8"
              >
                <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500/20 to-amber-600/20 backdrop-blur border border-amber-500/30 rounded-full text-sm font-semibold text-amber-400 shadow-lg shadow-amber-500/10">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  Welcome to the Happy Sapien Network
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-stone-50 leading-[1.1] mb-8"
              >
                Get company for social activities in{' '}
                <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent animate-gradient">
                  10 minutes
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-xl sm:text-2xl text-stone-400 mb-10 leading-relaxed max-w-2xl mx-auto"
              >
                Hapien is a private, hyperlocal social network that nurtures your
                existing connections and creates new ones within your
                communities through regular hangouts.
              </motion.p>

              {/* Social Proof */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex items-center justify-center gap-6 mb-10 text-sm text-stone-500"
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>1,000+ members</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-stone-600" />
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  <span>Delhi NCR</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-stone-600" />
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>500+ hangouts</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10"
              >
                <Link href="/auth/login" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    rightIcon={<ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                    className="w-full sm:w-auto text-lg px-8 py-6 shadow-xl shadow-amber-500/20 hover:shadow-2xl hover:shadow-amber-500/30 hover:scale-105 transition-all duration-300 group"
                  >
                    Join Your Community
                  </Button>
                </Link>
                <Link href="#features" className="text-stone-400 hover:text-amber-400 transition-colors font-medium underline underline-offset-4">
                  How it works →
                </Link>
              </motion.div>

              {/* Trust Indicators */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="flex flex-wrap items-center justify-center gap-6 text-sm text-stone-500"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-400" />
                  <span>Private & Secure</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Hyperlocal</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-400" />
                  <span>Real Connections</span>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="px-4 py-16 lg:py-24 bg-gradient-to-b from-stone-900 via-stone-800/30 to-stone-900">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="font-display text-4xl lg:text-5xl font-bold text-stone-50 mb-6">
                Everything you need to stay connected
              </h2>
              <p className="text-xl text-stone-400 max-w-2xl mx-auto">
                Built for real-world connections, not vanity metrics. Your happiness is our metric.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="group bg-gradient-to-br from-stone-800/90 to-stone-800/50 backdrop-blur border border-stone-700 hover:border-amber-500/50 rounded-2xl p-8 hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-500 cursor-pointer relative overflow-hidden"
                >
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 via-amber-500/0 to-amber-500/0 group-hover:from-amber-500/5 group-hover:via-transparent group-hover:to-transparent transition-all duration-500" />

                  <div className="relative z-10">
                    <div
                      className={`w-14 h-14 rounded-xl flex items-center justify-center mb-5 ${feature.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}
                    >
                      <feature.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="font-display text-xl font-bold text-stone-50 mb-3 group-hover:text-amber-400 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-stone-400 group-hover:text-stone-300 transition-colors leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
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
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 100 }}
              className="relative bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 rounded-3xl p-8 lg:p-16 text-center text-white shadow-2xl shadow-amber-500/30 overflow-hidden"
            >
              {/* Animated gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400/0 via-white/10 to-amber-400/0 animate-gradient" />

              <div className="relative z-10">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="mb-6"
                >
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur border border-white/30 rounded-full text-sm font-semibold shadow-lg">
                    <Sparkles className="w-4 h-4" />
                    Start Your Journey
                  </span>
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="font-display text-4xl lg:text-5xl font-bold mb-6 leading-tight"
                >
                  Ready to find your tribe?
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                  className="text-xl lg:text-2xl text-white/95 mb-10 max-w-2xl mx-auto leading-relaxed"
                >
                  Join thousands of happy sapiens building meaningful connections in
                  their local communities.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-col sm:flex-row items-center justify-center gap-6"
                >
                  <Link href="/auth/login">
                    <Button
                      size="lg"
                      variant="secondary"
                      rightIcon={<ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                      className="bg-white text-amber-600 hover:bg-white hover:shadow-xl hover:scale-105 transition-all duration-300 text-lg px-8 py-6 font-bold group"
                    >
                      Join Hapien Today
                    </Button>
                  </Link>

                  {/* Value props */}
                  <div className="flex items-center gap-4 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </div>
                      <span>Free to join</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </div>
                      <span>Private & secure</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-4 py-8 border-t border-stone-700">
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
            <span className="font-display font-semibold text-stone-50">
              Hapien
            </span>
          </div>
          <p className="text-sm text-stone-500">
            © {new Date().getFullYear()} Hapien. Made with{' '}
            <Heart className="w-4 h-4 inline text-rose-500" /> in India
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
    color: 'bg-amber-900/200',
  },
  {
    title: 'Hangouts',
    description:
      'Create and discover local meetups. From sports to food to learning - find your people doing what you love.',
    icon: Calendar,
    color: 'bg-rose-900/200',
  },
  {
    title: 'Hyperlocal',
    description:
      'Connect with people in your neighborhood. Real connections happen in real places.',
    icon: MapPin,
    color: 'bg-sage-900/200',
  },
  {
    title: 'Friends Graph',
    description:
      'Build your real friend network. See what your friends are up to and never miss a moment.',
    icon: Heart,
    color: 'bg-rose-400',
  },
  {
    title: 'Personal Wall',
    description:
      'Share life updates with the people who matter. No algorithms, just genuine connections.',
    icon: MessageCircle,
    color: 'bg-amber-600',
  },
  {
    title: 'Made for Happiness',
    description:
      'Designed to nurture real relationships, not engagement. Your happiness is our metric.',
    icon: Sparkles,
    color: 'bg-sage-400',
  },
]
