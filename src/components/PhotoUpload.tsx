import { useRef } from "react";
import { Camera, User, Building2 } from "@/components/ui/Icons";

const SIZES = {
  sm: { container: "w-12 h-12", icon: "w-5 h-5", badge: "w-5 h-5 -bottom-1 -right-1", camera: "w-2.5 h-2.5", text: "text-sm" },
  md: { container: "w-16 h-16", icon: "w-7 h-7", badge: "w-6 h-6 -bottom-1 -right-1", camera: "w-3 h-3",   text: "text-base" },
  lg: { container: "w-24 h-24", icon: "w-10 h-10", badge: "w-7 h-7 bottom-0 right-0",  camera: "w-3.5 h-3.5", text: "text-2xl" },
};

/** Upload photo avec aperçu. Passe `initials` pour afficher des initiales quand aucune photo n'est choisie. */
export function PhotoUpload({
  photo,
  onChange,
  size = "md",
  label,
  rounded = "full",
  initials,
}: {
  photo?: string;
  onChange: (base64: string) => void;
  size?: "sm" | "md" | "lg";
  label?: string;
  rounded?: "full" | "lg";
  initials?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const s = SIZES[size];
  const r = rounded === "full" ? "rounded-full" : "rounded-lg";

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 2 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  };

  const bg = !photo && initials ? "bg-brand" : "bg-blue-50";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`relative ${s.container} ${r} ${bg} overflow-hidden border-2 border-dashed border-blue-300 hover:border-brand transition-colors group cursor-pointer`}
        title="Cliquer pour choisir une photo"
      >
        {photo ? (
          <img src={photo} alt="photo" className={`w-full h-full object-cover ${r}`} />
        ) : initials ? (
          <div className={`w-full h-full flex items-center justify-center text-white font-bold ${s.text}`}>
            {initials}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className={`${s.icon} text-brand`} />
          </div>
        )}
        <div className={`absolute ${s.badge} bg-brand ${r === "rounded-full" ? "rounded-full" : "rounded-md"} flex items-center justify-center shadow border-2 border-white`}>
          <Camera className={`${s.camera} text-white`} />
        </div>
        <div className={`absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center ${r}`}>
          <Camera className={`${s.icon} text-white`} />
        </div>
      </button>
      {label && <span className="text-xs text-muted-foreground text-center leading-tight">{label}</span>}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

/** Upload logo entreprise */
export function LogoUpload({
  logo,
  onChange,
  size = 80,
  rounded = false,
  label = "Logo (optionnel)",
}: {
  logo?: string;
  onChange: (base64: string) => void;
  size?: number;
  rounded?: boolean;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const r = rounded ? "rounded-full" : "rounded-xl";

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 2 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        style={{ width: size, height: size }}
        className={`relative ${r} overflow-hidden bg-blue-50 border-2 border-dashed border-blue-300 hover:border-brand transition-colors group cursor-pointer shrink-0`}
        title={`Cliquer pour choisir ${rounded ? "une photo" : "un logo"}`}
      >
        {logo ? (
          <img src={logo} alt="logo" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {rounded ? <User className="w-7 h-7 text-brand" /> : <Building2 className="w-7 h-7 text-brand" />}
          </div>
        )}
        <div className={`absolute bottom-1 right-1 w-5 h-5 bg-brand ${rounded ? "rounded-full" : "rounded-md"} flex items-center justify-center shadow border border-white`}>
          <Camera className="w-2.5 h-2.5 text-white" />
        </div>
        <div className={`absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity ${r} flex items-center justify-center`}>
          <Camera className="w-6 h-6 text-white" />
        </div>
      </button>
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

/** Affichage seul (sans upload) */
export function PhotoAvatar({
  photo,
  nom,
  size = "md",
  rounded = "full",
}: {
  photo?: string;
  nom: string;
  size?: "sm" | "md" | "lg";
  rounded?: "full" | "lg";
}) {
  const s = SIZES[size];
  const r = rounded === "full" ? "rounded-full" : "rounded-lg";
  const initials = nom.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  if (photo) {
    return (
      <div className={`${s.container} ${r} overflow-hidden shrink-0`}>
        <img src={photo} alt={nom} className={`w-full h-full object-cover ${r}`} />
      </div>
    );
  }

  return (
    <div className={`${s.container} ${r} bg-brand flex items-center justify-center text-white font-bold shrink-0 ${s.text}`}>
      {initials}
    </div>
  );
}
