"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { useLocale } from "@/lib/localeProvider";

interface IntroModalProps {
  open: boolean;
  onClose: () => void;
  onStartSorting?: () => void;
  cardCount?: number;
  cardsPerColumn?: number;
}

export function IntroModal({ open, onClose, onStartSorting, cardCount = 33, cardsPerColumn = 11 }: IntroModalProps) {
  const { t } = useLocale();

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent onClose={onClose} className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{t('introModal.title')}</DialogTitle>
          <DialogDescription className="text-base">
            {t('introModal.subtitle')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">{t('introModal.whatIsThis_title')}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('introModal.whatIsThis_text')}
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">{t('introModal.howToUse_title')}</h3>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>{t('introModal.howToUse_step1', { cardCount, cardsPerColumn })}</li>
              <li>{t('introModal.howToUse_step2', { cardsPerColumn })}</li>
              <li>{t('introModal.howToUse_step3')}</li>
              <li>{t('introModal.howToUse_step4', { cardsPerColumn })}</li>
              <li>{t('introModal.howToUse_step5')}</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">{t('introModal.remember_title')}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: t('introModal.remember_text') }} />
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground italic">
              {t('introModal.quote')}
              <br />{t('introModal.quoteAuthor')}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={() => {
              if (onStartSorting) {
                onStartSorting();
              }
              onClose();
            }}
            size="lg"
            className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            {t('introModal.startSorting')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
