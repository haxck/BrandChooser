<script lang="ts">
  import { store } from '../lib/store.svelte';

  let { openPanel }: { openPanel: () => void } = $props();
</script>

<!-- ============ 底部：已选工具栏 ============ -->
<div class="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-300 bg-white">
  <div class="mx-auto flex h-12 max-w-[1500px] items-center justify-between px-4 sm:px-6">
    <button
      onclick={() => { if (store.totalSelected > 0) openPanel(); }}
      disabled={store.totalSelected === 0}
      class="flex items-center gap-2 text-sm text-slate-700 hover:text-slate-900 disabled:text-slate-400"
    >
      已选 <b class="font-mono">{store.selectedClassNoCount} 类，共 {store.totalSelected} 项</b>
      <span class="border border-slate-300 px-2 py-0.5 text-xs text-slate-500 hover:border-slate-900 hover:text-slate-900">查看 / 导出</span>
    </button>
    <p class="text-sm text-slate-400">&COPY;<a class="hover:text-slate-600" href="https://haxck.com">haxck</a></p>
  </div>
</div>