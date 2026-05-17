/**
 * Prompt Engineering Module.
 *
 * Single source of truth for translating user-facing UI styles into rich,
 * production-grade prompts for diffusion models (SDXL / ControlNet / etc.).
 *
 * Used by:
 *   - server/index.ts (real Replicate dispatch)
 *   - src/screens/UploadScreen.tsx (UI style picker metadata)
 *
 * Design choice: keep the heavy prompt text on the server boundary. The
 * client only ships small style metadata to minimise bundle size and
 * prevent prompt copy-paste / abuse.
 */

export type StyleId =
  | 'scandinavian'
  | 'loft'
  | 'neoclassic'
  | 'minimal'
  | 'japandi'
  | 'boho';

export interface StyleMeta {
  id: StyleId;
  /** Short UI label, localized in the screen if needed. */
  label: string;
  /** One-line UI description (RU). */
  description: string;
  /** Thumbnail used in the style carousel. */
  thumbnail: string;
}

export interface StyleDefinition extends StyleMeta {
  /** Detailed cinematic prompt for the diffusion model. */
  prompt: string;
  /** Extra weight modifiers appended after the user image guidance. */
  modifiers: string[];
}

/* ------------------------------------------------------------------ */
/*  Shared building blocks                                             */
/* ------------------------------------------------------------------ */

/** Quality + camera tags appended to every style. */
const QUALITY_SUFFIX = [
  'photorealistic',
  'ultra-detailed',
  'architectural digest photography',
  'professional interior photography',
  'shot on Sony A7R IV, 24mm lens, f/8',
  'soft natural daylight, golden hour ambient fill',
  'sharp focus, high dynamic range',
  '8k resolution',
  'magazine-quality composition',
].join(', ');

/** Hard negative prompt to suppress recurring SDXL / Replicate failure modes. */
export const NEGATIVE_PROMPT = [
  'low quality',
  'blurry',
  'out of focus',
  'jpeg artifacts',
  'compression artifacts',
  'oversaturated',
  'overexposed',
  'underexposed',
  'distorted perspective',
  'warped walls',
  'broken geometry',
  'wrong proportions',
  'floating furniture',
  'duplicated furniture',
  'extra furniture',
  'cartoon',
  'illustration',
  'painting',
  'render',
  '3d render',
  'cgi',
  'unreal engine',
  'cluttered',
  'messy',
  'people',
  'humans',
  'pets',
  'text',
  'watermark',
  'logo',
  'signature',
  'frame',
  'border',
].join(', ');

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const STYLES: Record<StyleId, StyleDefinition> = {
  scandinavian: {
    id: 'scandinavian',
    label: 'Scandinavian',
    description: 'Светлое дерево, мягкие тона, минимум деталей',
    thumbnail:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDsbKw5UkXdZ8xHDFSFguPVhuaE1F1j87EN7FMrrU3Dj5BQVcGKVenQUJu9DIdTrjYqf4c8SnBsW4Zn5IRO-7IfF5q_Uy0AlTIyuYGkl_xsXB6cEW7gMyxoJ0XHHMMl5oI4H6hkM4-IDATFWUTFvzJVAFAWBjgXa8ZejbmlubrMLIi6qNWlzSZovdc9LoT2CcrxqlJtu704tOxDBs9jjWUKJFiBCl3u0u7Jsu4mO7VsNYzcd2RQfTXaTbQdKNans1cdU531J6rm6xAo',
    prompt:
      'professionally staged Scandinavian interior, light oak hardwood floors, soft warm white walls, oversized linen sectional sofa in dove grey, low pile beige wool rug, light oak coffee table with subtle wood grain, slim black metal floor lamp, abundant indoor plants in matte terracotta pots, sheer linen curtains diffusing daylight, hygge atmosphere, airy and bright',
    modifiers: [
      'colour palette: warm off-white, dove grey, pale oak, sage accents',
      'lighting: soft Nordic daylight from large windows, gentle ambient bounce',
      'materials: brushed oak, linen, wool, matte ceramics, brushed brass details',
    ],
  },

  loft: {
    id: 'loft',
    label: 'Industrial Loft',
    description: 'Кирпич, металл, кожа, контрастное освещение',
    thumbnail:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDBQiCCd3qudKk6_uQB1ZxfzkoCpNSJRaG0F_X1NeZgwxHW_kzuiy3-vSCbGK93kr467XNGGU9gluS12WQTsu33ChCJTOMabjcHw0thgIypbndjE6BIA2FkvA1ZDznkQ6XkSgBdOB34txuMdpVrTEruyZQ21647ydJf8HVCaNprwwqjWMVf_LktdYEIFXIw9xIgoYnZ3jSwzGB34b_eMWV35GySsFQDTf1DtGhgdRIYq3Fm8-DK7d-CMV7Q8yott7ZqlCyU8dmaXpkB',
    prompt:
      'professionally staged industrial loft interior, exposed red brick accent wall, polished concrete floors, weathered Chesterfield leather sofa in cognac brown, blackened steel coffee table, vintage Edison filament pendant lighting, distressed leather club chair, large abstract canvas art with muted tones, reclaimed timber bookshelves, factory windows with black metal mullions',
    modifiers: [
      'colour palette: charcoal, cognac, rust, weathered brass, smoked oak',
      'lighting: high-contrast directional light, warm tungsten pendants, deep shadow play',
      'materials: aged leather, blackened steel, exposed brick, polished concrete, reclaimed wood',
    ],
  },

  neoclassic: {
    id: 'neoclassic',
    label: 'Neo-Classical',
    description: 'Молдинги, лепнина, благородные ткани',
    thumbnail:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA7ybKcdNYtoL9zFL0LPo1uIlsv_UM7fN-hF4av_SDSpHb8Na5hxvtO7hVpBZ-dlHDnu9fYcyk2pAt40RL2qaRFxc4Y5eP6EKkS2QEqIMZpZGtpvXEAQQbaLyKM57BYTIHVnpRX8sfM553cycKyc8hl17Y7bDqX10PoBcGdfYy9gJ5AsaMz6nMRATSxKm8jiUwHNAEVo5tmgxWariJRTr-jx1gEUR1HReTiy0VcObyoufxoacs9oqCmmUqNwOkdpGuBUhAevfcG_esk',
    prompt:
      'professionally staged neo-classical interior, ornate crown moulding, panelled walls in muted putty, herringbone parquet flooring, tufted velvet sofa in deep emerald, marble-topped coffee table with brass inlay, antique gilded mirror, crystal chandelier with brass arms, silk drapery with passementerie trim, symmetrical furniture arrangement, refined and elegant',
    modifiers: [
      'colour palette: ivory, putty, emerald velvet, polished brass, walnut',
      'lighting: chandelier ambient + soft sconce uplight, gentle key from tall windows',
      'materials: silk, velvet, polished marble, gilded brass, antique walnut',
    ],
  },

  minimal: {
    id: 'minimal',
    label: 'Modern Minimal',
    description: 'Чистые линии, монохром, много воздуха',
    thumbnail:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDsbKw5UkXdZ8xHDFSFguPVhuaE1F1j87EN7FMrrU3Dj5BQVcGKVenQUJu9DIdTrjYqf4c8SnBsW4Zn5IRO-7IfF5q_Uy0AlTIyuYGkl_xsXB6cEW7gMyxoJ0XHHMMl5oI4H6hkM4-IDATFWUTFvzJVAFAWBjgXa8ZejbmlubrMLIi6qNWlzSZovdc9LoT2CcrxqlJtu704tOxDBs9jjWUKJFiBCl3u0u7Jsu4mO7VsNYzcd2RQfTXaTbQdKNans1cdU531J6rm6xAo',
    prompt:
      'professionally staged ultra-minimal modern interior, seamless micro-cement flooring, monolithic plaster walls, floating low-profile sofa in pale stone bouclé, single oversized travertine coffee table, single sculptural ceramic vessel as focal point, recessed perimeter lighting, negative space, museum-quality restraint',
    modifiers: [
      'colour palette: bone white, warm grey, sand travertine, soft stone',
      'lighting: even diffuse daylight, low-contrast soft shadows',
      'materials: micro-cement, bouclé, travertine, raw plaster, brushed aluminium',
    ],
  },

  japandi: {
    id: 'japandi',
    label: 'Japandi',
    description: 'Японская сдержанность × скандинавское тепло',
    thumbnail:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDsbKw5UkXdZ8xHDFSFguPVhuaE1F1j87EN7FMrrU3Dj5BQVcGKVenQUJu9DIdTrjYqf4c8SnBsW4Zn5IRO-7IfF5q_Uy0AlTIyuYGkl_xsXB6cEW7gMyxoJ0XHHMMl5oI4H6hkM4-IDATFWUTFvzJVAFAWBjgXa8ZejbmlubrMLIi6qNWlzSZovdc9LoT2CcrxqlJtu704tOxDBs9jjWUKJFiBCl3u0u7Jsu4mO7VsNYzcd2RQfTXaTbQdKNans1cdU531J6rm6xAo',
    prompt:
      'professionally staged Japandi interior, wide plank ash flooring with matte finish, washi paper pendant lamp, low-profile Japanese tatami-inspired sofa in oat linen, smoked oak tea table, bonsai and tall floor reed arrangements, shoji-style sliding screens diffusing light, hand-thrown stoneware ceramics, wabi-sabi imperfection celebrated',
    modifiers: [
      'colour palette: oat, smoked oak, warm taupe, charcoal accent, soft moss',
      'lighting: diffused window light through washi screens, warm low-angle key light',
      'materials: ash wood, washi paper, raw linen, hand-thrown stoneware, smoked oak',
    ],
  },

  boho: {
    id: 'boho',
    label: 'Modern Boho',
    description: 'Тёплая земля, текстиль, растения',
    thumbnail:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDsbKw5UkXdZ8xHDFSFguPVhuaE1F1j87EN7FMrrU3Dj5BQVcGKVenQUJu9DIdTrjYqf4c8SnBsW4Zn5IRO-7IfF5q_Uy0AlTIyuYGkl_xsXB6cEW7gMyxoJ0XHHMMl5oI4H6hkM4-IDATFWUTFvzJVAFAWBjgXa8ZejbmlubrMLIi6qNWlzSZovdc9LoT2CcrxqlJtu704tOxDBs9jjWUKJFiBCl3u0u7Jsu4mO7VsNYzcd2RQfTXaTbQdKNans1cdU531J6rm6xAo',
    prompt:
      'professionally staged modern bohemian interior, terracotta-toned plaster walls, layered Berber and kilim rugs, low-slung cream linen sofa with abundant textured cushions, rattan and cane accent chair, woven jute pouf, large monstera and palm plants, hand-thrown earthenware vessels, macrame wall hanging, warm sun-soaked atmosphere',
    modifiers: [
      'colour palette: terracotta, cream, sand, deep ochre, dusty olive',
      'lighting: warm afternoon sun, soft golden glow, gentle window haze',
      'materials: hand-loomed wool, rattan, jute, raw plaster, hand-thrown earthenware',
    ],
  },
};

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

export const ALL_STYLES: StyleMeta[] = Object.values(STYLES).map(
  ({ id, label, description, thumbnail }) => ({ id, label, description, thumbnail }),
);

export const isStyleId = (s: string | undefined): s is StyleId =>
  !!s && Object.prototype.hasOwnProperty.call(STYLES, s);

export interface BuiltPrompt {
  styleId: StyleId;
  prompt: string;
  negativePrompt: string;
  /** Useful for logging / debugging Replicate runs. */
  meta: {
    label: string;
    modifiers: string[];
  };
}

/**
 * Build a production-ready prompt for the chosen style.
 * Falls back to `scandinavian` when the input is unknown so the pipeline
 * never crashes on unexpected client data.
 */
export const buildPrompt = (input: string | undefined, roomType?: string): BuiltPrompt => {
  const id: StyleId = isStyleId(input) ? input : 'scandinavian';
  const def = STYLES[id];

  const roomTag = roomType ? `${roomType.trim()}, ` : '';

  const prompt = [
    roomTag + def.prompt,
    ...def.modifiers,
    QUALITY_SUFFIX,
  ].join(', ');

  return {
    styleId: id,
    prompt,
    negativePrompt: NEGATIVE_PROMPT,
    meta: { label: def.label, modifiers: def.modifiers },
  };
};
