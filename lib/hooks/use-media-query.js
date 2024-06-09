'use client'

import {useEffect, useState} from 'react';

export const useMediaQuery = (query) => {

  if (typeof global?.window == 'undefined') return
  // const isBrowser = () => typeof global?.window !== "undefined" && global?.document
  const mediaMatch = global?.window.matchMedia(query);
  const [matches, setMatches] = useState(mediaMatch.matches);

  useEffect(() => {
    const handler = e => setMatches(e.matches);
    mediaMatch.addListener(handler);
    return () => mediaMatch.removeListener(handler);
  });
  return matches;
};