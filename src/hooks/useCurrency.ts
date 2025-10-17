"use client"

import { useEffect, useMemo, useState } from "react"

type Rates = Record<string, number>

export function useCurrency(base = "USD") {
  const [rates, setRates] = useState<Rates>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const fetchRates = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`https://api.frankfurter.app/latest?from=${encodeURIComponent(base)}`)
        if (!res.ok) throw new Error(`Failed to fetch rates`)
        const data = await res.json()
        if (mounted) setRates(data.rates || {})
      } catch (e: any) {
        if (mounted) setError(e?.message || "Unknown error")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchRates()
    return () => {
      mounted = false
    }
  }, [base])

  const convert = useMemo(() => {
    return (amount: number, from: string, to: string) => {
      if (from === to) return amount
      // Normalize via base
      // If base === from: amount * rates[to]
      // If base === to: amount / rates[from]
      // Else: convert to base then to target
      if (from === base) {
        return amount * (rates[to] ?? 1)
      }
      if (to === base) {
        const rateFrom = rates[from]
        return rateFrom ? amount / rateFrom : amount
      }
      const toBase = convert(amount, from, base)
      return convert(toBase, base, to)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rates, base])

  return { rates, loading, error, convert }
}
