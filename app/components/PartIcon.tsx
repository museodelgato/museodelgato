import { PART_COLORS, PART_LABELS } from "../game/config";

interface Props {
  part: number;
  size?: "sm" | "md" | "lg" | "xl";
  dim?: boolean;
}

const sizeMap = {
  sm: "w-16 h-16 text-xs",
  md: "w-28 h-28 text-sm",
  lg: "w-40 h-40 text-lg",
  xl: "w-64 h-64 text-2xl",
};

export function PartIcon({ part, size = "md", dim = false }: Props) {
  return (
    <div
      className={`${sizeMap[size]} rounded-2xl flex items-center justify-center font-bold tracking-widest transition-opacity`}
      style={{
        background: PART_COLORS[part],
        opacity: dim ? 0.15 : 1,
        color: "#0b0b0f",
      }}
    >
      {PART_LABELS[part]}
    </div>
  );
}
