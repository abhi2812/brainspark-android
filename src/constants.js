export const AGE_GROUPS = [
  { id: 'young', range: '3-5', label: 'Little Explorers', icon: '🧒', desc: 'Visual & audio games' },
  { id: 'middle', range: '6-8', label: 'Rising Stars', icon: '🧑‍🎓', desc: 'Fun challenges' },
  { id: 'older', range: '9-12', label: 'Brain Champions', icon: '🧑‍💻', desc: 'Advanced puzzles' },
];

export const DOMAINS = [
  { key: 'memory', name: 'Memory', icon: '🧩', color: '#4F46E5', storageKey: 'bs_game_memory' },
  { key: 'attention', name: 'Attention', icon: '👁️', color: '#EC4899', storageKey: 'bs_game_attention' },
  { key: 'pattern', name: 'Patterns', icon: '🔍', color: '#7C3AED', storageKey: 'bs_game_pattern' },
  { key: 'spatial', name: 'Spatial', icon: '🗺️', color: '#F59E0B', storageKey: 'bs_game_spatial' },
  { key: 'logic', name: 'Logic', icon: '⚙️', color: '#10B981', storageKey: 'bs_game_logic' },
];

export const GAMES = [
  {
    id: 'memory',
    name: 'Memory Match',
    icon: '🧩',
    domain: 'Memory',
    desc: 'Flip cards and find matching pairs. Train your working memory!',
    color: '#4F46E5',
    storageKey: 'bs_game_memory',
  },
  {
    id: 'attention',
    name: 'Spot the Odd',
    icon: '👁️',
    domain: 'Attention',
    desc: 'Find the different item in a grid. Focus up!',
    color: '#EC4899',
    storageKey: 'bs_game_attention',
  },
  {
    id: 'pattern',
    name: 'Pattern Puzzle',
    icon: '🔍',
    domain: 'Patterns',
    desc: 'Complete the repeating pattern. Spot the hidden rules!',
    color: '#7C3AED',
    storageKey: 'bs_game_pattern',
  },
  {
    id: 'spatial',
    name: 'Shape Shift',
    icon: '🗺️',
    domain: 'Spatial',
    desc: 'Find rotated and mirrored shapes. Think in 2D!',
    color: '#F59E0B',
    storageKey: 'bs_game_spatial',
  },
  {
    id: 'logic',
    name: 'Number Logic',
    icon: '⚙️',
    domain: 'Logic',
    desc: 'Find what comes next in number sequences. Crack the code!',
    color: '#10B981',
    storageKey: 'bs_game_logic',
  },
];
