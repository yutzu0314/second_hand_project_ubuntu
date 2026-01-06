import { seedOrders } from "./orderData.js";

const STORAGE_KEY = "SECOND_HAND_ORDERS_V1";

/**
 * 初始化資料（只會做一次）
 */
export function initDB() {
  if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedOrders));
  }
}

/**
 * 取得所有訂單
 */
export function getOrders() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

/**
 * 儲存訂單
 */
function saveOrders(orders) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

/**
 * 新增訂單（買家下單）
 */
export function createOrder(order) {
  const orders = getOrders();
  orders.push(order);
  saveOrders(orders);
}

/**
 * 更新訂單（買 / 賣 共用）
 */
export function updateOrder(orderId, updater) {
  const orders = getOrders();
  const idx = orders.findIndex(o => o.orderId === orderId);
  if (idx === -1) return false;

  updater(orders[idx]);
  saveOrders(orders);
  return true;
}
