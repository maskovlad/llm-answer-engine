"use server"

import { revalidateTag } from "next/cache";

export async function localeRevalidate (revalidateString: string) {
  try {
    setTimeout(()=>revalidateTag(revalidateString),500)
  } catch (error) {
    console.error({error})
  }
  
}