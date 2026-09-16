// 1. 最底层的商品项类型
export interface TrademarkItem {
  code: string; // 商品六位编码，如 "010061"
  name: string; // 商品名称，如 "氨"
}

// 2. 中间的类似群类型
export interface TrademarkGroup {
  g: string; // 类似群编号，如 "0101"
  groupTitle: string; // 类似群名称，如 "工业气体，单质"
  items: TrademarkItem[]; // 包含的商品数组
}

// 3. 顶层的大类 JSON 结构类型
export interface TrademarkClassData {
  classNo: number; // 大类编号，如 1
  className: string; // 大类描述名称
  groups: TrademarkGroup[]; // 包含的类似群数组
}

// 4. 用户已选中的商品项类型
export interface SelectedItem {
  id: string; // 唯一 ID：大类_商品编码，如 "1_010061"
  classNo: number;
  code: string;
  name: string;
}