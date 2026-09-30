<script lang="ts">
  import { store } from '../lib/store.svelte';
  import type { TrademarkGroup } from '../types/trademark';

  let {
    keyword = $bindable(),
    collapsed,
    mainEl = $bindable(),
    toggleCollapse,
    groupVisible,
    itemVisible,
    groupCount,
    itemChecked,
    totalItems,
  }: {
    keyword: string;
    collapsed: Set<string>;
    mainEl: HTMLElement | undefined;
    toggleCollapse: (g: string) => void;
    groupVisible: (g: TrademarkGroup) => boolean;
    itemVisible: (item: { name: string; code: string }) => boolean;
    groupCount: (classNo: number, group: TrademarkGroup) => number;
    itemChecked: (classNo: number, code: string) => boolean;
    totalItems: (groups: TrademarkGroup[]) => number;
  } = $props();
</script>

<main bind:this={mainEl} class="min-w-0 flex-1 scroll-mt-20">
  {#await store.currentPromise}
    <div class="flex flex-col items-center justify-center gap-3 border border-slate-300 bg-white py-28">
      <div class="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-700"></div>
      <p class="text-sm text-slate-500">加载第 {store.activeTab} 类数据…</p>
    </div>
  {:then data}
    <!-- 置顶信息卡 -->
    <div class="lg:sticky lg:top-14 z-20 border border-l-0 border-t-0 border-slate-300 bg-white">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div class="flex min-w-0 items-center gap-3">
          <span class="w-8 shrink-0 text-center font-mono text-lg font-bold text-slate-900">{data.classNo}</span>
          <div class="min-w-0">
            <h2 class="truncate text-base font-bold text-slate-900">第 {data.classNo} 类</h2>
            <p class="truncate text-xs text-slate-500">{data.className}</p>
          </div>
        </div>
        <div class="flex shrink-0 items-center gap-3 font-mono text-xs text-slate-500">
          <span>{data.groups.length} 类似群</span>
          <span>·</span>
          <span>{totalItems(data.groups)} 商品</span>
          <span>·</span>
          <span>已选 {store.classSelectedCount(data.classNo)}</span>
        </div>
      </div>

      <div class="relative flex items-center">
        <span class="pointer-events-none absolute left-3 text-slate-400">⌕</span>
        <input
          bind:value={keyword}
          type="text"
          placeholder="搜索商品名称或编码…"
          class="w-full bg-transparent px-3 py-3 pl-9 pr-8 text-sm text-slate-800 outline-none placeholder:text-slate-400"
        />
        {#if keyword}
          <button onclick={() => (keyword = '')} class="absolute right-2 text-slate-400 hover:text-slate-700">×</button>
        {/if}
      </div>
    </div>

    <!-- 类似群列表 -->
    <div class="relative z-0 mt-4">
      {#each data.groups as group}
        {#if groupVisible(group)}
          {@const open = keyword.trim() ? true : !collapsed.has(group.g)}
          <div class="mb-2 border border-l-0 border-slate-300 bg-white">
            <button
              onclick={() => toggleCollapse(group.g)}
              class="flex w-full items-center justify-between gap-3 border-b border-slate-200 px-4 py-2.5 text-left hover:bg-slate-50 {open ? '' : 'border-b-0'}"
            >
              <div class="flex min-w-0 items-center gap-3">
                <span class="w-4 shrink-0 font-mono text-xs text-slate-400">{open ? '▾' : '▸'}</span>
                <span class="shrink-0 font-mono text-xs font-semibold text-slate-600">{group.g}</span>
                <span class="truncate text-sm text-slate-800">{group.groupTitle}</span>
                {#if groupCount(data.classNo, group) > 0}
                  <span class="shrink-0 font-mono text-xs text-slate-500">({groupCount(data.classNo, group)}/{group.items.filter(itemVisible).length})</span>
                {/if}
              </div>
              <div class="flex shrink-0 items-center gap-2 text-xs">
                <span class="font-mono text-slate-400">{group.items.filter(itemVisible).length}</span>
                {#if open}
                  <span
                    role="button"
                    tabindex="0"
                    onclick={(e) => { e.stopPropagation(); store.selectAll(data.classNo, group.items); }}
                    onkeydown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); store.selectAll(data.classNo, group.items); } }}
                    class="border border-slate-300 px-2 py-0.5 text-slate-600 hover:border-slate-900 hover:text-slate-900"
                  >全选</span>
                  <span
                    role="button"
                    tabindex="0"
                    onclick={(e) => { e.stopPropagation(); store.clearGroup(data.classNo, group.items); }}
                    onkeydown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); store.clearGroup(data.classNo, group.items); } }}
                    class="border border-slate-300 px-2 py-0.5 text-slate-400 hover:border-slate-900 hover:text-slate-900"
                  >清除</span>
                {/if}
              </div>
            </button>

            {#if open}
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {#each group.items.filter(itemVisible) as item}
                  {@const checked = itemChecked(data.classNo, item.code)}
                  <label class="flex cursor-pointer select-none items-center gap-2 border-b border-r border-slate-100 px-3 py-2 hover:bg-slate-50 {checked ? 'bg-slate-100' : ''}">
                    <input type="checkbox" checked={checked} onchange={() => store.toggleItem(data.classNo, item)} class="h-4 w-4 shrink-0 cursor-pointer accent-slate-900" />
                    <span class="min-w-0 flex-1 truncate text-[13px] text-slate-700">{item.name}</span>
                    <span class="shrink-0 font-mono text-[10px] text-slate-400">{item.code}</span>
                  </label>
                {/each}
              </div>
            {/if}
          </div>
        {/if}
      {/each}

      {#if data.groups.filter(groupVisible).length === 0}
        <div class="border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          未找到匹配 “{keyword}” 的商品
        </div>
      {/if}
    </div>
  {:catch error}
    <div class="border border-red-300 bg-white p-6 text-center">
      <p class="text-sm text-red-600">{error.message}</p>
      <button onclick={() => (store.activeTab = store.activeTab)} class="mt-3 border border-red-300 px-4 py-1.5 text-sm text-red-600 hover:bg-red-50">重试</button>
    </div>
  {/await}
</main>