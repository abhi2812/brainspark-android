import React from 'react';
import Svg, { Polygon, Line, Circle, Text as SvgText } from 'react-native-svg';
import { DOMAINS } from '../constants';

const SIZE = 240;
const CENTER = SIZE / 2;
const RADIUS = 80;
const LEVELS = 4;
const ANGLE_STEP = (2 * Math.PI) / 5;
const START_ANGLE = -Math.PI / 2;

function getPoint(index, value) {
  const angle = START_ANGLE + index * ANGLE_STEP;
  const r = (value / 100) * RADIUS;
  return { x: CENTER + r * Math.cos(angle), y: CENTER + r * Math.sin(angle) };
}

export default function RadarChart({ scores }) {
  const gridPolygons = [];
  for (let l = 1; l <= LEVELS; l++) {
    const r = (l / LEVELS) * RADIUS;
    const pts = Array.from({ length: 5 }, (_, i) => {
      const angle = START_ANGLE + i * ANGLE_STEP;
      return `${CENTER + r * Math.cos(angle)},${CENTER + r * Math.sin(angle)}`;
    }).join(' ');
    gridPolygons.push(pts);
  }

  const axes = Array.from({ length: 5 }, (_, i) => {
    const angle = START_ANGLE + i * ANGLE_STEP;
    return { x2: CENTER + RADIUS * Math.cos(angle), y2: CENTER + RADIUS * Math.sin(angle) };
  });

  const dataPoints = DOMAINS.map((d, i) => getPoint(i, scores[d.key] || 0));
  const dataPolygonPts = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  const labels = DOMAINS.map((d, i) => {
    const angle = START_ANGLE + i * ANGLE_STEP;
    const labelR = RADIUS + 26;
    return {
      x: CENTER + labelR * Math.cos(angle),
      y: CENTER + labelR * Math.sin(angle),
      text: d.icon + ' ' + d.name,
      color: d.color,
    };
  });

  return (
    <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
      {gridPolygons.map((pts, i) => (
        <Polygon key={i} points={pts} fill="none" stroke="#E2E8F0" strokeWidth="1" />
      ))}
      {axes.map((ax, i) => (
        <Line key={i} x1={CENTER} y1={CENTER} x2={ax.x2} y2={ax.y2} stroke="#E2E8F0" strokeWidth="1" />
      ))}
      <Polygon points={dataPolygonPts} fill="rgba(79,70,229,0.15)" stroke="#4F46E5" strokeWidth="2.5" />
      {dataPoints.map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r="5" fill={DOMAINS[i].color} stroke="#fff" strokeWidth="2" />
      ))}
      {labels.map((l, i) => (
        <SvgText key={i} x={l.x} y={l.y} textAnchor="middle" fontSize="9" fontWeight="700" fill="#475569">
          {l.text}
        </SvgText>
      ))}
    </Svg>
  );
}
