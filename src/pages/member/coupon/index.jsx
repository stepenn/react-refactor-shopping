import React, { Component } from 'react';
import ReactDOM,{ render } from 'react-dom';
import { Link } from 'react-router';
import { LoadingRound } from 'component/common';
import Popup from 'component/modal';

import 'src/scss/coupon.scss';

export default class CouponList extends Component{
	constructor(props) {
		super(props);
		let self = this;
		this.state = {
			countData:[],
			couponData:[],
			update:false,
			listUpdate:false,
			type:1
		}
	};
	static contextTypes = {
		store:React.PropTypes.object,
		router:React.PropTypes.object
	};
	componentDidMount(){
		let self = this;
		this.getMsg(1,1);
	};
	getMsg=(status,page)=>{
		let self = this;
		self.setState({
  		listUpdate: false
  	})
  	$.ajax({
      url: "/api/wapapi/member-coupon.api",
      type: "get",
      data: {
        is_valid: status,
        page_size: 10,
        pages: page
      },
      success: function(data) {
      	if(data.code === 200 && data.status === true){
	      	self.setState({
	      		countData: data.data.couponList.count,
	      		couponData:data.data.couponList.data,
	      		update: true,
	      		listUpdate: true,
	      		type:status
	      	});
	      	if(data.data.couponList.data.length<10){
	      		$('.txt').html('没有更多优惠券了');
	      	};
	      	$('#coupon-list').css({height:$(window).height()});
      	}
      },
      error:function (err) {
      	Popup.MsgTip({msg: "服务器繁忙"});
      }
   });
  };
 	addMsg=(status,page)=>{
		let self = this;
  	$.ajax({
      url: "/api/wapapi/member-coupon.api",
      type: "get",
      data: {
        is_valid: status,
        page_size: 10,
        pages: page
      },
      success: function(data) {
      	if(data.code === 200 && data.status === true){
	      	self.setState({
	      		couponData:self.state.couponData.concat(data.data.couponList.data),
	      		type:status
	      	});
	      	if(data.data.couponList.data.length<10){
	      		$('.txt').html('没有更多优惠券了');
	      	} else {
	      		$('.more-click').css({display:'none'});
	      	}
      	} else {
      		$('.more-click').css({display:'none'});
      		Popup.MsgTip({msg: "服务器繁忙"});
      	}
      },
      error:function (err) {
      	Popup.MsgTip({msg: "服务器繁忙"});
      }
   });
  };
  componentWillMount(){
  	document.title = '优惠券';
  	window.location.href = 'jsbridge://set_title?title=优惠券';
  };
	render(){
		let {countData,type,couponData} = this.state;
    return(
    	this.state.update?
      <div data-page="coupon-list" >
				<section  id="coupon-list" ref="coupon" >
				  <CouponNav data={countData} fn={this.getMsg} />
				  {this.state.listUpdate?<List fn={this.addMsg} data={couponData} type={type} />:<LoadingRound />}
				</section>
			</div>
			:<LoadingRound />
    )
	}
}

//nav
class CouponNav extends Component{
	componentDidMount(){
		let {fn} = this.props;
		$('.coupon-nav li').click(function (e) {
			if($(this).attr('class') === "active-one"){
				//..
			} else {
				$(this).addClass('active-one').siblings().removeClass('active-one');
				let status = parseInt($('.active-one').attr('id'));
				fn(status);
			}

		});
	};
	render(){
		let {data} = this.props;
    return(
      <ul className="coupon-nav c-c35 c-tc c-fs14">
				<li className="active-one" id="1">未使用({data.no_use})</li>
				<li id="0">已使用({data.used})</li>
				<li id="2">已过期({data.expired})</li>
			</ul>
    )
	}
}

//兑换
class Exchange extends Component{
	componentWillMount(){
		this.setState({
			canExchange: true
		})
	};
	componentDidMount(){
		$('.exchange input').on('input change',function (e) {
			if($(this).val()){
				$(this).next().css({'background-color':'#e60a30'});
			} else {
				$(this).next().css({'background-color':'#c9c9c9'});
			}
		});
		let self = this;
		$('.exchange button').click(function (e) {
			let txt = $('.exchange input').val();
			if(txt != ''){
				if(self.state.canExchange){
					self.setState({
						canExchange: false
					});
					$.ajax({
						url:'/api/wapapi/getCoupon.api',
						type:'get',
						data:{
							exchange_code: txt
						},
						success:function (data) {
							self.setState({
								canExchange: true
							})
							Popup.MsgTip({msg: data.msg});
							$('.exchange input').val('');
							$('.exchange button').css({'background-color':'#c9c9c9'});
							if(data.status === true){
								setTimeout(function () {
									history.go(0);
								},500);
							}
						},
						error:function (err) {
			      	Popup.MsgTip({msg: "服务器繁忙"});
			      	$('.exchange input').val('');
			      }
					});
				};
			}
		});
	};
	render(){
    return(
      <div className="exchange">
				<input type="text" placeholder="请输入兑换码" />
				<button>兑换</button>
			</div>
    )
	}
}

//购物券列表
class List extends Component{
	componentDidMount(){
		let type = parseInt($('.active-one').attr('id'));
		this.setState({
			type: type
		})
	};
	render(){
		let {data,type,fn} = this.props;
		let coupons = data.map(function (item,i) {
			return <EachCoupon data={item} type={type} key={i} />
		})
    return(
      <div className="list-contrl">
      	{(type==1)?<Exchange />:''}
      	<div className="each-list">
					{data.length?coupons:<NoCoupon />}
				</div>
				{data.length?<NoMoreCoupon fn={fn} />:''}
			</div>
    )
	}
}

//无购物券
class NoCoupon extends Component{
	render(){
		return(
			<div className="no-coupon">
				<img src="./src/img/evaluate/no-coupon.png" />
			</div>
		)
	}
}

//列表内单个购物券
class EachCoupon extends Component{
	getDate=(tm)=>{ 
		let tt = new Date(parseInt(tm) * 1000);
		let ttyear = tt.getFullYear(),
				ttmonth = parseInt(tt.getMonth())+1,
				ttday = tt.getDate();
		let couponTime = ttyear+"."+ttmonth+"."+ttday;
		return couponTime; 
	};
	noUse=()=>{
		Popup.MsgTip({msg: "还未到使用时间哦"});
	};
	render(){
		let {data,type} = this.props;
		let startTime = this.getDate(data.use_start_time),
				endTime = this.getDate(data.use_end_time);
		let txt = '';
		if(data.coupon_type){//平台券、自营券
			if(data.used_shop_type === "self"){//自营券
				if(data.used_category === "all"){//自营全部分类
					if(data.used_brand === "all"){//自营全场
						txt = '指定自营商品适用';
					} else {//自营部分品牌
						txt = '自营商品指定品牌适用';
					}
				} else {//自营部分分类
					if(data.used_brand === "all"){//自营部分分类
						txt = '自营商品指定分类适用';
					} else {//自营部分分类、品牌
						txt = '自营商品指定分类、品牌适用';
					}
				}
			} else {//平台券
				if(data.used_category === "all"){//平台全部分类
					if(data.used_brand === "all"){//平台全场
						txt = '指定商品适用';
					} else {//平台部分品牌
						txt = '指定品牌适用';
					}
				} else {//平台部分分类
					if(data.used_brand === "all"){//平台部分分类
						txt = '指定分类适用';
					} else {//平台部分分类、品牌
						txt = '指定分类、品牌适用';
					}
				}
			}
		} else {//店铺券
			txt = '指定商品适用';
		}
		return(
			<div className="each-coupon">
				<div className={(type === 1)?(data.isset_limit_money?"coupon-bg":"coupon-bg coupon-bg2"):"coupon-bg coupon-bg3"}>
					<div className="coupon-left c-fl">
						<h2 className={(type === 1)?(data.isset_limit_money?"c-cdred":"c-cdyellow"):"c-c999"}>
							¥ <span style={{fontSize:'38px',lineHeight:'46px'}}>
								{parseInt(data.deduct_money)}
							</span>
						</h2>
						<p className="c-c999">
							满{data.limit_money?parseFloat(data.limit_money):''}使用
						</p>
					</div>
					<div className={data.isset_limit_money?"coupon-right c-fl":"coupon-right c-fl coupon-right2"}>
						<p className="c-c999">
							<span className="c-fs16 c-c35">
								{data.coupon_type?(data.used_shop_type=="self"?'自营券':'平台券'):'店铺券'}
							</span>
							{data.used_platform==="all"?'':(' (限'+data.used_platform+'端使用)')}
						</p>
						<li className="c-c999 c-pr">
							{txt}
							<span className="c-pa disc-dot"></span>
						</li>
						<p className="c-fs10 c-c999 c-fs10" style={{lineHeight:'14px',display:'block',width:'74%',paddingTop:'12px'}}>{startTime}至{endTime}</p>
						{(type === 1)?
							(data.time_status?
								<button onClick={this.noUse} className={(type === 1)?(data.isset_limit_money?"use-coupon":"use-coupon use-coupon2"):"use-coupon use-coupon3"}>立即使用</button>
								:<Link to={'/searchResult?coupon_id='+data.coupon_id}>
									<button className={(type === 1)?(data.isset_limit_money?"use-coupon":"use-coupon use-coupon2"):"use-coupon use-coupon3"}>立即使用</button>
								</Link>)
						:''}
					</div>
				</div>
			</div>
		)
	}
}

//没有更多
class NoMoreCoupon extends Component{
	componentDidMount(){
		let {fn,cLength} = this.props;
		let page = 1,
				status = parseInt($('.active-one').attr('id'));
		$('.txt').click(function (e) {
			if($(this).html()==='点击加载更多优惠券'){
				$('.more-click').css({display:'block'});
				page++;
				fn(status,page);
			}
		})
	};
	render(){
		let {cLength} = this.props;
    return(
      <div className="no-more">
      	<div className="line c-pr"></div>
      	<div className="more-click c-pa" style={{width:'100%',height:'100%',top:'0',left:'0',zIndex:'2',display:'none'}}></div>
      	<div className="txt c-c999 c-tc c-fs14">{cLength<10?'没有更多优惠券了':'点击加载更多优惠券'}</div>
			</div>
    )
	}
}

