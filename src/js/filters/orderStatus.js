export const orderStatusMap ={
	'WAIT_BUYER_PAY':'待付款',
	'WAIT_SELLER_SEND':'待发货',
	'WAIT_BUYER_CONFIRM':'待收货',
	'WAIT_BUYER_SIGNED':'待评价',
	'TRADE_FINISHED':'已完成',
	'TRADE_CLOSED_BY_REFUND':'已关闭',
	'TRADE_CLOSED_BY_CANCEL':'已关闭'
};
export const cancelOrderMap ={
	'SUCCESS':'取消成功',
	'NO_APPLY_CANCEL':''
};

//取消订单理由
export const reasonList =[
	{ name:"1",text:"现在不想购买"},
	{ name:"2",text:"商品价格较贵"},
	{ name:"3",text:"价格波动"},
	{ name:"4",text:"商品缺货"},
	{ name:"5",text:"重复下单"},
	{ name:"6",text:"订单商品选择有误"},
	{ name:"7",text:"支付方式选择有误"},
	{ name:"8",text:"收货信息填写有误"},
	{ name:"9",text:"发票信息填写有误"},
	{ name:"10",text:"无法支付订单"},
	{ name:"other",text:"其他原因"}
];

//订单类型
export const orderType=["普通订单","零元购","分期购","拼团"];

//拼团状态
export const groupStatus ={
	'IN_PROCESS':"拼团中",
	'SUCCESS':"拼团成功",
	'FAILED':"拼团失败"
};

//配送方式
export const dispatchType={
	'online':"在线支付"
};

//弹窗要加载的数据
export const  popupData = {
	type: {
		title: "售后类型",
		list: [
			{method: "退货退款", content: "已收到货，需要退还已收到的货物", select: "REFUND_GOODS" },
			{method: "仅退款", content: "无需退货", select: "ONLY_REFUND"}
		]
	},
	reason: {
		title: "退货原因",
		list: {
			"REFUND_GOODS": [{content: "商品与描述不符", select: 1},
				{content: "商品错发漏发", select: 2},
				{content: "收到商品破损", select: 3},
				{content: "商品质量问题", select: 4},
				{content: "个人原因退货", select: 5},
				{content: "其他", select: 6}
			],
			"ONLY_REFUND": [{content: "商品与描述不符", select: 1},
				{content: "商品错发漏发", select: 2},
				{content: "收到商品破损", select: 3},
				{content: "商品质量问题", select: 4},
				{content: "个人原因退货", select: 5},
				{content: "未收到货", select: 6},
				{content: "商品问题已拒签", select: 7},
				{content: "退运费", select: 8},
				{content: "其他", select: 9}
			]

		}
	}
};

//售后状态
export const asProcess ={
	0:"待审核",
	1:"待回寄",
	2:"待收货",
	3:"审核驳回",
	6:"审核驳回",
	8:"待退款",
	7:"已退款"};
export const asStatus =["待处理","处理中","已处理","已驳回"];

export const asTypes={
	"ONLY_REFUND":"仅退款",
	"REFUND_GOODS":"退货退款",
	"EXCHANGING_GOODS":"申请换货"
};
