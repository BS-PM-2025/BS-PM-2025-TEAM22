// hooks/useSmoothScroll.js
import { useRef, useEffect } from 'react';

export const useSmoothScroll = (dependency, options = {}) => {
  const { behavior = 'smooth', block = 'end' } = options;
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior, block });
    }
  }, [dependency, behavior, block]);

  return ref;
};