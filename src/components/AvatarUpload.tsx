"use client";
import { useRef } from "react";
import { PlayerAvatar } from "@/components/PlayerAvatar";

export function AvatarUpload({
  id, name, photoUrl, action, size = 48,
}: { id: string; name: string; photoUrl?: string | null; action: (fd: FormData) => void; size?: number }) {
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form ref={formRef} action={action}>
      <input type="hidden" name="id" value={id} />
      <label className="relative block cursor-pointer">
        <PlayerAvatar name={name} photoUrl={photoUrl} size={size} />
        <span className="absolute -bottom-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full bg-brand-600 text-[11px] font-bold text-white ring-2 ring-white">+</span>
        <input type="file" name="photo" accept="image/*" className="hidden"
          onChange={() => formRef.current?.requestSubmit()} />
      </label>
    </form>
  );
}
