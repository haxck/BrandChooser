<script lang="ts">
  import { store } from '../lib/store.svelte';

  let {
    classFilter = $bindable(),
    selectClass,
    classCount,
    classMatches,
    shortName,
    filteredClassCount,
  }: {
    classFilter: string;
    selectClass: (num: number) => void;
    classCount: (classNo: number) => number;
    classMatches: (num: number) => boolean;
    shortName: (num: number) => string;
    filteredClassCount: () => number;
  } = $props();
</script>

<!-- ============ 左侧：类别导航 ============ -->
<aside class="hidden w-[270px] shrink-0 lg:block">
  <div class="sticky top-14 max-h-[calc(100vh-6.5rem)] flex flex-col overflow-hidden border border-t-0 border-slate-300 bg-white">
    <div class="border-b border-slate-200">
      <div class="relative border-b border-slate-200">
        <span class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">◎</span>
        <input
          bind:value={classFilter}
          type="text"
          placeholder="过滤类别 / 编号"
          class="w-full bg-transparent py-2 pl-8 pr-2 text-sm text-slate-800 outline-none placeholder:text-slate-400"
        />
      </div>
    </div>

    <nav class="flex-1 overflow-y-auto">
      {#each Array.from({ length: 45 }, (_, i) => i + 1) as num}
        {#if classMatches(num)}
          {@const cnt = classCount(num)}
          <button
            onclick={() => selectClass(num)}
            class="flex w-full items-center gap-2.5 border-l-2 px-3 py-2 text-left {store.activeTab === num ? 'border-slate-900 bg-slate-100 text-slate-900' : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'}"
          >
            <span class="w-6 shrink-0 text-right font-mono text-xs text-slate-400">{num}</span>
            <span class="min-w-0 flex-1 truncate text-sm">{shortName(num)}</span>
            {#if cnt > 0}
              <span class="shrink-0 font-mono text-xs text-slate-500">({cnt})</span>
            {/if}
          </button>
        {/if}
      {/each}
    </nav>
  </div>
</aside>