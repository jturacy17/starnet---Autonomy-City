/* sidecar/enterprise/board-rollup.js — independent Board oversight from enterprise state.
   The Board evaluates manager effectiveness and business health; it does not directly manage agents. */
'use strict';

const O=require('./oversight.js');
const M=require('./manager-loop.js');

function buildBoardRollup(state, now){
  const s=state||{}, team=s.businesses&&s.businesses.media&&s.businesses.media.teams&&s.businesses.media.teams.sports||{};
  const manager=O.managerTeamHealth(team,now);
  const escalation=M.escalationNeed(team,now);
  const board=O.boardReview(manager,Array.isArray(s.experiments)?s.experiments:[]);
  const unresolvedCorrections=(Array.isArray(team.correctiveActions)?team.correctiveActions:[]).filter(c=>c.status!=='resolved');
  const repeatedCorrectionRisk=unresolvedCorrections.length>=2;
  const challenges=[];
  if(manager.onTimeRate<90) challenges.push('Manager must improve on-time delivery');
  if(manager.avgQuality!=null&&manager.avgQuality<80) challenges.push('Manager must improve delivered quality');
  if(repeatedCorrectionRisk) challenges.push('Manager has multiple unresolved corrective actions');
  if(board.forecastAccuracy!=null&&board.forecastAccuracy<70) challenges.push('Forecast accuracy requires management correction');
  const requiresCeoDecision=board.requiresBoardAction&&challenges.length>0;
  return {
    scope:'media/sports',
    managerId:'media-manager',
    managerPerformance:board.managerPerformance,
    businessHealth:board.businessHealth,
    onTimeRate:manager.onTimeRate,
    avgQuality:manager.avgQuality,
    blocked:manager.blocked,
    overdue:manager.overdue,
    openCorrectiveActions:manager.openCorrectiveActions,
    profitPerHumanHour:board.profitPerHumanHour,
    forecastAccuracy:board.forecastAccuracy,
    escalation,
    challenges,
    recommendation:requiresCeoDecision?'Require a management recovery plan before expanding the Sports pilot':'Continue manager-led correction and monitor performance',
    confidence:challenges.length?80:90,
    requiresCeoDecision
  };
}

module.exports={buildBoardRollup};
