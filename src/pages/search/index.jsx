import React, { Component } from 'react';
import { Link, browserHistory } from 'react-router';
import { ownAjax } from 'js/common/ajax.js';
import {SearchBarA } from 'component/common';
import Popup from 'component/modal';
import 'src/scss/search.scss';

let specList ={
	brand:{text:"进入品牌",url:( id, key )=>{  browserHistory.push( `/searchResult?brand=${id}`) }  },
	country_property:{text:"进入国家",url:( id, key )=>{  browserHistory.push( `/searchResult?property=${id}`) } },
	primary_category:{text:"进入分类",url:( id,key )=>{ window.location=`trc://category?catId=${id}` } },
	secondary_category:{text:"进入分类",url:( obj, key )=>{ window.location=`trc://category?catId=${obj.first}&subId=${obj.second}` } },
	tertiary_category:{text:"进入分类",url:( id,key)=>{ browserHistory.push( `/searchResult?category=${id}`)  } }
};

const searchAPI ={
	completion:{url:"/api/api/search/suggests",type:"get"},
	hot:{ url:"/api/api/search/hots",type:"get"}
};

//函数节流
function throttle( fn ,wait){
	let _self = fn,
		timer,
		args,
		firstTime = true;
	return function(){
		let _me = this;
		args = arguments;
		if(firstTime){
			_self.apply( _me,args);
			return firstTime = false;
		}
		if( timer ){
			return false;
		}
		timer = setTimeout( function(){
			clearTimeout( timer );
			timer = null;
			_self.apply( _me, args);
		},wait || 500 );
	}
}

let searchReq = false;

//搜索列表页
export default class SearchPage extends Component{
  constructor(props) {
    super(props);
	  const {key} =props.location.query;
    this.state = {
	    compList:"",
	    keyWord:key!==undefined?key:"",
	    searchHistory:[],
	    hotWord:[]
    };
    $(window).scrollTop(0);
  }
	static contextTypes = {
		router: React.PropTypes.object
	};
	//搜索补全
	searchHandle=( value )=>{
		const self = this,
			{ keyWord,compList } = this.state;
		/*if( keyWord ===value.trim() ){
			return;
		}*/
		if( value.trim() ==""){
			this.setState({
				compList:""
			})
		}
		this.setState({
			keyWord:value
		});
		value = value.trim();
		if( value=="" ){
			return;
		}
		this.ajaxHandle( value );
	};
	searchBarMount(){
		$(this.refs.search).focus();
	};
	//历史搜索和热词搜索
	clickWordSubmit=( key) =>{
		this.addHistoryHandle( key );
		this.searchSubmit( key );
	};
	//添加本地搜索历史
	addHistoryHandle=( key )=>{
		if( key.trim() =="" ) return false;
		let {searchHistory} = this.state;
		for( let i= 0,item;item=searchHistory[i++];){
			if( item.key == key ){
				searchHistory.splice(i-1,1);
			}
		}
		searchHistory.unshift({key:key});
		if( searchHistory.length > 20 ){
			searchHistory.length = 20;
		}
		let storage = JSON.stringify( searchHistory );
		window.localStorage.setItem("searchHistory",storage );
	};
	//清除搜索历史
	clearHistory=()=>{
		window.localStorage.removeItem("searchHistory");
		this.setState({
			searchHistory:[]
		})
	};
	//搜索提交
	searchSubmit=( key )=>{
		const {router} = this.context;
		if( !key.trim() ){
			Popup.MsgTip({msg:"请输入搜索词"});
			return;
		}
		this.addHistoryHandle( key );
		router.push(`/searchResult?key=${ encodeURIComponent( key)}`);
	};
	//只能数据提示处理
	dataHandle=( data )=>{
		let newType = {};
	  let { type } = data;
	  if( type.brand ) newType.brand = type.brand;
	  if( type.country_property ) newType.country_property = type.country_property;
	  if( type.primary_category ) newType.primary_category = type.primary_category;
		if( type.secondary_category ) newType.secondary_category = {second: type.secondary_category, first:type.secondary_category_primary };
		if( type.tertiary_category ) newType.tertiary_category = type.tertiary_category;
		data.type = newType;
		return data;
	};
	componentWillMount() {
		document.title="搜索";
		window.location.href = "jsbridge://set_title?title=搜索";
		let history = window.localStorage.getItem("searchHistory");
		const { completion } = searchAPI;
		const self = this;
		this.ajaxHandle = throttle(function( value ){
				$.ajax({
					url:completion.url,
					type:completion.type,
					data:{keyword:value },
					dataType:"json",
					success:function( result ){
						if( result.status ){
							self.setState({
								compList:self.dataHandle( result.data )
							})
						}
					
					},
					error:function(){}
				});
		},300);
		if( history ){
			try {
				history = JSON.parse(history);
				this.setState({
					searchHistory:history
				});
			}catch(e){}
		}
		const {keyWord} = this.state;
		this.searchHandle( keyWord );
		ownAjax(searchAPI.hot ).then( result =>{
			if( result.status ){
				this.setState({ hotWord: result.data || [] })
			}
		})
	}
	componentWillUnmount(){
		const msgTip =document.querySelector("#msgTip");
		msgTip && msgTip.parentNode && msgTip.parentNode.removeChild(msgTip);
	}
	render(){
		const { compList,keyWord,hotWord } = this.state;
		let compListSpec = [];
		if(  keyWord && compList && compList.type ){
			$.each(compList.type,(key,value)=>{
					compListSpec.push(  <ResultStrip text={ keyWord }  key={key} accurate={ specList[key].text }  clickHandle={ ()=> specList[key].url( value,keyWord ) } /> );
			});
		}
		const	 compListHtml = keyWord && compList && (compList.suggests instanceof Array) && compList.suggests.map((list,i)=>{
				return <ResultStrip text={list} key={i}/>
		});
		return (
				<div data-page="search-page" id="searchPage">
					<div style={{borderBottom:"1px solid #e4e4e4"}} className="search-bar-grid">
						<SearchBarA onChange={ this.searchHandle } value={keyWord} isMount={ this.searchBarMount } onSearch={this.searchSubmit } />
					</div>
					{!keyWord?
					<div className="history-block">
						<SearchKeyWord type="history" data={this.state.searchHistory} clearHistory={this.clearHistory } searchKeyWord={this.clickWordSubmit } />
						<SearchKeyWord type="hotWord" data={ hotWord } searchKeyWord={this.clickWordSubmit } />
					</div>:
					<div className="search-list-grid">
						<div className="search-list">
							{compListSpec}
							{compListHtml}
						</div>
					</div>
					}
				</div>
		)
	}
}

//搜索关键词
export class SearchKeyWord extends Component{
	render(){
		const {type,data,searchKeyWord} = this.props;
		const title={
			history:{text:"历史搜索", del:true},
			hotWord:{text:"热门搜索", del:false}
		};
		const html = data? <div className="search-key">
			{ data.map( (item,i)=>{
				return(
						<div className="grid-key" key={i} onTouchTap={ (e)=>{ searchKeyWord(item.word || item.key,type) }} >
							<span className={item.active?"red-btn":"black-btn"}>{item.word || item.key }</span>
						</div>
				)
			})}
			</div>:
			<div>无搜索历史</div>;
		return(
				<div className="search-key-list c-clrfix">
					<h3>
						<span>{ title[type].text }</span>
						{ title[type].del && <i className="delete-box-icon" onTouchTap={ this.props.clearHistory }> </i> }
					</h3>
					{html}
				</div>
		)
	}
}

//结果条
export class ResultStrip extends Component{
	render(){
		const { text,accurate,clickHandle } =this.props;
		return(
			<div className="list-one g-row-flex c-clrfix">
					<Link className="c-fl c-dpb grid-left g-col-1" to={`/searchResult?key=${text}`} >{text}</Link>
					{accurate?<div className="c-fr c-dpb grid-right"  onClick={ (e)=>{ e.stopPropagation(); clickHandle(); } } >{accurate}<i className="arrow-right-icon"> </i></div>:""}
			</div>
		)
	}
}

