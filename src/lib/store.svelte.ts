import { services } from './services.svelte';
import type { TrademarkItem } from '../types/trademark';

class Store {
  activeTab = $state<number>(1);

  // 用一个普通对象做选中表（结构 {"1_010061": {code,name}}），
  // 每次变更都整体重建并重新赋值，确保跨组件响应式必定触发。
  selected = $state<Record<string, TrademarkItem>>({});

  // 类别名称缓存：key = 类别号，value = 完整类别名
  classNames = $state<Record<number, string>>({});

  constructor() {
    const local = localStorage.getItem('tm_selected');
    if (local) {
      try { this.selected = JSON.parse(local); } catch (e) { this.selected = {}; }
    }
    this.prefetchClassNames();
  }

  // 并行预取所有 45 类的名称，用于侧边栏展示
  private prefetchClassNames() {
    for (let i = 1; i <= 45; i++) {
      services.getClassData(i).then((data) => {
        this.classNames[i] = data.className;
      }).catch(() => {});
    }
  }

  get currentPromise() {
    return services.getClassData(this.activeTab);
  }

  private persist() {
    try { localStorage.setItem('tm_selected', JSON.stringify(this.selected)); } catch (e) {}
  }

  // ---------- 派生统计（响应式） ----------
  get totalSelected(): number {
    return Object.keys(this.selected).length;
  }

  // 有选中项的类别数量（已选涉及几个大类）
  get selectedClassNoCount(): number {
    const set = new Set<number>();
    for (const k of Object.keys(this.selected)) set.add(Number(k.split('_')[0]));
    return set.size;
  }

  classSelectedCount(classNo: number): number {
    const p = `${classNo}_`;
    let c = 0;
    for (const k of Object.keys(this.selected)) if (k.startsWith(p)) c++;
    return c;
  }

  isSelected(classNo: number, code: string): boolean {
    return `${classNo}_${code}` in this.selected;
  }

  // 返回所有已选条目：{ classNo, code, name }
  get selectedList(): { classNo: number; code: string; name: string }[] {
    const list: { classNo: number; code: string; name: string }[] = [];
    for (const [key, item] of Object.entries(this.selected)) {
      const cls = Number(key.split('_')[0]);
      list.push({ classNo: cls, code: item.code, name: item.name });
    }
    list.sort((a, b) => a.classNo - b.classNo || a.code.localeCompare(b.code));
    return list;
  }

  // ---------- 变更方法：每次重建对象 & 持久化 ----------
  removeItem(classNo: number, code: string) {
    const next: Record<string, TrademarkItem> = { ...this.selected };
    delete next[`${classNo}_${code}`];
    this.selected = next;
    this.persist();
  }

  toggleItem(classNo: number, item: TrademarkItem) {
    const key = `${classNo}_${item.code}`;
    const next: Record<string, TrademarkItem> = { ...this.selected };
    if (key in next) {
      delete next[key];
    } else {
      next[key] = item;
    }
    this.selected = next;
    this.persist();
  }

  selectAll(classNo: number, items: TrademarkItem[]) {
    const next: Record<string, TrademarkItem> = { ...this.selected };
    for (const it of items) next[`${classNo}_${it.code}`] = it;
    this.selected = next;
    this.persist();
  }

  clearGroup(classNo: number, items: TrademarkItem[]) {
    const next: Record<string, TrademarkItem> = { ...this.selected };
    for (const it of items) delete next[`${classNo}_${it.code}`];
    this.selected = next;
    this.persist();
  }

  clearAll() {
    this.selected = {};
    localStorage.removeItem('tm_selected');
  }
}

export const store = new Store();