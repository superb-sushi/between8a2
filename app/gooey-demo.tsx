"use client"

import { useScreenSize}  from "@/hooks/use-screen-size"
import { PixelTrail } from "@/components/ui/pixel-trail"
import { GooeyFilter } from "@/components/ui/gooey-filter"
import { getRandomBackground } from "@/lib/utils"
import Image from 'next/image'
import { useState, useEffect } from 'react'

function GooeyPage() {
  const screenSize = useScreenSize()
  const [bg, setBg] = useState<any>(null)

  useEffect(() => {
    setBg(getRandomBackground())
  }, [])

  if (!bg) return null

  return (
    <div className="fixed inset-0 z-0 w-full h-full bg-black text-center text-pretty">
      <Image
        src={bg}
        alt="impressionist painting"
        fill
        className="object-cover opacity-60"
      />

      <GooeyFilter id="gooey-filter-pixel-trail" strength={4} />

      <div
        className="absolute inset-0 z-0"
        style={{ filter: "url(#gooey-filter-pixel-trail)" }}
      >
        <PixelTrail
          pixelSize={screenSize.lessThan(`md`) ? 24 : 38}
          fadeDuration={300}
          delay={1300}
          pixelClassName="bg-white"
        />
      </div>
    </div>
  )
}

export default GooeyPage