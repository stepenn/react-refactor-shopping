import React, { Component } from 'react';
import { Link,browserHistory } from 'react-router';
import { ownAjax } from 'js/common/ajax.js';
import Popup,{ ModalAComp } from 'component/modal';
import { LoadingRound } from 'component/common';

const ctrlAPI = {
	cashier:{ url:"/api/api/payment/getPayOptions", type:"post" },
	payQuery:{ url:"/api/api/payment/query", type:"get" },
	typeQuery:{ url:"/api/trade-query-object.html", type:"get"}
};

export default class Cashier extends  Component{
	componentWillMount() {
		document.title ="订单支付";
		window.location.href = "jsbridge://set_title?title=订单支付";
		const host =window.location.protocol+"//"+window.location.host;
		const { oid,zeroBuy } =this.props.location.query;
		window.onTRCPayResult = ( state )=> {
			if (state === 'true') {
				ownAjax( ctrlAPI.payQuery,{payment_id:this.payment_id}).then( result =>{
					if( result.data.payment.status !== "Completed" ){
						window.location.href = 'jsbridge://open_link_at_stack_root?url=' + window.btoa(host + `/payResult?status=${result.data.payment.status}`);
					}
					ownAjax( ctrlAPI.typeQuery,{order_id: oid } ).then( res =>{
						if( res.data.type == 3 ){
							window.location.href = 'jsbridge://open_link_at_stack_root?url=' + window.btoa(host + `/groupDetail?pay=1&object_id=${res.data.data.object_id}`);
						}else{
							window.location.href = 'jsbridge://open_link_at_stack_root?url=' + window.btoa(host + `/payResult?status=${result.data.payment.status}`);
						}
					}).catch( xhr =>{
						window.location.href = 'jsbridge://open_link_at_stack_root?url=' + window.btoa(host + `/payResult?status=${result.data.payment.status}`);
					});
				}).catch( e =>{
					window.location.href = 'jsbridge://open_link_at_stack_root?url=' + window.btoa(host + "/tradeList/0");
				});
			} else {
				window.location.href = 'jsbridge://open_link_at_stack_root?url=' + window.btoa(host + "/tradeList/0");
			}
		};
		ownAjax( ctrlAPI.cashier,{order_id: oid }).then( result=>{
			if( !result.status ){
				Popup.MsgTip({msg:result.msg});
				setTimeout(()=>{
					window.location.href = 'jsbridge://open_link_at_stack_root?url=' + window.btoa(host + "/tradeList/0")
				},1000 );
				return;
			}
			if( zeroBuy ){
				if( result.msg.params.trcRemoteId ){
					window.location.replace(`taihe://to_reTenderZero?trcorderId=${result.msg.params.trcRemoteId}`);
				}else{
					window.location.replace(`taihe://to_tenderZero?trcorderId=${result.msg.params.trcOrderId}`);
				}
				return;
			}
			this.payment_id = result.msg.payment_id;
			window.location.href=`jsbridge://pay_by_trcpay?payid=${result.msg.payId}&appid=${result.msg.appId}&from=${result.msg.from}`;
		}).catch( xhr=>{
			Popup.MsgTip({msg:"跳转收银台失败"});
			setTimeout(()=>{
				window.location.href = 'jsbridge://open_link_at_stack_root?url=' + window.btoa(host + "/tradeList/0")
			},1000 );
		});
	}
	componentWillUnmount(){
		window.onAlipayPayResult = null;
		const msgTip =document.querySelector("#msgTip");
		msgTip && msgTip.parentNode && msgTip.parentNode.removeChild(msgTip);
	}
	render(){
		return <LoadingRound />
	}
}