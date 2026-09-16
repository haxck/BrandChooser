import { services } from './services.svelte';
import type { TrademarkItem } from '../types/trademark';

class Store {
  activeTab = $state<number>(1);
  selectedMap = $state(new Map<string, TrademarkItem>());

  constructor() {
    const local = localStorage.getItem('tm_selected');
    if (local) {
      try { this.selectedMap = new Map(JSON.parse(local)); } catch (e) {}
    }
  }

  // 快捷获取当前 JSON 的 Promise
  get currentPromise() {
    return services.getClassData(this.activeTab);
  }

  toggleItem(classNo: number, item: TrademarkItem) {
    const key = `${classNo}_${item.code}`;
    if (this.selectedMap.has(key)) {
      this.selectedMap.delete(key);
    } else {
      this.selectedMap.set(key, item);
    }
    localStorage.setItem('tm_selected', JSON.stringify([...this.selectedMap.entries()]));
  }
}

export const store = new Store();