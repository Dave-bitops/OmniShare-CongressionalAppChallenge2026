import { useRef, useState, useCallback } from 'react';
import { Camera, X, ImageIcon, Loader2 } from 'lucide-react';

interface Props {
  photos: string[];
  onAdd: (photo: string) => void;
  onRemove: (index: number) => void;
}

export function PhotoCapture({ photos, onAdd, onRemove }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const processFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) return;
      setBusy(true);
      const reader = new FileReader();
      reader.onload = () => {
        onAdd(reader.result as string);
        setBusy(false);
      };
      reader.onerror = () => setBusy(false);
      reader.readAsDataURL(file);
    },
    [onAdd]
  );

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <ImageIcon className="h-3.5 w-3.5 text-olive-500" />
        <span className="text-xs font-semibold uppercase tracking-wide text-olive-500">
          Photos of Donated Items
        </span>
      </div>

      {/* Hidden inputs — one for camera capture, one for file picker */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) processFile(file);
          e.target.value = '';
        }}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          files.forEach(processFile);
          e.target.value = '';
        }}
      />

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={busy}
          className="flex items-center gap-2 rounded-xl border border-olive-300 bg-olive-50 px-4 py-2.5 text-sm font-semibold text-olive-700 transition hover:border-olive-400 hover:bg-olive-100 active:scale-[0.98] disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          Take Photo
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
          className="flex items-center gap-2 rounded-xl border border-olive-200 bg-cream-50 px-4 py-2.5 text-sm font-medium text-olive-600 transition hover:border-olive-300 hover:bg-cream-100 active:scale-[0.98] disabled:opacity-50"
        >
          <ImageIcon className="h-4 w-4" />
          Upload
        </button>
      </div>

      {/* Photo thumbnails */}
      {photos.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {photos.map((src, i) => (
            <div
              key={i}
              className="group relative h-20 w-20 overflow-hidden rounded-lg border border-olive-200 shadow-sm"
            >
              <img src={src} alt={`Donation photo ${i + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-olive-950/70 text-cream-50 opacity-0 transition group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
