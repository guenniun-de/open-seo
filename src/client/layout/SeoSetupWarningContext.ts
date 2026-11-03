import { createContext, useContext, useEffect } from "react";

// Dialogs can opt out of the shell's provider-specific setup prompt while
// performing work that does not use that provider. Counts support nested dialogs.
export const SeoSetupWarningContext = createContext<
  ((change: number) => void) | null
>(null);

export function useSuppressSeoSetupWarnings(suppress: boolean) {
  const change = useContext(SeoSetupWarningContext);
  useEffect(() => {
    if (!suppress || !change) return;
    change(1);
    return () => change(-1);
  }, [suppress, change]);
}
