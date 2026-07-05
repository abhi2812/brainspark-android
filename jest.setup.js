/* Test harness setup for React Native rendering. */

// SafeAreaProvider/SafeAreaView/useSafeAreaInsets need a context. Provide an
// explicit mock (the package's built-in mock omits SafeAreaView in this version).
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  const insets = { top: 0, right: 0, bottom: 0, left: 0 };
  const frame = { x: 0, y: 0, width: 390, height: 844 };
  return {
    SafeAreaProvider: ({ children }) => React.createElement(React.Fragment, null, children),
    SafeAreaConsumer: ({ children }) => children(insets),
    SafeAreaView: ({ children, ...props }) => React.createElement(View, props, children),
    useSafeAreaInsets: () => insets,
    useSafeAreaFrame: () => frame,
    SafeAreaInsetsContext: React.createContext(insets),
    SafeAreaFrameContext: React.createContext(frame),
    initialWindowMetrics: { insets, frame },
  };
});

// react-native-svg renders native views; stub the primitives so components
// that draw art (Mascot, Icons) render as inert hosts in tests.
jest.mock('react-native-svg', () => {
  const React = require('react');
  const make = (name) => {
    const C = ({ children, ...props }) => React.createElement(name, props, children);
    C.displayName = name;
    return C;
  };
  const Svg = make('Svg');
  return {
    __esModule: true,
    default: Svg,
    Svg,
    Path: make('Path'),
    Circle: make('Circle'),
    Ellipse: make('Ellipse'),
    Rect: make('Rect'),
    Line: make('Line'),
    G: make('G'),
  };
});

// Silence the "useNativeDriver is not supported" noise from Animated in tests.
jest.spyOn(console, 'warn').mockImplementation((msg) => {
  if (typeof msg === 'string' && msg.includes('useNativeDriver')) return;
  // eslint-disable-next-line no-console
});
