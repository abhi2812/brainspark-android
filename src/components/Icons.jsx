import React from 'react';
import Svg, { Path, Rect, Circle, G, Line } from 'react-native-svg';

// Soft = the same color, faded — keeps every icon monochromatic & cohesive.
const SOFT = 0.26;

/** Skill-area glyphs (Memory, Attention, Pattern, Spatial, Logic). */
export function SkillIcon({ name, color = '#26C2AE', size = 28 }) {
  const p = { fill: color };
  const s = { fill: color, opacity: SOFT };
  const glyph = {
    memory: (
      <G>
        <Rect x="3.5" y="7" width="11" height="14" rx="3.2" {...s} />
        <Rect x="9.5" y="3.5" width="11" height="14" rx="3.2" {...p} />
        <Circle cx="15" cy="10.5" r="2.1" fill="#fff" />
      </G>
    ),
    attention: (
      <G>
        <Circle cx="8" cy="8" r="3" {...s} />
        <Circle cx="16.5" cy="7.6" r="3.8" {...p} />
        <Circle cx="8" cy="16.5" r="3" {...s} />
        <Circle cx="16" cy="16.5" r="3" {...s} />
      </G>
    ),
    pattern: (
      <G>
        <Circle cx="5" cy="12" r="3.2" {...p} />
        <Rect x="9" y="8.8" width="6" height="6" rx="1.8" {...s} />
        <Circle cx="19" cy="12" r="3.2" {...p} />
      </G>
    ),
    spatial: (
      <G>
        <Rect x="6.5" y="8.5" width="9.5" height="9.5" rx="3" {...s} />
        <Path d="M15 4.5 A 6.5 6.5 0 0 1 20 9.5" stroke={color} strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <Path d="M20.4 5 L20.2 9.6 L15.8 8.7 Z" {...p} />
      </G>
    ),
    logic: (
      <G>
        <Circle cx="12" cy="9.5" r="6.2" {...s} />
        <Rect x="9" y="15" width="6" height="4.5" rx="1.6" {...p} />
        <Path d="M12 6.5 L12 12.5 M9.5 9 L12 12.5 L14.5 9" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </G>
    ),
  }[name];
  return <Svg width={size} height={size} viewBox="0 0 24 24">{glyph}</Svg>;
}

/** UI icons — tabs, badges, actions. */
export function Icon({ name, color = '#2C2740', size = 24 }) {
  const st = { stroke: color, strokeWidth: 2, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };
  const fl = { fill: color };
  const glyph = {
    home: <Path d="M4 11 L12 4 L20 11 M6 10 V20 H18 V10" {...st} />,
    games: (
      <G>
        <Rect x="2.5" y="7" width="19" height="11" rx="5.5" {...st} />
        <Line x1="7" y1="12" x2="10" y2="12" {...st} /><Line x1="8.5" y1="10.5" x2="8.5" y2="13.5" {...st} />
        <Circle cx="15.5" cy="11" r="1.1" {...fl} /><Circle cx="17.5" cy="13.5" r="1.1" {...fl} />
      </G>
    ),
    chart: (
      <G>
        <Line x1="5" y1="20" x2="19" y2="20" {...st} />
        <Rect x="6" y="12" width="3.2" height="6" rx="1.2" {...fl} />
        <Rect x="10.4" y="8" width="3.2" height="10" rx="1.2" {...fl} />
        <Rect x="14.8" y="14" width="3.2" height="4" rx="1.2" {...fl} />
      </G>
    ),
    spark: (
      <Path d="M12 3 C12.6 7.5 14.5 9.4 19 10 C14.5 10.6 12.6 12.5 12 17 C11.4 12.5 9.5 10.6 5 10 C9.5 9.4 11.4 7.5 12 3 Z" {...fl} />
    ),
    flame: (
      <Path d="M12 3 C13 7 17 8 15.5 13 C15 15 13.5 16.5 12 16.5 C10 16.5 8.5 15 8.5 12.5 C8.5 10.5 10 10 10 8 C11 8.5 11.5 6 12 3 Z" {...fl} />
    ),
    trend: <Path d="M4 15 L9 10 L13 13 L20 6 M20 6 H15.5 M20 6 V10.5" {...st} />,
    globe: (
      <G>
        <Circle cx="12" cy="12" r="8.5" {...st} />
        <Path d="M3.5 12 H20.5 M12 3.5 C15 6.5 15 17.5 12 20.5 C9 17.5 9 6.5 12 3.5" {...st} />
      </G>
    ),
    sound: (
      <G>
        <Path d="M4 9.5 H7 L11 6 V18 L7 14.5 H4 Z" {...fl} />
        <Path d="M14 9 Q16 12 14 15 M16.5 7 Q20 12 16.5 17" {...st} />
      </G>
    ),
    lock: (
      <G>
        <Rect x="5" y="10.5" width="14" height="9.5" rx="3" {...fl} />
        <Path d="M8 10.5 V8 A4 4 0 0 1 16 8 V10.5" {...st} />
      </G>
    ),
    arrow: <Path d="M5 12 H19 M13 6 L19 12 L13 18" {...st} />,
    check: <Path d="M5 12.5 L10 17.5 L19 7" {...st} />,
  }[name];
  return <Svg width={size} height={size} viewBox="0 0 24 24">{glyph}</Svg>;
}
