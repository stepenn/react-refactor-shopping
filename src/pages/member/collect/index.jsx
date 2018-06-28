import React, { Component } from 'react';
import { Link } from 'react-router';
import ReactDOM,{ render } from 'react-dom';
import Popup from 'component/modal';
import {ownAjax} from '../../../js/common/ajax.js';
import 'src/scss/collect.scss';
import {LoadingRound } from 'component/common';
import { DropDownLoad } from 'component/highComp';

const ctrlAPI = {
  init: {url: "/api/wapapi/member-collectitems.api?pages=1", type: "get"},
  del: {url: '/api/wapapi/member-collectdel.api', type: "get"},
};
export default class Collect extends Component {
  constructor(props){
    super(props)
    this.pages=1;
    this.total = 100;
    this.state = {
      goodsData: [],
      success: false
    }
  }
  componentWillMount(){
    document.title = '商品收藏';
    location.href="jsbridge://set_title?title=商品收藏";
  }
  //删除数据
  onDelete=( id )=>{
    let newData =this.state.goodsData;
    for( let i= 0,arr; arr=newData[i];i++){
      if( arr.item_id == id ){
        newData.splice(i,1);
      }
    }
    this.setState({
      goodsData:newData
    })
  };
  loadDownHandle=( me )=> {
    const self = this;
    if (this.pages >= this.total) {
      me.lock();
      me.noData();
      me.resetload();
      return;
    }
    this.pages++
    const sources = '/api/wapapi/member-collectitems.api?pages='+this.pages;
    $.ajax({
      url:sources,
      type:'get',
      success:function(result){
        let {goodsData} = self.state;
        if( !result.data.fav_info ) {
          me.lock();
          me.noData();
          me.resetload();
          return;
        }
        goodsData = goodsData.concat( result.data.fav_info);
        self.setState({
          goodsData: goodsData,
          success:true
        });
        me.resetload();
      },
      error:function(xhr){
        me.resetload();
      }
    })
  }
  //获取数据
  loadDataServer = ()=> {
    const {init} = ctrlAPI;
    let self = this
    ownAjax(init).then((res)=> {
      let goodsData= res.data.fav_info;
      self.pages = res.data.pages;
      self.total = res.data.total;
      self.setState({
        goodsData: goodsData,
        success: true
      });
    })
    //  .catch(()=>{
    //Popup.MsgTip({msg:"网络错误，请稍后再试"});
    //});
  }
  componentDidMount() {
    this.loadDataServer()
  }
  componentWillUnmount() {
    const modal = document.querySelector("#modal");
    modal && modal.parentNode && modal.parentNode.removeChild(modal);
    const msgTip = document.querySelector("#msgTip");
    msgTip && msgTip.parentNode && msgTip.parentNode.removeChild(msgTip);
  }
  render() {
    const {goodsData,success} = this.state;
    return (
      <div data-page="collect-page" className="main" >
        {success ?
          <div className="showarea area">
            { (goodsData && goodsData.length) ?
              <section className="floor-bd">
                <DropDownList data={goodsData} success={success}
                              onDelete={this.onDelete}  dropDown={this.loadDownHandle} scrollArea={window} />
              </section> :
              <CollectEmpty />
            }
          </div> :
          <LoadingRound />
        }
      </div>
    )
  }
}
//商品列表
export class CollectBar extends Component {
  constructor(props){
    super(props);
    this.state = {
      data: this.props.data,
      active: "edit",
      select: []
    }
  }
  componentWillReceiveProps( props){
    this.setState({ data: props.data });
  }
  toggleActive = ()=> {
    let active = this.state.active;
    if (active == "edit") {
      this.state.active = "del"
    } else {
      if (!this.state.select.length) {
        this.state.active = "edit";
      } else{
        this.showModal()
      }
    }
    this.setState(this.state)
  }
  update() {
    let { data, select } = this.state;
    this.state.select.forEach((val) => {
      let index = data.indexOf(val)
      data.splice(index, 1)
    });
    select=[];
    this.setState({ select:select,data:data});
  }
  checkActive(str) {
    return str === this.state.active
  }
  onSelect(id) {
    if (this.checkActive("edit")) {
      return
    }else{
      let index;
      if (~(index = this.state.select.indexOf(id))) {
        this.state.select.splice(index, 1);
      } else {
        this.state.select.push(id);
      }
    }
    this.setState(this.state);
  }
  getSelectId() {
    return this.state.select.map((val) => val.item_id);
  }
  showModal = ()=> {
    let self = this;
    let itemId = this.getSelectId();
    Popup.Modal({
      isOpen: true,
      msg: "确定删除收藏商品吗？",
    }, ()=> {
      $.ajax({
        url: ctrlAPI.del.url,
        type: ctrlAPI.del.type,
        data: { item_id: itemId },
        success: function (result) {
          Popup.MsgTip({msg: result.msg});
          if (result.status) {
            self.update()
          }
          self.props.onDelete(itemId)
        }
      });
    });
  };
  render() {
    let {data} = this.state;
    let CollectHtml = this.props.success?(data instanceof Array ? (data.map((item, i)=> {
        return (
          <CollectCtrl data={item} key={item.item_id+"_"+i} onSelect={() =>this.onSelect(item)}
                       checkActive={this.checkActive("edit")}
            />
        )
      })
    ) : ''):null;
    return (
        <div className="collect-control list-data">
          {CollectHtml}
          {
            this.checkActive("edit") ?
              <div className='edit' onClick={this.toggleActive}>
                <button type="button" className="ui-btn edit-btn">编辑</button>
              </div>
              :
              <div className='delete-action' onClick={this.toggleActive}>
                <button type="button" className="ui-btn-warning">删 除</button>
              </div>
          }
        </div>
    )
  }
}
const DropDownList = DropDownLoad(CollectBar);
//单个商品
export class CollectCtrl extends Component {
  constructor(props){
    super(props);
    this.state ={active:false }
  }
  changeHandle=()=>{
    if(!this.props.checkActive){
      this.setState({
        active:!this.state.active
      });
    }
    this.props.onSelect();
  };
  render() {
    const {data,checkActive}= this.props;
    return (
      <div className="collect-box clearfix" onClick={this.changeHandle}>
        <div className="col-xs-6 single un-padding">
          <div className={`pro-pic pro-info list-item-pic un-padding ${this.state.active&&"cur"}`}>
            <Link className="pro-link" to={(data.image_default_id|| data.goods_name)&&checkActive?"/item?item_id="+data.item_id:null}>
              {(data.image_default_id || data.goods_name )? <img src={data.image_default_id}/> :
                <img src={require("../../../img/collect/have-deleted.png")} />
              }
            </Link>
            <div className="info-g" style={{display:'none'}}>
              {data.promotion_tag instanceof Array ? data.promotion_tag.map((item, i)=> {
                return (
                  <div key={i} style={{float:'left'}}>
                    {
                      item != '拼团' ?
                        <span key={i}>{item}</span> : null
                    }
                  </div>
                )
              }) : data.promotion_tag}
            </div>
            <div className="info-n">
              <a href="javascript:;">
                <p>{data.brand_name}</p>
                <p>{data.goods_name}</p>
              </a>
            </div>
            <div className="info-p">
              <div className="p-lf">
                {
                  data.min_promotion_price?(+data.min_promotion_price).toFixed(2):(+data.goods_price).toFixed(2)
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

//没有收藏时
export class CollectEmpty extends Component {
  render() {
    return (
      <div>
        <div className="empty-area" style={{marginTop:'2.5rem'}}>
          <img src={require("../../../img/collect/no-collected.png")}/>
          <span className="empty-txt">你还没有收藏哦~</span>
          <a href="/" className="ui-btn-empty">去逛逛</a>
        </div>
        <div className="empty-mask"></div>
      </div>
    )
  }
}
