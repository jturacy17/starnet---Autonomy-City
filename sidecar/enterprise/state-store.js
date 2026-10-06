/* sidecar/enterprise/state-store.js — durable StarNetOS enterprise state for Phase 1B.
   Reuses StarNet's crash-safe domain store. This layer persists normalized business state only;
   execution remains in the existing harness and higher-risk actions remain separately authorized. */
'use strict';

const { makeDomainStore } = require('../domain-store.js');

function clip(v, n) { return String(v == null ? '' : v).trim().slice(0, n); }
function num(v, d) { const n = Number(v); return Number.isFinite(n) ? n : d; }
function bool(v) { return v === true; }
function arr(v, n) { return Array.isArray(v) ? v.slice(0, n) : []; }

function defaults() {
  return {
    enterpriseId: 'jts-service-sale',
    businesses: {
      media: {
        id: 'media', name: 'Media', status: 'active',
        managerId: 'media-manager',
        teams: {
          sports: {
            id: 'sports', name: 'Sports Clipping', status: 'pilot',
            objectives: [], work: [], correctiveActions: [], metrics: {}
          }
        }
      }
    },
    decisions: [],
    recommendations: [],
    experiments: [],
    financialEntries: [],
    humanTimeEntries: [],
    audit: []
  };
}

function normalizeWork(raw) {
  const x = raw && typeof raw === 'object' ? raw : {};
  const state = ['queued','active','blocked','review','done','cancelled'].includes(x.state) ? x.state : 'queued';
  return {
    id: clip(x.id, 120), title: clip(x.title, 240), ownerAgentId: clip(x.ownerAgentId, 120),
    state, priority: ['low','normal','high','critical'].includes(x.priority) ? x.priority : 'normal',
    dueAt: Math.max(0, num(x.dueAt, 0)), createdAt: Math.max(0, num(x.createdAt, 0)),
    completedAt: Math.max(0, num(x.completedAt, 0)), blockedReason: clip(x.blockedReason, 280),
    quality: Math.max(0, Math.min(100, num(x.quality, 0))), costUsd: Math.max(0, num(x.costUsd, 0)),
    humanMinutes: Math.max(0, num(x.humanMinutes, 0))
  };
}
function normalizeCorrection(raw) {
  const x = raw && typeof raw === 'object' ? raw : {};
  return {
    id: clip(x.id,120), reason: clip(x.reason,280), ownerManagerId: clip(x.ownerManagerId,120),
    status: ['open','monitoring','resolved'].includes(x.status) ? x.status : 'open',
    openedAt: Math.max(0,num(x.openedAt,0)), resolvedAt: Math.max(0,num(x.resolvedAt,0))
  };
}
function normalizeDecision(raw) {
  const x=raw&&typeof raw==='object'?raw:{};
  return {
    id: clip(x.id,120), type: clip(x.type,80), title: clip(x.title,240), status: ['pending','approved','denied','modified','more_info','closed'].includes(x.status)?x.status:'pending',
    requestedBy: clip(x.requestedBy,120), decidedBy: clip(x.decidedBy,120), rationale: clip(x.rationale,800),
    amountUsd: Math.max(0,num(x.amountUsd,0)), createdAt: Math.max(0,num(x.createdAt,0)), decidedAt: Math.max(0,num(x.decidedAt,0))
  };
}
function normalizeRecommendation(raw) {
  const x=raw&&typeof raw==='object'?raw:{};
  return {
    id: clip(x.id,120), source: clip(x.source,120), title: clip(x.title,240), recommendation: clip(x.recommendation,800),
    evidence: arr(x.evidence,12).map(e=>clip(e,280)).filter(Boolean), disagreement: arr(x.disagreement,8).map(e=>clip(e,280)).filter(Boolean),
    confidence: Math.max(0,Math.min(100,num(x.confidence,0))), upside: clip(x.upside,500), downside: clip(x.downside,500),
    requiresCeoDecision: bool(x.requiresCeoDecision), createdAt: Math.max(0,num(x.createdAt,0))
  };
}
function normalizeExperiment(raw) {
  const x=raw&&typeof raw==='object'?raw:{};
  return {
    id: clip(x.id,120), opportunityId: clip(x.opportunityId,120), hypothesis: clip(x.hypothesis,600),
    status: ['proposed','approved','running','completed','paused','killed'].includes(x.status)?x.status:'proposed',
    predictedRevenueUsd: Math.max(0,num(x.predictedRevenueUsd,0)), predictedCostUsd: Math.max(0,num(x.predictedCostUsd,0)),
    actualRevenueUsd: Math.max(0,num(x.actualRevenueUsd,0)), actualCostUsd: Math.max(0,num(x.actualCostUsd,0)),
    predictedHumanMinutes: Math.max(0,num(x.predictedHumanMinutes,0)), actualHumanMinutes: Math.max(0,num(x.actualHumanMinutes,0)),
    createdAt: Math.max(0,num(x.createdAt,0)), completedAt: Math.max(0,num(x.completedAt,0))
  };
}
function normalizeEntry(raw) {
  const x=raw&&typeof raw==='object'?raw:{};
  return { id:clip(x.id,120), businessId:clip(x.businessId,80), experimentId:clip(x.experimentId,120), kind:clip(x.kind,60), usd:num(x.usd,0), minutes:Math.max(0,num(x.minutes,0)), at:Math.max(0,num(x.at,0)) };
}
function normalizeAudit(raw) {
  const x=raw&&typeof raw==='object'?raw:{};
  return { id:clip(x.id,120), actorId:clip(x.actorId,120), action:clip(x.action,120), targetId:clip(x.targetId,120), detail:clip(x.detail,600), at:Math.max(0,num(x.at,0)) };
}

function normalize(raw) {
  const base=defaults(), x=raw&&typeof raw==='object'?raw:{};
  const media=(x.businesses&&x.businesses.media)||base.businesses.media;
  const sports=(media.teams&&media.teams.sports)||base.businesses.media.teams.sports;
  base.businesses.media.status=['active','paused','coming_soon'].includes(media.status)?media.status:'active';
  base.businesses.media.managerId=clip(media.managerId,120)||'media-manager';
  base.businesses.media.teams.sports.status=['pilot','active','paused'].includes(sports.status)?sports.status:'pilot';
  base.businesses.media.teams.sports.objectives=arr(sports.objectives,50).map(v=>clip(v,240)).filter(Boolean);
  base.businesses.media.teams.sports.work=arr(sports.work,2000).map(normalizeWork).filter(v=>v.id&&v.title);
  base.businesses.media.teams.sports.correctiveActions=arr(sports.correctiveActions,500).map(normalizeCorrection).filter(v=>v.id);
  base.businesses.media.teams.sports.metrics=sports.metrics&&typeof sports.metrics==='object'?{
    revenueUsd:Math.max(0,num(sports.metrics.revenueUsd,0)),
    costUsd:Math.max(0,num(sports.metrics.costUsd,0)),
    humanMinutes:Math.max(0,num(sports.metrics.humanMinutes,0))
  }:{};
  base.decisions=arr(x.decisions,2000).map(normalizeDecision).filter(v=>v.id&&v.title);
  base.recommendations=arr(x.recommendations,2000).map(normalizeRecommendation).filter(v=>v.id&&v.title);
  base.experiments=arr(x.experiments,2000).map(normalizeExperiment).filter(v=>v.id);
  base.financialEntries=arr(x.financialEntries,5000).map(normalizeEntry).filter(v=>v.id);
  base.humanTimeEntries=arr(x.humanTimeEntries,5000).map(normalizeEntry).filter(v=>v.id);
  base.audit=arr(x.audit,5000).map(normalizeAudit).filter(v=>v.id&&v.action);
  return base;
}

function makeEnterpriseStateStore(deps) {
  deps=deps||{};
  if(!deps.fs||!deps.path||!deps.workspaces) throw new Error('makeEnterpriseStateStore: fs + path + workspaces required');
  const store=makeDomainStore({
    fs:deps.fs,path:deps.path,file:deps.path.join(deps.workspaces,'enterprise-state.json'),
    version:1,defaults,normalize,encode:value=>({enterprise:value}),decode:env=>env&&env.enterprise,
    writeDurable:deps.writeDurable,onIssue:deps.onIssue
  });
  function read(){return store.load();}
  function save(value){return store.save(value);}
  function update(mutator){
    const current=read().value;
    const next=mutator(JSON.parse(JSON.stringify(current)));
    return save(next===undefined?current:next);
  }
  return { file:store.file, read, save, update, remove:store.remove };
}

module.exports={ defaults, normalize, makeEnterpriseStateStore };
