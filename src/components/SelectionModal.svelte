<script lang="ts">
  import { store } from '../lib/store.svelte';
  import { services } from '../lib/services.svelte';

  let { closePanel }: { closePanel: () => void } = $props();

  // 按类别分组显示已选（响应式：读取 store.selected）
  function groupedSelection(): { classNo: number; items: { code: string; name: string }[] }[] {
    const map = new Map<number, { code: string; name: string }[]>();
    for (const it of store.selectedList) {
      const arr = map.get(it.classNo) ?? [];
      arr.push({ code: it.code, name: it.name });
      map.set(it.classNo, arr);
    }
    return [...map.entries()]
      .map(([classNo, items]) => ({ classNo, items }))
      .sort((a, b) => a.classNo - b.classNo);
  }

  function classNameOf(classNo: number): string {
    const full = store.classNames[classNo] ?? '';
    const m = full.match(/^第\s*\d+\s*类\s*(.*)$/);
    return m ? m[1] : full;
  }

  // ---------- 导出 ----------
  function download(filename: string, content: string, type: string) {
    const blob = new Blob([content], { type });
    downloadBlob(filename, blob);
  }

  function downloadBlob(filename: string, blob: Blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function escapeCSV(v: string): string {
    if (/[",\n\r]/.test(v)) return '"' + v.replace(/"/g, '""') + '"';
    return v;
  }

  function exportJSON() {
    const data = { exportedAt: new Date().toISOString(), items: store.selectedList };
    download('trademark-selected.json', JSON.stringify(data, null, 2), 'application/json');
  }

  function exportCSV() {
    const rows = [['类别编号', '类别名称', '商品编码', '商品名称']];
    for (const it of store.selectedList) {
      rows.push([String(it.classNo), classNameOf(it.classNo), it.code, it.name]);
    }
    const csv = rows.map((r) => r.map(escapeCSV).join(',')).join('\r\n');
    // 加 BOM 便于 Excel 打开中文
    download('trademark-selected.csv', '\uFEFF' + csv, 'text/csv;charset=utf-8;');
  }

  async function exportTXT() {
    const lines: string[] = [];
    const seal = '─'.repeat(48);

    // 所有涉及的大类（升序）
    const classNos = [...new Set(store.selectedList.map((i) => i.classNo))].sort((a, b) => a - b);

    for (const classNo of classNos) {
      // 该大类的商品编码 -> 类似群编号(g) 映射
      const gMap = new Map<string, string>();
      try {
        const data = await services.getClassData(classNo);
        for (const grp of data.groups) {
          for (const it of grp.items) gMap.set(it.code, grp.g);
        }
      } catch {
        /* 数据加载失败时退化为“未知小类” */
      }

      const className = classNameOf(classNo);
      lines.push(`第 ${classNo} 类　${className}`);
      lines.push(seal);

      // 按类似群（小类）升序分组
      const byGroup = new Map<string, { code: string; name: string }[]>();
      for (const it of store.selectedList.filter((i) => i.classNo === classNo)) {
        const g = gMap.get(it.code) ?? '未分类';
        const arr = byGroup.get(g) ?? [];
        arr.push({ code: it.code, name: it.name });
        byGroup.set(g, arr);
      }

      const sortedGroups = [...byGroup.entries()].sort((a, b) => a[0].localeCompare(b[0]));
      for (const [g, items] of sortedGroups) {
        lines.push(`${g}\u3000${items.map((it) => `${it.code} ${it.name}`).join('、')}`);
      }
      lines.push('');
    }

    download('trademark-selected.txt', lines.join('\n'), 'text/plain');
  }

  // 每个大类内：商品编码 -> (类似群编号, 类似群名称)
  async function groupMetaOf(classNo: number): Promise<Map<string, { g: string; title: string }>> {
    const meta = new Map<string, { g: string; title: string }>();
    try {
      const data = await services.getClassData(classNo);
      for (const grp of data.groups) {
        for (const it of grp.items) meta.set(it.code, { g: grp.g, title: grp.groupTitle });
      }
    } catch {
      /* 加载失败时退回空映射 */
    }
    return meta;
  }

  // 导出：每大类一个独立的 xlsx 文件，最后打包成一个 zip 压缩包
  async function exportXLSX() {
    const XLSX = await import('xlsx');
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    const list = store.selectedList;
    const classNos = [...new Set(list.map((i) => i.classNo))].sort((a, b) => a - b);

    // —— 汇总表：单独一个 xlsx ——
    const sumRows: (string | number)[][] = [['类别编号', '类别名称', '已选数量']];
    for (const cn of classNos) sumRows.push([cn, classNameOf(cn), store.classSelectedCount(cn)]);
    const sumWs = XLSX.utils.aoa_to_sheet(sumRows);
    const sumWb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(sumWb, sumWs, '汇总');
    zip.file('汇总.xlsx', toUint8(XLSX.write(sumWb, { bookType: 'xlsx', type: 'array' })));

    // —— 每个大类一个 xlsx ——
    for (const cn of classNos) {
      const meta = await groupMetaOf(cn);
      const className = classNameOf(cn);
      const rows: (string | number)[][] = [
        ['序号', '商品类别', '类似群', '商品名称'],
      ];
      let seq = 0;
      for (const it of list.filter((i) => i.classNo === cn)) {
        seq++;
        const m = meta.get(it.code);
        rows.push([seq, it.classNo, m?.g ?? '', it.name]);
      }
      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws['!cols'] = [{ wch: 6 }, { wch: 40 }, { wch: 16 }, { wch: 40 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `第${cn}类`);
      zip.file(`第${cn}类.xlsx`, toUint8(XLSX.write(wb, { bookType: 'xlsx', type: 'array' })));
    }

    const blob = await zip.generateAsync({ type: 'blob' });
    downloadBlob('trademark-selected-xlsx.zip', blob);
  }

  // 把 SheetJS 的 array 输出统一转为 Uint8Array，供 JSZip 使用
  function toUint8(out: any): Uint8Array {
    if (out instanceof Uint8Array) return out;
    if (out instanceof ArrayBuffer) return new Uint8Array(out);
    if (Array.isArray(out)) return new Uint8Array(out);
    const bytes = new Uint8Array(out.length);
    for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 0xff;
    return bytes;
  }
</script>

<!-- ============ 已选面板（弹窗） ============ -->
<div
  class="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-20"
  role="presentation"
  onclick={(e) => { if (e.target === e.currentTarget) closePanel(); }}
  onkeydown={(e) => { if (e.key === 'Escape') closePanel(); }}
>
  <div
    class="w-full max-w-3xl border border-slate-300 bg-white"
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <!-- 头部 -->
    <div class="flex items-center justify-between border-b border-slate-200 px-4 py-3">
      <h3 class="text-base font-bold text-slate-900">已选商标项目</h3>
      <div class="flex items-center gap-2">
        <span class="font-mono text-xs text-slate-500">共 {store.totalSelected} 项</span>
        <button onclick={() => closePanel()} class="border border-slate-300 px-2 py-1 text-sm text-slate-500 hover:border-slate-900 hover:text-slate-900">关闭</button>
      </div>
    </div>

    <!-- 操作栏：导出 / 清空 -->
    <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-2">
      <div class="flex items-center gap-2 text-sm">
        <span class="text-xs text-slate-400">导出为：</span>
        <button onclick={exportXLSX} class="border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:border-slate-900 hover:text-slate-900">Zip</button>
        <button onclick={exportCSV} class="border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:border-slate-900 hover:text-slate-900">CSV</button>
        <button onclick={exportTXT} class="border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:border-slate-900 hover:text-slate-900">TXT</button>
      </div>
      <button
        onclick={() => {
          if (confirm('确认清空所有已选的商标项目？')) {
            store.clearAll();
            closePanel();
          }
        }}
        class="border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
        disabled={store.totalSelected === 0}
      >清空全部</button>
    </div>

    <!-- 列表 -->
    <div class="max-h-[50vh] overflow-y-auto">
      {#if store.totalSelected === 0}
        <div class="p-10 text-center text-sm text-slate-400">暂无已选商品</div>
      {:else}
        {#each groupedSelection() as cls}
          <div class="border-b border-slate-100">
            <div class="bg-slate-50 px-4 py-1.5 text-xs font-semibold text-slate-600">
              第 {cls.classNo} 类 · {classNameOf(cls.classNo)}
            </div>
            <table class="w-full text-sm">
              <tbody>
                {#each cls.items as item}
                  <tr class="border-b border-slate-100 last:border-b-0 hover:bg-slate-50">
                    <td class="w-10 px-4 py-1.5 font-mono text-xs text-slate-400">{item.code}</td>
                    <td class="px-2 py-1.5 text-slate-800">{item.name}</td>
                    <td class="w-12 text-right pr-2">
                      <button
                        onclick={() => store.removeItem(cls.classNo, item.code)}
                        class="px-2 py-0.5 text-xs text-slate-400 hover:text-red-600"
                        title="移除"
                      >✕</button>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/each}
      {/if}
    </div>
  </div>
</div>