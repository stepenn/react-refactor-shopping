import React, { Component } from 'react';
import { Link } from 'react-router';
import Popup from 'component/modal';
import {ownAjax} from 'js/common/ajax.js';
import { asProcess,asStatus} from 'js/filters/orderStatus.js';
import { timeUtils } from 'js/common/utils.js';
import { LoadingRound,NoMore,NoMorePage } from 'component/common';
//import { DropDownLoad } from 'component/highComp';

const ctrlAPI ={
	init:{ url:"/api/wap/member-aftersales-list.html" ,type:"get"}
};

export default class AfterSaleList extends Component{
  constructor(props) {
    super(props);
	  document.title="退款/售后";
	  window.location.href = "jsbridge://set_title?title=退款/售后";
    this.state = { data:"",update:false };
	  this.page =1;
  }
	onData=( type )=>{
		if( type==="init")this.page =1;
		else this.page++;
		ownAjax( ctrlAPI.init,{page:this.page}).then((result)=>{
			if( !result.status ){
				Popup.MsgTip({msg:result.msg });
				return;
			}
			this.setState({ data:result.data,update:true });
			}).catch(()=>{
			Popup.MsgTip({msg:"网络错误，请稍后再试"});
		});
	};
	componentDidMount() {
		this.onData("init");
	}
	componentWillUnmount(){
		const msgTip =document.querySelector("#msgTip");
		msgTip && msgTip.parentNode && msgTip.parentNode.removeChild(msgTip);
	}
	render(){
		const {update,data } = this.state;
		return (
			<div data-page="after-sale-list">
				{update && data ?
					(data.list && data.list.length)?
						<div className="order-list">
							<OrderList data={data.list} />
							<NoMore />
						</div>:
						<NoMorePage text={"您还没有售后记录哦"} />:
					<LoadingRound />
				}
			</div>
		)
	}
}

const OrderList =({data})=>{
	const html = data && data.map((item,i)=>{
		return <OneOrderGrid data={item} key={i} />
	});
	return <div> {html}</div>
};

const OneOrderGrid =({data})=>{
	return(
		<div className="one-order-grid">
			<StripTop data={data} />
			<OneOrder data={data} />
			{asProcess[data.progress]=="待回寄" && 	<OrderCtrl asid={data.aftersales_bn } />}
		</div>
	)
};

//一个订单头部
const StripTop =({data})=>(
	<div className="strip-top c-clrfix">
		<div className="left c-fl" >售后单号:{data.aftersales_bn}</div>
		{/*<div className="right c-fr">{ timeUtils.detailFormat(data.created_time) }</div>*/}
	</div>
);

//一件商品订单
const OneOrder =({data})=>{
	return(
		<div className="one-order">
			<OneOrderInfo data={data} />
		</div>
	)
};

//一件商品订单信息
const OneOrderInfo =({data})=>{
	return(
		<div className="order-info">
			<div className="list-body">
				<div className="list-img">
					<Link to={`/afterSale/detail?id=${data.aftersales_bn}`} >
						<img src={data.sku.pic_path} />
					</Link>
				</div>
				<div className="list-body-ctt">
					<div className="order-info-detail">
						<div className="order-info-top">
							<Link to={`/afterSale/detail?oid=${data.oid}`} className="order-info-title">{data.sku.title}</Link>
							<div className="order-info-type">{data.sku.spec_nature_info}</div>
						</div>
						<div className="order-status-wrap">
							<div className="order-status">{asProcess[data.progress]}</div>
						</div>
					</div>
					<div className="order-total">
						<span className="order-number">共{data.num}件商品</span>  退款金额：<span className="order-total-pay">{(+data.refund_amount).toFixed(2)}</span>
					</div>
				</div>
			</div>
		</div>
	)
};

const OrderCtrl =({asid})=>(
	<div className="order-ctrl">
		<Link to={`/afterSale/logistics?asid=${asid}`} className="btn">填写物流</Link>
	</div>
);