'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { createHostedProxy } = require('../sidecar/hosted-proxy');
test('hosted gateway protects pages and API while preserving loopback guards', async t => {
  const upstream = http.createServer((req,res) => { res.setHeader('Content-Type','application/json');res.end(JSON.stringify({host:req.headers.host,origin:req.headers.origin,authorization:req.headers.authorization,token:req.headers['x-starnet-token'],path:req.url})); });
  await new Promise(r=>upstream.listen(0,'127.0.0.1',r));
  const gateway=createHostedProxy({origin:'https://city.example',username:'owner',password:'test-password-long-enough',upstreamPort:upstream.address().port});
  await new Promise(r=>gateway.listen(0,'127.0.0.1',r));
  t.after(()=>{gateway.closeAllConnections();gateway.close();upstream.closeAllConnections();upstream.close();});
  function request(path, headers={}) {return new Promise((resolve,reject)=>{const req=http.get({hostname:'127.0.0.1',port:gateway.address().port,path,headers:{host:'city.example',...headers}},res=>{let body='';res.on('data',x=>body+=x);res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body}));});req.on('error',reject);});}
  const auth={authorization:'Basic '+Buffer.from('owner:test-password-long-enough').toString('base64')};
  assert.equal((await request('/')).status,401);
  assert.equal((await request('/api/enterprise/command')).status,401);
  assert.equal((await request('/',{authorization:'Basic wrong'})).status,401);
  assert.equal((await request('/',{...auth,host:'attacker.example'})).status,403);
  assert.equal((await request('/api/save',{...auth,origin:'https://attacker.example'})).status,403);
  assert.equal((await request('/',{...auth,'sec-fetch-site':'cross-site'})).status,403);
  const ok=await request('/api/enterprise/command',{...auth,origin:'https://city.example','x-starnet-token':'test-token'});
  assert.equal(ok.status,200);const body=JSON.parse(ok.body);
  assert.equal(body.host,'127.0.0.1:'+upstream.address().port);assert.equal(body.origin,'http://127.0.0.1:'+upstream.address().port);assert.equal(body.authorization,undefined);assert.equal(body.token,'test-token');
  assert.equal((await request('/healthz')).body,'ready');
  assert.throws(()=>createHostedProxy({origin:'https://city.example',username:'owner',password:'short',upstreamPort:1}));
});
