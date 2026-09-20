const BUTTON_BASE =
  "pixel-corners inline-flex items-center justify-center gap-2 border-4 font-normal leading-none whitespace-nowrap select-none [text-shadow:none] transition-[transform,filter] hover:brightness-105 focus-visible:border-white focus-visible:outline-none active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100 disabled:active:translate-y-0";

const BUTTON_VARIANTS = {
  /** The default: the banner's parchment. */
  parchment:
    "border-[#4a3a24] bg-[#d5bd93] text-[#3a2a1a] shadow-[inset_-3px_-3px_0_#9c8766,inset_3px_3px_0_#efe0c0] active:shadow-[inset_3px_3px_0_#9c8766]",
  /** The main action on a screen, and the selected tab. */
  gold: "border-[#4a3a24] bg-[#f6d365] text-[#3a2a1a] shadow-[inset_-3px_-3px_0_#c98f2b,inset_3px_3px_0_#fff1b8] active:shadow-[inset_3px_3px_0_#c98f2b]",
} as const;

const BUTTON_SIZES = {
  sm: "min-h-9 px-3 py-2 text-[10px]",
  md: "min-h-11 px-4 py-3 text-xs",
  /** Square, for a single glyph. */
  icon: "size-11 text-xs",
} as const;

export function pixelButton(
  options: { variant?: keyof typeof BUTTON_VARIANTS; size?: keyof typeof BUTTON_SIZES } = {},
): string {
  const { variant = "parchment", size = "md" } = options;
  return `${BUTTON_BASE} ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]}`;
}

/** A sheet of parchment: popups, dialogs and message boxes. */
export const PIXEL_PANEL =
  "pixel-corners border-4 border-[#4a3a24] bg-[#e6d3ac] text-[#3a2a1a] [text-shadow:none] shadow-[inset_-4px_-4px_0_#9c8766,inset_4px_4px_0_#f4e8cd]";

/** Error text on a parchment panel. */
export const PIXEL_ERROR_TEXT = "text-[#a3261f]";

/** A sunken field cut into the parchment. */
export const PIXEL_INPUT =
  "pixel-corners w-full border-4 border-[#4a3a24] bg-[#f4e8cd] px-4 py-3 text-sm text-[#3a2a1a] [text-shadow:none] shadow-[inset_3px_3px_0_#cdb98e] placeholder:text-[#3a2a1a]/45 focus:border-white focus:outline-none";
