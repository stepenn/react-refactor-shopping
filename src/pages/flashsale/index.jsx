import React, { Component } from 'react';
import ReactDOM,{ render } from 'react-dom';
import { Link } from 'react-router';
import 'src/scss/flashsale.scss';
import {createAction} from 'filters/index'
import {LoadingRound,ShareAndTotop, ReactIscroll, Scroll} from 'component/common';


let Action = createAction({
    flashSale: {
        url: "/api/wapapi/flashsale.api",
        type: "get"
    },
    itemList: {
        url: "/api/wapapi/flashsaleItem.api",
        type: "get"
    },
    DelFav: {
        url: "/api/member-collectdel.html",
        type: "post"
    },
    Fav: {
        url: "/api/member_fav.html",
        type: "post"
    }
}, true);

let Type = {
    "past": {navText: "已结束", timeText: "本场已结束", countDown: false},
    "present":{navText:"进行中", timeText: "离本场结束", countDown: true, countField: "end_time"},
    "future": {navText:"即将开始", timeText: "离本场开始", countDown: true, countField: "start_time"}
}

let _localTime;

function  parse(n) {
    n = n | 0;
    return n >= 10 ? n : "0" + n
}

export default class Flashsale extends Component {

    constructor(props) {
        super(props);
        this.state = {
            update: false,
            data: null
        }
    }

    componentWillMount() {
        document.title= '限时特卖';
        location.href="jsbridge://set_title?title=限时特卖";
        $.ajax(Action("flashSale", {
            success: (data)=>{
                _localTime = +new Date();
                this.setState({
                    update: true,
                    data: data.data
                })
            }
        }));
        const {store} = this.context;
    }
    render() {

        return (
            this.state.update ?
            this.state.data ?
            <FlashSaleContent data={this.state.data} />: <EmptyPage />:<LoadingRound />
        )
    }
}

class EmptyPage extends Component {
    render () {
        return (
            <div data-page="flashsale-page">
            <div className="nopublish-body c-tc">
                <img className="main-img" src="/src/img/flashsale/sale-nopublish1-icon.png" />
                    <div className="no-pub-h">
                        敬请期待
                    </div>
                    <img className="img-icon" src="/src/img/flashsale/sale-nopublish2-icon.png" />
                        <div className="no-pub-con">
                            特卖商品正在发布中
                        </div>
            </div>
                </div>
        )
    }
}


class FlashSaleContent extends Component {
    constructor(props) {
        super(props);
        this.state = {}
    }
    componentWillMount() {
        this.onChangeActive();
    }

    onChangeActive=(obj)=>{
        let data = this.props.data,
            len;
        if (!obj) {
            if (data.present &&(len=data.present.length)) {
                obj = data.present[len-1]
            } else if (data.future &&data.future.length) {
                obj = data.present[0]
            } else if (data.past&&(len=data.past.length)) {
                obj = data.past[len-1]
            }
        }
        if (obj !== this.state.active) {
            this.setState({
                active: obj
            })
        }
    }

    render() {
        return (
            <div data-page="flashsale-page">
                <FlashNavs data={this.props.data} active={this.state.active} onChangeActive = {this.onChangeActive} />
                <FlashContents initData={this.props.data.items} active={this.state.active} nowTime = {this.props.data.now} />
            </div>
        )
    }
}

class FlashNavs extends Component {
    constructor(props) {
        super(props);
        this.initData()
    }
    initData() {
        let {data} = this.props;
        let keys = Object.keys(Type);
        this._data = [];

        keys.forEach((val, i) => {
            if (data[val]) {
                data[val].forEach((vals, key) => vals.type = val);
                this._data.push(...data[val]);
            }
        })
    }
    componentDidMount() {
        let myScroll =  new IScroll(this.refs.nav, {scrollX: true, scrollY: false, mouseWheel: true});
        let windowWidth = $(window).width(),
            $navWrap = $(this.refs.nav),
            lenLi = $navWrap.find("li").length,
            liW = $navWrap.find("li").width(),
            $activeLi =$navWrap.find("li.active"),
            activeLioffsetLeft = $activeLi.offset().left;
            if(windowWidth - liW < activeLioffsetLeft){
                    myScroll.scrollTo( - (activeLioffsetLeft + ( liW - windowWidth ) / 2),0,800);
            }
    }
    initList() {
        let ret = [];

        this._data.forEach((val, i)=> {
            ret.push(<FlashNav data={val} key={i} className={val == this.props.active ? "active" : ""} onChangeActive = {() =>this.props.onChangeActive(val)}/>)
        });
        return ret
    }
    render() {
        return (
            <div className="nav-container">
                <div id="nav-wrap">
                    <div className="nav_bar" ref="nav">
                        <div id="nav-con">
                            <ul className="nav_bar_ul">
                                {this.initList()}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

class FlashNav extends Component {
    getTime() {
        let d = new Date(this.props.data.start_time *1000)
        return parse(d.getHours()) + ":" + parse(d.getMinutes())
    }
    getType() {
        let {type} = this.props.data;
        return Type[type].navText
    }
    render() {
        return (
         <li className={this.props.className}  onTouchTap = {() => this.props.onChangeActive()}>
            <div className="start-time">{this.getTime()}</div>
            <div className="text_tip">{this.getType()}</div>
         </li>)
    }
}


class FlashContentLists extends Component {
    getListHtml() {
        let ret = [];
        this.props.data && this.props.data.forEach((val, i) => {
            ret.push(<FlashContentList data={val} key={i} nowTime={this.props.nowTime} />);
        });
        return ret
    }
    render () {
        return (
        <div className="sale_ul floor-bd">
            <ul>
                {this.getListHtml()}
            </ul>
        </div>)
    }
}

class FlashContents extends Component {
    constructor(props) {
        super(props);
        this.getData = this.getData.bind(this);
    }

    initState() {
        this.state = {
            data: [],
            update: true,
            nowState: "INIT"
        }
        this._page = 1;
        this.setState(this.state)
    }
    getData =(scroll) => {
        let self=this;
        delete this.state.nowState;
        self.ajax && self.ajax.abort()
        self.ajax =  $.ajax(Action('itemList', {
            data: {
                promotion_id: this.props.active["promotion_id"],
                page: this._page++,
                pageSize: 10
            },
            success: (res) => {
                if (!res.data ||  res.data.length < 10) {
                    scroll.stateNodata()
                } else {
                    scroll.stateRefresh();
                }
                self.state.update = false;
                if (res.data) {
                    self.state.data.push(...res.data)
                    self.setState(self.state);
                }
                scroll.unLocked()
            },
            error: () => {}
        }))
    }
    componentWillMount() {
        this.initState()
    }
    componentWillReceiveProps(nextProps) {
        if (nextProps.active !== this.props.active) {
             this.initState();
        }
    }
    render() {
        return (
            <div className="tab_wrap">
            <div className="tab_con">
                <FlashTimeInfo active={this.props.active} nowTime={this.props.nowTime}/>
                    <Scroll getData={this.getData} onRefresh={this.onRefresh} nowState={this.state.nowState}>
                        <FlashContentLists data={this.state.data} nowTime={this.props.nowTime}/>
                    </Scroll>

            </div>
            </div>
        )
    }
}

function getURLParameter(name){
	let parameterStr = window.location.search.replace(/^\?/,''),
		reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)'),
		value = parameterStr.match(reg);
	return value ? value[2] : null;
}


class FlashContentList extends Component {
		constructor(props){
			super(props);
			this.channel = getURLParameter("channel");
		}
    getStatus() {
        let {data} = this.props;
        let intervalTime = Math.floor((new Date() - _localTime)/1000);
        let now = this.props.nowTime + intervalTime;
        let ret;
        if (now > data.end_time) {
            ret = 0;
        } else if (now > data.start_time) {
            ret = 1
        } else {
            ret = 2
        }
        return ret
    }
    urlHandle = ( url )=>{
	    if( this.channel ){
		    let  reg_schem =/^t/;
		    let  reg_channel= /channel/;
		    if( url && !reg_schem.test( url ) && !reg_channel.test( url )){
			    let reg_requrey = /\?/ ;
			    url = url  + (reg_requrey.test( url ) ? "&" :"?" )+"channel="+this.channel;
		    }
	    }
	    return url;
    }
    componentWillMount() {
        this.state = {
            collect: this.props.data.is_faved
        }
    }
    onCollect () {
        let self = this;
        let action = Action(this.state.collect ? "DelFav" : "Fav", {
            data: {
                item_id: this.props.data.item_id
            },
            success(data) {
                if (data.success) {
                    self.setState({
                        collect: !self.state.collect
                    })
                }
            }
        });
        $.ajax(action)
    }
    render() {
        let {data} = this.props;
        let {real_store} = data;
        let status = this.getStatus();
        return (
            <li>
                <div className="infor_l c-fl">
                    <Link to={this.urlHandle("/item?item_id=" + data.item_id)}>
                        <img src={data.primary_image} />
                        {!status? <div className="sale_statue c-tc">已结束</div> : !real_store ?<div className="sale_statue c-tc">已抢完</div> : null  }
                    </Link>
                </div>
                <div className="infor_r">
                    <Link to={this.urlHandle( "/item?item_id=" + data.item_id )} className="infor_tit">{data.title}</Link>
                    <div className="price_area">
                        <span className="price c-fl"><em>限时价</em>¥{data.promotion_price.toFixed(2)}</span>
                        {status < 2 ?
                        <span className={`c-tc c-fr ${status == 0 || !real_store? 'toseeit' : 'rightnow'}`}>
                            <Link to={this.urlHandle( "/item?item_id=" + data.item_id )}>{status ==0 || !real_store ?"去看看":"马上抢"}</Link>
                        </span>
                        :
                            <span className="c-tc c-fr  ahead_time uncollect-goods"  onClick={() => this.onCollect()}>
                                    {this.state.collect ? "已收藏": "抢先收藏"}
                            </span>
                        }
                    </div>
                    <div className="process">
                        {  status < 2 ?
                            (status ?
                           <div className="last-num">
                                <span>仅剩{data.real_store}件</span>

                           </div> : "")
                               :
                           <span className="ahead_time_storage">限量{data.promotion_store}件</span>
                        }
                    </div>
                </div>
            </li>
        )
    }
}

class FlashTimeInfo extends Component {
    constructor(props) {
        super(props);
        this.state = {};
    }
    componentWillReceiveProps(nextProps) {
        this.initState(nextProps)
    }
    componentDidMount() {
        this.initState()
    }
    componentWillUnmount() {
        window.clearTimeout(this.timer);
        this.timer = null
    }
    initState(nextProps) {
        let {active} = nextProps || this.props;
        let count = null;
        let intervalTime = Math.floor((new Date() - _localTime)/1000);
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        if (Type[active.type].countDown) {
            count =   active[Type[active. type].countField] - this.props.nowTime - intervalTime
            this.timeHandler()
        }
        this.setState({
            count: count
        })
    }
    getTimeInfo() {
        let {active} = this.props;
        return Type[active.type].timeText
    }
    timeHandler() {
       this.timer =setTimeout(() => {
            let count = this.state.count-1;
            if (count ==0) {
                location.reload()
            } else {
                this.setState({
                    count
                });
                this.timeHandler()
            }
        }, 1000)
    }

    getTimeCount() {
        let count = this.state.count > 0 ? this.state.count : 0;

        if (count) {
            let t = parse(count/3600);
            let s =parse(count/60%60)
            let m = parse(count%60);
            return t + ":" + s + ":" + m
        }
        return null
    }
    render() {
        return (<div className="timelast c-tc">
                    <div className="line-through"></div>
                    <span className="time-span">
                        {this.getTimeInfo()}
                        <span className="time">
                            {this.getTimeCount()}
                        </span>
                    </span>
        </div>)
    }
}