'use strict';

const A = require('./_assert.js');
const E = require('../sidecar/enterprise/model.js');

const org = E.defaultOrganization();
A.eq(org.enterprise.id, 'jts-service-sale', 'Phase 1 organization is rooted in JT Service & Sale');
A.ok(org.roles.some(r => r.id === 'ceo' && r.level === 'ceo'), 'CEO is represented');
A.ok(org.roles.some(r => r.id === 'board' && r.reportsTo === 'ceo'), 'Board rolls up to CEO');
A.ok(org.roles.filter(r => r.level === 'agent').every(r => r.reportsTo === 'media-manager'), 'Sports agents report to their manager');

A.eq(E.responsibilityFor('agent'), 'execute', 'agents execute');
A.eq(E.responsibilityFor('manager'), 'delivery', 'managers own delivery');
A.eq(E.responsibilityFor('board'), 'oversight', 'board owns oversight');
A.eq(E.responsibilityFor('ceo'), 'decision', 'CEO owns material decisions');
A.eq(E.escalationTarget('agent'), 'manager', 'agent issues escalate to manager');
A.eq(E.escalationTarget('manager'), 'board', 'manager issues escalate to board');
A.eq(E.escalationTarget('board'), 'ceo', 'board issues escalate to CEO');

A.eq(E.capitalApproval(49).band, 'under_50', 'under $50 policy band');
A.eq(E.capitalApproval(50).band, '50_250', '$50 enters detailed analysis band');
A.eq(E.capitalApproval(250).band, '250_1000', '$250 enters portfolio-impact band');
A.eq(E.capitalApproval(1001).approval, 'manual_strategic', 'over $1,000 requires manual strategic approval');

A.ok(E.canSelfRaiseAutonomy('L2', 'L1'), 'authority may be reduced without self-escalation');
A.ok(!E.canSelfRaiseAutonomy('L2', 'L3'), 'agent cannot raise its own autonomy');

A.eq(E.monetizationDecision({
  ownership:'verified', licensing:'verified', commercialRights:'verified',
  transformationRights:'verified', platformEligibility:'verified',
  copyrightRisk:'low', monetizationMechanism:'platform revenue share'
}), 'MONETIZE', 'verified commercial path can monetize');
A.eq(E.monetizationDecision({
  ownership:'verified', licensing:'unknown', commercialRights:'verified',
  transformationRights:'verified', platformEligibility:'verified',
  monetizationMechanism:'platform revenue share'
}), 'REVIEW', 'unknown rights never become permission');
A.eq(E.monetizationDecision({
  ownership:'verified', licensing:'denied', commercialRights:'verified',
  transformationRights:'verified', platformEligibility:'verified',
  monetizationMechanism:'platform revenue share'
}), 'REJECT', 'denied rights reject the opportunity');

A.ok(!E.canEnterControlledProduction({ monetizationDecision:'REVIEW', managementReview:'approved' }), 'production is blocked without monetization approval');
A.ok(!E.canEnterControlledProduction({ monetizationDecision:'MONETIZE', managementReview:'approved', ceoApprovalRequired:true }), 'required CEO approval cannot be bypassed');
A.ok(E.canEnterControlledProduction({ monetizationDecision:'MONETIZE', managementReview:'approved', ceoApprovalRequired:true, ceoDecision:'approved' }), 'approved opportunity may enter controlled production');

A.eq(E.nextSportsStage('experiment', { ceoApprovalRequired:false }), 'controlled_production', 'policy may skip CEO interruption when approval is not required');
A.eq(E.nextSportsStage('ceo_approval', { ceoDecision:'denied' }), null, 'denied CEO decision stops forward progress');

A.eq(E.classifyCeoAttention({}), 'INFORM', 'healthy routine state only informs CEO');
A.eq(E.classifyCeoAttention({ managerCorrectionActive:true }), 'WATCH', 'manager corrective action is watch-level');
A.eq(E.classifyCeoAttention({ requiresDecision:true }), 'DECIDE', 'material decision reaches CEO');

A.report('enterprise-model.test');
