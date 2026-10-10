import fs from 'node:fs/promises';
import path from 'node:path';
import { FileBlob, PresentationFile } from 'file:///C:/Users/ankus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs';
import { finalizePresentation } from 'file:///C:/Users/ankus/.codex/plugins/cache/openai-primary-runtime/presentations/26.1007.11041/skills/presentations/container_tools/artifact_tool_utils.mjs';

const workspaceDir = process.cwd();
const skillDir = 'C:/Users/ankus/.codex/plugins/cache/openai-primary-runtime/presentations/26.1007.11041/skills/presentations';
process.env.RUNTIME_NODE_MODULES = 'C:/Users/ankus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const sourcePath = 'C:/Users/ankus/OneDrive/Desktop/GigShield_Project_Presentation_Final.pptx';
const draftPath = path.join(workspaceDir, '.gigshield-ppt-build', 'draft.pptx');
const finalPath = path.join(workspaceDir, '.gigshield-ppt-output', 'GigShield_Project_Presentation_Updated.pptx');
const presentation = await PresentationFile.importPptx(await FileBlob.load(sourcePath));

function resolveSearch(query) {
  return presentation.inspect({kind:'textbox', search:query, maxChars:3000}).then(r => {
    const rec = r.ndjson.split('\n').filter(Boolean).map(line => JSON.parse(line)).find(x => x.kind === 'textbox' && x.text?.includes(query));
    if (!rec) throw new Error(`Could not resolve textbox: ${query}`);
    return presentation.resolve(rec.id);
  });
}

function addText(slide, text, x, y, w, h, size, color, bold=false, name='') {
  const shape = slide.shapes.add({
    geometry:'textbox', name: name || undefined,
    position:{left:x,top:y,width:w,height:h}, fill:'none',
    line:{style:'solid',fill:'none',width:0},
  });
  shape.text = text;
  shape.text.style = {fontSize:size, typeface:'Arial', color, bold, alignment:'left'};
  return shape;
}

function addRect(slide, x,y,w,h, fill, stroke='#CBD8E2', radius='roundRect') {
  return slide.shapes.add({geometry:radius,position:{left:x,top:y,width:w,height:h},fill,
    line:{style:'solid',fill:stroke,width:1}});
}

function baseSlide(afterSlide, pageNo, title, subtitle) {
  const slide = presentation.slides.insert({after:afterSlide, background:{fill:'#F6F9FB'}}).slide;
  addText(slide,'GIGSHIELD  /  PROJECT PRESENTATION',68,30,600,20,13,'#587D9B',true);
  addText(slide,title,68,66,1140,60,42,'#142943',true);
  addText(slide,subtitle,70,128,1125,38,19,'#607386');
  slide.shapes.add({geometry:'rect',position:{left:68,top:676,width:1144,height:1},fill:'#CBD8E2',line:{style:'solid',fill:'none',width:0}});
  addText(slide,'GigShield · company-sponsored disruption cover ·',68,687,850,18,13,'#607386');
  addText(slide,String(pageNo).padStart(2,'0'),1160,686,50,20,14,'#587D9B',true);
  return slide;
}

// Remove an outdated note about the separate traffic workflow; update it to match the current product.
(await resolveSearch('OpenWeatherMap supplies live current weather')).text =
  'Admin traffic analysis is a separate workflow; its results do not feed the claim approval decision.';
(await resolveSearch('Present in backend test suite;')).text =
  'Attempted health and admin-auth checks; app startup stalled before pytest returned results.';
(await resolveSearch('First commit: 30 Jul 2026')).text =
  'First repository commit: 30 Jul 2026 · latest commit: 09 Oct 2026 (c9c0516) · working-tree changes reviewed 10 Oct 2026';
(await resolveSearch('GigShield source repository. AnkushKr836/GigShield')).text =
  'GigShield source repository. AnkushKr836/GigShield, local HEAD c9c0516 plus working-tree changes, reviewed 10 October 2026.';

// Workflow slide is inserted before the original references slide.
const flow = baseSlide(presentation.slides.items[13],15,'End-to-end project workflow',
  'Company-funded cover connects rider activity, disruption evidence and a transparent claim decision.');
const top = [
  ['01  Sponsor coverage','Company creates a plan\nand sets the daily limit'],
  ['02  Rider enrollment','Rider joins the company\nand selects a service region'],
  ['03  Delivery activity','Completed rides store\ntime, route and fare'],
  ['04  Claim submitted','Rider selects a ride,\ndisruption and amount'],
];
const xs = [68,360,652,944];
for (let i=0;i<top.length;i++) {
  addRect(flow,xs[i],206,258,104,'#FFFFFF','#CBD8E2');
  addText(flow,top[i][0],xs[i]+16,222,226,28,18,'#142943',true);
  addText(flow,top[i][1],xs[i]+16,257,226,44,15,'#607386');
  if (i<3) flow.shapes.add({geometry:'rightArrow',position:{left:xs[i]+264,top:249,width:28,height:18},fill:'#3E9C98',line:{style:'solid',fill:'none',width:0}});
}
flow.shapes.add({geometry:'downArrow',position:{left:1170,top:317,width:15,height:25},fill:'#3E9C98',line:{style:'solid',fill:'none',width:0}});
const bottom = [
  ['08  Payout + history','Approved amount is capped;\npayout entry is recorded'],
  ['07  Decision branch','Eligible claims auto-approve;\nuncertain cases go to admin'],
  ['06  Risk guardrails','Frequency and ride anomalies\ncan request human review'],
  ['05  Evidence + cover','Match disruption to ride time;\nconfirm company coverage'],
];
for (let i=0;i<bottom.length;i++) {
  addRect(flow,xs[i],358,258,104,'#FFFFFF','#CBD8E2');
  addText(flow,bottom[i][0],xs[i]+16,374,226,28,18,'#142943',true);
  addText(flow,bottom[i][1],xs[i]+16,409,226,44,15,'#607386');
  if (i>0) flow.shapes.add({geometry:'leftArrow',position:{left:xs[i]-31,top:400,width:27,height:16},fill:'#3E9C98',line:{style:'solid',fill:'none',width:0}});
}
addRect(flow,68,494,1144,112,'#EAF3F8','#CBD8E2');
addText(flow,'ADMIN-ONLY ANALYTICS',88,510,250,22,14,'#3E9C98',true);
addText(flow,'Traffic records → train Random Forest → analyze selected employee rides → save assessments',88,540,1070,26,19,'#142943',true);
addText(flow,'This traffic-analysis lane is separate from the claim decision. Six saved claim checkpoints show review progress to the rider.',88,572,1080,24,15,'#607386');

// Decision outcomes and the actual test-run limitation are explicit and separated.
const outcomes = baseSlide(flow,16,'Claim decision paths and test outcomes',
  'The outcome depends on evidence, active company coverage, payout limits and review signals.');
const cols = [70,355,760];
addText(outcomes,'SCENARIO',cols[0],194,250,22,14,'#587D9B',true);
addText(outcomes,'SYSTEM OUTCOME',cols[1],194,320,22,14,'#587D9B',true);
addText(outcomes,'EFFECT ON APPROVAL',cols[2],194,400,22,14,'#587D9B',true);
outcomes.shapes.add({geometry:'rect',position:{left:70,top:224,width:1140,height:2},fill:'#142943',line:{style:'solid',fill:'none',width:0}});
const rows = [
  ['Evidence matches ride + active plan','Automatic approval, subject to risk review','Payout is limited to the remaining daily cap'],
  ['No matching disruption evidence','Manual review','No automatic payout; admin checks the claim'],
  ['Evidence matches but no active plan','Manual review','Coverage must exist before an amount is payable'],
  ['Repeated filing or elevated ride anomaly','Manual review if otherwise approvable','Flag prompts review; it does not auto-reject'],
  ['A claim already exists for the ride','HTTP 409 duplicate response','A second claim cannot be created'],
];
for (let i=0;i<rows.length;i++) {
  const y=244+i*63;
  addText(outcomes,rows[i][0],cols[0],y,265,48,16,'#142943',true);
  addText(outcomes,rows[i][1],cols[1],y,375,48,16,'#1B2B3D');
  addText(outcomes,rows[i][2],cols[2],y,420,48,16,'#607386');
  if (i<rows.length-1) outcomes.shapes.add({geometry:'rect',position:{left:70,top:y+53,width:1140,height:1},fill:'#CBD8E2',line:{style:'solid',fill:'none',width:0}});
}
addRect(outcomes,70,577,1140,67,'#FFF6E7','#E5C88E');
addText(outcomes,'TEST RUN',88,590,150,19,14,'#A46D12',true);
addText(outcomes,'Selected pytest health + admin-auth checks were interrupted after app startup stalled; no pass/fail results were produced. The rows above summarize the current decision rules, not a completed integration run.',220,587,970,48,15,'#3C4A56');

// Move the original references slide after the two new slides; update its page marker.
const reference = presentation.slides.items.find(s => s.shapes.items.some(x => String(x.text ?? '').includes('References and visual credits')));
if (reference) reference.moveTo(presentation.slides.items.length-1);
// Refresh page marker on the source references slide when its existing footer is present.
if (reference) {
  const snapshot = await presentation.inspect({kind:'textbox',search:'References and visual credits',maxChars:3000});
  const record = snapshot.ndjson.split('\n').filter(Boolean).map(line=>JSON.parse(line)).find(x=>x.kind==='textbox');
  if (record) {
    const records = await presentation.inspect({kind:'textbox',maxChars:200000});
    const all = records.ndjson.split('\n').filter(Boolean).map(line=>JSON.parse(line));
    const footer = all.find(x=>x.slideIndex===presentation.slides.items.indexOf(reference) && x.text==='15');
    if (footer) presentation.resolve(footer.id).text='17';
  }
}

// Export editable slides and review images before finalization.
for (const [index,slide] of presentation.slides.items.entries()) {
  const png = await presentation.export({slide,format:'png',scale:1});
  await fs.writeFile(path.join(workspaceDir,'.gigshield-ppt-build',`final-slide-${String(index+1).padStart(2,'0')}.png`),new Uint8Array(await png.arrayBuffer()));
}
const montage = await presentation.export({format:'png',montage:true,scale:0.35});
await fs.writeFile(path.join(workspaceDir,'.gigshield-ppt-build','final-montage.png'),new Uint8Array(await montage.arrayBuffer()));
await (await PresentationFile.exportPptx(presentation)).save(draftPath);

const result = await finalizePresentation({
  workspaceDir, candidatePath:draftPath, finalPath,
  pythonExecutable:'C:/Users/ankus/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe',
  integrityValidatorPath:path.join(skillDir,'container_tools/inspect_presentation_package_integrity.py'),
  layoutValidatorPath:path.join(skillDir,'container_tools/inspect_presentation_layout_geometry.py'),
  layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-bullet-geometry','--validate-heading-fit'],
  requiredNativeTableOwnerSlides:[],
  fontPolicy:{basis:'reference',families:['Arial'],referencePath:sourcePath,referenceSha256:'f6ef824ca91ef75ce988a76e0c18913f39eb0e3a0e1b7e9639b2afd27dd66aa9'},
  verifyArtifactToolImport:true,
  receiptPath:path.join(workspaceDir,'.gigshield-ppt-build','GigShield_Project_Presentation_Updated.validation.json'),
});
console.log(JSON.stringify(result,null,2));
