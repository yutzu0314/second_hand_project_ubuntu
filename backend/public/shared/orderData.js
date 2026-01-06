// 共用訂單初始資料（假資料，用來 demo）
export const seedOrders = [
  {
    orderId: "ORD001",
    buyerId: "B001",
    sellerId: "S001",

    status: "待出貨", // 待出貨 / 準備中 / 已出貨 / 已抵達

    messages: [
      {
        from: "buyer",
        text: "請問什麼時候會出貨？",
        time: "2026-01-06 10:00"
      }
    ],

    review: {
      rating: null,        // 1~5
      comment: "",         // 買家評價
      sellerReply: ""      // 賣家回應
    }
  }
];
