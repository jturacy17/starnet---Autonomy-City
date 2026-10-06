'use strict';
const fs=require('node:fs/promises');
const {runClip}=require('../sidecar/media/clip-worker');
(async()=>{
 if(process.argv.length!==3)throw new Error('Usage: node scripts/render-media-clip.js /path/to/job.json');
 const receipt=await runClip(JSON.parse(await fs.readFile(process.argv[2],'utf8')));
 console.log(JSON.stringify(receipt,null,2));
})().catch(error=>{console.error(error.message);process.exitCode=1;});
