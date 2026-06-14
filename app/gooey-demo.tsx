"use client"

import { useScreenSize}  from "@/hooks/use-screen-size"
import { PixelTrail } from "@/components/ui/pixel-trail"
import { GooeyFilter } from "@/components/ui/gooey-filter"
import mendobg from "@/public/mendobg.jpg"
import Image from 'next/image'

function GooeyPage() {
  const screenSize = useScreenSize()

  return (
    <div className="relative w-full h-full gap-8 bg-black text-center text-pretty">
      <Image
        src={mendobg}
        alt="impressionist painting"
        className="w-full h-full object-cover absolute inset-0 opacity-70"
      />

      <GooeyFilter id="gooey-filter-pixel-trail" strength={5} />

      <div
        className="absolute inset-0 z-0"
        style={{ filter: "url(#gooey-filter-pixel-trail)" }}
      >
        <PixelTrail
          pixelSize={screenSize.lessThan(`md`) ? 32 : 48}
          fadeDuration={5000}
          delay={30000}
          pixelClassName="bg-white"
        />
      </div>
      <div>Hi!</div>
    </div>
  )
}

export default GooeyPage