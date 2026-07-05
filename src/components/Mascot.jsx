import React from 'react';
import Svg, { Path, Ellipse, Circle, G } from 'react-native-svg';

/**
 * Timmo — the Timmble mascot. A friendly round sprout-creature.
 * Props:
 *   size  - width in px (height scales, default 128)
 *   mood  - 'happy' | 'celebrate' | 'think'
 */
const C = {
  body: '#26C2AE',
  bodyDark: '#13A796',
  belly: '#FFF3E4',
  cheek: '#FF8A7A',
  ink: '#2C2740',
  leaf: '#3DBE7A',
  stem: '#13A796',
};

export default function Mascot({ size = 128, mood = 'happy', style }) {
  const h = size * (120 / 100);
  return (
    <Svg width={size} height={h} viewBox="0 0 100 120" style={style}>
      {/* sprout */}
      <Path d="M50 27 Q47 17 50 9" stroke={C.stem} strokeWidth="4" fill="none" strokeLinecap="round" />
      <Path d="M50 13 C43 11 39 3 47 4 C54 5 53 11 50 13 Z" fill={C.leaf} />

      {/* feet */}
      <Ellipse cx="38" cy="103" rx="10" ry="6" fill={C.bodyDark} />
      <Ellipse cx="62" cy="103" rx="10" ry="6" fill={C.bodyDark} />

      {/* arms */}
      <Ellipse cx="15" cy="70" rx="7" ry="11" fill={C.bodyDark} />
      <Ellipse cx="85" cy="70" rx="7" ry="11" fill={C.bodyDark} />

      {/* body */}
      <Path
        d="M50 26 C72 26 86 42 86 64 C86 87 72 100 50 100 C28 100 14 87 14 64 C14 42 28 26 50 26 Z"
        fill={C.body}
      />
      {/* belly */}
      <Ellipse cx="50" cy="73" rx="19" ry="17" fill={C.belly} />

      {/* cheeks */}
      <Circle cx="27" cy="69" r="6" fill={C.cheek} opacity={0.55} />
      <Circle cx="73" cy="69" r="6" fill={C.cheek} opacity={0.55} />

      {/* face */}
      {mood === 'celebrate' ? (
        <G>
          <Path d="M33 57 Q40 50 47 57" stroke={C.ink} strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <Path d="M53 57 Q60 50 67 57" stroke={C.ink} strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <Path d="M42 68 Q50 80 58 68 Q50 73 42 68 Z" fill={C.ink} />
        </G>
      ) : mood === 'think' ? (
        <G>
          <Circle cx="40" cy="58" r="9" fill="#fff" />
          <Circle cx="60" cy="58" r="9" fill="#fff" />
          <Circle cx="40" cy="60" r="4.6" fill={C.ink} />
          <Circle cx="61" cy="60" r="4.6" fill={C.ink} />
          <Path d="M44 74 Q50 71 56 74" stroke={C.ink} strokeWidth="3" fill="none" strokeLinecap="round" />
        </G>
      ) : (
        <G>
          <Circle cx="40" cy="58" r="9.5" fill="#fff" />
          <Circle cx="60" cy="58" r="9.5" fill="#fff" />
          <Circle cx="41" cy="60" r="5" fill={C.ink} />
          <Circle cx="61" cy="60" r="5" fill={C.ink} />
          <Circle cx="38.6" cy="57.6" r="1.7" fill="#fff" />
          <Circle cx="58.6" cy="57.6" r="1.7" fill="#fff" />
          <Path d="M43 71 Q50 78 57 71" stroke={C.ink} strokeWidth="3" fill="none" strokeLinecap="round" />
        </G>
      )}
    </Svg>
  );
}
