<script lang="ts">
  import { store } from './lib/store.svelte';
  import type { TrademarkGroup } from './types/trademark';
  import './app.css';

  import TopBar from './components/TopBar.svelte';
  import MobileClassBar from './components/MobileClassBar.svelte';
  import ClassSidebar from './components/ClassSidebar.svelte';
  import ClassViewer from './components/ClassViewer.svelte';
  import SelectionBottomBar from './components/SelectionBottomBar.svelte';
  import SelectionModal from './components/SelectionModal.svelte';

  let classFilter = $state('');
  let keyword = $state('');
  const collapsed = $state(new Set<string>()); // 折叠的类似群编号
  let mainEl: HTMLElement | undefined = $state();
  let showPanel = $state(false);

  // 点击大类：切换并让右侧从顶部开始展示（scroll-margin-top 补偿顶栏高度）
  function selectClass(num: number) {
    store.activeTab = num;
    if (mainEl) mainEl.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  function shortName(num: number): string {
    const full = store.classNames[num];
    if (!full) return `第 ${num} 类`;
    const m = full.match(/^第\s*\d+\s*类\s*([^；;，,.。]+)/);
    return m ? m[1] : `第 ${num} 类`;
  }

  function classCount(classNo: number): number {
    return store.classSelectedCount(classNo);
  }

  function classMatches(num: number): boolean {
    const q = classFilter.trim().toLowerCase();
    if (!q) return true;
    return String(num).includes(q) || (store.classNames[num] ?? '').toLowerCase().includes(q);
  }

  function filteredClassCount(): number {
    let c = 0;
    for (let i = 1; i <= 45; i++) if (classMatches(i)) c++;
    return c;
  }

  // ---------- 主内容区（类似群 / 商品级）逻辑 ----------
  function groupVisible(g: TrademarkGroup): boolean {
    const q = keyword.trim().toLowerCase();
    if (!q) return true;
    return (
      g.groupTitle.toLowerCase().includes(q) ||
      g.items.some((it) => it.name.toLowerCase().includes(q) || it.code.includes(q))
    );
  }

  function itemVisible(item: { name: string; code: string }): boolean {
    const q = keyword.trim().toLowerCase();
    if (!q) return true;
    return item.name.toLowerCase().includes(q) || item.code.includes(q);
  }

  function itemChecked(classNo: number, code: string): boolean {
    return store.isSelected(classNo, code);
  }

  function groupCount(classNo: number, group: TrademarkGroup): number {
    let c = 0;
    for (const it of group.items) if (store.isSelected(classNo, it.code)) c++;
    return c;
  }

  function totalItems(groups: TrademarkGroup[]): number {
    return groups.reduce((a, g) => a + g.items.length, 0);
  }

  function toggleCollapse(g: string) {
    if (collapsed.has(g)) collapsed.delete(g);
    else collapsed.add(g);
  }
</script>

<svelte:head>
  <title>商标分类选择器 · Trademark Selector</title>
</svelte:head>

<TopBar />

<MobileClassBar {selectClass} {classCount} />

<div class="mx-auto flex max-w-[1500px]">
  <ClassSidebar
    bind:classFilter
    {selectClass}
    {classCount}
    {classMatches}
    {shortName}
    {filteredClassCount}
  />

  <ClassViewer
    bind:mainEl
    bind:keyword
    {collapsed}
    {toggleCollapse}
    {groupVisible}
    {itemVisible}
    {groupCount}
    {itemChecked}
    {totalItems}
  />
</div>
<div class="h-12"></div>

<SelectionBottomBar
  openPanel={() => (showPanel = true)}
/>

{#if showPanel}
  <SelectionModal closePanel={() => (showPanel = false)} />
{/if}