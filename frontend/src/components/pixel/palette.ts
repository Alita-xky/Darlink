export type PaletteColors = {
  skin: string;
  hair: string;
  hairShade: string;
  top: string;
  topShade: string;
  prop: string;
  bg: string;
  outline: string;
};

export const PALETTES: Record<string, PaletteColors> = {
  warm:    { skin: '#F5C09F', hair: '#5C3A1E', hairShade: '#3A2611', top: '#E8745C', topShade: '#A04A38', prop: '#F5D14A', bg: '#FFF1E0', outline: '#1F1F1F' },
  cool:    { skin: '#E8C39E', hair: '#2A3F66', hairShade: '#1A2440', top: '#5C7AB4', topShade: '#384C73', prop: '#A4D4E6', bg: '#E8F0FA', outline: '#1F1F1F' },
  pastel:  { skin: '#F5D5C0', hair: '#A47AAA', hairShade: '#73557D', top: '#F5B5C8', topShade: '#C97C99', prop: '#C9E5C0', bg: '#FFF8E7', outline: '#1F1F1F' },
  mono:    { skin: '#D4D4D4', hair: '#2A2A2A', hairShade: '#0F0F0F', top: '#1F1F1F', topShade: '#0A0A0A', prop: '#999999', bg: '#F0F0F0', outline: '#1F1F1F' },
  earth:   { skin: '#C9A37A', hair: '#4A3320', hairShade: '#2D1F12', top: '#7A6440', topShade: '#4D3F26', prop: '#A88555', bg: '#E5DCC8', outline: '#1F1F1F' },
  candy:   { skin: '#FFD5C0', hair: '#FF6B9E', hairShade: '#A8447E', top: '#A4D8E5', topShade: '#5E8FA0', prop: '#FFE066', bg: '#FFF0F8', outline: '#1F1F1F' },
  forest:  { skin: '#D5B585', hair: '#3D5226', hairShade: '#243515', top: '#7A9E5C', topShade: '#4D6F35', prop: '#C4A455', bg: '#E5EFD5', outline: '#1F1F1F' },
  sunset:  { skin: '#F5C09F', hair: '#A04A38', hairShade: '#6B2A1E', top: '#FFA055', topShade: '#B86A2E', prop: '#FF6B9E', bg: '#FFE0CC', outline: '#1F1F1F' },
};
