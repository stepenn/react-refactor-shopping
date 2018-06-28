import React, { Component } from 'react';
import { Link } from 'react-router';
import ReactDOM, { render } from 'react-dom';
import { browserHistory } from 'react-router';
import { LoadingRound,ShareAndTotop,LinkChange,OpenInAppGuide } from 'component/common';
import Popup from 'component/modal';

import 'src/scss/groupDetail.scss';
import {BuyModal} from "../itemDetail/groupBuy.jsx"


export default class GroupDetail extends Component {
  constructor(props, context) {
    super(props);
    let { object_id } = props.location.query;
    this.state = {
      objectID: object_id,
      update: false,
      openMsg: false
    }
  };
  static contextTypes = {
    store: React.PropTypes.object,
    router: React.PropTypes.object
  };
  openOrClose(){
  	this.setState({
  		openMsg: !this.state.openMsg
  	})
  }
  componentWillMount() {
  	document.title = '拼团详情';
  	window.location.href = 'jsbridge://set_title?title=拼团详情';
		if (!this.state.objectID) {
      browserHistory.push("/");
    }
  };
  componentDidMount(){
  	let {objectID} = this.state,
  			self = this;
  	$.ajax({
  		type:"get",
  		url:"api/wapapi/groupDetail.api",
  		async:true,
  		data:{
  			object_id: objectID
  		},
  		success: function (data) {
  			if(data.code === 200 && data.status === true){
	  			self.setState({
	  				update: true,
	  				dataList: data.data
	  			})
  			} else {
  				Popup.MsgTip({msg: data.msg});
  			}
  		},
  		error:function (err) {
      	Popup.MsgTip({msg: "服务器繁忙"});
      }
  	});
  };
	openShare() {
		let {pay} = this.props.location.query;
		return !!pay
	}
  render() {
  	let {dataList} = this.state;
    return(
    	this.state.update?
      <div data-page="group-detail">
				<section  id="group-detail" ref="group-detail">
				  <GoodsMsg data={dataList} />
				  <GroupMsg data={dataList} fn={this.openOrClose.bind(this)}  />
				  {this.state.openMsg?<UsersDetail data={dataList} />:''}
				</section>
		  <BuyBar data={dataList} specs={dataList.specSku} promotion={dataList.promotionData} itemId={dataList.item.item_id}/>
		  <OpenInAppGuide />
		  <ShareAndTotop config={{
		  	 title: dataList.item.title,
     		   content: "我在泰然城发现了一个不错的商品，赶快来看看吧。",
       		 	link: window.location.href,
        		icon: dataList.item.primary_image
		  }} openShare={this.openShare()} />
			</div>
			:<LoadingRound />
    )
  }
}



//商品信息
class GoodsMsg extends Component {
	render(){
		let {data} = this.props;
		return(
			<div className="goods-msg">
				<div className="goods-img"><img src={data.item.primary_image} /></div>
				<div className="goods-detail">
					<p className="c-fs12 c-c35 c-lh16 goods-title" style={{'display':'block','height':'48px'}}>{data.item.title}</p>
					<p className="c-fs12 c-c35">{data.group.required_person}人团: <span className="c-fs16 c-cf55">¥{data.group.price}</span></p>
				</div>
			</div>
		)
	}
}

//参团信息
class GroupMsg extends Component {
	componentDidMount(){
		let self = this;
		let gHeight = $(self.refs.imgsBox).css('height');
		$(self.refs.groupImg).css({'height':gHeight});
	};
	render(){
		//用户
		let {data} = this.props,
				groupPeople = data.group.required_person - data.group.current_person;
		let users = data.user.map(function (item,i) {
			return <HeadPortrait second={i?false:true} isLeader={false} key={i} />
		})
		//时间
		let end = parseInt(data.group.expire_time),
				now = parseInt(data.group.now_time),
				timeOut = end - now;
		let status = data.promotionData[0].status;
		return(
			<div className="group-msg c-bgf4">
				<div className="c-c80 c-fs12 c-tc c-lh50">
					{(groupPeople>0&&timeOut>0)?
						(status?<span>还差<span className="c-cf44">{groupPeople}</span>人,盼你如南方人盼暖气</span>:<span>{data.group.current_person}人参团，拼团失败</span>):
						((groupPeople>0&&timeOut<=0)?<span>{data.group.current_person}人参团，拼团失败</span>:<span className="c-cf44">{data.group.current_person}人参团，此团已完成</span>)}
				</div>
				<div className="group-img c-mb15" ref="groupImg">
					<div className="imgs-box c-tc" ref="imgsBox" >
						<HeadPortrait isLeader={true} />
						{users}
					</div>
				</div>
				{groupPeople>0?(timeOut>0?(status?<Timer data={data.group} />:''):''):''}
				<OpenDetail fn={this.props.fn} />
				{(groupPeople>0&&timeOut>0)?(status?'':<img className='success-of-fail' src='/src/img/evaluate/group-fail.png' />):<img className="success-of-fail" src={(groupPeople>0&&timeOut<=0)?'/src/img/evaluate/group-fail.png':'/src/img/evaluate/group-success.png'} />}
			</div>
		)
	}
}

//参团人头像
class HeadPortrait extends Component {
	render(){
		let {second,isLeader} = this.props;
		return(
			<div className="head-portrait">
				<div className="portrait">
					<img src="/src/img/evaluate/group-head.png" />
				</div>
				{(isLeader||second)?
				<span className="c-bgf44 c-cfff c-fs10 c-tc c-lh16" style={{'backgroundColor':isLeader?'#ff4444':'#ffc515'}}>
					{isLeader?'团长':'沙发'}
				</span>
				:''}
			</div>
		)
	}
}

//倒计时
class Timer extends Component {
	componentWillMount(){
		let {data} = this.props;
		let timeDiff = parseInt(data.expire_time) - parseInt(data.now_time),
				hh = Math.floor(timeDiff/60/60),
				mm = Math.floor((timeDiff - hh * 60 * 60) / 60),
				ss = Math.floor((timeDiff - hh * 60 * 60 - mm * 60));
		this.setState({
			hh : hh || 0,
			mm : mm || 0,
			ss : ss || 0
		})
	}
	componentDidMount(){
		let 	self = this;
		this.timer = setInterval(()=> {
			let {hh, mm, ss} = self.state;
			if(hh===0 && mm===0 && ss===0){
				clearInterval(this.timer);
				$('.remaining-time').css({display:'none'});
				history.go(0);
				return;
			}
			self.setState({ss: ss-1});
			if(ss<1){
				self.setState({
					ss: 59,
					mm: mm-1
				});
			};
			if(mm<0){
				self.setState({
					mm: 59,
					hh: hh-1
				});
			}
		},1000);
	};
	componentWillUnmount(){
		clearInterval(this.timer );
	}
	render(){
		let {hh, mm, ss} = this.state;
		return(
			<div className="remaining-time">
				<div className="timer c-fs10 c-cfff c-tc c-bg35">距离结束仅剩 {hh>9?hh:('0'+hh)}:{mm>9?mm:('0'+mm)}:{ss>9?ss:('0'+ss)}</div>
			</div>
		)
	}
}

//查看详情
class OpenDetail extends Component {
	componentWillMount(){
		this.setState({
			isOpen: false
		})
	};
	openOrClose(){
		this.setState({
			isOpen: !this.state.isOpen
		});
		this.props.fn();
	};
	render(){
		let {isOpen} = this.state;
		return(
			<div className="open-detail">
				<div onClick={this.openOrClose.bind(this)} className={isOpen?"open-txt open-txt-bg c-fs12 c-c80":"open-txt c-fs12 c-c80"}>
					查看全部参团详情
				</div>
			</div>
		)
	}
}

//参团用户详情
class UsersDetail extends Component {
	render(){
		let {data} = this.props;
		let users = data.user.map(function (item,i) {
			return <EachDetail data={item} isLeader={false} key={i} />
		})
		return(
			<div className="users-detail" style={{paddingBottom:'50px'}}>
				<ul>
					<EachDetail data={data.user_start} isLeader={true} />
					{users}
				</ul>
			</div>
		)
	}
}

//单个参团用户详情
class EachDetail extends Component {
	getDate(tt) {     
    let d = new Date(tt),
    		yy = d.getFullYear()>9?d.getFullYear():'0'+d.getFullYear(),
    		mon = d.getMonth()+1>9?d.getMonth()+1:'0'+(d.getMonth()+1),
    		dd = d.getDate()>9?d.getDate():'0'+d.getDate(),
    		hh = d.getHours()>9?d.getHours():'0'+d.getHours(),
    		mm = d.getMinutes()>9?d.getMinutes():'0'+d.getMinutes(),
    		ss = d.getSeconds()>9?d.getSeconds():'0'+d.getSeconds();
    return yy+'-'+mon+'-'+dd+' '+hh+':'+mm+':'+ss
	};
	render(){
		let {isLeader,data} = this.props,
				startTime = isLeader?data.start_time : data.join_time;
				startTime = this.getDate(startTime*1000);
		return(
			<li className={isLeader?"c-bgf99 c-mb10":"c-bgc9 c-mb10"}>
				<span className={isLeader?"c-bgf99 horn":"c-bgc9 horn"}></span>
				<span className="circle c-bgf44"></span>
				<div className="portrait">
					<img src="/src/img/evaluate/group-head.png" />
				</div>
				{isLeader?<div className="c-cfff c-fl c-fs12 c-lh46" style={{paddingRight:'4px'}}>团长</div>:''}
				<p className="c-fl c-cfff c-fs12 c-lh46">{data.name}</p>
				<p className="c-fr c-cfff c-fs12 c-lh46">{isLeader?'开团':'参团'}</p>
				<div className="c-fr c-cfff c-fs12 c-lh46" style={{paddingRight:'2px'}}>{startTime}</div>
			</li>
		)
	}
}

let NOSELL = 0,
	OPENGROUP = 1,
	AGAINGROUP = 2,
	SPONSOR = 3,
	NOTSPONSOR = 4,
	NOGROUPBUY = 5,
	SELLLIMIT = 6,
	NOLOGIN = 7,
	SELLOUT = 8;

let GroupState = [];


GroupState[NOGROUPBUY] = {
	text: "活动已过期",
	clsFix: "color-grey",
	click: null
}
GroupState[SELLOUT] = {
	text: "已售罄",
	clsFix: "color-grey",
	click: null
}


GroupState[NOSELL] = {
	text: "暂不销售",
	click: null
}

GroupState[OPENGROUP] = {
	text: "我也开个团",
	click: "showModal",
	activeType: "groupBuy"
}
GroupState[AGAINGROUP] = {
	text: "重新开团",
	click: "showModal",
	activeType: "groupBuy"
}
GroupState[SPONSOR] = {
	text: "分享",
	click: "BUY"
}
GroupState[NOTSPONSOR] = {
	text: "确定参团",
	click: "showModal",
	activeType: "joinGroup"
}
GroupState[SELLLIMIT] = {
	text: "参与次数到上限",
	clsFix: "color-grey",
	click: null
}
GroupState[NOLOGIN] = {
	text: "登录后参团",
	click: null
}


class BuyBar extends Component {
	static contextTypes = {
		isLogin: React.PropTypes.bool
	};
	componentWillMount() {
		let groupState = GroupState[this.getGroupState()];
		this.state = {
			modal: false,
			groupState
		}
	}
	getGroupState() {
		let {data} = this.props;
		let {rules} = data.promotionData[0];
		let {item} = data
		let groupPeople = data.group.required_person - data.group.current_person;
		let old = data.group.expire_time,
			now = data.group.now_time,
			timeOut = old - now;
		let is_sponsor = data.joinUser.is_sponsor;

		if (!this.context.isLogin) {
			return NOLOGIN
		}

		if (item.status !=="Shelves") {
			return NOSELL
		}

		if (item.realStore ===0) {
			return SELLOUT
		}

		if (data.item_type !== "groupbuy") {
			return NOGROUPBUY
		}
		if (data.buyCount >= rules.user_buy_limit) {
			return SELLLIMIT
		}

		if (timeOut <=0) {
			return OPENGROUP
		}else if(!groupPeople) {
			return AGAINGROUP
		}else{
			return is_sponsor==1 ? AGAINGROUP: is_sponsor ==0 ? OPENGROUP  : NOTSPONSOR
		}
	}
	showModal=()=> {
		this.state.modal = true;
		this.setState(this.state)
	}
	closeModal=() =>{
		this.state.modal = false;
		this.setState(this.state)
	}
	bindClick(state) {
		if (!state.click) {
			return
		} else {
			this[state.click]();
		}
	}
	render () {
		let props = {
			...this.props,
			...this.state,
			toggleModal: this.closeModal
		}
		let {groupState} = this.state;
		return (
			<section className="group-purchase-btn">
				<BuyModal  {...props} active={groupState.activeType}  />
				<Link className="more-pintuan" to="/searchResult?key=拼团">
					<span className="list-icon"><img src="https://www.trc.com/themes/wapmall/images/pintuan/list-shape-icon.png" alt="" /></span>更多拼团
				</Link>
				<LinkChange className={"jump-group-btn sure-join-group " + (groupState.clsFix || " ")} onClick={() =>{this.bindClick(groupState)}}>{groupState.text}</LinkChange>
			</section>
		)
	}
}


