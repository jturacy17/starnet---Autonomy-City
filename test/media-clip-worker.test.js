'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const execute=require('node:util').promisify(require('node:child_process').execFile);
const {runClip}=require('../sidecar/media/clip-worker');
test('renders real playable vertical exports and rejects unknown rights and out-of-range selections',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'media-clip-'));
 try{
  const input=path.join(dir,'source.mp4');
  await execute('ffmpeg',['-v','error','-f','lavfi','-i','testsrc2=size=320x180:rate=15','-t','3','-c:v','libx264','-threads','1',input]);
  const job={input,outputDir:path.join(dir,'job'),startSeconds:0.5,durationSeconds:1,rights:{status:'owned',evidence:'Synthetic test video generated for this test'},monetizationEligible:true};
  await assert.rejects(runClip({...job,rights:{status:'unknown'}}),/rights required/);
  await assert.rejects(runClip({...job,monetizationEligible:false}),/eligibility/);
  await assert.rejects(runClip({...job,startSeconds:3}),/exceeds/);
  const receipt=await runClip(job);assert.equal(receipt.published,false);
  for(const file of receipt.files){
   const probe=JSON.parse((await execute('ffprobe',['-v','error','-show_streams','-show_format','-of','json',path.join(job.outputDir,file)])).stdout);
   assert.equal(probe.streams[0].width,720);assert.equal(probe.streams[0].height,1280);
   assert.ok(Math.abs(Number(probe.format.duration)-1)<0.15);
  }
  await assert.rejects(runClip(job),/EEXIST/);
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
