import React, { Component } from 'react';
import ReactDOM,{ render } from 'react-dom';
import { Link } from 'react-router';
import 'src/scss/item.scss';

import {FilterTrade, FilterTradeType,createMSG, createAction,PurchaseLimit,FilterTradeClass, TradeFade} from 'filters/index'
import {dateUtil} from "../../../js/util/index"
import {LoadingRound,EmptyPage,ShareAndTotop, LinkChange,OpenInAppGuide} from 'component/common';
import { browserHistory } from 'react-router';
import {onAreaResultJSBrige} from "../../../js/jsbrige/index"
import Popup , {Modal, Fix} from 'component/modal';


let Action = createAction({
    toCart: {
        url: "/api/cart-add.html",
        type: "post"
    },
    Spec: {
        url: "/api/wapapi/spec.api",
        type: "get"
    },
    DelFav: {
        url: "/api/member-collectdel.html",
        type: "post"
    },
    Fav: {
        url: "/api/member_fav.html",
        type: "post"
    },
    GetCoupon: {
        url: "/api/getCoupon.html",
        type: "post"
    }
}, true);


let PromotionInfo = {
    //特卖
    flashsale: {
        link: "/flashsale",
        getValue(props) {
            return (<span>限时特卖正在火热抢购中...</span>)
        },
        getNum(props, state) {
            let {itemRules} = props;
            let count = itemRules.user_buy_limit - itemRules.user_buy_count;
            if (state.nowPromotioinSpec) {
                return Math.min(count, state.nowPromotioinSpec.real_store);
            }
            return count
        },
        getStore(props, state) {
            return state.nowPromotioinSpec ? state.nowPromotioinSpec.real_store : true
        },
        name: "flashsale"
    },
    fullminus: {
        getValue(props) {
            let {itemdata} = props;

            let item = itemdata.rules.rule.map((val, i) => `满${val.limit_money}减${val.deduct_money}` + (i !== itemdata.rules.rule.length-1 ? ";" :""));
            if (itemdata.rules.no_capped) {
                item.push(";上不封顶")
            }
            return (
                <ul className="full-cut-list c-fl">
                    <li>
                    {item.join('')}
                    </li>
                </ul>
            )
        },
        name: "fullminus"
    },
    // 满折
    fulldiscount: {
        getValue(props) {
            let {rules} = props.itemdata;

            return (
                <ul className="full-cut-list c-fl">
                    <li>
                    {rules.map((val, i) => `${val.full}件${val.discount/10}折` + (i !== rules.length-1 ? ";" :"")).join('')};
                    </li>
                </ul>
            )
        }
    },
    // 直降
    directreduction: {

        getValue(props) {
            let {specs,promotion} = props;
            let {itemRules} = promotion;
            let sku_ids = itemRules.sku_ids.slice();
            let {min_promotion_price} = itemRules;
            let keys = Object.keys(specs), num;

            sku_ids = sku_ids.filter((val) => itemRules[val].promotion_price == min_promotion_price);

            keys.forEach((key) => {
                if (sku_ids.indexOf(specs[key].sku_id) >= 0 && (!num || specs[key].price - min_promotion_price > num)) {
                    num = specs[key].price - min_promotion_price
                }
            })

            return (
                <span>直降{num.toFixed(2)}元 </span>
            )
        }
    },
    default() {
        return null
    }
}

export function FreePostage({data, className}) {
    let {is_free} = data.dlytmplInfo;
    return (
        +is_free ? <span className={className + " free-postage-tag"}>包邮</span>:null
    )
}


function CouponClassFix(data) {
    if (data.isset_limit_money) {
        return "coupon-red"
    } else {
        return "coupon-yellow"
    }
}

export let CouponType = [
    {

        text() {
            return "指定商品适用"
        },
        title() {
            return "店铺劵"
        }
    },
    {
        text(data) {
            let s = (data.used_category + "_" + data.used_brand).replace(/[^_]+/g, (a) => a == "all" ? 0 : 1);

            return this[data.used_shop_type == "self" ?"platSelfValue": "platValue" ][s];
        },
        platValue: {
            "0_0": "指定商品适用",
            "1_1": "指定分类、品牌适用",
            "1_0": "指定分类适用",
            "0_1": "指定品牌适用"
        },
        platSelfValue: {
            "0_0": "指定自营商品适用",
            "1_1": "自营商品指定分类、品牌适用",
            "1_0": "自营商品指定分类适用",
            "0_1": "自营商品指定品牌适用"
        },
        title(data) {
            return data.used_shop_type == "self" ? "自营劵" : "平台劵"
        }
    }
]
let EvaluateGrade = {
    "Good": "好评!",
    "Bad" :"差评!",
    "Neutral": "中评!"
}


function getPrice(props) {
    let {data, nowPromotioinSpec, nowSpec, itemRules, showPrice} = props;

    return showPrice || parseFloat(nowPromotioinSpec && nowPromotioinSpec.promotion_price || nowSpec && nowSpec.price || itemRules.min_promotion_price || data.item.sell_price).toFixed(2)
}

class ScrollImage extends Component {

    static defaultProps = {
        src: "",
        alt: ""
    };

    render() {
        return (
            <div className="swiper-slide"><img data-src={this.props.src} alt={this.props.alt} className="swiper-lazy"/>
                <div className="swiper-lazy-preloader"></div>
            </div>
        )
    }
}


export class ScrollImageState extends Component {
    static defaultProps = {
        isUpdate: true
    };

    componentDidMount() {
        this.initSwiper();
    }

    componentDidUpdate() {
        if (this.props.isUpdate) {
            this.initSwiper();
        }
    }

    initSwiper() {
        if (this.swiper) {
            this.swiper.destory();
        }
        this.swiper = new Swiper(this.refs.swiper, {
            pagination: '.swiper-pagination',
            lazyLoading: true,
            paginationClickable: true,
            spaceBetween: 30,
            centeredSlides: true,
            loop: false,
            autoplayDisableOnInteraction: false
        });
    }

    render() {
        let html = this.props.data.map(function (item, i) {
            return <ScrollImage key={i} src={item}/>
        });

        return (
            <div data-plugin="swiper" data-page="trade-list">
                <div className="swiper-container detail-banner" ref="swiper">
                    <div className="swiper-wrapper">
                        {html}
                    </div>
                    <div className="swiper-pagination"></div>
                </div>
            </div>
        )
    }
}


export class GoodsTit extends Component {
    render() {
        let  strfilterTrade = FilterTrade(this.props.item.trade_type);
        let tradeClass = FilterTradeClass(this.props.item.trade_type);
        return (
            <div className="goods-tit">
                {strfilterTrade &&
                <span className={tradeClass}>{strfilterTrade}</span>}
                {this.props.item.title}
            </div>
        )
    }
}

export class Price extends Component {

    getPrice() {
        let {item_type} = this.props.data;
        let {price} = this.props;

        return  parseFloat(price ? price : item_type == "invest" ? 0 :  this.props.itemRules.min_promotion_price || this.props.data.item.sell_price).toFixed(2);
    }

    render() {
        let {market_price} = this.props.data.item;
        return (

            <div className="price-info">
                <span className="sale action-update-price c-fl"> ¥{this.getPrice()}</span>
                {market_price ?
                    <span className="sale  market-price c-fl"> ¥{market_price.toFixed(2)}</span> : null }
                <FreePostage {...this.props} className="c-fl" />
            </div>

        )
    }
}

export class Tag extends Component {
    getList() {
        let brandcountryImg = this.props.item.country;
        let tradeType = this.props.item.trade_type;
        let selfSupport = this.props.item.self_support;
        let strFilterTradeType = FilterTradeType(tradeType);
        let ret = [];

        brandcountryImg && ret.push(<li key='brandcountry'><img src={brandcountryImg.image}/>{brandcountryImg.text}
        </li>);
        selfSupport && ret.push(<li key='trc'><img src="/src/img/icon/trc-logo-icon.png"/> 泰然城</li>);
        strFilterTradeType && ret.push(<li key='tradetype'><img
            src="/src/img/icon/trade-type-icon.png"/> {strFilterTradeType}</li>);
        return ret;
    }

    render() {
        return (<div className="all-tag">
            <ul>
                {this.getList()}
            </ul>
        </div>)
    }
}


export class PriceArea extends Component {
    render() {
        return (
            <div className="price-area">
                <GoodsTit item={this.props.data.item}/>
                <Price item={this.props.data.item} dlytmplInfo={this.props.data.dlytmplInfo} {...this.props}/>
                <Tag item={this.props.data.item}/>
            </div>
        )
    }
}

class Add extends Component {
    static contextTypes = {
        isApp: React.PropTypes.bool,
        store: React.PropTypes.object
    };

    componentWillMount() {
        let {data} = this.props;

        this.setState({areaDate: this.props.data.default_city});

        window.onAreaResult = onAreaResultJSBrige(data.item.delivery_regions, (data, flag) => {
            this.setState({
                areaDate: data
            });
            if (!flag) {
                Popup.MsgTip({msg: "不在配送区域"});
            }
        });
    }

    componentWillUnmount() {
        window.onAreaResult = null;
    }

    render() {
        let { data} = this.props;

        let html = (
            <div>
                配送：
                <span className="addr-fh"> {data.dlytmplInfo  && data.dlytmplInfo.depart_add}</span> 至
                <i className="icon place-icon"></i>
                <span className="addr-solected">{this.state.areaDate}</span>
                <i className="icon icon-forward vertical-middle"><img
                    src="/src/img/icon/arrow/arrow-right-icon.png"/></i></div>
        );

        return (
            <div className="addr-ser">
                <div className="sever-addr">
                    {this.context.isApp ? <a href="jsbridge://getAreaInfo">{html}</a> : <LinkChange to="/">{html}</LinkChange>}
                </div>
            </div>
        )
    }
}


class GoodsModal extends Component {


    render() {
        let {item} = this.props.data;
        let departAdd = item.storehouse && item.storehouse.name;
        let isTradeFade = TradeFade(this.props.data);
        return (
            <Modal isOpen={this.props.modal} title="服务说明" className="modal sever-pop-wrap"
                   onClose={() => this.props.onClose()}>
                <section className="container">
                    <ul>
                        {isTradeFade && item.trade_type!== "Domestic" ?
                            <li>
                                <div className="hd">
                                    <i className="detail-serve-icon"></i>  商品税费
                                </div>
                                <div className="tax-cont">
                                    按照国家规定，本商品适用于跨境综合税，税率为{(item.tax.tax_rate*100).toFixed(2)}%， 实际结算税费请以提交订单时的应付总额明细为准。
                                </div>
                            </li> : null
                        }

                        {departAdd ?
                            <li>
                                <div className="hd">
                                    <i className="detail-serve-icon"></i> {departAdd}
                                </div>

                                <div className="tax-cont">
                                    本商品由{departAdd}发货。
                                </div>
                            </li> : null}
                             <li>

                            <div className="hd">
                                <i className="detail-serve-icon"></i> 正品保证
                            </div>
                            <div className="tax-cont">
                                泰然城每件商品都经过严苛的质量把关，保障正品、保障品质，杜绝一切假货，让您购物无忧。
                            </div>
                        </li>
                        {!this.props.noRetruen ?
                        <li>
                            <div className="hd">
                                <i className="detail-serve-icon"></i> 7天无忧退货
                            </div>
                            <div className="tax-cont">
                                收到商品之日起7天（含）内如有商品质量问题或溢漏损失等可申请售后进行退货。
                            </div>
                        </li>: null}
                    </ul>
                </section>
            </Modal>
        )
    }
}


class Goods extends Component {

    constructor(props) {
        super(props);
        this.state = {
            modal: false
        }
    };

    onClose() {
        this.setState({
            modal: !this.state.modal
        })
    }

    render() {
        let {data} = this.props;
        let departAdd = data.item.storehouse && data.item.storehouse.name;
        let isTradeFade = TradeFade(this.props.data);
        return (
            <div className="goods-tax" onTouchTap={()=> this.setState({modal: !this.state.modal})}>
                <div className="promotion-ti c-fl">说明：</div>

                <GoodsModal {...this.props} modal={this.state.modal} onClose={() => this.onClose()}/>
                <section className="promotion-list c-fl">
                    <div className="list-details">
                        <ul>
                            {
                                isTradeFade && data.item.trade_type!== "Domestic" ? <li><i className="detail-serve-icon"></i>商品税费</li> : null
                            }
                            {departAdd ?
                                <li><i className="detail-serve-icon"></i>{departAdd}</li>
                                : ""}
                            <li><i className="detail-serve-icon"></i>正品保证</li>
                            {!this.props.noRetruen ?  <li><i className="detail-serve-icon"></i>非质量不退换</li> : null}
                            {+data.dlytmplInfo.is_free ? <li><i className="detail-serve-icon"></i>包邮</li>: null}
                            <li><i className="detail-serve-icon"></i>担保交易</li>
                        </ul>
                        <i className="icon icon-forward vertical-middle"><img
                            src="/src/img/icon/arrow/arrow-right-icon.png"/></i>
                    </div>
                </section>
                <p className="clearfix"></p>
            </div>
        )
    }
}


export class SeverArea extends Component {
    render() {
        let {store} = this.context;
        return (
            <div>
                <Add {...this.props} />
                <Goods {...this.props} />
            </div>
        )
    }
}

export class EvaluateArea extends Component {
    render() {
        let {itemId,data} = this.props;
        return (
            <div className="evaluate-area detail">
                <div className="hd">
                    <LinkChange  to={`/evaluate?item_id=${itemId}`} data-notLogin={true}>
                        商品评价({data.rate.total})
                        <i className="icon icon-forward vertical-middle"><img
                            src="/src/img/icon/arrow/arrow-right-icon.png"/></i>
                    </LinkChange>
                </div>

               <EvaluateAreaContents {...this.props} />
            </div>
        )
    }
}

export class EvaluateAreaContents extends Component {

    getList() {
        let {rates} = this.props.data.rate;
        let {itemId} = this.props;
        let flag = true;

        if (rates.length == 3) {
            rates.some((val) => {if (!val.images.length) flag = false})
        } else {
            flag = false;
        }

        if (flag) {
            return rates.map((val, i)=> <EvaluateAreaContent data={val} key={i} itemId = {itemId} />)
        }
        return null
    }
    componentDidMount() {
        if (this.refs.swiper) {
            this.initSwiper();
        }
    }
    initSwiper() {
        this.swiper = new Swiper(this.refs.swiper, {
            loop: false,
            slidesPerView : 1.5,
            spaceBetween: 10
        });
    }
    render() {
        let html = this.getList();

        return (
            html ?
                <div data-plugin="swiper">
                    <div className="swiper-container evaluate-swiper-container" ref="swiper">
                        <div className="swiper-wrapper">
                            {html}
                        </div>
                    </div>
                </div>
                : null
        )
    }
}
//
class EvaluateAreaContent extends Component {
    getName(name) {
        return name ? name.replace(/(\d{3})\d{5}(\d{3})/, "$1*****$2") : null
    }

    render() {
        let {data, itemId} = this.props;
        return (
            <div className="swiper-slide">
                <LinkChange  to={`/evaluate?item_id=${itemId}`} data-notLogin={true}>
                    <div className="c-fl">
                        <h2><span><img src={data.head_portrait || "/src/img/evaluate/no-user.png"} /></span><font>{this.getName(data.show_name)}</font></h2>
                        <div className="evaluate-content">
                            {data.content || EvaluateGrade[data.experience]}
                        </div>
                    </div>
                    <div className="c-fr">
                        <img src ={data.images[0]} />
                    </div>
                </LinkChange>
                <p className="c-cb"></p>
            </div>
        )
    }
}



export class GoodsDetail extends Component {
    constructor(props) {
        super(props);
        this.state = {
            active: 0
        }
    }
    componentDidMount() {
        let height = $(window).height();
        $(this.refs.detail).css('min-height', height - 40)
    }
    changeTag(active) {
        if (active != this.state.active) {
            this.setState({
                active
            })
        }
    }

    checkTag(active) {
        return this.state.active === active ? "active" : "";
    }

    getList() {
        let {item} = this.props.data
        let {properties} = this.props.data.item;
        let ret = [
            <li key="id">商品编号：<span className="c-fr">{item.art_no}</span></li>,
            <li key="time">上架时间：<span className="c-fr">{dateUtil.format(item.shelved_at * 1000, "Y-M-D")}</span></li>,
            <li key="weight">商品毛重：<span className="c-fr">{item.weight}kg</span></li>
        ];
        for (var i in properties) {
            ret.push(<li key={i}>{properties[i].name}：<span className="c-fr">{properties[i].text}</span></li>)
        }
        return ret
    }

    getGoodsHtml() {
        return {__html: 'First &middot; Second'};
    }

    render() {
        let {data} = this.props;
        let item_t_type =data.item.trade_type;
        return (
            <div className="pic-area detail goods-detail">
                <Fix>
                    <div className="tab-ti-wrap">
                        <div className="tab-ti">
                            <ul>
                                <li className={this.checkTag(0)} onClick={()=>this.changeTag(0)}><span>图文详情</span>
                                </li>
                                <li className={this.checkTag(1)} onClick={()=>this.changeTag(1)}><span>商品参数</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </Fix>
                <div className="tab-con">
                    <div className={"tw-con " + this.checkTag(0)}>
                        {item_t_type=='Direct'|| item_t_type =='Overseas' ?
                            <div className='zhiyou img-w'>
                                <img src="/src/img/pintuan/zhiyou.jpg"/>
                            </div>
                            :null
                        }
                        <div className="goods-pic" dangerouslySetInnerHTML={{__html: data.item.desc && data.item.desc.handset}}>
                        </div>
                        { item_t_type =='Direct' || item_t_type =='Bonded' || item_t_type =='Overseas' ?
                        <div className="goods_text img-w" >
                        <img src="/src/img/pintuan/goods_text.jpg"/>
                        </div>
                            :''
                        }
                        <div className="price_text img-w">
                            <img src="/src/img/pintuan/price_text.jpg"/>
                        </div>
                    </div>
                    <div className={"cs-con " + this.checkTag(1)} ref="detail">
                        <ul className="goods-detail">
                            {this.getList()}
                        </ul>
                    </div>
                </div>
            </div>
        )
    }
}


// 收藏
export class Collect extends Component {
    componentWillMount() {
        this.state = {
            collect: this.props.data.item.favorite
        }
    }
    locked(flag) {
        if (flag != null) {
            this.update = flag;
        }
        return this.update
    }
    onCollect() {
        let self = this;
       if (!this.locked()) {
           this.locked(true);
           let action = Action(this.state.collect ? "DelFav" : "Fav", {
               data: {
                   item_id: this.props.itemId
               },
               success(data) {
                   if (data.success) {
                       self.setState({
                           collect: !self.state.collect
                       })
                   }
               },
               complete() {
                   self.locked(false)
               }
           });
           $.ajax(action)
       }

    }

    render() {
        return (
            <div className="collect">
                <LinkChange className={this.state.collect ? "save curr uncollect-goods" : "save collect-goods"} onClick={() => this.onCollect()}>
                    {
                        this.state.collect ? [<span className="icon icon-favor text_sc" key="0"><img src="/src/img/icon/collected-icon.png"/></span>, <span className="icon-title" key="1">已收藏</span>] :
                            [<span className="shoucang" key="0"><img src="/src/img/icon/collect-icon.png"/></span>, <span className="icon-title" key="1"> 收藏</span>]
                    }
                </LinkChange>

            </div>
        )
    }
}

// 购物袋
export class ToCart extends Component {

    render() {
        let {data} = this.props
        return (
            <div className="collect serve-kf tocart">
                <LinkChange to="/shopCart" className="save">

                <span className="details-kf">
                <img src="/src/img/icon/tocart-icon.png"/>
                    {data.cartCount &&data.cartCount.countCart ? <em>{data.cartCount.countCart}</em> : null }
                </span>

                    <span className="icon-title">购物袋</span>
                </LinkChange>
            </div>
        )
    }
}

export class Specs extends Component {

    initList() {
        let {isOn, spec, changeOn} = this.props;
        let values = spec.values;
        let ret = [];
        let keys = Object.keys(values);
        keys.forEach((i, keys) => {
            let specValue = values[i];
            ret.push(
                <li key={keys} className={isOn(specValue.spec_value_id, spec.spec_id)}
                    onTouchTap={ () => changeOn(specValue.spec_value_id, spec.spec_id)}>
                    <a href="javascript:;" title={specValue.text}>
                        {spec.show_type == "Text" ? specValue.text :
                            <img src={specValue.image} width="25" height="25"/>}
                    </a>
                </li>)
        })

        return ret
    }

    render() {
        let {spec} = this.props;
        return (
            <div className="color parameter">
                <span className="tit">
                {spec.name}
                </span>
                <ul className="size_ul">
                    {this.initList()}
                </ul>
            </div>

        )
    }
}


class BuyModalTitle extends Component {

    initList() {
        let {clickList, data, getSpec} = this.props;
        let keys = Object.keys(clickList);
        let list = [], spec;

        if (!keys) {
            return
        } else {
            keys.forEach((val, keys) => {
                spec = getSpec(val, clickList[val]);
                list.push(<span key={keys}>{spec.text}</span>)
            });

            return (
                <p className="text-price-sel" style={{display: "block"}}>已选
                    {list}
                </p>
            )
        }
    }
    render() {
        let {item } = this.props.data;
        let  strfilterTrade = FilterTrade(item.trade_type);
        let tradeClass = FilterTradeClass(item.trade_type);
        return (
            <ul className="ui-table-view">
                <li className="ui-table-view-cell">
                <span className="posit-img"><img className="ui-media-object ui-pull-left" src={item.primary_image}
                                                 width="80" height="80"/></span>
                    <div className="ui-media-body window-head">
                        {
                            strfilterTrade ?
                             <p style={{position: "relative", height: "18px"}}>
                                <span className={tradeClass}>{strfilterTrade}</span>
                            </p>:null
                        }
                        <div className="price-tag">
                            <p className="ui-ellipsis text-price action-update-price">
                                ¥{getPrice(this.props)}</p>
                            <p className="free-postage-tag-wrap">
                                <FreePostage {...this.props} />
                            </p>
                        </div>
                        {this.initList()}
                    </div>
                </li>
            </ul>
        )
    }
}

export class ExpectTax extends Component{
    constructor(props) {
        super(props);
        this.state = {
            rateShow: false
        }
    }
    getRate() {
        let {item} = this.props.data;
        let isTradeFade = TradeFade(this.props.data);

        if (!isTradeFade || item.trade_type=== "Domestic") {
            return null
        }
        let realRate = item.tax.tax_rate*100;
        let rate = realRate.toFixed(2);
        let price = getPrice(this.props);
        let tax = (this.props.num * realRate*price/100);
        tax  =  +tax.toFixed(2) + (tax - tax.toFixed(2) >=0.001 ? 0.01:0);

        return (<div>
            <div className="expect_tax" onClick={() => this.setState({rateShow: !this.state.rateShow})}>
                预计税费
                <span className={"icon_slide c-fr " + (this.state.rateShow ? "rotate" : "")}><img src="/src/img/icon/arrow/arrow-btm-icon.png" /></span>
                <span className="tax_count c-fr" style={{display: this.state.rateShow ? "none": "block"}}>￥{tax}</span>
            </div>
            <div className="expect_tax_con disnon" style={{display: this.state.rateShow ? "block": "none"}}>
                <div className="tax_count">￥{tax}</div>
                <div className="hd">
                    <img src="/src/img/icon/checked-icon.png" /> 税率<span id="tax_cou">{rate}</span>%
                </div>
                <div className="tax_cont tax_cont1"> 按照国家规定，本商品适用于跨境综合税，税率为{rate}%， 实际结算税费请以提交订单时的应付总额明细为准。</div>
                <div className="hd">
                    <img src="/src/img/icon/checked-icon.png" /> 税费计算
                </div>
                <div className="tax_cont">
                    进口税费=商品完税价格(包括运费)*税率
                </div>
            </div>
        </div>)
    }

    render () {
        return this.getRate()
    }
}

class BuyModalInfo extends Component {

    initList() {
        let {specs} = this.props.data.item;
        let specsKeys = Object.keys(specs);
        let ret = [];
        specsKeys.forEach((val, keys) => {
            ret.push(<Specs spec={specs[val]} {...this.props} key={keys}/>)
        });
        return ret
    }

    getLimit() {
        let {activity_type} = this.props.data;
        let {itemRules} = this.props
        if (activity_type == PromotionInfo.flashsale.name) {
            return (
                <span className="limit_buy">限购{itemRules.user_buy_limit}件
                        {itemRules.user_buy_count ? `(已购${itemRules.user_buy_count}件)` : ""}
                </span>
            )
        }
        return null
    }


    render() {
        let {addMinNum, num} = this.props;

        return (
            <div className="attr-wrap">
                <div className="standard-area stable-standard cur">
                    <div className="standard-info">
                        {this.initList()}
                    </div>
                </div>
                <div className="buy-amount">
                    <span className="amount-tit">数量：</span>
                <span className="number-increase-decrease" style={{position: "relative"}}>
                <a href="javascript:void(0);" className="btn action-decrease"
                   onTouchTap={() => addMinNum(-1)}>-</a>
                <input type="number" readOnly className="action-quantity-input"
                       value={num}/>
                <span className="input_bak"></span>
                <a href="javascript:void(0);" className="btn action-increase"
                   onTouchTap={() => addMinNum(1)}>+</a>
                </span>
                    {this.getLimit()}
                    <div className="clearfix"></div>
                </div>
                <ExpectTax {...this.props} />
            </div>
        )
    }
}

class BuyModalButton extends Component {
    noop() {}
    render() {
        let {active, onClickCart, onClickBuy, getStore,purchaseLimit} = this.props;
        let isPurchaseLimit = purchaseLimit();

        return (
            <div className="buy-option-btn">
                {  getStore() ? active === "cart" ? <div className="btn-addcart" onTouchTap={onClickCart}>加入购物袋</div> :
                        <div>
                         { isPurchaseLimit ? <span className="purchase-limit">抱歉，海外直邮类商品和跨境保税类商品总价超过限额￥2000，请分次购买。</span>: null}
                         <div className={isPurchaseLimit ? "c-bgc9" : "" + " btn-tobuy "} onTouchTap={isPurchaseLimit ? this.noop : onClickBuy}>立即购买</div>
                        </div>
                    : <div className="buy_fast_no has_sellout" style={{color: "#fff", zIndex: 15, background:"#FF8888"}}>已售罄</div>
                }
            </div>
        )
    }
}


class BuyModal extends Component {

    componentWillMount() {
        this.state = this.initState();
    }

    isOn = (id, spec)=> {
        return this.state.clickList[spec] == id ? "on" : ""
    }

    changeOn = (id, spec)=> {
        if (this.state.clickList[spec] === id) {
            return
        }
        this.state.clickList[spec] = id;
        if (this.updateSpec())
            this.updateNum(this.state.num);
        this.setState(this.state);
    }

    updateNum(num) {
        let {store} = this.props.data.item;
        let {activity_type} = this.props.data
        let {nowSpec, nowPromotionSpec} = this.state
        let snum, fn;
        if (num < 1) {
            return false
        }
        if (PromotionInfo[activity_type] && (fn = PromotionInfo[activity_type].getNum)) {
            snum = fn(this.props, this.state)
        } else {
            snum = nowPromotionSpec && nowPromotionSpec.real_store || (nowSpec ? nowSpec.store : store.total - store.freeze);
        }

        this.changeState({
            num: num > snum ? snum == 0 ? 1 : snum : num
        });

        return num > snum ? snum : true
    }

    changeState(obj) {
        this.setState(Object.assign(this.state, obj));
    }

    initState(num) {
        let ret = {
            isValid: this.state && this.state.isValid,
            nowSpec: null,
            clickList: {},
            nowSpecKey: null,
            nowPromotioinSpec: null,
            num: num || 1
        }

        let {specs} = this.props.data.item;
        this.specList = Object.keys(specs);

        if (!this.specList.length) {
            let nowSpec = ret.nowSpec = this.props.specs[0];
            ret.nowPromotioinSpec = this.props.itemRules[nowSpec.sku_id]
        }

        return ret
    }

    getSpec = (id, specId)=> {
        let {specs} = this.props.data.item;

        return specs[id].values[specId];
    }

    addMinNum = (num)=> {
        let cnum = this.state.num + num;
        let v = this.updateNum(cnum);

        if (v !== true) {
            Popup.MsgTip({
                msg: num < 0 ? createMSG("MINNUM") : createMSG("MAXNUM", v)
            })
        }
    }

    onClickCart = ()=> {
        if (!this.checkSpec()) {
            Popup.MsgTip({
                msg: createMSG("SELECTSPEC")
            });
            return
        }
        $.ajax(Action("toCart", {
            data: this.getActionData(),
            success: () => {
                this.closeAndClear()
            }
        }))
    }
    getStore = () => {
        let {activity_type} = this.props.data;
        let fn;
        if (PromotionInfo[activity_type] && (fn = PromotionInfo[activity_type].getStore)) {
            return fn(this.props, this.state)
        } else if (this.state.nowSpec) {
            return this.state.nowSpec.store > 0
        } else {
            return true
        }
    }

    purchaseLimit = ()=> {
        let {trade_type} = this.props.data.item;
        if (this.state.num > 1 && this.state.nowSpec && PurchaseLimit(trade_type)) {
            return this.state.num * this.state.nowSpec.price > 2000
        }
    }

    getActionData(flag) {
        let ret = {
            "item[item_id]": this.props.itemId,
            "item[quantity]": this.state.num,
            "item[sku_id]": this.state.nowSpec.sku_id
        }

        flag && (ret.mode = "fast_buy");
        return ret
    }

    closeAndClear() {
        this.props.toggleModal();
        this.setState(this.initState());
    }

    onClickBuy = ()=> {
        if (!this.checkSpec()) {
            Popup.MsgTip({
                msg: createMSG("SELECTSPEC")
            });
            return
        }
        $.ajax(Action("toCart", {
            data: this.getActionData(true),
            success: (result) => {
                this.closeAndClear();
                if (!result.status) {
                    return;
                }

                browserHistory.push('/orderConfirm?mode=fast_buy');
            }
        }))
    }

    updateSpec() {
        if (!this.checkSpec()) {
            return false;
        }
        let key = this.specList.join("_").replace(/\d+/g, (key) => this.state.clickList[key]);
        let nowSpec
        if (key !== this.state.nowSpecKey) {
            nowSpec = this.props.specs[key];
            this.changeState({
                nowSpec,
                nowSpecKey: key,
                nowPromotioinSpec: this.props.itemRules[nowSpec.sku_id]
            });
        }

        return this.state.nowSpec;
    }

    checkSpec() {
        if (Object.keys(this.state.clickList).length === this.specList.length) {
            return true
        }
    }

    render() {
        let props = {
            addMinNum: this.addMinNum,
            isOn: this.isOn,
            getStore: this.getStore,
            changeOn: this.changeOn,
            getSpec: this.getSpec,
            onClickCart: this.onClickCart,
            onClickBuy: this.onClickBuy,
            purchaseLimit: this.purchaseLimit.bind(this),
            ...this.state,
            ...this.props
        };
        return (
            <Modal isOpen={this.props.modal} onClose={() => this.closeAndClear()} className="action-buy-modal">
                <div className="in-panel">
                    <div className="in-panel">
                        <div className="close-btn-wrap">
                            <span className="close-btn"><i className="icon icon-close"></i></span>
                        </div>
                        <BuyModalTitle {...props} />
                        <BuyModalInfo {...props} />

                        <BuyModalButton {...props} />
                    </div>
                </div>
            </Modal>
        )
    }
}

export class Buy extends Component {
    constructor(props) {
        super(props);
        this.state = {
            modal: false,
            active: null,
        }
    }

    active(tab) {
        this.setState({
            modal: true,
            active: tab
        })
    }

    toggleModal = ()=> {
        this.setState(Object.assign(this.state, {
            modal: false
        }))
    }
    isShelves = () => {
        return this.props.data.item.status === "Shelves"
    }
    isSaleOut() {
        let {promotion} = this.props;
        let {item} = this.props.data;
        let realStore =  promotion && promotion.itemRules && promotion.itemRules.real_store;
        if (realStore == null) {
            realStore =  +item.realStore
        }
        return !! realStore
    }
    isCharge() {
        let {item} = this.props.data;
        return item.is_charge
    }
    render() {
        let props = {
            ...this.props,
            ...this.state,
            toggleModal: this.toggleModal
        }
        return (
                this.isCharge() ? null :
                this.isShelves() ?
                    this.isSaleOut() ?
                <div className="action-btn-group c-fr">
                    <BuyModal {...props} />
                    <LinkChange className="ui-btn  action-addtocart c-fl" onTouchTap={() => {Modal.close();this.active("cart")}}>加入购物袋</LinkChange>
                    <LinkChange className="ui-btn  action-buy-now c-fl" onTouchTap={() => {Modal.close();this.active("buy")}}>立即购买</LinkChange>
                </div>
                :
                  <div className="action-btn-group c-fr">
                        <LinkChange type="button" className="ui-btn action-notify">已售罄</LinkChange>
                    </div>:
                <div className="action-btn-group c-fr">
                      <LinkChange type="button" className="ui-btn action-notify">暂不销售</LinkChange>
                </div>

        )
    }
}


export let createBuyAction = function ({Buy}) {

    return class BuyAction extends Component {

        render() {
            return (
                <div className="buy-action">
                    {/*  客服 */}
                    <div className="collect serve_kf">
                        <a  href="taihe://to_customer_service" className="save" >
                            <span className="details_kf"><img src="/src/img/icon/serve-phone-icon.png"/></span><span
                            className="icon-title">客服</span>
                        </a>
                    </div>
                    {/* 收藏 */}
                    <Collect {...this.props}/>
                    {/* 购物袋 */}
                    <ToCart {...this.props} />
                    {/* 加入购物袋 立即购买*/}
                    <Buy {...this.props} />
                </div>
            )
        }
    }
}

let BuyAction = createBuyAction({Buy})


// 促销
class PromotionWrap extends Component {
    getList() {

    }
    getPromotion() {
        let {promotion} = this.props;
        return promotion[0] ? <Promotion {...this.props}/> : null
    }

    render() {
        return (
            this.getPromotion()
        )
    }
}

class Promotion extends Component {
    constructor(props) {
        super(props)
        this.state = {modal: false}
    }

    getList(flag) {
        let {promotion} = this.props;
        let i = 0, ret = [], item;

        while (item = promotion[i]) {
            ret.push(<PromotionDefault {...this.props} itemdata={item} key={i} hasLink={flag}/>)
            i++
        }
        return ret
    }

    toggle(flag) {
        this.state.modal = flag
        this.setState(this.state);
    }

    render() {
        return (
            <div>
            <div className="goods-promotion" onClick={() => this.toggle(!this.state.modal)}>
                <Modal isOpen={this.state.modal} title="促销活动" onClose={() => this.toggle(false)}
                       className="goods-promotion-modal">
                    <section className="promotion-list">
                        <div className="list-details">
                            <ul className="promotion-ul">
                                {this.getList(true)}
                            </ul>
                        </div>
                    </section>
                </Modal>

                <div className="promotion_ti c-fl">促销：</div>
                <section className="promotion-list c-fl">
                    <div className="list-details">
                        <ul className="promotion-ul">
                            {this.getList()}
                        </ul>
                    </div>
                </section>
                <i className="icon icon-forward vertical-middle"><img
                    src="/src/img/icon/arrow/arrow-right-icon.png"/></i>
                <p className="clearfix"></p>
            </div>
                <div className="gap bgf4"></div>
            </div>
        )
    }
}


class PromotionDefault extends Component {
    linkTo() {
        let link = this.getLink();

        if (link) {
            browserHistory.push(link);
        }
    }

    getLink() {
        let {itemdata} = this.props;
        let PInfo = PromotionInfo[itemdata.promotion_type];
        return PInfo && PInfo.link
    }

    render() {
        let {itemdata, hasLink} = this.props;
        let PInfo = PromotionInfo[itemdata.promotion_type];
        return (
            <li className="promotion-li" onClick={() => hasLink && this.linkTo()}>
                <div className="clearfix">
                    <button type="button" className="c-fl">{itemdata.promotion_tag}</button>
                    {
                        PInfo ? <PInfo.getValue {...this.props} /> : <PromotionInfo.default {...this.props} />
                    }
                    {hasLink && this.getLink() ? <i className="icon icon-forward vertical-middle"><img
                        src="/src/img/icon/arrow/arrow-right-icon.png"/></i> : null}
                </div>
            </li>
        )
    }
}


// 分期
class StageModalInfo extends Component {
    initList() {
        let {specs} = this.props.data.item;
        let specsKeys = Object.keys(specs);
        let ret = [];
        specsKeys.forEach((val, keys) => {
            ret.push(<Specs spec={specs[val]} {...this.props} key={keys}/>)
        });
        return ret
    }

    initStateList() {
        return <StageList {...this.props} strategy={this.props.nowSpec["periods"]}/>
    }

    render() {
        return (
            <div className="attr-wrap">
                <div className="standard-area">
                    <div className="standard-info">
                        {this.initList()}
                    </div>
                </div>

                <div className="standard-area installment-area">
                    <div className="standard-info">
                        {this.initStateList()}
                    </div>
                </div>
            </div>
        )
    }
}

export class StageList extends Component {

    initList() {
        let {isStageOn, strategy, changeStage} = this.props;
        let ret = [];

        strategy.forEach((key, i) => {
            ret.push(
                <li key={i} className={isStageOn(key)} onTouchTap={ () => changeStage(key)}>
                    <a href="javascript:;" dangerouslySetInnerHTML={this.getText(key)}></a>
                </li>)
        })

        return ret
    }

    getText(val) {
        let {sell_price} = this.props.data.item;
        let numT = ((sell_price / val.number + sell_price * val.fee_rate).toFixed(2))
        let rateT = val.fee_rate == 0 ? "无手续费" : "手续费率" + val.fee_rate * 100 + "%";

        return ({__html: "￥" + numT + "&times;" + val.number + "期<br/>" + rateT})
    }

    render() {
        let {spec} = this.props;
        return (
            <div className="color parameter">
                <span className="tit">分期购买</span>
                <ul className="size_ul">
                    {this.initList()}
                </ul>
            </div>

        )
    }
}


class StageModalButton extends Component {
    render() {
        let {getStore, onClickStage} = this.props;

        return (
            <div className="buy-option-btn">
                {  getStore() ?
                    <div className="btn-addcart" onTouchTap={onClickStage}>分期购买</div>
                    : <div className="buy_fast_no has_sellout"
                           style={{color: "#fff", zIndex: 15, background:"#FF8888"}}>已售罄</div>
                }
            </div>
        )
    }
}

class StageModal extends Component {
    componentWillMount() {
        this.state = this.initState();
    }

    isOn = (id, spec)=> {
        return this.state.clickList[spec] == id ? "on" : ""
    }
    onClickStage = () => {
        if (!this.checkSpec()) {
            Popup.MsgTip({
                msg: createMSG("SELECTSPEC")
            });
            return
        } else if (!this.state.stage) {
            Popup.MsgTip({
                msg: createMSG("STRATEGY")
            });
            return
        }

        $.ajax(Action("toCart", {
            data: {
                "item[item_id]": this.props.itemId,
                "item[quantity]": 1,
                "item[sku_id]": this.state.nowSpec.sku_id,
                "obj_type": "stage_buy",
                'params[strategy]': this.state.nowSpec.strategy,
                "params[period]": this.state.stage.number,
                "params[fee_rate]": this.state.stage.fee_rate,
                "mode": "fast_buy"
            },
            success: (result) => {
                this.closeAndClear();
                if (!result.status) {
                    return;
                }
                browserHistory.push('/orderConfirm?mode=fast_buy');
            }
        }))
    }

    closeAndClear() {
        this.props.toggleModal();
        this.setState(this.initState());
    }

    getSpec = (id, specId)=> {
        let {specs} = this.props.data.item;

        return specs[id].values[specId];
    }
    changeOn = (id, spec)=> {
        if (this.state.clickList[spec] === id) {
            return
        }
        this.state.clickList[spec] = id;
        this.state.stage = null

        this.setState(this.state);
    }

    initState() {
        let keys = Object.keys(this.props.specs);
        let ret = {
            nowSpec: this.props.specs[keys[0]],
            clickList: {},
            nowSpecKey: null,
            stage: null
        }
        let {specs} = this.props.data.item;
        this.specList = Object.keys(specs);
        return ret
    }

    getStore = () => {
        if (this.state.nowSpec) {
            return this.state.nowSpec.store > 0
        } else {
            return true
        }
    }
    isStageOn = (stage)=> {
        return this.state.stage === stage ? "on" : ""
    }

    changeStage = (stage)=> {
        if (this.state.stage !== stage) {
            this.state.stage = stage;
            this.setState(this.state)
        }
    }

    updateSpec() {
        if (!this.checkSpec()) {
            return false;
        }
        let key = this.specList.join("_").replace(/\d+/g, (key) => this.state.clickList[key]);
        let nowSpec;
        if (key !== this.state.nowSpecKey) {
            nowSpec = this.props.specs[key];
            this.changeState({
                nowSpec,
                nowSpecKey: key
            });
        }

        return this.state.nowSpec;
    }

    changeState(obj) {
        this.setState(Object.assign(this.state, obj));
    }

    checkSpec() {
        if (Object.keys(this.state.clickList).length === this.specList.length) {
            return true
        }
    }

    render() {
        let props = {
            isStageOn: this.isStageOn,
            changeOn: this.changeOn,
            isOn: this.isOn,
            getSpec: this.getSpec,
            getStore: this.getStore,
            onClickStage: this.onClickStage,
            changeStage: this.changeStage,
            ...this.state,
            ...this.props
        };

        return (
            <Modal isOpen={this.props.modal} onClose={() => this.closeAndClear()} className="action-buy-modal">
                <div className="in-panel">
                    <div className="in-panel">
                        <div className="close-btn-wrap">
                            <span className="close-btn"><i className="icon icon-close"></i></span>
                        </div>
                        <BuyModalTitle {...props} />
                        <StageModalInfo {...props} />
                        <StageModalButton {...props} />
                    </div>
                </div>
            </Modal>
        )
    }
}


class StageWrap extends Component {
    getStage() {
        let {item_type} = this.props.data;
        if (item_type == "installment") {
            return <Stage {...this.props} />
        }
        return null
    }

    render() {
        return this.getStage()
    }
}


class Stage extends Component {
    componentWillMount() {
        this.state = {
            modal: false
        };
    }

    render() {
        return (
            <div>
                <div className="installment" id="installment_bar" onClick={() => this.setState({modal: true})}>
                    <StageModal {...this.props} modal={this.state.modal}
                                                toggleModal={() => this.setState({modal: false})}/>
                    <ul>
                        <li>分期购买</li>
                    </ul>
                    <i className="icon icon-forward vertical-middle"><img
                        src="/src/img/icon/arrow/arrow-right-icon.png"/></i>
                </div>
                <div className="gap bgf4"></div>
            </div>
        )
    }
}


// 优惠劵
export class CouponWrap extends Component {
    getCoupon() {
        let {promotion} = this.props;
        if (promotion.coupon) {
            return <Coupons {...this.props} />
        }
        return null
    }

    render() {
        return this.getCoupon()
    }
}

class Coupons extends Component {
    constructor(props) {
        super(props);
        this.state = {}
    }

    getCouponList() {
        let {coupon} = this.props.promotion
        let i = 0, ret = [], item;

        while (item = coupon[i]) {
            ret.push(<span key={i}>满{item.limit_money}减{item.deduct_money}</span>)
            i++
        }
        return ret
    }

    getModalCouponList() {
        let {coupon} = this.props.promotion
        let i = 0, ret = [], item;

        while (item = coupon[i]) {
            ret.push(<Coupon {...this.props} itemdata={item} key={i}/>)
            i++
        }
        return ret
    }

    onClose = () => {
        this.state.modal = false;
        this.setState(this.state)
    }

    render() {
        return (
            <div className="addr-ser">
                <Modal title="优惠劵" isOpen={this.state.modal} onClose={this.onClose} className="goods-coupon-modal">
                    <div className="coupon-wrap">
                        <h2>可领优惠劵</h2>
                        <div className="coupone-list">

                            {this.getModalCouponList()}

                        </div>
                    </div>
                </Modal>
                <div className="sever-addr" >
                    <LinkChange className="coupon-list" onClick={() => {
                    this.setState({modal: true})
                }}>
                        领券： {this.getCouponList()}
                        <i className="icon icon-forward vertical-middle"><img
                            src="/src/img/icon/arrow/arrow-right-icon.png"/></i>
                    </LinkChange>
                </div>
            </div>)
    }
}

class Coupon extends Component {
    getUse() {
        let {used_platform} = this.props.itemdata;
        if( used_platform ==="all"){
        	return "";
        }
        return "(限" + used_platform.split(',').map((val) => {
                return val.toUpperCase() + "端"
            }).join("、") + "使用)"

    }

    getCoupon = ()=> {
        let {itemdata, data} = this.props;
        $.ajax(Action("GetCoupon", {
            data: {
                coupon_id: itemdata.coupon_id,
                shop_id: data.item.shop_id
            },
            success(data) {
                if (data.statusCode) {
                    Popup.MsgTip({msg: "领取优惠劵成功"})
                }
            }
        }))
    }

    render() {
        let {itemdata} = this.props
        let i = itemdata.coupon_type;
        return (
            <div className={"coupon " + CouponClassFix(itemdata)}>
                <div className="coupon-li-wrap">
                <div className="c-fl coupon-left">
                    <h3><span>¥</span>{itemdata.deduct_money}</h3>
                    <p>满{itemdata.limit_money}使用</p>
                </div>
                <div className="c-fr coupon-right">
                    <h3>{CouponType[i].title(itemdata)}<span>{this.getUse()}</span></h3>
                    <p className="coupon-right-type">

                        &bull;&nbsp;{CouponType[i].text(itemdata)}
                    </p>
                    <p className="coupon-right-use-date">{dateUtil.format(itemdata.use_start_time * 1000, "Y.M.D")}
                        至 {dateUtil.format(itemdata.use_end_time * 1000, "Y.M.D")} <span onClick={this.getCoupon}>立即领取</span>
                    </p>
                </div>
                </div>
            </div>
        )
    }
}


// 活动
export class ActiveArea extends Component {
    render() {
        return ( <div className="active-area">

            { /* <StageWrap {...this.props} /> */}
            <CouponWrap {...this.props} />
            <PromotionWrap {...this.props} />
        </div>)
    }
}
export function createShareData(data) {
    return {
        title: data.item.title,
        content: "我在泰然城发现了一个不错的商品，赶快来看看吧。",
        link: window.location.href,
        icon: data.item.images[0]
    }
}



export default class detail extends Component {
    render() {
        let {data} = this.props;
        return (
            <div data-page="item-details" id="itemDetails">
                <ScrollImageState data={data.item.images}/>
                <PriceArea {...this.props} />
                <div className="gap bgf4"></div>
                <ActiveArea {...this.props} />
                <SeverArea data={data}/>
                <div className="gap bgf4"></div>
                <EvaluateArea {...this.props}/>
                <div className="gap bgf4"></div>
                <GoodsDetail data={data}/>
                <BuyAction {...this.props} />
                <ShareAndTotop config={createShareData(data)}/>
                <OpenInAppGuide />
            </div>
        )
    }
}