'use strict';
const fs=require('node:fs/promises');
const path=require('node:path');
const {execFile}=require('node:child_process');
const {promisify}=require('node:util');
const execute=promisify(execFile);
async function runClip(job) {
 if(!job||typeof job!=='object')throw new Error('Clip job required');
 if(!job.rights||!['owned','licensed'].includes(job.rights.status)||typeof job.rights.evidence!=='string'||!job.rights.evidence.trim())throw new Error('Documented commercial reuse rights required');
 if(job.monetizationEligible!==true)throw new Error('Monetization eligibility must be verified before clipping');
 if(typeof job.input!=='string'||!path.isAbsolute(job.input)||typeof job.outputDir!=='string'||!path.isAbsolute(job.outputDir))throw new Error('Absolute local input and output directory required');
 const start=job.startSeconds,duration=job.durationSeconds;
 if(!Number.isFinite(start)||start<0||!Number.isFinite(duration)||duration<=0||duration>180)throw new Error('Valid start and duration (up to 180 seconds) required');
 const input=await fs.realpath(job.input);
 if(!(await fs.stat(input)).isFile())throw new Error('Input must be a local file');
 const probe=JSON.parse((await execute('ffprobe',['-v','error','-show_format','-show_streams','-of','json',input],{timeout:30000,maxBuffer:1024*1024})).stdout);
 if(!probe.streams.some(s=>s.codec_type==='video'))throw new Error('Input contains no video');
 const length=Number(probe.format.duration);
 if(!Number.isFinite(length)||start+duration>length+0.05)throw new Error('Clip selection exceeds source duration');
 // An exclusive directory prevents accidental overwrite or duplicate concurrent execution.
 await fs.mkdir(path.dirname(job.outputDir),{recursive:true});
 await fs.mkdir(job.outputDir);
 const output=path.join(job.outputDir,'vertical-master.mp4');
 try{
  await execute('ffmpeg',['-hide_banner','-loglevel','error','-nostdin','-n','-ss',String(start),'-i',input,'-t',String(duration),'-map','0:v:0','-map','0:a:0?',
   '-vf','scale=720:1280:force_original_aspect_ratio=decrease:force_divisible_by=2,pad=720:1280:(ow-iw)/2:(oh-ih)/2,setsar=1',
   '-c:v','libx264','-preset','veryfast','-crf','24','-threads','1','-pix_fmt','yuv420p','-r','30','-c:a','aac','-b:a','128k','-movflags','+faststart',output],{timeout:600000,maxBuffer:1024*1024});
  const platforms=['youtube-shorts','tiktok','instagram-reels'];
  for(const platform of platforms)await fs.copyFile(output,path.join(job.outputDir,platform+'.mp4'),fs.constants.COPYFILE_EXCL);
  const receipt={status:'rendered',engine:'ffmpeg',startSeconds:start,durationSeconds:duration,width:720,height:1280,
   framing:'fit-and-pad',automaticHighlightSelection:false,captions:false,published:false,
   rights:job.rights,monetizationEligible:true,files:platforms.map(p=>p+'.mp4'),createdAt:new Date().toISOString()};
  await fs.writeFile(path.join(job.outputDir,'receipt.json'),JSON.stringify(receipt,null,2),{flag:'wx'});
  return receipt;
 }catch(error){
  await fs.writeFile(path.join(job.outputDir,'failed.json'),JSON.stringify({status:'failed',message:String(error.message).slice(0,500)}));
  throw error;
 }
}
module.exports={runClip};
