// application's entry
import React, { Component } from 'react';
import ReactDOM,{ render } from 'react-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { Router, Route, IndexRoute, browserHistory, Link } from 'react-router';
import reducers from 'reducers/index';
import $ from 'n-zepto'; //dom库
import 'whatwg-fetch';
//import {RouteTransition} from 'react-router-transition' //路由切换动画

import createTapEventPlugin from 'react-tap-event-plugin';
createTapEventPlugin(); //添加touchTap事件

//公用scss
import '../scss/common.scss';
import '../scss/grid.scss';
import 'src/scss/ReactTransition.scss';

//公用插件
import 'plugin/flexible.min.js';
import 'src/plugin/swiper/swiper.scss';


//获取cookie值中的origin，判断是否是在app中
function getCookie( name ){
	let cookie = document.cookie,
		objCookie ={},
		arrCookie = cookie.split(";");
	for (let i = 0, item; item = arrCookie[i++];) {
		let cookieVal = item.split("=");
		objCookie[cookieVal[0] && cookieVal[0].trim()] = cookieVal[1];
	}
	return name in objCookie;
}

const context={
	isApp : getCookie("origin"),
	isLogin : getCookie("token")
};
//页面最外层
class Application extends Component {
  constructor(props) {
    super(props);
    // 初始状态
    this.state = {}
  }
	static contextTypes = {
		store:React.PropTypes.object
	};
	static childContextTypes = {
		isApp:React.PropTypes.bool,
		isLogin:React.PropTypes.bool
	};
	getChildContext(){
		return {
			isLogin:context.isLogin,
			isApp:context.isApp
		};
	}
	componentDidMount() {
		const self = this;
		const { store } = this.context;
		this.unSubscribe = store.subscribe(function(){
			const state = store.getState();
			if( state.type =="CONTEXT_CHANGE"){
				context[state.variable] = state.value;
				self.forceUpdate();
			}
		});
	}
	componentWillUnmount(){
		this.unSubscribe();
	}
	render() {
		return (
			<section id="wap-main">
			{this.props.children}
	</section>
	);
	}
}
const store = createStore(reducers, {}, applyMiddleware(thunk));

const rootRoute ={
	childRoutes:[
		{
			path: "/",
			component:Application,
			indexRoute:{
				onEnter:( nextState,replaceState )=> replaceState( "/searchResult")
			},
			childRoutes:[
				/*个人中心*/
				{
					path:"/personCenter",
					getComponent( nextState, callback ){
						require.ensure([], (require)=> {
							callback(null,require('./member/personCenter/index').default );
						}, "Channel");
					}
				},
				/*普通订单列表*/
				{
					path:"tradeList/:status",
					getComponent( nextState, callback ){
						require.ensure([],(require)=>{
							require('plugin/swiper/swiper.min.js');
							callback( null, require( './member/trade/tradeList').default );
						},"TradeList");
					}
				},
				/*查看物流页面*/
				{
					path:"logistics",
					getComponent( nextState, callback ){
						require.ensure([], (require)=> {
							require('plugin/swiper/swiper.min.js');
							callback(null, require( './member/trade/logistics.jsx').default );
						}, "Logistics");
					}
				},
				/*拼团订单列表*/
				{
					path:"myGroupList/:status",
					getComponent( nextState, callback ){
						require.ensure([],(require)=>{
							require('plugin/swiper/swiper.min.js');
							callback( null, require( './member/trade/myGroupList').default );
						},"MyGroupList");

					}
				},
				/*订单详情*/
				{
					path:"/tradeDetail",
					component:require('./member/trade/TradeDetail').default
				},
				/*取消订单页*/
				{
					path:"orderCancel",
					component:require( './member/trade/orderCancel.jsx').default
				},
				/*优惠券页面*/
				{
					path:"/couponList",
					getComponent( nextState, callback ){
						require.ensure([],(require)=>{
							require('plugin/swiper/swiper.min.js');
							callback( null, require('./member/coupon/index').default );
						},"CouponList");
					}
				},
				/*订单售后列表页*/
				{
					path:"/afterSale",
					component:require('./member/afterSale/index').default,
					childRoutes:[
						/*订单售后列表页*/
						{
							path:"list",
							component:require('./member/afterSale/list').default
						},
						/*订单售后申请页*/
						{
							path:"apply",
							component:require('./member/afterSale/apply').default
						},
						/*售后订单详情页*/
						{
							path:"detail",
							component:require('./member/afterSale/detail').default
						},
						/*售后填写物流页*/
						{
							path:"logistics",
							component:require('./member/afterSale/logistics').default
						}
					]
				},
				/*订单确认页*/
				{
					path:"/orderConfirm",
					component:require( './trade/orderConfirm/index').default
				},
				/*零元购订单确认页*/
				{
					path:"/zeroBuyConfirm",
					component:require( './trade/orderConfirm/zeroBuy').default
				},
				/*充值中心*/
				{
					path:"/rechargeCenter",
					component:require( './member/recharge/index2').default
				},

				/*收银台页面*/
				{
					path:"/cashier",
					component:require('./trade/pay/cashier').default
				},
				/*支付成功页面*/
				{
					path:"/payResult",
					component:require('./trade/pay/payResult').default
				},
				/*商品收藏*/
				{
					path:"/collect",
					component:require( './member/collect/index').default
				},
				/*零元购频道页*/
				{
					path:"/zeroBuyChannel",
					getComponent( nextState, callback ){
						require.ensure([], (require)=> {
							require('plugin/swiper/swiper.min.js');
							callback(null, require('./item/zeroBuy/channel').default );
						}, "Channel");
					}
				},
				/*乐享列表页*/
				{
					path:"/zeroBuyList",
					component:require( './item/zeroBuy/list').default
				},
				/*精选页面*/
				{
					path:"/selected",
					component:require('./selected/index').default
				},
				/*商品详情页*/
				{
					path:"item",
					getComponent( nextState, callback ){
						require.ensure([], (require)=> {
							require('plugin/swiper/swiper.min.js');
							callback(null, require('./item/index').default );
						}, "ItemPage");
					}
				},
				/*团购详情页*/
				{
					path:"/groupDetail",
					component:require( './item/groupDetail/groupDetail').default
				},
				/*  评团玩法 */
				{
					path: "pintuan-rules",
					component:require('./item/groupDetail/pintuanRules').default
				},
				/*购物车页面*/
				{
					path:"shopCart",
					component:require('./trade/shopCart/index').default
				},
					/*搜索列表页*/
				{
					path:"search",
					component:require( './search/index').default
				},
					/*搜索结果页*/
				{
					path:"searchResult",
					getComponent( nextState, callback ){
						require.ensure([],(require)=>{
							require('plugin/swiper/swiper.min.js');
							 window.IScroll = require('plugin/iscroll/iscroll.js');
							callback( null, require('./search/result').default );
						},"SearchResult");
					}
				},
				/*评价列表页*/
				{
					path:"evaluate",
					getComponent( nextState, callback ){
						require.ensure([], (require)=> {
							require('plugin/swiper/swiper.min.js');
							callback(null, require('./item/evaluate').default );
						}, "EvaluateList");
					}
				},
				/*评价输入页*/
				{
					path:"evaluateInput",
					component:require('./member/trade/EvaluateInput').default
				},
				/*限时特卖*/
				{
					path:"flashsale",
					getComponent( nextState, callback ){
						require.ensure([], (require)=> {
							window.IScroll =require('plugin/iscroll/iscroll.js');
							callback(null, require("./flashsale/index").default );
						}, "Flashsale");
					}
				},
				/* static 通用 */
					/* 下载引导 */
				{
					path: "guide",
					component:require('./static/guide').default
				}
				/*未匹配的重定向*/
				/*{
					path:"*",
					onEnter:( nextState,replaceState )=> replaceState( "/")
				}*/
			]
		}
	]
};

render((
	<Provider store={store}>
		<Router history={browserHistory} routes={rootRoute} />
	</Provider>
), document.getElementById('app'));
