import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import mendobg from "@/public/mendobg.jpg"
import yosemitebg from "@/public/yosemitebg.jpg"
import zionbg from "@/public/zionbg.jpg"
import texasbg from "@/public/texasbg.jpg"
import bg82 from "@/public/82bg.jpg"
import bg15mile from "@/public/15milebg.jpg"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getRandomBackground() {
  const backgrounds = [
    mendobg,
    yosemitebg,
    zionbg,
    texasbg,
    bg82,
    bg15mile,
  ]
  return backgrounds[Math.floor(Math.random() * backgrounds.length)]
}
