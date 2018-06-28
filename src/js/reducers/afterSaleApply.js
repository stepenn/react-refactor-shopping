import update from 'react-addons-update';
import createReducers from './createReducers.js';
const initState ={
	initData:true,
	update:true,
	error:false,
	errorMsg:"",
	popup:"",
	show:false,
	listType:"REFUND_GOODS",
	reason:"1",
	money:"",
	description:""
};
function afterSaleApply( state= initState ,action){
	switch( action.type){
		case 'initialPage':
			return initState;
		case 'onlyRefund':
			return {...state,listType:"ONLY_REFUND" };
		case 'showPopup':
			return Object.assign({},state,{
				popup:action.popupType,
				show:true
			});
		case 'hidePopup':
			return Object.assign({},state,{
				show:false
			});
		case 'applyTypeChange':
			return Object.assign({},state,{
				listType:action.listType,
				reason:action.reason,
				show:false
			});
		case "applyReasonChange":
			return Object.assign({},state,{
				reason:action.reason,
				show:false
			});
		case "changeMoney":
			return Object.assign({},state,{
				money:action.value
			});
		case "changeDes":
			return Object.assign({},state,{
				description:action.value
			});
		default:
			return state;
	}
}

export default createReducers("afterSaleApply",afterSaleApply,initState )