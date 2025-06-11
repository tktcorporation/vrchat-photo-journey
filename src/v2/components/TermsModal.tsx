import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useState } from 'react';
import * as React from 'react';
import { cn } from '../../components/lib/utils';
import { Button } from '../../components/ui/button';
import {
  DialogContent as BaseDialogContent,
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from '../../components/ui/dialog';
import { ScrollArea } from '../../components/ui/scroll-area';
import { terms as jaTerms } from '../constants/terms/ja';
import { useI18n } from '../i18n/store';

/**
 * 規約表示用ダイアログの本体コンポーネント。
 * 閉じるボタンの表示を制御できる。
 */
const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    showCloseButton?: boolean;
  }
>(({ className, children, showCloseButton = true, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg',
        className,
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

interface TermsModalProps {
  open: boolean;
  onAccept: () => void;
  isUpdate?: boolean;
  canClose?: boolean;
}

/**
 * 利用規約とプライバシーポリシーを提示するモーダル。
 * アプリ初回起動時や更新時に表示される。
 */
export const TermsModal = ({
  open,
  onAccept,
  isUpdate = false,
  canClose = true,
}: TermsModalProps) => {
  const { t } = useI18n();
  const [_accepted, setAccepted] = useState(false);

  const terms = jaTerms;

  const handleAccept = () => {
    setAccepted(true);
    onAccept();
  };

  return (
    <Dialog open={open} onOpenChange={canClose ? () => {} : undefined}>
      <DialogContent
        className="max-w-[800px] h-[80vh]"
        showCloseButton={canClose}
      >
        <DialogHeader>
          <DialogTitle>
            {isUpdate ? t('terms.updateTitle') : t('terms.title')}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-full pr-4">
          <div className="space-y-8">
            <section>
              <h3 className="text-lg font-medium mb-4">
                {terms.sections.termsOfService.title}
              </h3>
              <DialogDescription className="whitespace-pre-wrap">
                {terms.sections.termsOfService.content}
              </DialogDescription>
            </section>

            <section>
              <h3 className="text-lg font-medium mb-4">
                {terms.sections.privacyPolicy.title}
              </h3>
              <DialogDescription className="whitespace-pre-wrap">
                {terms.sections.privacyPolicy.content}
              </DialogDescription>
            </section>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button onClick={handleAccept}>{t('terms.accept')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
