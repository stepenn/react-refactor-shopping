import React, { Component } from 'react';
import { Link } from 'react-router';
import GetNextPage from '../src/plugin/get-next-page.js'
import {base64encode, utf16to8} from "../src/js/util/index"
import "src/scss/component.scss";


//没有更多
export let NoMore =()=>{
	const style ={
		height:"30px",
		lineHeight:"30px"
	};
	return <div className="no-more c-fs14 c-cc9 c-tc" style={style}>
		没有更多了
	</div>
};

//加载中 圆圈
export let LoadingRound =()=>(
	<div className="loading-round c-tc" style={{padding:"80px 0",width:"100%"}}>
		<img src="/src/img/icon/loading/load-animate.gif" width="77" height="80" />
		<div className="c-fs10 c-c999" >加载中...</div>
	</div>
);

//局部 加载中
export let LoadingImg = () =>(
	<div className="c-tc" style={{padding:"10px 0",width:"100%"}} >
		<img src="/src/img/icon/loading/load-animate.gif" width="38" height="40" />
	</div>
);

//没有更多订单
export let NoMoreOrder =()=>{
	return(
		<div className="no-more-order c-tc" style={{paddingTop:"2.8rem",width:"100%"}}>
			<img src="/src/img/icon/order-menu-icon.png"  width="100" height="80"/>
			<div className="c-fs14 c-cc9" style={{padding:"0.35rem 0"}}>您还没有相关订单</div>
		</div>
	)
};

//没有更多页面
export let NoMorePage =({text})=>{
	return(
		<div className="no-more-order c-tc" style={{paddingTop:"2.8rem",width:"100%"}}>
			<img src="/src/img/icon/order-menu-icon.png"  width="100" height="80"/>
			<div className="c-fs14 c-cc9" style={{padding:"0.35rem 0"}}>{text}</div>
		</div>
	)
};

//半透明遮罩层
export const Shady =({ options,clickHandle })=>{
	let zIndex = (options &&options.zIndex) || 100;
	const styles={zIndex:zIndex, opacity:0.5, background:"#000", top:0, left:0, position:"fixed", width:"100%", height:"100%"};
	return(
		<div style={styles} onTouchStart={ (e)=>{ clickHandle && clickHandle(); } }  onTouchMove={ (e)=>{ e.preventDefault(); } }></div>
	)
};

//页面为空
export let EmptyPage =({ config })=>{
	return(
		<div data-comp="empty-page">
			<div className="empty-bg"  style={{background:`url(${config.bgImgUrl}) center top no-repeat transparent`,backgroundSize:"125px 100px"}}>
				<p className="c-fs13 c-cc9">{config.msg}</p>
				{!config.noBtn ?<a className="red-btn" href={config.link}>{config.btnText}</a> : null}
			</div>
		</div>
	)
};



//搜索条
export class SearchBarA extends Component{
  constructor(props) {
    super(props);
    this.state = {
	    innerValue:props.defaultValue
    };
  }
	changeHandle=(e)=>{
		const value = e.target.value;
		if( this.props.value !==undefined ){
			this.props.onChange && this.props.onChange( value );
		}else{
			this.setState({
				innerValue:value
			});
		}
	};
	clearHandle=(e)=>{
		if( this.props.value ){
			this.props.onChange && this.props.onChange("");
		}else{
			this.setState({
				innerValue:""
			})
		}
	};
	componentDidMount() {
		const {isMount} = this.props;
		isMount && isMount.call(this);
	}
	render(){
		const {value} = this.props,
			{innerValue} = this.state;
		return (
				<form data-comp="search-bar-a" className="g-row-flex"
				      action="javascript:;" onSubmit={(e)=>{e.preventDefault();
				      this.props.onSearch( this.refs.search.value.trim() ) }}>
					<label className="g-col-1 search-label" ref="label">
						<input ref="search"value={ value!==undefined?value:innerValue } type="search"  placeholder="可以搜索商品、分类、品牌"  onChange={this.changeHandle} onFocus={this.props.onFocus } className="search-input"/>
						{(value!==undefined?value:innerValue) !="" && <i ref="clear" onTouchTap={this.clearHandle }  className="close-x-icon"> </i>}
						<i className="search-icon"> </i>
					</label>
					<button type="submit" className="search-btn">搜索</button>
				</form>
		)
	}
}

export class LinkChange extends Component {
	static contextTypes = {
		isApp: React.PropTypes.bool,
		isLogin: React.PropTypes.bool
	};
	noop() {}
	render() {
		let props = this.props;
		let notLogin = props["data-notLogin"]
		let context = this.context;
		return (
			!context.isApp ?
				<Link {...props} to={"/guide?redirect=" + encodeURIComponent(location.href)} onTouchTap={this.noop} onClick = {this.noop}>{props.children}</Link>
				: !(notLogin ===true || context.isLogin) ?
				<a href="taihe://to_login" {...props} onTouchTap={this.noop} onClick = {this.noop}>{props.children}</a>
				: <Link  {...props}>{props.children}</Link>
		)
	}
}

//分享
export class ShareAndTotop extends Component{
	static contextTypes = {
		isApp: React.PropTypes.bool,
		store: React.PropTypes.object
	};

	componentDidMount() {
		let $window = $(window)
		let windowH = $window.height();
		let $toTop = $(".toTop");
		let time;
		$toTop.on("click", function () {
			let h = $window.scrollTop();
			time = setInterval(function () {
				h -= 10;
				$window.scrollTop(h);
				if (h <= 0) {
					clearInterval(time)
				}
			}, 1)

		})
		$window.scroll(function () {
			let $this = $(this);
			let scrollH = $this.scrollTop();
			if (scrollH > 35) {
				$toTop.show()
			} else {
				$toTop.hide()
			}
		})

		if (this.props.openShare &&this.refs.share) {
			this.refs.share.click()
		}
	}
	getShareParams() {

		let {config} = this.props, params;

		if (this.params) {
			return this.params;
		} else {
			params = base64encode(utf16to8(JSON.stringify(config)));
			return this.params = "trc://share?params=" + params
		}
	}


	render(){
		return (
			<div className="share-toTop" data-comp="share-label">
				<ul> {
					this.context.isApp ? <li className="share"> <a href={this.getShareParams()} ref="share"></a> </li> : null
				}
					<li className="toTop"></li>
				</ul>
			</div>
		)
	}
}

export class OpenInAppGuide extends Component {
	static contextTypes = {
		isApp: React.PropTypes.bool,
		store: React.PropTypes.object
	};
	render() {
		return(
			!this.context.isApp ?
				<div id="mask" style={{position: "fixed",top: "0",width: "100%",background:"rgba(0,0,0,.6)",padding: "3px 10px",color:"#fff" ,zIndex: "10000"}}>
					<p style={{color:"#fff" ,fontSize: "12px" ,margin:"0"}}>1.微信等暂不支持打开第三方应用，进行购买将跳转到下载界面，请根据引导操作。</p>
					<p style={{color: "#fff",fontSize: "12px",margin:"0"}}>2.若您已安装本应用，进入浏览器后请根据提示进入应用。</p>
				</div> : null)

	}
}


export class Scroll extends Component {

	static contentsProps = {
		classfix: "scroll-wrap",
		nowState: "INIT",
		scrollArea: window,
		domDown: {
			domInit: () => (<div className = "dropload-load">初始化中</div>),
			domRefresh: () => (<div className = "dropload-load">上拉加载更多</div>),
			domLoad: () => (<div className = "dropload-load">加载中</div>),
			domNoData: () =>(<div className = "dropload-load">没有更多了</div>)
		},
		getData: ()=> {}
	}

	createMapState() {
		let {domDown} = this._props;

		this.mapState = {
			"INIT" : {dom: domDown.domInit, fn: this.getData},
			"REFRESH": {dom: domDown.domRefresh},
			"LOAD": {dom:domDown.domLoad, fn: this.getData},
			"NODATA": {dom:domDown.domNoData }
		}
	}

	stateInit() {
		this.changeState("INIT")
	}
	stateRefresh() {
		this.changeState("REFRESH")
	}
	stateLoad() {
		this.changeState("LOAD")
	}
	stateNodata() {
		this.changeState("NODATA")
	}
	unLocked(flag) {
		this._props.locked = !!flag;
	}
	clone(target, ...arg) {
		if (!arg.length) {
			return target
		}

		let src,keys, cObj, i=-1;

		while(src=arg[++i]) {
			keys = Object.keys(src);

			keys.forEach((key, i) => {
				if (typeof src[key] == "Object") {
					cObj = target[key] || src[key].length ? [] : {}
					this.clone(cObj, src[key]);
				} else {
					cObj = src[key]
				}

				target[key] = cObj
			})
		}

		return target
	}

	changeState(sState) {
		let state = this.mapState[sState];

		state.nowState = sState;
		this.setState(state);
		if (state.fn) {
			state.fn.call(this)
		}
	}

	getData() {
		this.unLocked(true);
		this.props.getData(this)
	}


	constructor(props) {
		super(props)
		this.state = {}
		this._props = this.clone({
			locked: false
		}, Scroll.contentsProps, props);

		this.createMapState()
	}

	componentWillReceiveProps(np) {
		if (np.nowState == "INIT") {
			this.stateInit()
		}
	}

	componentWillMount() {
		 this.changeState(this._props.nowState);
	}

	componentDidMount() {
		this.unmout = this.onMount();
	}

	componentWillUnmount() {
		if (this.unmout)
			this.unmout();
	}

	onMount() {
		let {anchor} = this.refs;
		let self = this;

		self.mount = () => {
			if (self.state.nowState == "NODATA" || self._props.locked) {
				return
			} else if (window.innerHeight > anchor.offsetTop - window.scrollY) {
				self.changeState("LOAD")
			}
		}

		this._props.scrollArea.addEventListener('scroll', self.mount);

		return () => this._props.scrollArea.removeEventListener('scroll', self.mount)
	}



	render() {
		let {classfix} = this._props;
		return (
			<div className={classfix}>
				{this.props.children }
				<div ref = "anchor" id="test">
					{this.state.dom()}
				</div>
			</div>
		)

	}

}












































