import React, { Component } from 'react';
import { Link } from 'react-router';
import 'plugin/dropload.js';

//双向绑定
export const FormBind = (CompComponent) =>
	class extends Component{
			constructor(props) {
				super(props);
			}
		textChange(){
			let event = Array.prototype.pop.call( arguments );
			let newState ={
				[event.target.dataset.type]:event.target.value
			};
			this.setState(newState);
			arguments[0] && arguments[0]( event.target );
		};
		render(){
			return <CompComponent {...this.props} {...this.state}  textChange={this.textChange }  />
		}
	};

export const DropDownLoad =( ListComponent )=>{
	return class extends Component{
		constructor(props){
			super(props);
		}
		componentDidMount() {
			this.props.didMount && this.props.didMount();
			this.dropLoad = $(this.refs.list).dropload({
				scrollArea:this.props.scrollArea,
				loadDownFn:this.props.dropDown
			});
		}
		componentWillUnmount(){
			this.dropLoad.remove();
		}
		render(){
			return(
				<div  data-comp="drop-down-load" ref="list">
						<ListComponent {...this.props} />
				</div>
			)
		}
	}
};