/** Sync static project previews from the shared JSON. No dependencies or build required. */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
const projects = JSON.parse(await readFile(new URL('lib/projects.json', root), 'utf8'));
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
if (new Set(projects.map(p => p.slug)).size !== projects.length) throw new Error('Project slugs must be unique.');
const featured = projects.filter(p => p.featuredOrder !== null).sort((a, b) => a.featuredOrder - b.featuredOrder);
const svg = body => `<svg viewBox="0 0 340 215" fill="none" aria-hidden="true">${body}</svg>`;
const text = (x,y,value,size=10,other='') => `<text x="${x}" y="${y}" fill="var(--ink)" font-family="var(--sans)" font-size="${size}" ${other}>${value}</text>`;
function visual(project) {
  if (project.slug === 'news-credibility') {
    const signals = ['Coverage','Intent','Stance','Sensationalism','Context','Title ↔ body'];
    return svg(`<rect x="35" y="30" width="270" height="158" rx="7" fill="var(--surface)" stroke="var(--line)"/>${text(55,54,'CONTENT CREDIBILITY SIGNALS',8,'letter-spacing="1.3"')}<path d="M55 66h230" stroke="var(--line)"/>`+signals.map((s,i)=>{
      const x=80+(i%3)*90,y=97+Math.floor(i/3)*55;
      return `<circle cx="${x}" cy="${y}" r="13" fill="var(--lilac)"/>${text(x,y+3,`0${i+1}`,8,'text-anchor="middle"')}${text(x,y+26,s,7,'text-anchor="middle"')}`;
    }).join(''));
  }
  if (project.slug === 'recipe-analysis') return svg(`${text(35,42,'RECIPE RATING CLASSIFICATION',8,'letter-spacing="1.2"')}${text(35,84,'Baseline',10)}${text(305,84,'0.87',14,'text-anchor="end"')}<rect x="35" y="97" width="270" height="12" rx="3" fill="var(--surface)"/><rect x="35" y="97" width="234.9" height="12" rx="3" fill="var(--ink)" opacity=".5"/>${text(35,141,'With features &amp; tuning',10)}${text(305,141,'0.92',14,'text-anchor="end"')}<rect x="35" y="154" width="270" height="12" rx="3" fill="var(--surface)"/><rect x="35" y="154" width="248.4" height="12" rx="3" fill="var(--ink)"/>${text(35,193,'Reported F1 · scale 0–1',8)}`);
  if (project.slug === 'blood-glucose') return svg(`${text(30,40,'GLUCOSE DATA VISUALIZATION',8,'letter-spacing="1.2"')}<path d="M67 99h205" stroke="var(--accent)" stroke-width="1.2" stroke-dasharray="3 4"/>`+['Prepare','Explore','Explain'].map((s,i)=>`<rect x="${30+i*98}" y="73" width="84" height="54" rx="8" fill="var(--surface)" stroke="var(--line)"/>${text(72+i*98,105,s,11,'text-anchor="middle"')}`).join('')+`${text(170,165,'15 participants. An interactive story.',11,'text-anchor="middle"')}${text(170,186,'Python data pipeline · JavaScript visualization',8,'text-anchor="middle"')}`);
  const captions = {posturepress:['PRESSURE SENSOR VISUALIZATION','Text files','Matrices','Contours'], 'ev-adoption':['ELECTRIC VEHICLE ADOPTION','Registrations','Analysis','Patterns'], 'interest-zoning':['EVENT DISCOVERY RESEARCH','Research','Prototype','Iterate']}[project.slug];
  return svg(`${text(30,43,captions[0],8,'letter-spacing="1.1"')}<path d="M70 101h200" stroke="var(--accent)"/>`+captions.slice(1).map((s,i)=>`<circle cx="${70+i*100}" cy="101" r="22" fill="var(--surface)" stroke="var(--line)"/>${text(70+i*100,105,`0${i+1}`,10,'text-anchor="middle"')}${text(70+i*100,150,s,10,'text-anchor="middle"')}`).join(''));
}
function card(p, base) {
  const local = p.featuredOrder !== null;
  const compact = base === '';
  const title = compact ? p.shortTitle ?? p.title : p.title;
  const description = compact ? p.shortDescription ?? p.description : p.description;
  const heading = base ? 'h2' : 'h3';
  const href = local ? `${base}projects/${p.slug}/` : p.url;
  const external = local ? '' : ' target="_blank" rel="noopener noreferrer"';
  const color = {'news-credibility':'news','recipe-analysis':'recipe','blood-glucose':'glucose','posturepress':'news','ev-adoption':'recipe','interest-zoning':'glucose'}[p.slug];
  const search = [p.title,p.shortTitle ?? '',p.description,p.shortDescription ?? '',p.category,...p.tags,...p.tools].join(' ').toLocaleLowerCase();
  return `<article class="project-card" data-project="${escape(p.slug)}" data-tags="${escape(p.tags.join('|'))}" data-search="${escape(search)}">
<div class="project-visual visual-${color}">${visual(p)}</div><div class="project-body">${compact ? '' : `<p class="project-meta">${escape(p.category)} · ${escape(p.year)}</p>`}<${heading}><a href="${escape(href)}"${external}>${escape(title)}</a></${heading}><p class="project-description">${escape(description)}</p><ul class="tools" aria-label="Tools and methods">${p.tools.map(t=>`<li>${escape(t)}</li>`).join('')}</ul><a class="project-link" href="${escape(href)}"${external}>${local?'Read case study':escape(p.urlLabel)} <span aria-hidden="true">↗</span><span class="sr-only">: ${escape(p.title)}</span></a></div></article>`;
}
let changed = false;
for (const [path, marker, data, base] of [['index.html','featured',featured,''],['projects/index.html','projects',projects,'../']]) {
  const file = new URL(path, root);
  const original = await readFile(file,'utf8');
  const pattern = new RegExp(`<!-- ${marker}:start -->[\\s\\S]*?<!-- ${marker}:end -->`);
  if (!pattern.test(original)) throw new Error(`Missing project markers: ${path}`);
  const next = original.replace(pattern,`<!-- ${marker}:start -->\n${data.map(p=>card(p,base)).join('\n')}\n<!-- ${marker}:end -->`);
  if (next !== original) {
    changed = true;
    if (!process.argv.includes('--check')) await writeFile(file,next);
  }
}
if (process.argv.includes('--check') && changed) {
  console.error('Project previews are out of sync. Run node scripts/sync-projects.mjs.');
  process.exitCode = 1;
} else console.log(`${process.argv.includes('--check')?'Verified':'Synced'} ${projects.length} projects and ${featured.length} featured previews (${fileURLToPath(root)}).`);
