import test from 'node:test';
import assert from 'node:assert/strict';
import { UI_COPY } from '../src/UIManager.js';

test('interface copy contains exact chapter 1 audit values', () => {
  const copy = JSON.stringify(UI_COPY);
  for (const value of ['D9-4417', '二十七點', '九點', '四十點', '七十二小時']) {
    assert.equal(copy.includes(value), true, `missing chapter value: ${value}`);
  }
});

test('interface copy excludes retired prototype and internal process language', () => {
  const copy = JSON.stringify(UI_COPY);
  for (const forbidden of ['規則殘片', '污染值', '紅色方塊', 'AI 續寫', '後續揭露', '作者需注意']) {
    assert.equal(copy.includes(forbidden), false, `forbidden copy: ${forbidden}`);
  }
});

test('maintenance instrument copy explains every skill action and recovery', () => {
  const copy = JSON.stringify(UI_COPY);
  for (const value of ['探測電纜', '焊接熱度', '接頭穩定', '穩住義腿', '管線壓力', '斷路器復歸']) {
    assert.equal(copy.includes(value), true, `missing maintenance copy: ${value}`);
  }
});
