// =========================================================
// CARHAWK ULTIMATE - QUANTUM CONFIGURATION
// =========================================================
// FILE: quantum_config.gs - Centralized System Identity & Constants
// This file MUST load before all other modules.
// All system-level identifiers are declared here ONCE to prevent
// duplicate const declarations across the shared Apps Script global scope.
// =========================================================

/**
 * QUANTUM - Central system identity configuration object.
 * Single source of truth for version, name, and signature constants.
 *
 * Usage:
 *   QUANTUM.VERSION   - System version string
 *   QUANTUM.NAME      - Application display name
 *   QUANTUM.SIGNATURE - Application icon/emoji signature
 */
const QUANTUM = {
  VERSION: 'QUANTUM-2.0.0',
  NAME: 'CarHawk Ultimate CRM',
  SIGNATURE: '🚗⚛️'
};
