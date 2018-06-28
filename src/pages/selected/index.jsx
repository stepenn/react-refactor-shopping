import React, { Component } from 'react';
import { Link } from 'react-router';
import ReactDOM,{ render } from 'react-dom';
import {ownAjax} from '../../js/common/ajax.js';
import '../../scss/collect.scss';
import echo from  'plugin/echo.js';
import {LoadingRound } from 'component/common';

const selectAPI = {
	init: {url: 'api/wapapi/selectItem.api', type: 'get'}
}
export default class SelectedPage extends Component{
	componentWillMount(){
		document.title = "商品精选";
		location.href="jsbridge://set_title?title=商品精选";
		this.state = {
			itemCount:'',
			selectData: [],
			success: false
		}
	}
	componentDidMount() {
			ownAjax( selectAPI.init,{module_id:this.props.location.query.module_id}).then(result=>{
				if(result.status){
					this.setState({
						itemCount:result.data,
						selectData: result.data.item_list,
						success: true
					});
				}
			})
	}
	render(){
		const {selectData,success,itemCount} = this.state;
		return (
			<div data-page="collect-page selected-page" className="main">
				{success ?
					<div className="showarea area">
						{ (selectData && selectData.length) ?
							<section className="floor-bd">
								<div style={{overflow:'hidden'}}>
									<div className="selected_title">
										{itemCount.title}
									</div>
									<div className="select_subtitle">
											相关产品{itemCount.item_count}款
									</div>
									<SelectList data={selectData} />
								</div>
							</section> :
							<SelectEmpty />
						}
					</div> :
					<LoadingRound />
				}
			</div>
		)
	}
}
export class SelectList extends Component{
	render(){
		const {data} = this.props;
		let html = this.props.data instanceof Array? data.map((item,i)=>{
			return <SelectBar data={item} key={i} />
		}):null;
		return (<div>
				{html}
			</div>
		)
	}
}
export class SelectBar extends Component{
	constructor(props){
		super(props);
		this.state ={ }
	}
	componentDidMount(){
		echo.init();
	}
	render() {
		const {data}= this.props;
		return (<div>
				<div className="col-xs-6 col-select single">
					<div className="pro-pic list-item-pic" style={{border:'none'}}>
						<Link className="pro-link" to={data.link}>
							{
								data.isSoldOut?<img src={require("../../img/search/sale-out-big.png")} />:
									<img data-echo={data.imgSrc} src="../../img/icon/loading/default-watermark.png"/>
							}
						</Link>
						<div className="info-n">
							<p>{data.title}</p>
						</div>
						<div className="info-p" style={{marginTop:'5px',color:'#ff5555',paddingLeft:'2%'}}>
							<div className="p-lf">
								{data.originPrice?data.originPrice:data.price}
							</div>
							<div className='goods_store' style={{display:'none'}}>
								<span style={{border:'1px solid #ff5555'}}>{data.reposity}</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		)
	}
}
//精选商品不存在时
export class SelectEmpty extends Component {
	render() {
		return (
			<div>
				<div style={{paddingTop:'105px'}}>
					<div className="empty-bg">
						<p className="empty-select">精选商品不存在</p>
					</div>
				</div>
			</div>
		)
	}
}