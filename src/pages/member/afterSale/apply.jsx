import React, { Component } from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import {browserHistory} from 'react-router';
import Popup from 'component/modal';
import { LoadingRound,NoMore } from 'component/common';
import { ownAjax } from 'js/common/ajax.js';
import  concatPageAndType from 'js/actions/actions.js';
import {popupData} from 'js/filters/orderStatus.js';
import {Shady} from 'component/common';

const ctrlAPI ={
	submit:{url:"/api/wap/aftersalesCommit.api",type:"post"}
};
const createActions = concatPageAndType("afterSaleApply");

const typeText={
	"REFUND_GOODS":"退货退款",
	"ONLY_REFUND":"仅退款"
};
const reasonText ={
	"REFUND_GOODS":{"1":"商品与描述不符", "2":"商品错发漏发", "3":"收到商品破损", "4":"商品质量问题", "5":"个人原因退货", "6":"其他"},
	"ONLY_REFUND":{"1":"商品与描述不符", "2":"商品错发漏发", "3":"收到商品破损", "4":"商品质量问题", "5":"个人原因退货", "6":"未收到货", "7":"商品问题已拒签", "8":"退运费", "9":"其他"}
};

class AfterSaleApply extends Component{
	componentWillMount() {
		document.title="售后申请单";
		window.location = "jsbridge://set_title?title=售后申请单";
	}
	render(){
		const {tid,oid,refund,payment} = this.props.location.query;
		return <div><Page tid={tid} oid={oid} refund={refund} payment={payment} /></div>
	}
}

class ApplyPage extends Component{
	componentWillMount(){
		this.props.initialType();
	}
	componentWillUnmount(){
		this.props.initialPage();
	}
	render(){
		const {update,data,tid,oid,refund,payment } = this.props;
		if( !(update && data) ){
			return <LoadingRound />
		}
		return (
			<div data-page="after-sale-apply">
				<form id="applyForm">
					<input type="hidden" name="tid" value={tid} />
					<input type="hidden" name="oid" value={oid} />
					<ReasonConnect refund={ refund } />
					<ApplyMoney changeHandle={this.props.moneyChange } payment={payment} />
					<ApplyDetail changeHandle={this.props.descriChange }/>
					<ApplyVoucher />
					<SubmitBtn submitHandle={ this.props.submitApply } />
					<ApplyPopupConnect />
				</form>
			</div>
		)
	}
}
const pageState =function( state, props ){
	const newState = state.afterSaleApply;
	return{
		data:newState.initData,
		update:newState.update,
		error:newState.error,
		errorMsg:newState.errorMsg,
		submitApply:function(){
			if( !(/^(\d)*\.?\d*$/).test( newState.money ) || !newState.money ){
				Popup.MsgTip({msg:"请输入正确的退款金额" });
				return;
			}
			$.ajax({
				url:ctrlAPI.submit.url,
				type:ctrlAPI.submit.type,
				data:$("#applyForm").serialize(),
				success:function( result ){
					Popup.MsgTip({msg:result.message });
					if (result.error) {
						return;
					}
					window.setTimeout(()=>{
						browserHistory.replace('/afterSale/list');
					},1000);
				},
				error:function(){
					Popup.MsgTip({msg:"网络错误，请稍候再试" });
				}
			})
		}
	}
};
const pageDisp =function( dispatch, props ){
	return {
		moneyChange:function(e){
			dispatch( createActions("changeMoney",{value:e.target.value.trim() } ));
		},
		descriChange:function(e){
			dispatch( createActions("changeDes",{ value: e.target.value.trim() }))
		},
		initialPage:()=>{
			dispatch( createActions("initialPage") );
		},
		initialType:()=>{
		if( Number(props.refund) ){
			dispatch( createActions("onlyRefund") );
		}
	}
	}
};
const Page = connect(pageState,pageDisp)(ApplyPage);

class ApplyReason extends Component{
	render(){
		return(
			<section className="apply-section">
				<div className="strip-list">
					<div className="left"><i>*</i>售后类型</div>
					<div className="right" onTouchTap={ (e)=> !Number(this.props.refund) && this.props.showPopup("type") }>
						{typeText[this.props.type]} {!Number(this.props.refund) && <i className="arrow-btm-icon"> </i> }
						<input type="hidden" name="aftersales_type" value={this.props.type} />
					</div>
				</div>
				<div className="strip-list">
					<div className="left"><i>*</i>退款原因</div>
					<div className="right" onTouchTap={ (e)=>this.props.showPopup("reason") } >
						{ reasonText[this.props.type][this.props.reason] }<i className="arrow-btm-icon"> </i>
						<input type="hidden" name="reason" value={ reasonText[this.props.type][this.props.reason] }/>
					</div>
				</div>
			</section>
		)
	}
}

const ReasonState =function(state,props){
	const newState =  state.afterSaleApply;
	return{
		type:newState.listType,
		reason:newState.reason
	}
};
const ReasonDisp=function( dispatch,props){
	return {
		showPopup:function( type ){
			dispatch(createActions("showPopup",{popupType: type } ));
		}
	}
};
const ReasonConnect = connect(ReasonState,ReasonDisp)(ApplyReason);

class ApplyMoney extends Component{
	render(){
		return(
			<section className="apply-section">
				<div className="strip-list">
					<div className="left"><i>*</i>退款金额</div>
					<div className="right"><span>¥</span> <input type="number" step="0.01" onBlur={this.props.changeHandle } name="refund_amount" placeholder={`最多可退${this.props.payment}元`}/>
					</div>
				</div>
			</section>
		)
	}
}

class ApplyDetail extends Component{
	render(){
		return(
			<div className="apply-section">
				<section className="apply-detail">
					<h3>详细说明</h3>
					<div className="area">
						<textarea name="description" placeholder="最多200字" maxLength="200" onBlur={ this.props.changeHandle }/>
					</div>
				</section>
			</div>
		)
	}
}

class ApplyVoucher extends Component{
	render(){
		return(
			<section className="apply-section">
				<div className="apply-detail">
					<h3>申请凭证</h3>
					<MultiImgChoose maxLength={3} inputName={"evidence_pic[]"} />
				</div>
			</section>
		)
	}
}

//凭证选择
class MultiImgChoose extends Component{
  constructor(props) {
    super(props);
    this.state = {
	    imgArr: []
    };
	  this.maxLength=props.maxLength || 3;
	  this.selectIndex = 0;
	  this.inputName = this.props.inputName;
  }
	componentDidMount() {
		window.onImageSelected = ( jsonData )=> {
			const objData = JSON.parse( jsonData );
			if( objData.success ){
				this.changePhoto( objData.data.image.url );
			}
			if( objData.error ){
				Popup.MsgTip({msg:"选择图片失败"});
			}
		}
	}
	choosePhoto=( index )=>{
		this.selectIndex =index;
		let url ='https://www.trc.com/utils/util/upload_images.html?from=user&type=aftersales';
		let bridgeUrl = 'jsbridge://choosePic?maxSize=2000&size=0&crop=false&postUrl='+ window.btoa( url );
		window.location = bridgeUrl;
	};
	changePhoto=( url )=>{
		let {imgArr} = this.state;
		if( this.selectIndex >= imgArr.length ){
			imgArr.push(url);
			this.setState({
				imgArr:imgArr
			});
		}else{
			imgArr[this.selectIndex] = url;
			this.setState({
				imgArr:imgArr
			})
		}
	};
	deletePhoto=( index )=>{
		const { imgArr } = this.state;
		imgArr.splice(index,1);
		this.setState({
			imgArr:imgArr
		});
	};
	componentWillUnmount() {
		window.onImageSelected = null;
	}
	render(){
		return(
			<div className="multi-img-choose c-clrfix">
				{ this.state.imgArr.map((item,i)=>{
					return <div className="photo" key={i}  >
						<img src={item} onClick={ e=>this.choosePhoto(i)  } />
						<input type="hidden" name={this.inputName} value={item}/>
						<i className="red-delete-icon" onClick={ e=> this.deletePhoto(i)} > </i>
					</div>
					})
				}
				{ this.state.imgArr.length < this.maxLength &&
					<div className="photo" onClick={ e=>this.choosePhoto( this.state.imgArr.length ) } >
						<img src="/src/img/afterSale/voucher-img.png" />
					</div>
				}
			</div>
		)
	}
}

class SubmitBtn extends Component{
	render(){
		return(
			<div className="btm-btn colour-btn" onClick={ this.props.submitHandle }>提交申请</div>
		)
	}
}

//弹窗选择
class ApplyPopups extends Component{
	typeChangeHandle=( select )=>{
		if( select==this.props.listType ){
			this.props.typeChange( select,this.props.reason );
		}else{
			this.props.typeChange( select, 1 );
		}
	};
	render(){
		const {listData,popup,listType,reason,show} = this.props;
		let listHtml = "";
		if(popup =="type"){
			listHtml = listData.list.map((item,i)=>{
				return (
					<div className="list" key={`type-${i}`} onClick={ this.typeChangeHandle.bind(this,item.select ) }>
						<div className="top">{item.method}</div>
						<div className="mid">{item.content}</div>
						{ item.select==listType && <i className="current-black-icon"> </i> }
					</div>
				)
			})
		}
		if(popup=="reason"){
			listHtml= listData.list[listType].map((item,i)=>{
				return(
					<div className="list" key={`reason-${i}`} onClick={ (e)=> this.props.reasonChange(item.select ) }>
						<div className="one">{item.content}</div>
						{ item.select==reason && <i className="current-black-icon"> </i> }
					</div>
				)
			});
		}
		return(
			<div>
				{show && <Shady clickHandle={ this.props.hidePopup } /> }
				<div className={`total-popup ${show?"active":""}`}>
				<div className="popup-top">{show&&listData.title}<i className="black-close-icon" onClick={ this.props.hidePopup }> </i></div>
					<div className="popup-body">
						{listHtml}
					</div>
				</div>
			</div>
		)
	}
}

const popupState =function(state,props){
	const newState = state.afterSaleApply;
	return{
		popup:newState.popup,
		listData:popupData[newState.popup],
		listType:newState.listType,
		reason:newState.reason,
		show:newState.show
	}
};
const popupDisp = function( dispatch ){
	return {
		hidePopup:function(){
			dispatch(createActions("hidePopup"));
		},
		typeChange:function( type,reason ){
			dispatch( createActions("applyTypeChange",{listType:type,reason:reason }))
		},
		reasonChange:function( reason ){
			dispatch( createActions("applyReasonChange",{ reason:reason }) );
		}
	}
};

const ApplyPopupConnect =connect(popupState,popupDisp)(ApplyPopups);

export default AfterSaleApply;