import React, { Component } from 'react';
import { Link } from 'react-router';
import {connect} from 'react-redux';
import {LoadingRound} from 'component/common';
import Popup from 'component/modal';
import {orderStatusMap,reasonList} from '../../../js/filters/orderStatus';
import {browserHistory} from 'react-router';
import  concatPageAndType from 'js/actions/actions.js';

const ctrlAPI ={
	init:{url:"/api/wap/trade-mtradeDetail.html",type:"get"},
	cancel:{url:"/api/wap/trade-mcancelOrder.html",type:"get"}
};
const createActions = concatPageAndType("orderCancel");

export default class OrderCancel extends Component{
	componentWillMount() {
		document.title="取消订单";
		window.location.href = "jsbridge://set_title?title=取消订单";
	}
	componentDidMount() {
		$(this.refs.page).css({minHeight:$(window).height() });
	}
	componentWillUnmount(){
		const modal =document.querySelector("#modal");
		modal && modal.parentNode && modal.parentNode.removeChild(modal);
		const msgTip =document.querySelector("#msgTip");
		msgTip && msgTip.parentNode && msgTip.parentNode.removeChild(msgTip);
	}
	render(){
		return <div data-page="order-cancel" ref="page">
			<PageCtrl tid={this.props.location.query.tid }/>
			</div>
	}
}

class OrderCancelPage extends Component{
	static contextTypes ={
		store:React.PropTypes.object
	};
	componentDidMount() {
		const {store} = this.context;
		store.dispatch( createActions("getInitData") );
		$.ajax({
			url:ctrlAPI.init.url,
			data:{tid:this.props.tid },
			success( result ){
				store.dispatch(  createActions('sucInitData',{ data:result } ));
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
		this.props.dispatch( createActions("initialPage"));
	}
	render(){
		const {update,msg,tid,cancelReason,data } = this.props;
		return (
			<div>
				{ update ?
					<div>
						<OrderTop data={data} />
						<ReasonChooseCtrl />
						<SubBtnCtrl tid={tid} btnText={"取消订单"} />
					</div>:
					<LoadingRound />
				}
			</div>
		)
	}
}

const initDataMapState = function(state,props){
const newState = state.orderCancel;
	return{
		data: newState.initData,
		error:newState.error,
		update:newState.update,
		msg:newState.errorMsg,
		cancelReason:newState.cancel_reason
	}
};

const PageCtrl = connect( initDataMapState )(OrderCancelPage);

const OrderTop =({data})=>(
	<div className="cancel-top">
		<div className="list-top g-row-flex">
			<div className="left g-col-1">订单号：{data.id}</div>
			<div className="right ">{ orderStatusMap[data.status] }</div>
		</div>
		<div className="list-mid">
			<div className="li  g-row-flex">
				<div className="left">商品总额</div> <div className="right g-col-1">¥{(+data.total_fee).toFixed(2)}</div>
			</div>
			<div className="li  g-row-flex">
				<div className="left">-折扣</div> <div className="right g-col-1">- ¥{(+data.discount_fee).toFixed(2)}</div>
			</div>
			<div className="li g-row-flex">
				<div className="left">+运费</div> <div className="right g-col-1">+ ¥{(+data.post_fee).toFixed(2)}</div>
			</div>
		</div>
	</div>
);

//取消理由列表
class ReasonChoose extends Component{
	render(){
		const { cancel_reason,changeReason,otherReason } = this.props;
		const list = reasonList.map((item)=>{
			return <div key={item.name} className="list c-clrfix" onTouchTap={(e)=>{ changeReason(item.name) } }>
				<div className="choose">
					{cancel_reason==item.name?<i className="current-black-icon"> </i>:<i className="current-no-agree-icon"> </i>}
				</div>
				<div className="text">{item.text}</div>
			</div>
		});
		return (
			<div className="reason-choose">
				<div className="reason-list">
					{list}
				</div>
				{cancel_reason=="other" &&
					<div className="reason-text">
						<textarea placeholder="请填写取消订单的理由" defaultValue="" onBlur={(e)=>{ otherReason(e.target.value ) } }/>
					</div>}
			</div>
		)
	}
}
const mapStateReasonChoose =function(state,props){
	const newState = state.orderCancel;
	return{
		cancel_reason:newState.cancel_reason
	}
};
const mapDispReasonChoose = function( dispatch,props){
	return {
		changeReason( type ){
			dispatch( createActions('changeReason',{ reason:type }));
		},
		otherReason( value ){
			dispatch( createActions('otherReasonChange',{value:value }));
		}
	};
};
const ReasonChooseCtrl = connect(mapStateReasonChoose,mapDispReasonChoose)(ReasonChoose);


class SubBtn extends Component{
	render(){
		return(
			<div className="btm-btn colour-btn" onClick={this.props.clickHandle } >
				{this.props.btnText}
			</div>
		)
	}
}

let isReq = false;
const mapStateSubBtn =function( state,props ){
	const newState = state.orderCancel;
	return{
		clickHandle(){
			if( !newState.cancel_reason ){
				Popup.MsgTip({ msg :"请选择取消订单的理由"});
				return;
			}
			if( newState.cancel_reason =='other' && !newState.other_reason.trim() ){
				Popup.MsgTip({ msg :"请填写取消订单的理由"});
				return;
			}
			if( isReq ){
				return;
			}
			isReq = true;
			$.ajax({
				url:ctrlAPI.cancel.url,
				type:ctrlAPI.cancel.type,
				data:{
					tid:props.tid,
					cancel_reason:newState.cancel_reason,
					other_reason:newState.other_reason
				},
				success( result ){
					isReq = false;
					Popup.MsgTip({msg:result.msg });
					if( !result.status ){
						return;
					}
					window.setTimeout(()=>{
						browserHistory.goBack();
					},2000);
				},
				error(){
					isReq = false;
					Popup.MsgTip({msg:"网络出现问题，请稍后再试" });
				}
			});
		}
	}
};
const SubBtnCtrl = connect( mapStateSubBtn )(SubBtn);