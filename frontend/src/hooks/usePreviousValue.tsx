import { useEffect, useRef } from "react";

/**
 *
 * this hook helps to get previous value of any state
 * useEffect runs after the rendering is done, so the previousValue be already sent
 *
 */

const usePreviousValue = (value: unknown) => {
  const previousValue = useRef<unknown>(undefined);
  useEffect(() => {
    previousValue.current = value;
  });
  return previousValue.current;
};

export default usePreviousValue;
