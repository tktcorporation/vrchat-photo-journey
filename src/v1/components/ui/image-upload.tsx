import { Upload } from 'lucide-react';

import * as React from 'react';

import { trpcReact } from '@/trpc';
import { cn } from '@/v1/lib/utils';
import { useState } from 'react';
import { P, match } from 'ts-pattern';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const ImageUpload = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, onChange, ...props }, ref) => {
    const [preview, setPreview] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result;
          match(result)
            .with(P.string, (r) => {
              setPreview(r);
            })
            .with(P.instanceOf(ArrayBuffer), (r) => {
              const decoder = new TextDecoder('utf-16');
              setPreview(decoder.decode(r));
            })
            .with(P.nullish, () => {
              setPreview(null);
            })
            .exhaustive();
        };
        reader.readAsDataURL(selectedFile);
      }
      onChange?.(e);
    };

    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg dark:border-gray-600 transition-colors hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer relative',
          className,
        )}
      >
        {preview ? (
          <img
            src={preview}
            alt="Preview"
            className="object-cover rounded-lg h-60"
          />
        ) : (
          <>
            <Upload className="h-12 w-12 text-gray-400 dark:text-gray-500" />
            <p className="mt-4 text-gray-500 dark:text-gray-400">
              Drag and drop a file or click to select
            </p>
          </>
        )}
        <input
          type="file"
          className={
            'absolute inset-0 opacity-0 cursor-pointer placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
          }
          ref={ref}
          onChange={handleFileChange}
          {...props}
        />
      </div>
    );
  },
);
ImageUpload.displayName = 'ImageUpload';

export { ImageUpload };
