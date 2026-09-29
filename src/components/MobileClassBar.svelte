<script lang="ts">
  import { store } from '../lib/store.svelte';

  let {
    selectClass,
    classCount,
  }: {
    selectClass: (num: number) => void;
    classCount: (classNo: number) => number;
  } = $props();
</script>

<!-- ============ 移动端：类别切换条 ============ -->
<div class="sticky top-14 z-20 border-b border-slate-300 bg-white lg:hidden">
  <div class="overflow-x-auto px-3 py-2">
    <div class="flex w-max items-center gap-1.5">
      {#each Array.from({ length: 45 }, (_, i) => i + 1) as num}
        <button
          onclick={() => selectClass(num)}
          class="flex h-9 min-w-[2.75rem] shrink-0 items-center justify-center gap-1 px-2 font-mono text-sm {store.activeTab === num ? 'bg-slate-900 text-white' : 'border border-slate-300 text-slate-600 hover:border-slate-900 hover:text-slate-900'}"
        >
          {num}
          {#if classCount(num) > 0}
            <span class="text-[10px] {store.activeTab === num ? 'text-slate-300' : 'text-slate-400'}">✓</span>
          {/if}
        </button>
      {/each}
    </div>
  </div>
</div>