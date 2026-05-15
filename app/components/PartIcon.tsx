import { PART_IMAGES, PART_LABELS } from "../game/config";

interface Props {
  part: number;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  dim?: boolean;
  /**
   * Si true, aplica la animación de aparición/desaparición (pop-in con
   * bounce + fade out al final). Se usa en SequenceScreen para los iconos
   * de la secuencia que el jugador debe memorizar.
   */
  animated?: boolean;
}

// Tamaños del contenedor. La imagen interna usa object-contain para no
// deformarse — el tamaño efectivo depende del aspect ratio del PNG.
// `2xl` usa viewport units para aprovechar la pantalla en cualquier monitor.
const sizeMap = {
  sm: "w-16 h-16",
  md: "w-28 h-28",
  lg: "w-40 h-40",
  xl: "w-64 h-64",
  "2xl": "w-[75vw] h-[60vh] max-w-[1400px] max-h-[800px]",
};

export function PartIcon({
  part,
  size = "md",
  dim = false,
  animated = false,
}: Props) {
  return (
    <div
      className={`${sizeMap[size]} flex items-center justify-center transition-opacity ${
        animated ? "animate-part-icon" : ""
      }`}
      style={{ opacity: dim ? 0.15 : 1 }}
    >
      <img
        src={PART_IMAGES[part]}
        alt={PART_LABELS[part]}
        className="w-full h-full object-contain"
        draggable={false}
      />
    </div>
  );
}
