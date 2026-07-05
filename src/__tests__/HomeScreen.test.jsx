import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import HomeScreen from '../screens/HomeScreen';
import { registerDevice } from '../api/timmble';
import { setString } from '../storage';

jest.mock('../api/timmble', () => ({ registerDevice: jest.fn() }));
jest.mock('../storage', () => ({ setString: jest.fn(() => Promise.resolve()) }));

const makeNav = () => ({ navigate: jest.fn() });

describe('HomeScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders the mascot greeting and all core sections', () => {
    const { getByText } = render(<HomeScreen navigation={makeNav()} />);
    expect(getByText(/Hi, I.m Timmo/)).toBeTruthy();
    expect(getByText('Who’s playing today?')).toBeTruthy();
    expect(getByText('Start Warm-Up')).toBeTruthy();
    expect(getByText('Skip to Games')).toBeTruthy();
    // the 5 skill labels render (custom icons, no emoji)
    ['Memory', 'Focus', 'Patterns', 'Shapes', 'Logic'].forEach((label) =>
      expect(getByText(label)).toBeTruthy()
    );
  });

  it('does NOT register or navigate until an age is chosen (age gate)', () => {
    const nav = makeNav();
    const { getByText } = render(<HomeScreen navigation={nav} />);
    fireEvent.press(getByText('Start Warm-Up'));
    expect(registerDevice).not.toHaveBeenCalled();
    expect(nav.navigate).not.toHaveBeenCalled();
  });

  it('registers the device and opens the Warm-Up after an age is chosen', async () => {
    const nav = makeNav();
    const { getByText } = render(<HomeScreen navigation={nav} />);
    fireEvent.press(getByText('Little Explorers')); // age id "young"
    fireEvent.press(getByText('Start Warm-Up'));
    await waitFor(() => expect(nav.navigate).toHaveBeenCalledWith('Assessment'));
    expect(setString).toHaveBeenCalledWith('bs_age_group', 'young');
    expect(registerDevice).toHaveBeenCalledWith('young');
  });

  it('"Skip to Games" opens Games once an age is chosen', async () => {
    const nav = makeNav();
    const { getByText } = render(<HomeScreen navigation={nav} />);
    fireEvent.press(getByText('Rising Stars')); // age id "middle"
    fireEvent.press(getByText('Skip to Games'));
    await waitFor(() => expect(nav.navigate).toHaveBeenCalledWith('Games'));
    expect(registerDevice).toHaveBeenCalledWith('middle');
  });
});
