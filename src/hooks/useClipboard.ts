import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';

export function useClipboard() {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const copy = useCallback(async (text: string, message?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: t('common.copied'),
        description: message || t('toast.copiedDesc'),
      });
      setTimeout(() => setCopied(false), 2000);
      return true;
    } catch (error) {
      toast({
        title: t('toast.copyFailed'),
        description: t('toast.copyFailed'),
        variant: "destructive",
      });
      return false;
    }
  }, [toast, t]);

  return { copy, copied };
}
