/* sidecar/enterprise/model.js — StarNetOS Phase 1 enterprise-control domain.
   Pure policy/model helpers only: no I/O, no model calls, no authority side effects. */
'use strict';

const LEVELS = Object.freeze(['agent', 'manager', 'board', 'ceo']);
const AUTONOMY = Object.freeze(['L0', 'L1', 'L2', 'L3', 'L4']);
const SPORTS_STAGES = Object.freeze([
  'source_discovery',
  'content_understanding',
  'opportunity_scoring',
  'rights_compliance',
  'monetization_gate',
  'management_review',
  'experiment',
  'ceo_approval',
  'controlled_production',
  'quality_control',
  'measurement',
  'learning',
  'terminal'
]);
const TERMINAL_DECISIONS = Object.freeze(['scale', 'modify', 'continue', 'pause', 'kill']);

function clean(value) { return String(value == null ? '' : value).trim(); }
function finite(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
function autonomyRank(level) { return AUTONOMY.indexOf(clean(level).toUpperCase()); }

function createRole(input) {
  const x = input || {};
  const level = clean(x.level).toLowerCase();
  if (!LEVELS.includes(level)) throw new Error('enterprise: invalid role level');
  const id = clean(x.id);
  const name = clean(x.name);
  if (!id || !name) throw new Error('enterprise: role id and name are required');
  return Object.freeze({
    id, name, level,
    reportsTo: clean(x.reportsTo) || null,
    businessId: clean(x.businessId) || null,
    teamId: clean(x.teamId) || null
  });
}

function defaultOrganization() {
  return Object.freeze({
    enterprise: { id: 'jts-service-sale', name: "JT's Service & Sale" },
    roles: Object.freeze([
      createRole({ id: 'ceo', name: 'CEO / Owner', level: 'ceo' }),
      createRole({ id: 'board', name: 'Board of Directors', level: 'board', reportsTo: 'ceo' }),
      createRole({ id: 'media-manager', name: 'Media Manager', level: 'manager', reportsTo: 'board', businessId: 'media', teamId: 'sports' }),
      createRole({ id: 'sports-scout', name: 'Sports Scout', level: 'agent', reportsTo: 'media-manager', businessId: 'media', teamId: 'sports' }),
      createRole({ id: 'sports-analyst', name: 'Sports Analyst', level: 'agent', reportsTo: 'media-manager', businessId: 'media', teamId: 'sports' }),
      createRole({ id: 'rights-analyst', name: 'Rights / Monetization Analyst', level: 'agent', reportsTo: 'media-manager', businessId: 'media', teamId: 'sports' }),
      createRole({ id: 'sports-producer', name: 'Sports Producer', level: 'agent', reportsTo: 'media-manager', businessId: 'media', teamId: 'sports' }),
      createRole({ id: 'performance-analyst', name: 'Performance Analyst', level: 'agent', reportsTo: 'media-manager', businessId: 'media', teamId: 'sports' })
    ])
  });
}

function responsibilityFor(level) {
  switch (clean(level).toLowerCase()) {
    case 'agent': return 'execute';
    case 'manager': return 'delivery';
    case 'board': return 'oversight';
    case 'ceo': return 'decision';
    default: return null;
  }
}

function escalationTarget(level) {
  switch (clean(level).toLowerCase()) {
    case 'agent': return 'manager';
    case 'manager': return 'board';
    case 'board': return 'ceo';
    default: return null;
  }
}

function capitalApproval(amountUsd) {
  const amount = Math.max(0, finite(amountUsd, 0));
  if (amount < 50) return { band: 'under_50', approval: 'approval', analysis: 'recommendation' };
  if (amount < 250) return { band: '50_250', approval: 'approval', analysis: 'detailed' };
  if (amount <= 1000) return { band: '250_1000', approval: 'approval', analysis: 'detailed_portfolio_impact' };
  return { band: 'over_1000', approval: 'manual_strategic', analysis: 'detailed_portfolio_impact' };
}

function canSelfRaiseAutonomy(current, requested) {
  const a = autonomyRank(current), b = autonomyRank(requested);
  if (a < 0 || b < 0) return false;
  return b <= a; // raising authority is never self-service
}

function monetizationDecision(input) {
  const x = input || {};
  const required = ['ownership', 'licensing', 'commercialRights', 'transformationRights', 'platformEligibility'];
  if (required.some(k => clean(x[k]).toLowerCase() === 'denied')) return 'REJECT';
  if (required.some(k => !clean(x[k]) || clean(x[k]).toLowerCase() === 'unknown')) return 'REVIEW';
  const risk = clean(x.policyRisk || x.copyrightRisk).toLowerCase();
  if (risk === 'high' || risk === 'prohibited') return 'REJECT';
  if (!clean(x.monetizationMechanism)) return 'REVIEW';
  return 'MONETIZE';
}

function canEnterControlledProduction(input) {
  const x = input || {};
  if (x.monetizationDecision !== 'MONETIZE') return false;
  if (x.managementReview !== 'approved') return false;
  if (x.ceoApprovalRequired && x.ceoDecision !== 'approved') return false;
  return true;
}

function nextSportsStage(stage, state) {
  const current = clean(stage);
  const i = SPORTS_STAGES.indexOf(current);
  if (i < 0 || current === 'terminal') return null;
  if (current === 'monetization_gate' && state && state.monetizationDecision !== 'MONETIZE') return null;
  if (current === 'management_review' && state && state.managementReview !== 'approved') return null;
  if (current === 'experiment' && state && !state.ceoApprovalRequired) return 'controlled_production';
  if (current === 'ceo_approval' && state && state.ceoDecision !== 'approved') return null;
  return SPORTS_STAGES[i + 1] || null;
}

function classifyCeoAttention(input) {
  const x = input || {};
  if (x.requiresDecision || x.policyException || x.materialRisk) return 'DECIDE';
  if (x.managerCorrectionActive || x.trendConcern) return 'WATCH';
  return 'INFORM';
}

module.exports = {
  LEVELS, AUTONOMY, SPORTS_STAGES, TERMINAL_DECISIONS,
  createRole, defaultOrganization, responsibilityFor, escalationTarget,
  capitalApproval, canSelfRaiseAutonomy, monetizationDecision,
  canEnterControlledProduction, nextSportsStage, classifyCeoAttention
};
