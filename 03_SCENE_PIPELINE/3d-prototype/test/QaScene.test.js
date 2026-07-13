import test from 'node:test';
import assert from 'node:assert/strict';
import { qaScenePreset } from '../src/dev/QaScene.js';

test('QA presets preserve chapter order and never invent story events', () => {
  const reveal = qaScenePreset('reveal');
  assert.deepEqual(reveal.events.map((item) => item.action), [
    'locate-short', 'secure-joint', 'pull-valve', 'scan-wristband', 'choose-bargain', 'open-airlock',
  ]);
  assert.deepEqual(reveal.position, [0, 1.65, -154]);
  assert.equal(reveal.pitch, 0.16);
  assert.equal(qaScenePreset('unknown'), null);
});
