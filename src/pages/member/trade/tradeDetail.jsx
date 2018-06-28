import React, { Component } from 'react';
import { Link,browserHistory } from 'react-router';
import 'src/scss/tradeAll.scss';
import {LoadingRound} from 'component/common';
import { connect } from 'react-redux';
import Popup from 'component/modal';
import 'src/scss/ReactTransition.scss';
import  concatPageAndType from 'js/actions/actions.js';
import { ownAjax } from 'js/common/ajax.js';
import { timeUtils } from 'js/common/utils.js';
import { orderStatusMap,dispatchType,groupStatus } from 'js/filters/orderStatus';

const ctrlAPI ={
	init:{url:"/api/wap/trade-mtradeDetail.html",type:"get"},
	del:{ url:'/api/wap/trade-mdeleteOrder.html',type:"get"},
	conf:{ url:"/api/wap/trade-mupdateStatus.html",type:"get" },
	track:{ url:"/api/wapapi/tracking.api",type:"get"},
	logistics:{ url:"/api/wapapi/tradeTracking.api",type:"get"},
	cashier:{ url:"/api/api/payment/getPayOptions", type:"post"}
};

const createActions = concatPageAndType("tradeDetail");

//订单详情页
export default class TradeDetail extends Component{
	componentWillMount() {
		document.title = '订单详情';
		window.location.href = "jsbridge://set_title?title=订单详情";
		const host =window.location.protocol+"//"+window.location.host;
		window.onTRCPayResult = function( state ){
			if (state == 'true') {
				window.location.href='jsbridge://open_link_at_stack_root?url='+window.btoa(  host+"/paySuccess" );
			} else {
				window.location.href='jsbridge://open_link_at_stack_root?url='+window.btoa( host+"/tradeList/0" );
			}
		}
	}
	componentWillUnmount(){
		window.onTRCPayResult = null;
	}
	componentWillUnmount() {
		const modal =document.querySelector("#modal");
		modal && modal.parentNode && modal.parentNode.removeChild(modal);
		const msgTip =document.querySelector("#msgTip");
		msgTip && msgTip.parentNode && msgTip.parentNode.removeChild(msgTip);
	}
	render(){
		return (
			<div data-page="trade-detail"  style={{minHeight:$(window).height()}}>
				<PageCtrl tid={this.props.location.query.tid } />
			</div>
		)
	}
}
//页面主要内容
class TradeDetailPage extends Component{
	static contextTypes ={
		store:React.PropTypes.object
	};
	componentDidMount() {
		const { store } = this.context;
		store.dispatch(createActions("getInitData"));
		$.ajax({
			url:ctrlAPI.init.url,
			type:ctrlAPI.init.type,
			data:{tid:this.props.tid },
			success( result ){
				/*if( !result.status ){
					Popup.MsgTip({msg:result.msg});
					return;
				}*/
				store.dispatch(createActions('sucInitData',{data:result }));
			},
			error( xhr ){
				store.dispatch( createActions('failInitData',{ msg:"网络发生问题，请稍后再试"}));
			}
		});
	}
	componentWillUpdate(newProps){
		if( newProps.error ){
			Popup.MsgTip({msg:newProps.msg});
			return false;
		}
	}
	componentWillUnmount(){
		this.props.dispatch( createActions("initialPage") );
	}
	render(){
		let {update,tid,data} = this.props;
		return(
			<div>
				{update && data ?
					<section id="tradeDetail">
						{data.type==3 && data.group_buy_status!=="NO_APPLY" &&<FightGroupStatus status={data.group_buy_status } info={data.groupBuy}/> }
						<OrderNumStatus  orderNum={data.id} status={ orderStatusMap[data.status] } type={data.type} groupStatus={ data.group_buy_status }  />
						{/* !data.is_virtual && (orderStatusMap[data.status]==="待收货" || orderStatusMap[data.status]==="待评价" || orderStatusMap[data.status]==="已完成") && <LogiInfoCtrl data={data} />*/ }
						{ !data.is_virtual && <AddressInfo data={data} /> }
						<OrderDetailMid data={data.good_orders} virtual={data.is_virtual} tid={data.id} groupStatus={data.group_buy_status}
						                groupInfo={data.groupBuy } curTime={data.curTime}  overDate={data.overDate}/>
						<UserInfo data={data}/>
						<OrderTotal  data={data} />
						{orderStatusMap[data.status]!=="待发货" &&  <OrderCtrlConnect type={data.type} status={orderStatusMap[data.status]}  tid={data.id} virtual={data.is_virtual} /> }
					</section>:
					<LoadingRound />
				}
			</div>

		)
	}
}

const mapStatePage =function( state, props ){
	const newState = state.tradeDetail;
	return{
		data: newState.initData,
		error:newState.error,
		update:newState.update,
		msg:newState.errorMsg
	}
};
const PageCtrl = connect(mapStatePage)(TradeDetailPage);

//拼团状态
class FightGroupStatus extends Component{
	render(){
			const {status,info} = this.props;
		 let html = "";
		switch (status ){
			case "SUCCESS":
				html = <div className="group-success"><i className="face-happy-icon"> </i>拼团成功</div>;
				break;
			case "IN_PROCESS":
				html =<div className="group-strive"><i className="face-strive-icon"> </i>拼团尚未成功，还差{info.object.required_person-info.object.current_person}人</div>;
				break;
			case "FAILED":
				html =<div className="group-fail"><i className="face-unhappy-icon"> </i>拼团失败</div>;
				break;
		}
		return(
			<div className="fight-group-status c-tc c-cfff">
				{html}
			</div>
		);
	}
}

//订单号和状态
export class OrderNumStatus extends Component{
	render(){
		let { status, type, groupStatus } = this.props;
		if( type==3 ){
			groupStatus==="IN_PROCESS" ? status="拼团中":"";
			( groupStatus==="FAILED" && status !=="已关闭" ) ? status = "拼团失败" :"";
		}
		return(
			<div className="status-info clearfix">
				<span>订单号：{this.props.orderNum}</span><i>{status}</i>
			</div>
		);
	}
}

//物流信息
export class LogisticsInfo extends Component{
	componentDidMount() {
		this.props.getData();
	}
	render(){
		const { data,load,error,tid} = this.props;
		return(
			<Link to={`/logistics?tid=${tid}`} className="logistics-info">
				<div className="blue-car">
					<i className="blue-car-icon"> </i>
				</div>
				{load?
				<div className="loading-img"><img src="/src/img/icon/loading/loading-round.gif" width="20" height="20" /></div> :
					(error?
						<div className="logistics-none">没有物流信息</div>:
						<div className="logistics-status">
							<div className="logistics-addr">{data.AcceptStation}</div>
							<div className="logistics-time">{data.AcceptTime}</div>
						</div>)
				}

				<div className="arrow-right">
					<i className="arrow-right-icon"> </i>
				</div>
			</Link>
		);
	}
}

const logiInfoState =function( state, props ){
	const newState = state.tradeDetail;
	return {
		data:newState.logiData,
		load:newState.logiLoad,
		error:newState.logiError,
		tid:props.data.id
	}
};
const logiInfoDisp = function(dispatch,props){
	return{
		getData:function(){
			ownAjax( ctrlAPI.track,{tid:props.data.id} ).then( result=>{
				if( result.code != 200 || !result.code ){
					dispatch(createActions("logiDataError"));
					return;
				}
				let package_id = result.data && result.data[0] && result.data[0].packageArr && result.data[0].packageArr[0] && result.data[0].packageArr[0].package_id;
				let is_national = result.data && result.data[0] && result.data[0].packageArr && result.data[0].packageArr[0] && result.data[0].packageArr[0].delivery_inner &&  result.data[0].packageArr[0].delivery_inner.is_national;
				ownAjax( ctrlAPI.logistics,{ tid:props.data.id,package_id, is_national}).then( result=>{
					if( result.tracker && result.tracker[0] ){
						dispatch( createActions("logiDataSuc",{data:result.tracker[0] }));
					}else{
						dispatch( createActions("logiDataError"));
					}
				}).catch( xhr=>{
					dispatch( createActions("logiDataError"));
				});
			}).catch( xhr =>{
				dispatch( createActions("logiDataError"));
			})

		}
	}
};

const LogiInfoCtrl = connect( logiInfoState,logiInfoDisp )(LogisticsInfo);

//收货人信息
const AddressInfo=({data})=>{
	return(
		<div className="address-info-grid">
			<div  className="address-info">
				<ReceivePerson data={data}/>
				<ReceiveAddr  data={data} />
				{data.receiver_id_number && <ReceiverId  data={data} /> }
			</div>
		</div>
	)
};
//收货人姓名和电话
const ReceivePerson =({data})=>{
	return(
		<div className="receive-person g-row-flex">
			<div className="left g-col-1">收货人：{data.receiver_name}</div> <div className="right">{data.receiver_mobile}</div>
		</div>
	);
};
//收货地址
const ReceiveAddr =({data})=>{
	return(
		<div className="receive-addr g-row-flex ">
			<div className="left">
				<i className="location-address-icon"> </i>
			</div>
			<div className="address-text g-col-1 right">收货地址：{data.receiver_state}{data.receiver_city}{data.receiver_district}{data.receiver_address}</div>
		</div>
	)
};
//收货人身份证
const ReceiverId  =({data})=>{
	return(
		<div className="receiver-id-grid">
			<div className="receiver-id g-row-flex">
				<div className="left">
					<i className="identify-card-icon"> </i>
				</div>
				<div className="receiver-id-text g-col-1">身份证信息：{data.receiver_name} {data.receiver_id_number.slice(0,3)+"********"+data.receiver_id_number.substr(data.receiver_id_number.length-3,3 ) }</div>
			</div>
		</div>
	)
};

//页面中部
const OrderDetailMid =(props)=>{
	return(
		<div className="order-detail-mid">
			<ItemList{...props}  />
			<div className="link-server-grid">
				<LinkServer />
			</div>
		</div>
	)
};

// 商品列表
const ItemList =(props)=>{
	const html = props.data && props.data.map((item,i)=>{
			return(
				<div className="one-item c-mb10" key={i}>
					<OneItemInfo data={item}/>
					<OneItemCtrl {...props} data={item}  />
				</div>)
	});
	return(
	<div className="item-list">
		{html}
	</div>
	)
};
const OneItemInfo =({data})=>{
	return(
		<div className="item-info g-row-flex">
			<Link to={`/item?item_id=${data.item_id}`} className="item-img c-dpb">
				<img src={data.pic_path}  width="75" height="75"/>
			</Link>
			<div className="item-detail g-col-1">
				<Link to={`/item?item_id=${data.item_id}`} className="item-title">{data.title}</Link>
				<div className="item-props">{data.spec_nature_info}</div>
				<div className="item-price c-clrfix">
					<span className="price c-fl">¥{ (+data.promotion_price)?(+data.promotion_price).toFixed(2):(+data.price).toFixed(2) }</span> <span className="num c-fr">x{data.num}</span>
				</div>
			</div>
		</div>
	)
};

const  OneItemCtrl =({data,tid,groupStatus,groupInfo,virtual,curTime,overDate })=> {
	let afterStatus ="";
	switch( data.after_sales_status ){
		case "WAIT_SELLER_AGREE":
		case "WAIT_BUYER_RETURN_GOODS":
		case "WAIT_SELLER_CONFIRM_GOODS":
		case "REFUNDING":
			afterStatus = <Link to={`/afterSale/detail?oid=${data.id}`}  className="btn" >退款处理中</Link>;
			break;
		case "SELLER_REFUSE_BUYER":
			if ( (!data.aftersales_count || data.aftersales_count <=2 ) && ( !data.consign_time || (curTime - data.consign_time < overDate*24*3600 )  )    ) {
				afterStatus = <Link to={`/afterSale/apply?tid=${tid}&oid=${data.id}&refund=${orderStatusMap[data.status]==="待发货"?1:0}&payment=${+data.payment}` } className="btn">退款失败，再次申请</Link>;
			}
			break;
		case "SUCCESS":
		case "SELLER_SEND_GOODS":
			afterStatus =  <Link to={`/afterSale/detail?oid=${data.id}`}  className="btn" >退款成功</Link>;
			break;
		case "CLOSED":
			afterStatus =  <Link  to={`/afterSale/detail?oid=${data.id}`}  className="btn" >售后申请驳回</Link>;
			break;
		default:
			if ( (!data.aftersales_count || data.aftersales_count <=2 ) && ( !data.consign_time || (curTime - data.consign_time < overDate*24*3600 )  )    ){
				afterStatus =<Link to={`/afterSale/apply?tid=${tid}&oid=${data.id}&refund=${orderStatusMap[data.status]==="待发货"?1:0}&payment=${+data.payment}`} className="btn">申请售后</Link>;
			}
	}
	return(
		<div className="one-item-ctrl">
			{groupStatus && groupStatus!=="NO_APPLY" && <Link to={`/groupDetail?object_id=${groupInfo.object_id}`} className="btn">查看团详情</Link> }
			{orderStatusMap[data.status]!=="待付款" && orderStatusMap[data.status]!=="已关闭" && !virtual
			&& ( groupStatus==="NO_APPLY" || ( groupStatus==="SUCCESS" && (orderStatusMap[data.status]==="待评价"||orderStatusMap[data.status]==="已完成" )  )  )
			&& ( data.type != 1 )
			&& afterStatus }
		</div>
	)
};

//联系客服
const LinkServer =()=>(
	<a href="taihe://to_customer_service" className="link-server">
		<i className="server-line-icon"> </i> <span>联系客服</span>
	</a>
);

const UserInfo =({data})=>{
	return(
		<div className="user-info order-list">
			<div className="list">
				<div className="left">支付方式</div>
				<div className="right">{dispatchType[data.pay_type]}</div>
			</div>
			{!data.is_virtual &&
				<div className="list">
					<div className="left">配送方式</div>
					<div className="right">快递 {data.post_fee==0 &&" 包邮"}</div>
				</div>
			}
			{/*<div className="list">
				<div className="left">买家留言</div>
				<div className="right c-c80">无</div>
			</div>*/}
		</div>
	)
};

const OrderTotal =({data})=>(
	<div className="order-list">
		<div className="total-list">
			<div className="list">
				<div className="left">商品总额</div>
				<div className="right">¥{(+data.total_fee).toFixed(2)}</div>
			</div>
			<div className="list">
				<div className="left">优惠金额</div>
				<div className="right">- ¥{(+data.discount_fee).toFixed(2)}</div>
			</div>
			{ !!data.total_tax &&
			<div className="list">
				<div className="left">税费</div>
				<div className="right">+ ¥{(+data.total_tax).toFixed(2)}</div>
			</div>
			}

			{ !data.is_vartual &&
				<div className="list">
					<div className="left">运费</div>
					<div className="right">+ ¥{(+data.post_fee).toFixed(2)}</div>
				</div>
			}
		</div>
		<div className="total-price">
			<div className="price">实付款：<span className="c-cf55">¥{(+data.payment).toFixed(2)}</span></div>
			<div className="time">下单时间：{timeUtils.detailFormat( data.modified_time) }</div>
		</div>
	</div>
);

class OrderCtrl extends Component{
	render(){
		let {status,tid,virtual,type} = this.props;
		let btnGroup ="";
		switch (status){
			case "待付款":
				btnGroup = [<Link className="ctrl-block cancel-order" key="1" to={`/orderCancel?tid=${tid}`}>取消订单</Link>,
					<Link className="ctrl-red pay-order" key="3"  to={`/cashier?oid=${tid}${type==1?"&zeroBuy=1":""}`} >去付款</Link>];
				break;
			case "待收货":
				btnGroup = [ !virtual && <Link className="ctrl-red pay-order" key="1" to={`/logistics?tid=${tid}`}>查看物流</Link>,
					<a className="ctrl-red pay-order" key="2" onTouchTap={ this.props.onConf } href="javascript:;">确认收货</a>];
				break;
			case "待评价":
				btnGroup = [ !virtual && <Link className="ctrl-red pay-order" key="2" to={`/logistics?tid=${tid}`}>查看物流</Link>,
					<Link className="ctrl-red pay-order" key="3" to={`/evaluateInput?tid=${tid}`} >评价晒单</Link>];
				break;
			case '已完成':
				btnGroup = [ !virtual && <Link className="ctrl-red pay-order" key="2" to={`/logistics?tid=${tid}`}>查看物流</Link>,
					<a className="ctrl-block" key="3" onTouchTap={ this.props.onDelete } >删除订单</a>];
				break;
			case '已关闭':
				btnGroup = 	<a className="ctrl-block" onTouchTap={ this.props.onDelete } >删除订单</a>;
				break;
			case "拼团中":
				btnGroup = [<a className="ctrl-red cancel-order" key="1" href="javascript:;">邀请好友参团</a>];
				break;
			default:break;
		}
		return(
			<div className="order-ctrl c-tr">
				{btnGroup}
			</div>
		)
	}
}

let isReq = false;

const orderCtrlState =function(state,props){
	return {}
};
const orderCtrlDisp =( dispatch, props ) =>{
	return {
		onDelete: function () {
			Popup.Modal({
				isOpen: true,
				msg: "是否要删除订单？"
			}, ()=> {
				if (isReq) return;
				isReq = true;
				$.ajax({
					url: ctrlAPI.del.url,
					type: ctrlAPI.del.type,
					data: {tid: props.tid},
					success(result){
						isReq = false;
						Popup.MsgTip({msg: result.msg});
						if (!result.status) return;
						window.setTimeout(()=> {
							browserHistory.goBack();
						}, 1000);
					},
					error(){
						isReq = false;
						Popup.MsgTip({msg: "网络错误，删除失败"});
					}
				})
			});
		},
		onConf: function () {
			Popup.Modal({
				isOpen: true,
				msg: "是否要确认收货？"
			}, ()=> {
				if (isReq) return;
				isReq = true;
				$.ajax({
					url: ctrlAPI.conf.url,
					type: ctrlAPI.conf.type,
					data: {tid: props.tid},
					success(result){
						isReq = false;
						Popup.MsgTip({msg: result.msg});
						if (!result.status) {
							return;
						}
						window.setTimeout(()=> {
							$.ajax({
								url: ctrlAPI.init.url,
								type: ctrlAPI.init.type,
								data: {tid: props.tid},
								success(result){
									dispatch(createActions('sucInitData', {data: result}));
								},
								error(xhr){
									dispatch(createActions('failInitData', {msg: "网络发生问题，请稍后再试"}));
								}
							});
						}, 1000);
					},
					error(){
						isReq = false;
						Popup.MsgTip({msg: "网络错误，删除失败"});
					}
				})
			});
		}
	}
};
const OrderCtrlConnect = connect(orderCtrlState,orderCtrlDisp)(OrderCtrl);