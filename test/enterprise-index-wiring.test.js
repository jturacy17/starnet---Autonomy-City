'use strict';
const fs=require('node:fs'),path=require('node:path');
const A=require('./_assert.js');
const root=path.resolve(__dirname,'..');
const index=fs.readFileSync(path.join(root,'sidecar','index.js'),'utf8');
const query=fs.readFileSync(path.join(root,'frontend','app','queryspine.js'),'utf8');

A.ok(index.includes("require('./enterprise/routes.js')"),'sidecar composes enterprise routes');
A.ok(index.includes('...enterpriseRoutes.routes'),'enterprise routes are mounted in canonical route table');
A.ok(index.includes('workspaces: WORKSPACES'),'enterprise route reads the canonical workspace root');
A.ok(query.includes("path: '/api/enterprise/command'"),'frontend and sidecar share the Command HQ endpoint');
A.report('enterprise-index-wiring.test');
