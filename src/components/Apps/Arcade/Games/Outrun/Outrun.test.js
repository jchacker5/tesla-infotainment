import React, { StrictMode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Outrun } from './Outrun';

let contexts;
let requests;
beforeEach(() => {
  jest.useFakeTimers();
  contexts = [];
  requests = [];
  window.AudioContext = function () {
    this.state = 'running';
    this.destination = {};
    this.gain = { gain: { value: 1 }, connect: jest.fn() };
    this.createGain = () => this.gain;
    this.close = jest.fn(() => { this.state = 'closed'; return Promise.resolve(); });
    this.resume = jest.fn(() => Promise.resolve());
    contexts.push(this);
  };
  jest.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
  jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  jest.spyOn(window, 'XMLHttpRequest').mockImplementation(function () {
    this.open = jest.fn();
    this.send = jest.fn();
    this.abort = jest.fn();
    requests.push(this);
  });
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

test('on-screen Start and Mute work after a parent rerender', () => {
  const view = render(<Outrun onClose={() => {}} />);
  view.rerender(<Outrun onClose={() => {}} />);
  fireEvent.click(screen.getByRole('button', { name: 'M Mute' }));
  expect(contexts[0].gain.gain.value).toBe(0);
  fireEvent.click(screen.getByRole('button', { name: 'M Mute' }));
  expect(contexts[0].gain.gain.value).toBe(1);
  fireEvent.click(screen.getByRole('button', { name: 'C Start' }));
  expect(view.container.querySelector('#text').innerText).toBe(3);
  act(() => jest.advanceTimersByTime(2000));
  expect(view.container.querySelector('#hud')).toHaveStyle({ display: 'block' });
  expect(view.container.querySelector('#home')).toHaveStyle({ display: 'none' });
});

test('unmount during a countdown cancels timers, animation, downloads and audio', () => {
  const view = render(<Outrun />);
  fireEvent.click(screen.getByRole('button', { name: 'C Start' }));
  view.unmount();
  expect(contexts[0].close).toHaveBeenCalledTimes(1);
  expect(window.cancelAnimationFrame).toHaveBeenCalled();
  requests.forEach(request => expect(request.abort).toHaveBeenCalled());
  expect(jest.getTimerCount()).toBe(0);
  act(() => jest.runOnlyPendingTimers());
});

test('StrictMode replay does not duplicate road nodes or leave the old audio context open', () => {
  const single = render(<Outrun />);
  const roadChildren = single.container.querySelector('#road').children.length;
  single.unmount();
  const strict = render(<StrictMode><Outrun /></StrictMode>);
  expect(strict.container.querySelector('#road').children).toHaveLength(roadChildren);
  expect(contexts.slice(0, -1).every(context => context.state === 'closed')).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'C Start' }));
  fireEvent.keyUp(window, { code: 'Escape' });
  act(() => jest.advanceTimersByTime(3000));
  expect(strict.container.querySelector('#home')).toHaveStyle({ display: 'block' });
  expect(strict.container.querySelector('#hud')).toHaveStyle({ display: 'none' });
});
