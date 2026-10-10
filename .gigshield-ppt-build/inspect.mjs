import fs from 'node:fs/promises';
import { FileBlob, PresentationFile } from 'file:///C:/Users/ankus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs';

const source = 'C:/Users/ankus/OneDrive/Desktop/GigShield_Project_Presentation_Final.pptx';
const p = await PresentationFile.importPptx(await FileBlob.load(source));
console.log('SLIDES', p.slides.items.length);
const info = await p.inspect({kind:'slide,textbox,shape,image,chart,table,layout', maxChars:30000});
await fs.writeFile('.gigshield-ppt-build/inspect.ndjson', info.ndjson, 'utf8');
const target = await p.inspect({kind:'slide,textbox,shape', search:'smoke-test cases', maxChars:5000});
await fs.writeFile('.gigshield-ppt-build/target.ndjson', target.ndjson, 'utf8');
for (const q of ['13','Present in backend test suite','not rerun for this deck']) {
 const result = await p.inspect({kind:'textbox', search:q, maxChars:2000});
 await fs.appendFile('.gigshield-ppt-build/target.ndjson', `\n##${q}\n${result.ndjson}`);
}
const montage = await p.export({format:'png', montage:true, scale:0.35});
await fs.writeFile('.gigshield-ppt-build/source-montage.png', new Uint8Array(await montage.arrayBuffer()));
for (const idx of [0, 6, 7, 9, 10, 11, 13]) {
 const slide = p.slides.items[idx];
 const png = await p.export({slide,format:'png',scale:1});
 await fs.writeFile(`.gigshield-ppt-build/source-slide-${idx+1}.png`,new Uint8Array(await png.arrayBuffer()));
}
