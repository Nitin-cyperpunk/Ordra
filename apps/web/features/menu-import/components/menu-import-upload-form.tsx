"use client";

import { useActionState, useRef } from "react";
import { Upload } from "lucide-react";

import {
  uploadMenuImportAction,
  type MenuImportActionState,
} from "@/features/menu-import/actions";
import { Button } from "@/components/ui/button";

const initial: MenuImportActionState = {};
const MAX_MB_LABEL = 10;

export function MenuImportUploadForm({ cafeId }: { cafeId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, action, pending] = useActionState(uploadMenuImportAction, initial);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="cafeId" value={cafeId} />

      <button
        type="button"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
        className="border-input bg-muted/30 hover:bg-muted/50 flex w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed px-6 py-14 text-center transition-colors"
      >
        <Upload className="text-muted-foreground size-8" aria-hidden />
        <div className="space-y-1">
          <p className="text-sm font-medium">Drop your menu here</p>
          <p className="text-muted-foreground text-xs">
            or click to upload · PDF, JPG, PNG, WEBP · up to {MAX_MB_LABEL} MB
          </p>
        </div>
      </button>

      <input
        ref={inputRef}
        type="file"
        name="file"
        accept="application/pdf,image/jpeg,image/png,image/webp,.pdf,.jpg,.jpeg,.png,.webp"
        capture="environment"
        className="sr-only"
        disabled={pending}
        onChange={(e) => {
          if (e.currentTarget.files?.length) {
            e.currentTarget.form?.requestSubmit();
          }
        }}
      />

      <Button
        type="button"
        className="w-full sm:w-auto"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
      >
        {pending ? "Uploading…" : "Choose File"}
      </Button>

      {state.error ? (
        <p className="text-destructive text-sm" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
