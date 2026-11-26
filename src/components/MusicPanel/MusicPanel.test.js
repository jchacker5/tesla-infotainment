import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MusicPanel } from './MusicPanel';

let players;
beforeEach(() => {
  players = [];
  jest.spyOn(window, 'Audio').mockImplementation(() => {
    const audio = new EventTarget();
    Object.assign(audio, {
      src: '', currentTime: 0, duration: 100, volume: 1,
      play: jest.fn(() => Promise.resolve()), pause: jest.fn(),
      removeAttribute: jest.fn(), load: jest.fn(),
    });
    players.push(audio);
    return audio;
  });
});
afterEach(() => jest.restoreAllMocks());

test('play/pause and rerenders reuse one player and do not reload the track', () => {
  const view = render(<MusicPanel volume={50} />);
  const audio = players[0];
  act(() => { audio.currentTime = 37; audio.dispatchEvent(new Event('timeupdate')); });
  const source = audio.src;
  fireEvent.click(screen.getByRole('button', { name: 'Play & Pause' }));
  expect(audio.play).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: 'Play & Pause' }));
  view.rerender(<MusicPanel volume={25} />);
  expect(players).toHaveLength(1);
  expect(audio.src).toBe(source);
  expect(audio.currentTime).toBe(37);
  expect(audio.volume).toBe(0.25);
  view.unmount();
  expect(audio.pause).toHaveBeenCalled();
  expect(audio.removeAttribute).toHaveBeenCalledWith('src');
  expect(audio.load).toHaveBeenCalled();
});

test('changing track resets displayed progress and a rejected play returns to paused', async () => {
  render(<MusicPanel volume={50} />);
  const audio = players[0];
  act(() => {
    audio.currentTime = 37;
    audio.dispatchEvent(new Event('timeupdate'));
    audio.dispatchEvent(new Event('loadedmetadata'));
  });
  expect(screen.getByText('0:37 / 1:40')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Next Track' }));
  expect(screen.getByText('0:00 / 0:00')).toBeInTheDocument();
  audio.play.mockRejectedValue(new Error('blocked'));
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Play & Pause' })));
  expect(screen.getByAltText('Play & Pause')).toHaveAttribute('src', expect.stringContaining('icon-music-play.svg'));
});

test('Space controls playback but does not intercept typing in an input', () => {
  render(<><input aria-label="Destination" /><MusicPanel volume={50} /></>);
  fireEvent.keyDown(screen.getByLabelText('Destination'), { key: ' ' });
  expect(players[0].play).not.toHaveBeenCalled();
  fireEvent.keyDown(window, { key: ' ' });
  expect(players[0].play).toHaveBeenCalledTimes(1);
});
