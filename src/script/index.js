
/* ============================================================
   商标类目选择器（按大类分页）
   数据结构: [{ classNo, className, groups:[{g, groupTitle, items:[{code,name}]}] }]
   ============================================================ */
const data = new Map()          // 已加载的类：classNo -> 类对象
let selected   = new Map()     // 已选：key = classNo-g-code
let currentNo  = null          // 当前正在编辑的大类编号（懒加载）
let curOnly    = false         // 只看已选开关
const CLASS_COUNT = 45         // 已知大类总数（不预测，点哪个加载哪个）

const treeEl   = document.getElementById('tree')
const resEl    = document.getElementById('result')
const countEl  = document.getElementById('resultCount')
const treeCnt  = document.getElementById('treeCount')
const searchEl = document.getElementById('search')
const tabsEl   = document.getElementById('tabs')
const titleEl  = document.getElementById('panelTitle')
const statusEl = document.getElementById('loadStatus')
const mvCountEl = document.getElementById('mvCount')

const keyOf = (cno,g,code)=> `${cno}-${g}-${code}`

function applySelect(cls, gr, it, on){
  const k = keyOf(cls.classNo, gr.g, it.code)
  if(on) selected.set(k, {classNo:cls.classNo, className:cls.className, g:gr.g, groupTitle:gr.groupTitle, code:it.code, name:it.name})
  else   selected.delete(k)
  saveSelected()
}

/* ============================================================
   懒加载：点哪个大类才 fetch 哪个大类，已加载的缓存在内存
   ============================================================ */
async function openClass(no){
  if(data.has(no)){ setCurrent(no); renderTree(); renderTabs(); return }
  statusEl.textContent = `加载第${no}类…`
  let cls=null
  try{
    let r = await fetch(`data/${String(no).padStart(2,'0')}.json`)
    if(!r.ok) r = await fetch(`data/${no}.json`)
    if(r.ok){ cls = await r.json(); data.set(no, cls) }
  }catch(e){}
  if(!cls){ statusEl.textContent=`第${no}类加载失败`; return }
  statusEl.textContent='已缓存'
  setCurrent(no); renderTree(); renderTabs(); renderResult()
}
function setCurrent(no){ if(data.has(no)) currentNo = no }
function curClass(){ return data.get(currentNo) || null }

/* ============================================================
   本地缓存：仅缓存已选小项（轻量），不缓存大量类目数据
   ============================================================ */
const LS_SELECT = 'brand:select:v4'

function saveSelected(){
  try{ localStorage.setItem(LS_SELECT, JSON.stringify([...selected.values()])) }catch(e){}
}
function loadSelected(){
  try{
    const raw = localStorage.getItem(LS_SELECT)
    if(!raw) return
    const arr = JSON.parse(raw)
    if(!Array.isArray(arr)) return
    const sel = new Map()
    arr.forEach(it=>{ if(it && it.code!=null && it.classNo!=null) sel.set(`${it.classNo}-${it.g}-${it.code}`, it) })
    selected = sel
  }catch(e){}
}

/* ---------- Tabs 栏（懒加载：点击才加载） ---------- */
function renderTabs(){
  tabsEl.innerHTML = ''
  for(let no=1; no<=CLASS_COUNT; no++){
    // 该大类已选小类数（无需加载该大类即可统计）
    let n=0
    for(const v of selected.values()) if(v.classNo===no) n++
    const b = document.createElement('button')
    b.className = 'tab' + (no===currentNo?' active':'') + (n>0?' sel':'')
    b.onclick = ()=>{ openClass(no) }
    b.textContent = `第${no}类` + (n?`(${n})`:'')
    tabsEl.appendChild(b)
  }
}

/* ---------- 当前大类渲染 ---------- */
function renderTree(){
  const cls = curClass()
  if(!cls){ treeEl.innerHTML='<div style="color:#888">点上方某个大类开始</div>'; return }
  titleEl.textContent = cls.className
  const keyword = searchEl.value.trim().toLowerCase()
  let visible = 0
  treeEl.innerHTML = ''

  const clsDiv = document.createElement('div')
  clsDiv.className = 'tree-item'

  cls.groups.forEach(gr=>{
    // 过滤
    const titleMatch = !keyword || gr.groupTitle.includes(keyword)
    let grItems = gr.items.filter(it=>!keyword || it.name.toLowerCase().includes(keyword)||it.code.includes(keyword)||titleMatch)
    if(keyword && titleMatch && grItems.length===0) grItems = gr.items
    if(keyword && grItems.length===0 && !titleMatch) return
    // 只看已选
    if(curOnly) grItems = grItems.filter(it=>selected.has(keyOf(cls.classNo,gr.g,it.code)))
    if(grItems.length===0 && !curOnly) return

    // 类似群行（label 包裹，点击文字也能勾选）
    const gkeys = gr.items.map(it=>keyOf(cls.classNo,gr.g,it.code))
    const grLabel = document.createElement('label')
    const grCheck = document.createElement('input')
    grCheck.type='checkbox'
    grCheck.checked = gkeys.length>0 && gkeys.every(k=>selected.has(k))
    grCheck.indeterminate = !grCheck.checked && gkeys.some(k=>selected.has(k))
    if(curOnly) grCheck.disabled = true
    grCheck.onchange = e=>{
      gr.items.forEach(it=>applySelect(cls,gr,it,e.target.checked))
      renderTree(); renderResult(); renderTabs()
    }
    grLabel.appendChild(grCheck)
    grLabel.append(gr.groupTitle)
    const grBar = document.createElement('div')
    grBar.className = 'group-title'
    grBar.appendChild(grLabel)
    clsDiv.appendChild(grBar)

    grItems.forEach(it=>{
      const k = keyOf(cls.classNo,gr.g,it.code)
      const row = document.createElement('div')
      row.className = 'item' + (selected.has(k)?' sel':'')
      const lbl = document.createElement('label')
      const cb = document.createElement('input')
      cb.type='checkbox'
      cb.checked = selected.has(k)
      cb.onchange = e=>{
        applySelect(cls,gr,it,e.target.checked)
        renderTree(); renderResult(); renderTabs();
      }
      lbl.appendChild(cb)
      lbl.append(`【${gr.g}】${it.code} ${it.name}`)
      row.appendChild(lbl)
      clsDiv.appendChild(row)
      visible++
    })
  })
  treeEl.appendChild(clsDiv)
  treeCnt.textContent = curOnly? (`已选 ${visible} 项`) : (keyword? `匹配 ${visible} 项`:'')
}

/* ---------- 汇总 ---------- */
function renderResult(){
  const group = {}
  for(const item of selected.values()){
    if(!group[item.classNo]) group[item.classNo] = {title:item.className,list:[]}
    group[item.classNo].list.push(item)
  }
  const keys = Object.keys(group).sort((a,b)=>a-b)
  let html=''
  for(const k of keys){
    html += `<div style="margin:8px 0"><strong>${group[k].title}</strong>（${group[k].list.length}）<ul style="margin:4px 0 12px 16px">`
    group[k].list.sort((a,b)=> a.g.localeCompare(b.g)||a.code.localeCompare(b.code)).forEach(it=>{
      html += `<li><span>【${it.g} ${it.groupTitle}】${it.code} ${it.name}</span></li>`
    })
    html += `</ul></div>`
  }
  resEl.innerHTML = html || "<div style='color:#888'>勾选左侧小类，此处自动汇总</div>"
  countEl.textContent = `共 ${selected.size} 个小类`
  mvCountEl.textContent = selected.size
  refreshButtons()
  saveSelected()
}

function clearAll(){
  selected.clear(); curOnly=false; searchEl.value=''
  saveSelected()
  renderTree(); renderResult(); renderTabs()
}
/* 只清空当前正在操作的大类，不影响其他类 */
function clearClass(){
  const no = currentNo
  if(no==null){ return }
  for(const k of [...selected.keys()]){
    if(selected.get(k).classNo === no) selected.delete(k)
  }
  curOnly=false
  saveSelected()
  renderTree(); renderResult(); renderTabs()
}
function toggleCurOnly(){
  curOnly = !curOnly; renderTree()
  document.getElementById('curOnlyBtn').textContent = curOnly?'显示全部':'只看已选'
}

/* ---------- 导出 ---------- */
function download(filename, content, mime){
  const blob = new Blob([content], {type:mime})
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href=url; a.download=filename
  document.body.appendChild(a); a.click()
  setTimeout(()=>{URL.revokeObjectURL(url); a.remove()},100)
}

function exportCSV(){
  const arr=[...selected.values()]
  arr.sort((a,b)=>(a.classNo-b.classNo)||a.g.localeCompare(b.g)||a.code.localeCompare(b.code))
  const rows=[['序号','商品类别','类似群','商品名称']]
  arr.forEach((it,i)=>rows.push([i+1, it.classNo, it.g, it.name]))
  const csv=rows.map(r=>r.map(c=>{ c=(c==null?'':String(c)); return /[\",\n]/.test(c)?'"'+c.replace(/"/g,'""')+'"':c }).join(',')).join('\n')
  download('商标已选类目.csv','\uFEFF'+csv,'text/csv;charset=utf-8')
}
function copyResult(){
  if(!selected.size){ alert('请先勾选'); return }
  let txt=''
  for(const it of selected.values()) txt += `【${it.g} ${it.groupTitle}】${it.code} ${it.name}\n`
  navigator.clipboard? navigator.clipboard.writeText(txt).then(()=>alert('已复制')) : (()=>{})()
}
function buildStructured(){
  const map={}
  for(const it of selected.values()){
    if(!map[it.classNo]) map[it.classNo]={classNo:it.classNo,className:it.className,groups:{}}
    if(!map[it.classNo].groups[it.g]) map[it.classNo].groups[it.g]={g:it.g,groupTitle:it.groupTitle,items:[]}
    map[it.classNo].groups[it.g].items.push({code:it.code,name:it.name})
  }
  const classes=Object.keys(map).sort((a,b)=>a-b).map(no=>{
    const c=map[no], groups=[]
    Object.keys(c.groups).sort().forEach(g=>{ const gi=c.groups[g]; gi.items.sort((x,y)=>x.code.localeCompare(y.code)); groups.push({g:gi.g,groupTitle:gi.groupTitle,items:gi.items}) })
    return {classNo:+no,className:c.className,groups}
  })
  return {exportedAt:new Date().toISOString(), totalItems:selected.size, classes}
}
function refreshButtons(){
  const on=selected.size>0
  ;['btnCsv'].forEach(id=>{ document.getElementById(id).disabled=!on })
}

/* 移动端：切换 选择 / 已选 两个面板 */
function showPanel(which){
  const main = document.querySelector('.main')
  const on = which==='res'
  main.classList.toggle('show-result', on)
  document.getElementById('mvSel').classList.toggle('on', !on)
  document.getElementById('mvRes').classList.toggle('on', on)
}

/* ---------- 启动：秒开，不预取任何类目 ---------- */
function boot(){
  loadSelected()               // 恢复已选（轻量）
  statusEl.textContent = '就绪'
  renderTabs()
  renderResult()
  // 若已有已选，默认打开第一个被选的大类方便回看
  const first = [...selected.values()]
    .map(v=>v.classNo).sort((a,b)=>a-b)[0]
  if(first) openClass(first)
  else renderTree()
}

// ---- 启动 ----
window.clearAll=clearAll; window.clearClass=clearClass; window.toggleCurOnly=toggleCurOnly
window.exportCSV=exportCSV
window.copyResult=copyResult; window.showPanel=showPanel
searchEl.addEventListener('input', renderTree)
boot()