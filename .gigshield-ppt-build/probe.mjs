import {FileBlob,PresentationFile} from 'file:///C:/Users/ankus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs';
const p=await PresentationFile.importPptx(await FileBlob.load('C:/Users/ankus/OneDrive/Desktop/GigShield_Project_Presentation_Final.pptx'));
const a=p.slides.items[13];
console.log('before',p.slides.items.length,Object.keys(a),typeof a.shapes,Object.keys(p.slides));
const s=p.slides.insert({after:a,background:{fill:'#F6F9FB'}});
console.log('insert result',s,typeof s,Object.keys(s||{}),'len',p.slides.items.length);
console.log('last',Object.keys(p.slides.items[14]),typeof p.slides.items[14].shapes);
const t=p.slides.add({background:{fill:'#F6F9FB'}});
console.log('add result',Object.keys(t||{}),typeof t?.shapes,'len',p.slides.items.length);
