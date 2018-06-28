import React, { Component } from 'react';
import Popup from 'component/modal';
import { LoadingRound,Shady } from 'component/common';
import { ownAjax } from 'js/common/ajax.js';
import { timeUtils } from 'js/common/utils.js';
import { asProcess,asStatus,asTypes } from 'js/filters/orderStatus.js';

const ctrlAPI ={
	init:{ url:"/api/wap/member-aftersales-detail.html" ,type:"get"}
};

export default class AfterSaleDetail extends Component{
	constructor(props){
		super(props);
		this.state ={
			update:false,
			error:false,
			data:""
		}
	}
	componentDidMount() {
		const {oid,id} =this.props.location.query;
		document.title ="售后申请单详情";
		window.location.href = "jsbridge://set_title?title=售后申请单详情";
		ownAjax(ctrlAPI.init,{oid:oid,id:id })
			.then((result)=>{
				if( !result.status ){
					Popup.MsgTip({ msg:result.msg });
				}
				this.setState({ data:result.data ,update:true });
			})
			.catch((e)=>{
				Popup.MsgTip({msg:"网络错误，请稍后再试"});
				console.error(e.message);
			});
	}
	componentWillUnmount(){
		const msgTip =document.querySelector("#msgTip");
		msgTip && msgTip.parentNode && msgTip.parentNode.removeChild(msgTip);
	}
	render(){
		const {update,data} = this.state;
		if( !(update && data) ){
			return <LoadingRound />
		}
		return (
			<div data-page="after-sale-detail">
				<InfoList data={data.info} />
				<InfoDetail data={data.info} />
				{	data.info.progress>0 &&<InfoBlock data={data.info} /> }
			</div>
		)
	}
}

const InfoList =({data}) =>(
	<div className="info-list">
		<div className="list">
			<div className="left">申请单号</div>
			<div className="right">{data.aftersales_bn}</div>
		</div>
		<div className="list">
			<div className="left">申请时间</div>
			<div className="right">{timeUtils.detailFormat(data.created_time) }</div>
		</div>
		<div className="list">
			<div className="left">售后状态</div>
			<div className="right">{asProcess[data.progress] }</div>
		</div>
		<div className="list">
			<div className="left">退款金额</div>
			<div className="right">¥{(+data.refund_amount).toFixed(2) }</div>
		</div>
		<div className="list">
			<div className="left">售后类型</div>
			<div className="right">{asTypes[data.aftersales_type]}</div>
		</div>
		<div className="list">
			<div className="left">退货原因</div>
			<div className="right">{data.reason}</div>
		</div>
	</div>
);

class InfoDetail extends Component{
	constructor(props){
		super(props);
		this.state ={
			imgSrc:"",
			bigShow:false
		}
	}
	showBigPicture =(e)=>{
		this.setState({
			imgSrc:e.target.src,
			bigShow:true
		});
	};
	hideBigPicture = ()=>{
	 this.setState({
		 imgSrc:"",
		 bigShow:false
	 })
	};
	render(){
		const {data} = this.props;
		return(
			<div className="info-detail">
				<div className="detail-explain">
					<h3>详细说明</h3>
					<div className="text">
						{data.description?data.description:"无详细描述"}
					</div>
				</div>
				{data.evidence_pic?
					<div className="detail-explain">
						<h3>申请凭证</h3>
						<div className="img">
							{ data.evidence_pic.map((item,i)=>{
									return <img src={item} key={i} width="75" height="75" onClick={ this.showBigPicture }/>
								})
							}
						</div>
				</div>:""
				}
				{ data.evidence_pic && this.state.bigShow?
					<div>
					 <Shady clickHandle={this.hideBigPicture}/>
						<div onClick={ this.hideBigPicture } className="big-picture" >
								<img src={this.state.imgSrc} />
							</div>
					</div>:""
				}
			</div>
		)
	}
}

const InfoBlock =({data})=>(
	<div className="info-block">
		<div className="info-list">
			<h3><i className="block-current-icon"> </i>商家处理说明</h3>
			<div className="text">{ data.shop_explanation }</div>
		</div>
		{ asTypes[data.aftersales_type]!=="仅退款" && data.sendback_data &&
			<div className="info-list">
				<h3><i className="location-address-icon"> </i>退货地址</h3>
				<div className="text">
					<p>地址：{ data.sendback_data.receiver.address }</p>
					<p>收件人：{ data.sendback_data.receiver.name }</p>
					<p>电话：{ data.sendback_data.receiver.mobile }</p>
				</div>
			</div>
		}
		{data.progress >= 2 && data.sendback_data &&
			<div className="info-list">
				<h3><i className="black-car-icon"> </i>退货物流信息</h3>
				<div className="text">
					<p>物流公司：{ data.sendback_data.logi_name }</p>
					<p>货运单号：{ data.sendback_data.logi_no }</p>
				</div>
			</div>
		}
	</div>
);