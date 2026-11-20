'use strict';
const byId = id => document.getElementById(id);
const questions = [
  'Who renovates overgrown flower beds in Cullman?',
  'Does Collins Lawncare haul away old mulch?',
  'Which landscapers renovate beds in Hanceville?'
];
// Each row is an independent, fictional observation for one question.
const answers = [
  [0,'ChatGPT','Recommended','Collins Lawncare is one option for bed renovation in Cullman.','Example trade directory · business listing'],
  [0,'Perplexity','Recommended','Collins Lawncare offers landscape bed renovation.','Example business website · services'],
  [1,'ChatGPT','Mentioned','Collins Lawncare lists bed cleanup. Haul-away is unclear.','Example business website · bed renovation'],
  [1,'Perplexity','Mentioned','Ask Collins Lawncare whether disposal is included in the estimate.','Example business website · estimate FAQs'],
  [2,'ChatGPT','Absent','A nearby landscape company appears in the local directory.','Example trade directory · Hanceville listing'],
  [2,'Perplexity','Absent','The listing describes a competitor offering bed renovation in Hanceville.','Example competitor website · service area']
];
const fixes = [
  {id:'scope',title:'Clarify haul-away on the estimate page',evidence:'Both example answers to the mulch question leave the cleanup terms unclear.',draft:'Your written bed renovation estimate will specify whether removal and disposal are included. Confirm this wording against your actual quoting process.',question:1},
  {id:'area',title:'Verify the Hanceville service area',evidence:'Both Hanceville answers point to other businesses. The sample service page names only Cullman.',draft:'Check the owner-approved service area. If Hanceville is covered, add it to the existing service page with a real job example.',question:2},
  {id:'link',title:'Check the directory’s estimate link',evidence:'One recommendation sends the reader to a trade directory. Its sample profile lacks a direct estimate link.',draft:'Verify the official estimate URL and add it to the directory profile if the listing supports it.',question:0}
];
const key = 'fpg:visibility-sample:approvals:v1';
let approved = new Set();
try { const saved = JSON.parse(localStorage.getItem(key) || '[]'); if (Array.isArray(saved)) approved = new Set(saved); } catch {}
function element(tag, text, className) {
  const node = document.createElement(tag);
  node.textContent = text;
  if (className) node.className = className;
  return node;
}
const rows = [];
function renderEvidence() {
  const engine = byId('engine').value;
  const visible = rows.filter(row => engine === 'All assistants' || row.engine === engine);
  rows.forEach(row => { row.node.hidden = !visible.includes(row); });
  const count = visible.filter(row => row.result === 'Recommended').length;
  byId('summary').textContent = count + ' of ' + visible.length + ' sample answers recommended Collins. One example response per question per assistant.';
}
for (const [index, engine, result, quote, source] of answers) {
  const details = document.createElement('details');
  details.append(element('summary', engine + ' · ' + questions[index]),element('p',result + ' · Nov 12, 2026 · illustrative response','meta'),element('blockquote',quote),element('p','Cited source in example: ' + source));
  byId('answers').append(details);
  rows.push({index,engine,result,node:details});
}
byId('rate').textContent = answers.filter(row => row[2] === 'Recommended').length + ' / ' + answers.length;
byId('engine').addEventListener('change',renderEvidence);
renderEvidence();
for (const fix of fixes) {
  const details = document.createElement('details');
  const heading = element('summary',fix.title);
  const status = element('span','','state');
  heading.append(status);
  const approve = element('button','');
  const evidence = element('button','View saved answers');
  const actions = element('div','','actions');
  function updateStatus() {
    status.textContent = approved.has(fix.id) ? 'Approved in demo' : 'For review';
    approve.textContent = approved.has(fix.id) ? 'Undo approval' : 'Approve sample draft';
  }
  updateStatus();
  approve.onclick = () => {
    if (approved.has(fix.id)) approved.delete(fix.id); else approved.add(fix.id);
    updateStatus();
    try { localStorage.setItem(key,JSON.stringify([...approved])); byId('message').textContent = fix.title + ' · ' + status.textContent; }
    catch { byId('message').textContent = 'Approval updated for this visit. Browser storage is unavailable.'; }
  };
  evidence.onclick = () => {
    byId('engine').value = 'All assistants';
    renderEvidence();
    rows.forEach(row => { row.node.open = row.index === fix.question; });
    rows.find(row => row.index === fix.question).node.querySelector('summary').focus();
  };
  actions.append(evidence,approve);
  details.append(heading,element('p',fix.evidence),element('h3','Proposed change'),element('p',fix.draft),actions);
  byId('fixes').append(details);
}
let printState;
window.addEventListener('beforeprint', () => {
  printState = Array.from(document.querySelectorAll('details'), node => [node,node.open]);
  printState.forEach(([node]) => {node.open = true;});
});
window.addEventListener('afterprint', () => { printState?.forEach(([node,open]) => {node.open=open;}); });
byId('print').onclick = () => window.print();
