import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldEnableMovement } from '../src/core/FirstPersonController.js';

test('movement remains available through drag-look fallback', () => {
  assert.equal(shouldEnableMovement({ locked: false, fallbackActive: true, modalOpen: false, ending: false }), true);
});

test('modal and ending states always suspend movement', () => {
  assert.equal(shouldEnableMovement({ locked: true, fallbackActive: false, modalOpen: true, ending: false }), false);
  assert.equal(shouldEnableMovement({ locked: false, fallbackActive: true, modalOpen: false, ending: true }), false);
});

test('sustained maintenance suspends walking without disabling fallback look', () => {
  assert.equal(shouldEnableMovement({
    locked: false,
    fallbackActive: true,
    modalOpen: false,
    ending: false,
    maintenanceActive: true,
  }), false);
});
