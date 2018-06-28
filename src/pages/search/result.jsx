import React, { Component } from 'react';
import { Link,browserHistory } from 'react-router';
import ReactDOM,{ render } from 'react-dom';

import {LoadingRound,SearchBarA,Shady } from 'component/common';
import Popup from 'component/modal';
import { DropDownLoad } from 'component/highComp';
import { ownAjax } from 'js/common/ajax.js';
import echo from  'plugin/echo.js';

import 'src/scss/search.scss';

const navDataA =[
	{text:"默认",icon:false,status:"shelves_time:asc"},
	{text:"销量",icon:false,status:"sell_count:des" },
	{text:"价格",icon:true ,status:"price",origIcon:"arrow-tb-icon",sort:true,ascIcon:"arrow-tr-bg-icon",desIcon:"arrow-tg-br-icon"}
];

const searchAPI={
	item:{ url:"/api/api/search",type:"post" }
};


//查询数据
function operaDataCreate(){
	return {
		search_keywords:"", //关键词
		category:{id:[], name:[]}, //分类
		brand:{id:[], name:[]}, //品牌
		orderBy:"shelves_time:asc", //排序
		priceRange:{min:"",max:""}, //价格范围
		properties:{}, //属性
		promotion:"", //促销
		self:"" , //自营
		pages:1,//页数
		coupon_id:"", //优惠券id
		preBrand:"",//预先品牌
		preProperty:"", //预先的属性
		perCategory:"" //预先分类
	};
}

let operaData =null;
let pageForceUpdate = null;
let popupNum = null;

function toggleWindowScroll( show ){
	show?popupNum++:popupNum--;
	if( popupNum ){
		$("html,body").css({ height:"100%",overflowY:"hidden" })
	}else{
		$("html,body").css({ height:"auto", overflowY:"auto" })
	}
}
//输入=>操作的映射
const inToCtrlMap ={
	brand:"brands",
	category:"categoriesInfo"
};

//操作=>搜索的映射
function operaToSearchMap( data ){
	let newData = Object.assign( {},data );
	newData.brand = newData.brand.id.join(",");
	//预先搜索品牌
	if( newData.preBrand ){
		newData.brand = newData.preBrand;
	}
	//预先搜索分类
	newData.category = newData.category.id.join(",");
	if( newData.preCategory ){
		newData.category = newData.preCategory;
	}
	let properties = [];
	for(let key in newData.properties ){
		properties = properties.concat(newData.properties[key].id );
	}
	//预先搜索属性
	if( newData.preProperty ){
		properties.push( newData.preProperty );
	}
	newData.properties = properties;
	if( newData.priceRange.min !=="" && newData.priceRange.max !=="" ){
		newData.priceRange = newData.priceRange.min + ":" + newData.priceRange.max;
	}else{
		newData.priceRange = "";
	}
	return newData;
}

function newWindow( url,type,channel ){
	if( channel ){
		let  reg_schem =/^t/;
		let  reg_channel= /channel/;
		if( url && !reg_schem.test( url ) && !reg_channel.test( url )){
			let reg_requrey = /\?/ ;
			url = url  + (reg_requrey.test( url ) ? "&" :"?" )+"channel="+channel;
		}
	}
	if( type==="app" ){
		return "jsbridge://open_link_in_new_window?url="+window.btoa(window.location.protocol+"//"+window.location.host+ url );
	}else{
		return url;
	}
}

function getURLParameter(name){
	let parameterStr = window.location.search.replace(/^\?/,''),
		reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)'),
		value = parameterStr.match(reg);
	return value ? value[2] : null;
}


//判断是Link还是A标签
class AppOrPc extends Component{
	render(){
		const { type,className,link } = this.props;
		if( type==="pc"){
			return <Link to={ newWindow(link,type,getURLParameter("channel") )} className={className}>{this.props.children}</Link>
		}else{
			return <a href={newWindow(link,type,getURLParameter("channel"))}  className={className}>{this.props.children}</a>
		}
	}
}
//搜索结果页
export default class SearchResult extends Component{
	constructor(props) {
		super(props);
		let {key,coupon_id, brand, property,category } = props.location.query;
		key = key!==undefined ? decodeURIComponent(key):"";
		this.totalPage = 10000;
		this.firstTime = true;
		this.state = {
			keyWord:key,
			data:{},
			update:false,
			listLoad:false,
		};
		operaData = operaDataCreate();
		popupNum = 0;
		operaData.search_keywords = key;
		operaData.coupon_id = coupon_id!==undefined?coupon_id:"";
		operaData.preBrand = brand!==undefined? Number( brand ):"";
		operaData.preProperty = property!==undefined? Number(property):"";
		operaData.preCategory = category!==undefined?Number(category):"";
	}
	static contextTypes = {
		router:React.PropTypes.object,
		store:React.PropTypes.object
	};
	//聚焦搜索框调到 搜索页面
	focusHandle=( key )=>{
		const {router} = this.context;
		router.push(`/search?key=${encodeURIComponent(key)}`);
	};
	//处理返回的数据
	sucDadaHandle =( data )=>{
		Array.isArray( data.category ) && data.category.forEach((item,i)=>{
			data.category[i].id = "properties"+i;
			operaData.properties["properties"+i] ={name:[],id:[]};
			//预先属性检测
			if( operaData.preProperty ){
				item.list.some( ( list, j )=>{
					if( list.property_value_id == operaData.preProperty ){
						operaData.properties["properties"+i].id.push( operaData.preProperty );
						operaData.properties["properties"+i].name.push( list.text );
						pageForceUpdate();
						operaData.preProperty ="";
						return true;
					}
				});
			}
		});
		//预先分类
		if( operaData.preCategory ){
			data.categoriesInfo.some( (item,i)=>{
				if( item.category_id == operaData.preCategory ){
					operaData.category.id.push( operaData.preCategory );
					operaData.category.name.push( item.name );
					pageForceUpdate();
					operaData.preCategory = "";
					return true;
				}
			})
		}
		//预先品牌
		if( operaData.preBrand ){
			data.brands.some( (item,i)=>{
				if( item.brand_id == operaData.preBrand ){
					operaData.brand.id.push( operaData.preBrand );
					operaData.brand.name.push( item.name );
					pageForceUpdate();
					operaData.preBrand = "";
					return true;
				}
			})
		}
		data.category.unshift({ id:"brand",name:"品牌",list:data.brands},{ id:"price","name":"价格"});
		data.category.push( { id:"category",name:"分类",list:data.categoriesInfo} );
	};
	loadHandle=( me )=>{
		const self  =this;
		if( operaData.pages >= this.totalPage ){
			me.lock();
			me.noData();
			me.resetload();
			return;
		}
		operaData.pages++;
		ownAjax(searchAPI.item,JSON.stringify( operaToSearchMap(operaData)))
			.then( result =>{
				if( !result.status ){
					me.resetload();
					return;
				}
				let {data} = this.state;
				data.items = data.items.concat( result.data.items );
				self.setState({
					data:data
				});
				me.resetload();
			})
			.catch( xhr =>{
				me.resetload();
			})
	};
	componentWillMount() {
		document.title="搜索结果";
		window.location.href = "jsbridge://set_title?title=搜索结果";
		pageForceUpdate = this.forceUpdate.bind( this );
	}
	componentDidMount() {
		const self = this,
			{store} = this.context;
		let scrollT = 0;
		let pageTop = $(this.refs.pageTop);
		this.filterScroll = function(){
			let top = $(window).scrollTop();
			if( pageTop.height() >100 && top > pageTop.height()-46 && top - scrollT >= 2 ){
				pageTop.addClass("active");
			}
			if( top - scrollT <= -2 ){
				pageTop.removeClass("active");
			}
			scrollT = top;
		};
		$(window).on('scroll',this.filterScroll );
		this.unSubscribe = store.subscribe(()=>{
			let state = store.getState().initial;
			if( state.type ==="SEARCH_RESULT" && state.update ){
				self.setState({ listLoad:false });
				operaData.pages =1;
				ownAjax( searchAPI.item,JSON.stringify( operaToSearchMap(operaData) )).then( result=>{
					if(  !(result.status && result.data && result.data.items ) ){
						let {data} = self.state;
						data.items=[];
						self.setState({
							data:data,
							update:true,
							listLoad:true
						});
						return;
					}
					let pageData = result.data;
					operaData.pages = pageData.pagers.current;
					self.totalPage = pageData.pagers.total;
					if( self.firstTime ){
						self.sucDadaHandle( pageData );
						self.firstTime = false;
						self.setState({
							data:pageData,
							update:true,
							listLoad:true
						});
					}else{
						let {data} = self.state;
						data.items = pageData.items;
						data.correction = pageData.correction;
						self.setState({
							data:data,
							update:true,
							listLoad:true
						});
					}
				}).catch( e =>{
				//	throw new Error( e.message );
				 Popup.MsgTip({msg:"服务器发生错误！"});
				 });
			}
		});
		store.dispatch({type:"SEARCH_RESULT",update:true });
	};
	componentWillUnmount() {
		this.unSubscribe();
		$(window).unbind('scroll',this.filterScroll );
		const msgTip =document.querySelector("#msgTip");
		msgTip && msgTip.parentNode && msgTip.parentNode.removeChild(msgTip);
	}
	render(){
		const { keyWord,update,data,listLoad } = this.state;
		return (
			<div data-page="search-page" id="searchResult">
				<div className="list-filter-ctrl" ref="pageTop"   >
					<div style={{borderBottom:"1px solid #e4e4e4"}}>
						<SearchBarA  onFocus={ (e)=>{ this.focusHandle(keyWord) } } value={keyWord} onSearch={()=>{ if( keyWord === ""){ Popup.MsgTip({msg:"请输入搜索词"}); return false; }  window.location.replace(`/searchResult?key=${keyWord}`) } }/>
					</div>
					{update && data.category && !!data.category.length && <div className="list-filter-a-wrap">
						<ListFilterACtrl data={data}   />
					</div> }
					{update &&  data.category && !!data.category.length && <ListFilterB data={data} ref="filterB" /> }
				</div>
				<div className="item-list" ref="list">
					{update?
						( data && data.items && data.items.length?
								<ListInfoCtrl data={data.items} dropDownLoad={ this.loadHandle } listLoad={listLoad} correct={data.correction } keyWord={ keyWord } /> :
								(  data.category &&  data.category.length ? <FilterNone /> : <SearchNone />)
						):
						<LoadingRound />
					}
				</div>
			</div>
		)
	}
}

//列表导航A控制
export class ListFilterACtrl extends Component{
	constructor(props) {
		super(props);
		this.state = {
			status:"shelves_time:asc",
			filter:false,
			direction:"asc"
		};
	}
	static contextTypes ={
		store: React.PropTypes.object
	};
	clickHandle=( type,event )=>{
		const {status,direction} = this.state;
		const {store} = this.context;
		if( type==="price"){
			if( status==="price"){
				this.setState({
					direction:direction==="asc"?"des":"asc"
				});
				operaData.orderBy ="price:"+(direction==="asc"?"des":"asc");
			}else{
				this.setState({
					direction:"asc",
					status:"price"
				});
				operaData.orderBy ="price:asc";
			}
		}else{
			this.setState({
				status:type
			});
			operaData.orderBy = type;
		}
		store.dispatch({type:"SEARCH_RESULT",update:true});
	};
	filterHandle=()=>{
		const { store } = this.context;
		store.dispatch({ type:"SEARCH_RESULT",tabChange:true });
		this.setState({
			filter:!this.state.filter
		});
	};
	render(){
		const {status,filter,direction} =this.state;
		const {data} =this.props;
		return(
			<div className="list-filter-a">
				<div className="list-nav-a-grid" ref="sortNav" >
					<ListFilterA   data={navDataA} status={status} direction={direction} filter={filter} clickHandle={ this.clickHandle } filterHandle={this.filterHandle } />
					{filter && <ListFilter data={data} filter={filter} onToggleList={ this.filterHandle } ref="accurateFilter"/> }
				</div>
			</div>

		)
	}
}

//列表导航A
export class ListFilterA extends Component{
	render(){
		const {data,status,clickHandle,filterHandle,filter,direction } = this.props;
		let html = data.map(function(item,i){
			return (
				<div key={item.text} className={"g-col-1 nav-click"} onClick={ (e)=>{ clickHandle(item.status,e) } }>
					<span className={`nav-span ${status==item.status?"active":""}`}>
						<span>{item.text}</span>
						{item.icon &&<i className={status==item.status?(item.sort?(direction==="asc"?item.ascIcon:item.desIcon):item.activeIcon ):item.origIcon}> </i> }
					</span>
				</div>
			)
		});
		return(
			<div className="list-nav-a g-row-flex c-tc">
				<div className="grid-left g-row-flex g-col-1">
					{html}
				</div>
				<div className="grid-right">
					<div className="nav-click" onClick={ filterHandle } >
						<span className={`nav-span${filter?" active":""}`}>
							<span>筛选</span>
						<i className={filter?"arrow-btm-m-r-icon":"arrow-btm-m-icon"}> </i>
						</span>
					</div>
				</div>
			</div>
		)
	}
}

//列表搜索B
export class ListFilterB extends Component{
	constructor(props) {
		super(props);
		// 初始状态
		this.state = {
			self:false,
			promotion:false,
			dropType:""
		};
	}
	static contextTypes = {
		store:React.PropTypes.object
	};
	//按钮切换
	btnStatusHandle=( type )=>{
		const{ store } = this.context;
		this.setState({
			[type]:!this.state[type]
		});
		operaData[type] =!this.state[type]?1:"";
		store.dispatch({type:"SEARCH_RESULT",update:true });
	};
	// 下拉切换
	dropDownHandle=( type )=>{
		const { dropType } = this.state;
		type = (type==dropType)?"":type;
		this.setState({
			dropType:type
		});
	};
	componentDidMount(){
		const { store } = this.context;
		this.unSubscibe = store.subscribe( ()=>{
			const state = store.getState().initial;
			if( state.type==="SEARCH_RESULT" && state.tabChange ){
				this.dropDownHandle("");
			}
		});
	}
	componentWillUnmount(){
		this.unSubscibe();
	}
	render(){
		const {self,promotion,dropType } = this.state;
		const { data } = this.props;
		return(
			<div className="list-nav-b-grid">
				<div className="list-nav-b g-row-flex" ref="navB" >
					<div className={`nav-one g-col-1 btn ${self?"active":""}`} onTouchTap={ (e)=>{this.btnStatusHandle("self")} } >
						<div className="nav-one-next">
							{self&&<i className="red-current-icon"> </i>}<span>自营</span>
						</div>
					</div>
					<div className={`nav-one g-col-1 btn ${promotion?"active":""}`} onTouchTap={ (e)=>{this.btnStatusHandle("promotion") } }>
						<div className="nav-one-next">
							{promotion&&<i className="red-current-icon"> </i>}<span>促销</span>
						</div>
					</div>
					<div className={`nav-one g-col-1 dropDown ${dropType==="brand"?"down":(operaData.brand.name.length?"active":"")}`} onTouchTap={ (e)=>{ this.dropDownHandle("brand") }}>
						<div className="nav-one-next">
							<span>{(operaData.brand.name.length && dropType!=="brand")?operaData.brand.name.join(","):"品牌"}</span>
							{(dropType==="brand")?<i className="arrow-top-m-icon"> </i>:(!operaData.brand.name.length?<i className="arrow-btm-m-icon"> </i>:"")}
						</div>
					</div>
					<div className={`nav-one g-col-1 dropDown ${dropType==="category"?"down":(operaData.category.name.length?"active":"")}`} onTouchTap={ (e)=>{ this.dropDownHandle("category") } } >
						<div className="nav-one-next">
							<span>{(operaData.category.name.length && dropType!=="category") ?operaData.category.name.join(","):"分类"}</span>
							{(dropType==="category")?<i className="arrow-top-m-icon"> </i>:(!operaData.category.name.length?<i className="arrow-btm-m-icon"> </i>:"")}
						</div>
					</div>
				</div>
				{dropType?<ListChoose data={data[inToCtrlMap[dropType]] } type={dropType} onBtnStatus={this.dropDownHandle }/>:""}
				{dropType?<Shady options={{zIndex:-2}} />:""}
			</div>
		)
	}
}

//列表内容控制
export class ListInfoCtrl extends Component{
	static contextTypes={
		isApp:React.PropTypes.bool
	};
	render(){
		const {data,listLoad,correct,keyWord} = this.props;
		return(
			<div className="list-center" ref="itemList">
				{listLoad ?
					<DropDownList data={data} scrollArea={window} dropDown={this.props.dropDownLoad } app={this.context.isApp} correct={correct} keyWord={keyWord} />:
					<LoadingRound />
				}

			</div>
		)
	}
}

//内容列表
export class ListInfo extends Component{
	componentDidMount() {
		echo.init();
	}
	render(){
		const {data,app,correct,keyWord } = this.props;
		const html = data.map( (item,i)=>{
			return <OneItem key={i} data={item} app={app}/>
		});
		return(
			<div className="list-main">
				{ correct !== null &&<div className="list-tip">
					<p>没找到“<span className="c-cdred">{keyWord}</span>”相关商品，已为您推荐“<span className="c-cdred">{correct}</span>”相关商品</p>
				</div>}
				<div className="list-detail c-clrfix">
					{html}
				</div>
			</div>
		)
	}
}

const DropDownList = DropDownLoad(ListInfo);

//一个商品
export class OneItem extends Component{
	render(){
		const {app} = this.props;
		const { item_id,sell_price,market_price,trade_type, primary_image, title,storehouse,promotionDetail,activity_price,activity_store,store } = this.props.data;
		let saleOut = null;
		activity_store !== undefined ?  saleOut = activity_store<=0 : saleOut = store <=0;
		return(
			<div className="one-item-grid">
				<AppOrPc className="one-item" type={app?"app":"pc"}  link={`/item?item_id=${item_id}`}>
					<div className="item-img">
						<img data-echo={primary_image} src="/src/img/icon/loading/default-watermark.png" />
						{ saleOut ?<div className="float-label"><img src="/src/img/search/sale-out-big.png" /></div> :""}
						{promotionDetail && <span className="img-label">{promotionDetail.join(" | ")}</span>}
					</div>
					<div className="item-title c-mt10">
						{ ( trade_type==="Direct" || trade_type==="Overseas") && <span className="label yellow-label">海外直邮</span>}
						{trade_type==="Bonded" && <span className="label blue-label">跨境保税</span>}
						{title}
					</div>
					<div className="item-price c-mt5">
						<span>¥{ activity_price?(+activity_price).toFixed(2):(+sell_price).toFixed(2) }</span> {market_price?<del>¥{(+market_price).toFixed(2)}</del>:""}
					</div>
				{/*	<div className="warehouse-label">
						<span>{ storehouse && storehouse.name }</span>
					</div>*/}
				</AppOrPc>
			</div>
		)
	}
}

//弹出列表筛选
export class ListFilter extends Component{
	constructor(props) {
		super(props);
		this.state = {};
	}
	static contextTypes ={
		store:React.PropTypes.object
	};
	//重置搜索条件
	resetHandle=()=>{
		operaData.brand ={id:[],name:[] };
		operaData.category ={ id:[],name:[]};
		let propArr = Object.keys( operaData.properties );
		propArr.forEach(function( props,i){
			operaData.properties[props] ={ id:[],name:[] };
		});
		this.refs.filter.clearPrceHandle();
		operaData.priceRange = { min:"",max:"" };
		pageForceUpdate();
	};
	//确定提交条件
	sureHandle=()=>{
		const {store} = this.context;
		store.dispatch({type:"SEARCH_RESULT",update:true});
		this.props.onToggleList();
	};
	componentWillMount(){
		toggleWindowScroll( true );
	}
	componentDidMount() {
		const dom = $(this.refs.main);
		dom.css({ height: $(window).height() - dom.offset().top + $(window).scrollTop() });
	}
	componentWillUnmount(){
		toggleWindowScroll( false );
	}
	render(){
		return(
			<div className="list-pop-select" ref="main" >
		  	{/*	<div className="list-pop-top"> </div>*/}
				<ListFilterMain data={this.props.data} ref="filter" />
				<ListFilterBtm onReset={ this.resetHandle } onSure={ this.sureHandle }/>
			</div>
		)
	}
}

//弹出列表筛选 main
export class ListFilterMain extends Component{
	constructor(props) {
		super(props);
		this.state = {
			type:"brand"
		};
	}
	typeHandle =( type )=>{
		this.priceChangeHack();
		this.setState({
			type:type
		});
	};
	//搜索品牌和分类处理
	seacrhDataHandle=( type,obj )=>{
		let num =operaData[type].id.indexOf( obj[`${type}_id`] );
		if( num> -1 ){
			operaData[type].id.splice(num,1);
			operaData[type].name.splice(num,1);
		}else{
			operaData[type].id.push( obj[`${type}_id`] );
			operaData[type].name.push( obj.name );
		}
		pageForceUpdate();
	};
	priceChangeHack =()=>{
		this.refs.min && $(this.refs.min).trigger("blur");
		this.refs.max && $(this.refs.max).trigger("blur");
	};
	//搜索属性处理
	propertiesHandle= ( type, obj ) =>{
		let num = operaData.properties[type].id.indexOf( obj.property_value_id );
		if( num > -1 ){
			operaData.properties[type].id.splice( num,1);
			operaData.properties[type].name.splice( num,1);
		}else{
			operaData.properties[type].id.push( obj.property_value_id );
			operaData.properties[type].name.push( obj.text );
		}
		pageForceUpdate();
	};
	//价格处理
	priceHandle =()=>{
		const min = +this.refs.min.value.trim(),
			max = +this.refs.max.value.trim();
		if( min==="" && max==="" ){
			operaData.priceRange={ min:"",max:""};
			return;
		}
		if( min!=="" && max!=="" ){
			operaData.priceRange={min:Math.min(min,max),max:Math.max(min,max)};
		}else{
			if( min!=="" ){
				operaData.priceRange = { min:0,max:min };
			}else{
				operaData.priceRange = { min:0,max:max };
			}
		}
	};
	clearPrceHandle=()=>{
		this.refs.min ? this.refs.min.value = "":"";
		this.refs.max ? this.refs.max.value = "":"";
	};
	componentDidMount() {
		this.listLeft = new IScroll( this.refs.listLeft,{ click:true });
		this.listRight = new IScroll( this.refs.listRight,{ click:true } );
		$(window).trigger("resize");
	}
	componentDidUpdate(){
		this.listRight.refresh();
	}
	render(){
		let listRight;
		const self =this,
			{data} = this.props,
			{type} = this.state;
		let listLeft =data.category && data.category.map(function(item,i){
				if( type==item.id ){
					switch( type ){
						case "brand":
							listRight = item.list.map(function(item,j){
								return <div key={j} className={`list-text ${(operaData.brand.id.indexOf(item.brand_id)>-1)?"active":"" }`} onTouchTap={ (e)=>{  self.seacrhDataHandle("brand",item ) } } >
									<span>{item.name }</span>{(operaData.brand.id.indexOf(item.brand_id)>-1) && <i className="red-current-icon"> </i>}
								</div>
							});
							break;
						case "price":
							listRight = <div className="range-price">
								<h4>价格区间</h4>
								<div className="input-price">
									<input ref="min" type="number" placeholder="最低价格"   defaultValue={operaData.priceRange.min} onBlur={self.priceHandle } /> - <input ref="max" type="number" placeholder="最高价格"  defaultValue={operaData.priceRange.max} onBlur={ self.priceHandle } />
								</div>
							</div>;
							break;
						case "category":
							listRight = item.list.map(function(item,j){
								return <div key={j} className={`list-text ${operaData.category.id.indexOf(item.category_id)>-1?"active":""}`} onTouchTap={ (e)=>{  self.seacrhDataHandle( "category", item ) } }>
									<span>{item.name}</span> { (operaData.category.id.indexOf( item.category_id )>-1) && <i className="red-current-icon"> </i>}
								</div>
							});
							break;
						default:
							listRight = item.list.map(function(item,j){
								return<div key={j} className={`list-text ${operaData.properties[type].id.indexOf(item.property_value_id)>-1?"active":"" }`}  onTouchTap={ (e)=>{ self.propertiesHandle( type, item); }}  >
									<span>{item.text}</span>{ (operaData.properties[type].id.indexOf(item.property_value_id)>-1) && <i className="red-current-icon"> </i>}
								</div>
							});
					}
				}
				return(
					<div className={`list-text ${item.id===type?"active":""}`}  key={i} onClick={ (e)=>{ self.typeHandle(item.id)} }>
						<span>{item.name}</span>
					</div>
				)
			});
		return(
			<div className="list-pop-main g-row-flex"  >
				<div className="list-left-grid" ref="listLeft" id="filterLeft">
					<div className="list-left" >
						{listLeft}
					</div>
				</div>
				<div className="list-right-grid g-col-1" id="filterRight" ref="listRight" >
					<div className="list-right">
						{listRight}
					</div>
				</div>
			</div>
		)
	}
}

//弹出列表筛选 底部
export class ListFilterBtm extends Component{
	render(){
		return(
			<div className="list-pop-btm g-row-flex">
				<div className="c-fs12 total-num" >
					{/*	有<span className="c-cdred">360</span>件商品*/}
				</div>
				<div className="grey-btn c-bge4 g-col-1" onClick={ this.props.onReset } >重置</div>
				<div className="dred-btn c-bgdred c-cfff g-col-1" onClick={ this.props.onSure  } >确定</div>
			</div>
		)
	}
}

//弹出选择列表
export class ListChoose extends Component{
	static contextTypes={
		store:React.PropTypes.object
	};
	toggleSearchHandle=( type,obj )=>{
		let num =operaData[type].id.indexOf( obj[`${type}_id`] );
		if( num> -1 ){
			operaData[type].id.splice(num,1);
			operaData[type].name.splice(num,1);
		}else{
			operaData[type].id.push( obj[`${type}_id`] );
			operaData[type].name.push( obj.name );
		}
		pageForceUpdate();
	};
	resetHandle =( type )=>{
		operaData[type].id=[];
		operaData[type].name=[];
		pageForceUpdate();
	};
	sureHandle=()=>{
		const {store} = this.context;
		store.dispatch({type:"SEARCH_RESULT",update:true});
		this.props.onBtnStatus( this.props.type );
	};
	componentWillMount(){
		toggleWindowScroll( true );
	}
	componentWillUnmount(){
		toggleWindowScroll( false );
	}
	render(){
		const { data,type } = this.props;
		const self = this;
		const html = data && data.map( (item,i)=>{
				let active = operaData[type].id.indexOf( item[`${type}_id`] )>-1;
				return (
					<div className="choose-one" key={i} onClick={ (e)=>{ self.toggleSearchHandle( type, item ) } }>
						<div className={`choose-span ${active?"active":"" }`}>
							<span>{item.name}</span>{active &&<i className="red-current-icon"> </i> }
						</div>
					</div>
				);
			});
		return(
			<div className="list-choose" >
				<div className="list-choose-main c-clrfix" >
					{html}
				</div>
				<div className="choose-ctrl g-row-flex">
					<div className="grey-btn c-bge4 g-col-1" onClick={ (e)=>{ self.resetHandle(type); } }>
						重置
					</div>
					<div className="dred-btn c-bgdred c-cfff g-col-1" onClick={ this.sureHandle } >
						确定
					</div>
				</div>
			</div>
		)
	}
}

//没有搜索结果
const SearchNone =()=>{
	return(
		<div className="c-tc" style={{paddingTop:"80px"}}>
			<img src="/src/img/search/search-none.png" width="58" height="56" />
			<p className="c-fs14 c-mt10">抱歉，暂无相关商品</p>
			<p className="c-cc9">换个关键词试试吧~</p>
		</div>
	)
};

//没有筛选结果
const FilterNone =()=>{
	return(
		<div className="c-tc" style={{paddingTop:"80px"}}>
			<img src="/src/img/search/search-none.png" width="58" height="56" />
			<p className="c-fs14 c-mt10">没有相关商品</p>
		</div>
	)
};