<script lang="ts">
  import { store } from './lib/store.svelte';
</script>

<main>
  <div class="tabs">
    {#each Array.from({ length: 45 }, (_, i) => i + 1) as num}
      <button 
        class:active={store.activeTab === num} 
        onclick={() => store.activeTab = num}
      >
        第 {num} 类
      </button>
    {/each}
  </div>

  <!-- 内容区 -->
  {#await store.currentPromise}
    <p>⚡ 数据加载中...</p>
  {:then data}
    <h2>第 {data.classNo} 类: {data.className}</h2>
    {#each data.groups as group}
      <div class="group">
        <h3>{group.g} {group.groupTitle}</h3>
        {#each group.items as item}
          {@const key = `${data.classNo}_${item.code}`}
          {@const isChecked = store.selectedMap.has(key)}
          <label>
            <input 
              type="checkbox" 
              checked={isChecked} 
              onchange={() => store.toggleItem(data.classNo, item)} 
            />
            {item.code} - {item.name}
          </label>
        {/each}
      </div>
    {/each}
  {:catch error}
    <p style="color: red;">{error.message}</p>
  {/await}
</main>