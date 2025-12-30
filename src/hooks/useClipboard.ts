import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export function useClipboard() {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copy = useCallback(async (text: string, message?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: "Copied!",
        description: message || "Content copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
      return true;
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  return { copy, copied };
}
