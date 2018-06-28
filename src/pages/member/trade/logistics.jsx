import React, { Component } from 'react';
import ReactDOM,{ render } from 'react-dom';
import { Link } from 'react-router';
import Popup from 'component/modal';
import { LoadingRound } from 'component/common';

import 'src/scss/logistics.scss';

let mySwiper={}
export default class LogisticsPage extends Component{
	constructor(props, context) {
    super(props);
    let { tid } = props.location.query;
    this.state = {
    	tid: tid,
      update: false,
      logisticsData: []
    }
 };
  static contextTypes = {
    store: React.PropTypes.object,
    router: React.PropTypes.object
  };
  componentWillMount(){
  	document.title = '查看物流';
  	window.location.href = 'jsbridge://set_title?title=查看物流';
  	$(this.refs.logistics).css({ minHeight: $(window).height() });
  	if (!this.state.tid) {
      browserHistory.push("/");
    }
  	let self=this;
  	$.ajax({
      url: "/api/wapapi/tracking.api",
      type: "get",
      data: {
        tid: this.state.tid
      },
      success: function(data) {
      	if(data.code === 200 && data.status === true && data.data){
      		let arr = data.data.packageArr,newArr=[];
      		for(let i=0,len=arr.length;i<len;i++){
      			newArr = newArr.concat(arr[i]);
      		};
	      	self.setState({
	          logisticsData: newArr,
	          update: true
	       });
	       //swiper---start
	       let dLength = newArr.length;
	       if(dLength>1){
	       	let navSwiper = new Swiper('.packages-nav',{
	       		observer:true,
	       		observeParents:true,
	       		slidesPerView:dLength===2?2:3,
	       		spaceBetween:15,
	       		freeMode:true
	       	});
	       	mySwiper = new Swiper('.packages-control',{
		    	roundLengths : true,
		    	observer:true,
		    	onSlideChangeStart:function (swiper) {
		    		navSwiper.slideTo(swiper.activeIndex-1,300,false);
		    		$('.packages-nav li').eq(swiper.activeIndex).addClass('active').siblings().removeClass('active');
		    	}
			});
			$('.packages-nav li').click(function (e) {
				$(this).addClass('active').siblings().removeClass('active');
				let cindex = $(this).index();
				navSwiper.slideTo(cindex-1,300,false);
				mySwiper.slideTo(cindex,300,false);
			});	
	       }
	       //swiper---end
       } else {
       	Popup.MsgTip({msg: "订单号错误"});
       }
      },
      error:function (err) {
      	Popup.MsgTip({msg: "服务器繁忙"});
      }
    });
    };
	render(){
		let {logisticsData} = this.state;
	    return(
	    	this.state.update?
	        <div data-page="logistics-page">
				<section  id="logistics-page" ref="logistics" data-plugin="swiper">
				  {logisticsData.length>1?<PackagesNav data={logisticsData} />:''}
				  <PackagesControl data={logisticsData}/>
				</section>
			</div>
			:<LoadingRound />
    )
	}
}

//包裹nav
class PackagesNav extends Component{
	render(){
		let {data} = this.props;
		let nav = data.map(function (item,i) {
			return <li key={i} className={(i?'':'active')+' swiper-slide'}>{'包裹'+(i+1)}</li>
		})
		return(
			<div className="packages-nav c-fs14 c-tc swiper-container" style={{padding:'0 7px'}}>
				<ul className="swiper-wrapper">
					{nav}
				</ul>
			</div>
		)
	}
}

//包裹控制
class PackagesControl extends Component{
	componentDidMount(){
		$(this.refs.packagesControl).css({minHeight:$(window).height()-40});
	}
	render(){
		let {data} = this.props;
		let packages = '';
		if(data[0].package_id){
			packages = data.map(function (item,i) {
				let className = 'package'+i;
				return <EachPackage className={className} data={item} key={i} />
			})
		} else {
			packages = <EachPackage className={'package0'} data={data[0]} />
		}
		
		return(
			<div className="swiper-container packages-control" ref="packagesControl" style={{width:'100%'}}>
				<div className="swiper-wrapper">
					{packages}
				</div>
			</div>
		)
	}
}

//单个包裹控制
class EachPackage extends Component{
	componentWillMount(){
		let { data } = this.props;
		this.setState({
			package_id: data.package_id,
			logData:[],
			update: false,
			delivery_id: data.delivery_inner.delivery_id
		})
	};
	componentDidMount(){
		let self = this;
		$.ajax({
	      url: "/api/wapapi/tradeTracking.api",
	      type: "get",
	      data: {
	        package_id: this.state.package_id,
	        delivery_id: this.state.delivery_id
	      },
	      success: function(data) {
	      	self.setState({
    			logData: data,
    			update: true
    		});
	      },
	      error:function (err) {
	      	self.setState({
    			update: true
    		});
	      }
	    });
	};
	render(){
		let {data,className}=this.props;
		let {logData} = this.state;
		let pData = [];
		if(data.package_id){
			pData = data.goods;
		} else {
			let arr = [];
			arr.push(data.goods.items[0]);
			pData = arr;
		}
    return(
      <div className="swiper-slide">
      	<PackageGoods className={className} data={pData} />
  		<div style={{height:'10px',background:'#f4f4f4'}}></div>
		{this.state.update?
		(logData.length?<Logistics data={logData} className={className} />:<NoMsg />)
		:<LoadingRound />}
	  </div>
    )
	}
}

//单个包裹商品信息
class PackageGoods extends Component{
	componentDidMount(){
		let {className} = this.props,
			swiperClass = '.'+className,
			slideLength = $(swiperClass).find('.swiper-slide').length;
	    if(slideLength > 4){
	    	let imgsSwiper = new Swiper(swiperClass, {
		      freeMode: true,
		      slidesPerView: 'auto',
		      observer:true,
		    });
	    }
	};
	render(){
		let {data} = this.props;
   		let goods = data.map(function (item,i) {
			return <div className="goods-img c-fl c-mb15 swiper-slide" key={i}><Link to={'/item?item_id='+item.item_id}><img src={item.pic_path} /></Link><span>x{item.send_num}</span></div>
		});
		return(
			<div className="package-goods">
				<div className={"c-clrfix package-imgs swiper-container "+this.props.className} style={{'width':'100%'}}>
					<div className="swiper-wrapper">
						{goods}
					</div>
				</div>
			</div>
		)
	}
}

//物流部分
class Logistics extends Component{
	componentDidMount(){
		let {data,className} = this.props;
		let cSwiper = '.'+className+'i';
		let navClass = '.'+className+'j'+' li';
		let logSwiper = {};
		if(data.length==2){
			logSwiper = new Swiper(cSwiper, {
		      	roundLengths : true,
		    	observer:true,
		    	autoHeight: true,
		    	onSlideChangeEnd: function(swiper){
				  $(navClass).eq(swiper.activeIndex).addClass('choose').siblings().removeClass('choose');
				},
		    });
		    $(navClass).click(function (e) {
		    	$(this).addClass('choose').siblings().removeClass('choose');
		    	let cindex = $(this).index();
		    	logSwiper.slideTo(cindex,300,false);
		    });
		   setTimeout(function () {
				logSwiper.update();
			},1000) 
		}
	};
	render(){
		let {data,className} = this.props;
		let cSwiper = className+'i';
		let dataN = {},dataC = {};
		if(data.length==2){
			dataN = (data[0].is_national==1?data[0]:data[1]);
			dataC = (data[0].is_national==0?data[0]:data[1]);
		}
		return(
			<div style={{'width':'100%'}}>
				{data.length==2?<LogisticsNav className={className} />:''}
				{data.length==2?
				<div  style={{'width':'100%'}} className={"swiper-container "+cSwiper}>
					<div className="swiper-wrapper" >
						<AllMsg data={dataN} />
						<AllMsg data={dataC} />
					</div>
				</div>
				:<AllMsg data={data[0]} />}
			</div>
		)
	}
}

//包裹无物流信息
class NoMsg extends Component{
	render(){
		return(
			<div className="no-msg"></div>
		)
	}
}

//国际物流--国内物流
class LogisticsNav extends Component{
	render(){
		let {className} = this.props;
		let navClass = className+'j';
		return(
			<ul className={"logistics-nav c-tc c-fs14 c-c999 "+navClass}>
				<li className="choose">国际物流</li>
				<li>国内物流</li>
			</ul>
		)
	}
}

//国际/国内信息
class AllMsg extends Component{
	render(){
		let {data} = this.props;
		return(
			<div className="swiper-slide" style={{width:'100%'}}>
				{data.logi_name?<PackageMsg data={data} />:''}
				{data.tracker?(data.tracker.length?<LogisticsMsg data={data.tracker} />:<NoMsg />):<NoMsg />}
			</div>
		)
	}
}

//快递信息
class PackageMsg extends Component{
	render(){
		let {data} = this.props;
		return(
			<div className="package-msg c-fs14 c-c35 c-lh18">
				<div style={{'width':'100%','borderBottom':'1px solid #e4e4e4','paddingBottom':'12px'}}>
					<p>承运来源：{data.logi_name}</p>
					<p>运单编号：<input id={data.logi_no} type="text" value={data.logi_no} style={{border:'none',background:'none'}} readOnly /></p>
				</div>
			</div>
		)
	}
}

//物流跟踪信息
class LogisticsMsg extends Component{
	render(){
		let {data} = this.props;
		let msgs = data.map(function (item,i) {
			return <EachMsg key={i} data={item} />
		})
		return(
			<div className="logistics-msg">
				<ul>
					{msgs}
				</ul>
			</div>
		)
	}
}

//单条跟踪信息
class EachMsg extends Component{
	render(){
		let {data} = this.props;
		return (
			<li>
				<p className="c-fs14">{data.AcceptStation}</p>
				<p className="c-fs12">{data.AcceptTime}</p>
				<span></span>
			</li>
		)
	}
}