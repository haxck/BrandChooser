import type { TrademarkClassData } from '../types/trademark.ts';

class Services {
  private cache = new Map<number, TrademarkClassData>();

  async getClassData(classNo: number): Promise<TrademarkClassData> {
    if (this.cache.has(classNo)) {
      return this.cache.get(classNo)!;
    }

    const res = await fetch(`/data/${String(classNo).padStart(2,"0")}.json`);
    if (!res.ok) throw new Error(`第 ${classNo} 类数据加载失败`);

    const data: TrademarkClassData = await res.json();
    this.cache.set(classNo, data);
    return data;
  }
}

export const services = new Services();