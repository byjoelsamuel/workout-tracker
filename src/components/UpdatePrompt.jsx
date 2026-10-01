// Desktop app only. A moment after launch, asks whether a newer release is out
// and, if so, says so once with a Download button. Silent when it's up to date
// or offline — Settings is where you go to check on purpose.
import { useEffect } from "react";
import { useToast } from "./Toaster.jsx";
import { runUpdateCheck } from "../hooks/useUpdate.js";
import { downloadUpdate } from "../lib/platform.js";

// Late enough not to land on top of the first screen while it's drawing.
const DELAY_MS = 2500;

export function UpdatePrompt() {
  const toast = useToast();

  useEffect(() => {
    const id = setTimeout(async () => {
      const result = await runUpdateCheck();
      if (!result?.available) return;
      toast.show({
        key: "update",
        tone: "update",
        title: `Tsyoku-naru ${result.latest} is out`,
        body: `You have ${result.current}. Install it over this one — your workouts stay.`,
        action: { label: "Download", onClick: downloadUpdate },
        duration: 15000,
      });
    }, DELAY_MS);
    return () => clearTimeout(id);
  }, [toast]);

  return null;
}
