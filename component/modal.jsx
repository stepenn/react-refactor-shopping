import React, { Component, DOM } from 'react';
import { Link } from 'react-router';
import ReactDOM,{ render, fin } from 'react-dom';
import 'src/scss/component.scss';
import {Shady} from './common.jsx';

//动画
import ReactTransition from 'react-addons-css-transition-group';

const Popup ={};
//弹出窗
Popup.Modal = function ( config,cb ) {
	class ModalComp extends Component {
		constructor(props) {
			super(props);
			// 初始状态
			this.state = {
				isOpen:false
			};
		}
		componentDidMount() {
			this.setState({
				isOpen:true
			});
		}
		modalHide=()=>{
			let self = this;
			this.setState({
				isOpen:false
			});
			setTimeout( function(){
				self.allHide();
			},200);
		};
		allHide=()=>{
			const { dom } = this.props;
			dom.parentNode.removeChild( dom );
			//ReactDOM.unmountComponentAtNode( modal );
		};
		callback=( cb )=>{
			this.modalHide();
			cb && cb();
		};
		render() {
			return (
				<div>
					<div ref="curtain" className="curtain" onTouchTap={(e)=>{ e.preventDefault();}}></div>
					<ReactTransition transitionName="modal"
					                 data-comp="animate"
					                 transitionEnterTimeout={200}
					                 transitionLeaveTimeout={200}
					                 component="div">
						{this.state.isOpen?
							<div ref="modal" className="modal" onTouchTap={(e)=>{ e.preventDefault();}} >
								<div className="modal-text">
									<span>{this.props.msg}</span>
								</div>
								<div className="modal-btn">
									<a href="javascript:;"  onTouchTap={(e)=>{ this.modalHide(); } } className="modal-cancel" ref="cancel">
										<span>取消</span>
									</a>
									<a href="javascript:;" onTouchTap={(e)=>{ this.callback( cb );} }  className="modal-sure" ref="sure">
										<span>确定</span>
									</a>
								</div>
							</div>
							:""}
					</ReactTransition>
				</div>
			)
		}
	}
	//对话框
	let modal = document.getElementById("modal");
	if( !modal ){
		modal = document.createElement("div");
		modal.setAttribute("data-comp", "modal");
		modal.setAttribute("id", "modal");
		document.body.appendChild(modal);
	}
	render(
		<ModalComp {...config} dom={modal}/>,
		document.getElementById("modal")
	);
};

//提示窗
Popup.MsgTip =function(config){
	class MsgTip extends Component{
		constructor(props) {
			super(props);
			this.state = {
				show:false
			};
		}
		componentDidMount() {
			const {dom} = this.props;
			this.setState({
				show:true
			});
			setTimeout(()=>{
				this.setState({
					show:false
				});
				setTimeout(()=>{
					dom && dom.parentNode && dom.parentNode.removeChild( dom );
				},2000);
			},2000);

		}
		render(){
			return (
				<ReactTransition data-comp="animate"
				                 transitionName="prompt"
				                 transitionEnterTimeout={100}
				                 transitionLeaveTimeout={200}
				                 component="div">
					{this.state.show?
						<div className="msg-text">
							{this.props.msg }
						</div>
						:""}
				</ReactTransition>
			)
		}
	}
	let msgTip = document.createElement("div");
	msgTip.setAttribute("data-comp", "msg-tip");
	msgTip.setAttribute("id", "msgTip");
	document.body.appendChild(msgTip);
	render(
		<MsgTip {...config} dom={msgTip} />,
		msgTip
	);
};

export default Popup;

// modal
function pipeModal () {

	const div = document.createElement('div');
	document.body.appendChild(div);
	let ContainerObj = ReactDOM.render(<Container />, div);

	let zIndex = 10;
	let id = 1000;

	 class Modal extends Component {

			constructor(prop) {

			super(prop);
			this.id = ++id
			this.zIndex = prop.zIndex || ++zIndex;
		}

		componentDidMount () {
			if (this.props.isOpen) {
				this.renderModal(this.props);
			}
		}

		componentWillReceiveProps(nextProp) {

			nextProp.isOpen ? this.renderModal(nextProp):  Modal.close(this.id)
		}

		 componentWillUnmount() {
			 Modal.close(this.id);
		 }

		 renderModal(prop) {
			ContainerObj.addModal({
				id: this.id,
				zIndex: this.zIndex,
				...prop
			});
		}

		render() {
			return DOM.noscript();
		}
	}

	Modal.open = (prop) => {
		ContainerObj.addModal({
			id: ++id,
			zIndex: ++zIndex,
			...prop
		});
		return id
	};

	Modal.close = (id) => {
		ContainerObj.removeModals(id);
	};

	return Modal
}


class Container extends Component {
	constructor(prop) {
		super(prop);

		this.state = {
			modals: {},
			ids: []
		};

		this.addMoal = this.addModal.bind(this);
		this.removeModal = this.removeModal.bind(this);
	}

	addModal(prop) {

		let {modals, ids} = this.state;

		modals[prop.id] = prop;

		if (!~ids.indexOf(prop.id)) {
			ids.push(prop.id);
		}
		this.setState({modals, ids});
		this.updateHeight()
	}

	removeModal(id) {
		let {modals, ids} = this.state;
		let index = ids.indexOf(id);
		let props = modals[id];
		if (index < 0) return
		props && props.onClose && props.onClose()
		delete modals[id];
		ids.splice(index, 1);
	}

	removeModals(id) {
		let ids = id ? [id] : this.state.ids;
		ids.forEach((v) =>{ this.removeModal(v)})
		this.setState(this.state);
		this.updateHeight()
	}

	updateHeight() {
		let hasIds = this.state.ids.length;
		let overflow = hasIds ? "hidden" : "";
		let height = hasIds ? "100%" : "";
		document.body.style.overflow = overflow;
		document.body.style.height = height;
	}

	renderModal() {
		var Modal = [];
		this.state.ids.map((value, key) => {
			let prop = this.state.modals[value];

			Modal.push(
				<ModalView {...prop} key={value} onClose={this.removeModal} />
			)
		});

		return Modal
	}

	render() {
		let hasIds = this.state.ids.length;
		let cls = "modalContainer " + (hasIds ?  'modalEnter': 'modalLeave');

		return (
			<ReactTransition transitionName="slide" data-comp="animate" transitionEnterTimeout={200} transitionLeaveTimeout={200} component="div" className={cls} onTouchMove={(e)=>{ e.preventDefault();}}>
				{this.renderModal()}
			</ReactTransition>
		)
	}
}


class ModalView extends Component {

	closeHandle() {
		this.props.onClose(this.props.id)
	}

	initHeader() {
		return (
			<div className="popModalHeader">{this.props.title}<span className="close-btn" onClick={ (events) => {return this.closeHandle(events)}}><i className="icon icon-close"></i></span></div>
		)
	}

	initFooter() {
		let { buttons=[]} = this.props;
		let btns = [];

		buttons.map((item, i) => {

			let handle = ()=> {
				if (!item.cb) {
					this.closeHandle()
				} else {
					item.cb() && this.closeHandle()
				}
			};
			btns.push(<a href="javascript:;"  onClick={handle} className={"modal-btn " + item.className}><span>{item.text}</span></a>)
		});

	   return (
		   <div className="modal-footer">{btns}</div>
	   )
	}

	render() {
		let {width, height, children, zIndex} = this.props;
		return (
			<div className={"modal " + this.props.className} style={{zIndex: zIndex}}>
					{this.initHeader()}
					<div className="popModalContent" style={{width: width || '100%', height: height||'50%'}}>
						{children}
					</div>
					{this.initFooter()}
			</div>
		)
	}
}

export  class Fix extends Component {
	constructor () {
		super();
		this.state = {}
	}
	componentDidMount() {
		let el = this.refs.el;
		let {isFix = false} = this.props;
		this.left = el.offsetLeft;
		$(el).height($(el).height())
		this.setState({isFix});
		this.addEvent()
	}

	addEvent() {
		let self = this;
		this.handle = (events) => {
			let isC = document.body.scrollTop > self.refs.el.offsetTop ? true : false;
			if (isC !== self.state.isFix) {
				self.setState({
					isFix: isC
				})
			}
		};
		window.addEventListener("scroll", this.handle);
	}
	componentWillUnmount() {
		window.removeEventListener("scroll", this.handle);
	}

	render() {
		let style = this.state.isFix ? {
			position: "fixed",
			top: 0,
			width:"100%",
			"borderBottom":"1px solid #f4f4f4",
			left: this.left
		} : {}
		return(
			<div ref="el">
				<div style={style}>
					{this.props.children}
				</div>
			</div>
		)
	}
}

export let Modal = pipeModal();


//弹窗的高阶组件实现
const HOCPopup =( ModalComponent )=>{
	return class extends Component{
	  constructor(props) {
	    super(props);
		  this.openPortal = this.openPortal.bind( this );
		  this.renderPortal = this.renderPortal.bind(this);
		  this.closePortal = this.closePortal.bind( this );
	  }
		renderPortal( props ){
			if( props.active ){
				ReactDOM.unstable_renderSubtreeIntoContainer(
					this,
					<ModalComponent {...props}  onClose={this.closePortal }  />,
					this.node
				);
			}else{
				ReactDOM.unmountComponentAtNode( this.node );
			}
		};
		openPortal( props = this.props ) {
			this.renderPortal( props );
		};
		closePortal(){
			this.props.onClose();
			ReactDOM.unmountComponentAtNode( this.node );
		};
		unMountPortal(){
			document.body.removeChild(this.node);
		}
		componentDidMount() {
			this.node = document.createElement('div');
			document.body.appendChild( this.node );
			this.openPortal();
		};
		componentWillUpdate( newProps ){
			this.renderPortal( newProps );
		}
		componentWillUnmount(){
			this.unMountPortal();
		}
		render(){
			return null;
		}
	}
};

class ModalComp extends Component {
	constructor(props) {
		super(props);
		// 初始状态
		this.state = {
			isOpen:false
		};
	}
	componentDidMount() {
		this.setState({
			isOpen:true
		});
	}
	modalHide=( cb )=>{
		let self = this;
		this.setState({
			isOpen:false
		});
		setTimeout( ()=>{
			cb && cb();
		},200);
	};
	render() {
		return (
			<div data-comp="modal" id="modal">
				<div ref="curtain" className="curtain" onTouchMove={(e)=>{ e.preventDefault();}}></div>
				<ReactTransition transitionName="modal"
				                 data-comp="animate"
				                 transitionEnterTimeout={200}
				                 transitionLeaveTimeout={200}
				                 component="div">
					{this.state.isOpen?
						<div ref="modal" className="modal"  >
							<div className="modal-text">
								<span>{this.props.msg}</span>
							</div>
							<div className="modal-btn">
								<a href="javascript:;" onClick={ this.props.onClose  } className="modal-cancel" ref="cancel">
									<span>取消</span>
								</a>
								<a href="javascript:;" onClick={ (e)=>{ this.props.onSure( this.props.onClose)  } }  className="modal-sure" ref="sure">
									<span>确定</span>
								</a>
							</div>
						</div>
						:""}
				</ReactTransition>
			</div>
		)
	}
}

export const PopupModal = HOCPopup(ModalComp);

class TipComp extends Component{
	constructor(props) {
		super(props);
		this.state = {
			show:false
		};
	}
	componentDidMount() {
		const self = this;
		this.setState({
			show:true
		});
		self.showTime =window.setTimeout(()=>{
				self.setState({ show:false });
			self.handleTime =window.setTimeout(()=>{
				self.props.onClose();
			},200);
		},2000);

	}
	render(){
		return (
			<ReactTransition data-comp="animate msg-tip"
			                 id="msgTip"
			                 transitionName="prompt"
			                 transitionEnterTimeout={100}
			                 transitionLeaveTimeout={200}
			                 component="div">
				{this.state.show?
					<div className="msg-text">
						{this.props.msg }
					</div>
					:""}
			</ReactTransition>
		)
	}
}

export const PopupTip = HOCPopup(TipComp);

class ModalA extends Component{
	render(){
		const {btns,msg,title="提示"} = this.props;
		const btnGroup = btns.map(( btn,i)=>{
			return <div key={i} className="g-col-1 one-btn" onClick={ (e)=>{ btn.cb(); } } >{btn.text}</div>
		});
		return(
			<div>
				<Shady options={{zIndex:105}} />
				<div data-comp="modal" id="modalA">
					<div className="top">{title}</div>
					<div className="content">{msg}</div>
					<div className="btn-group g-row-flex">
						{ btnGroup }
					</div>
				</div>
			</div>
		)
	}
}

 export const ModalAComp = HOCPopup(ModalA);

class ModalB extends Component {
	constructor(props) {
		super(props);
		// 初始状态
		this.state = {
			isOpen:false
		};
	}
	componentDidMount() {
		this.setState({
			isOpen:true
		});
	}
	modalHide=( cb )=>{
		let self = this;
		this.setState({
			isOpen:false
		});
		setTimeout( ()=>{
			cb && cb();
		},200);
	};
	render() {
		const { btns,title,msg} = this.props;
		const btnGroup = btns.map(( btn,i)=>{
			return <div key={i} className="g-col-1 one-btn" onClick={ (e)=>{ btn.cb(); } } ><span>{btn.text}</span></div>
		});
		return (
			<div data-comp="modal" id="modalB">
				<Shady options={{zIndex:105}} />
				<ReactTransition transitionName="modal"
				                 data-comp="animate"
				                 transitionEnterTimeout={200}
				                 transitionLeaveTimeout={200}
				                 component="div">
					{this.state.isOpen?
						<div ref="modal" className="modal" >
							<div className="modal-title">{ title }</div>
							<div className="modal-text">
								{ msg }
							</div>
							<div className="btn-group g-row-flex">
								{ btnGroup }
							</div>
						</div>
						:""}
				</ReactTransition>
			</div>
		)
	}
}

export const ModalBComp = HOCPopup(ModalB);