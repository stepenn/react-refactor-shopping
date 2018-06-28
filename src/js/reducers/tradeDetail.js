import update from 'react-addons-update';
import createReducers from './createReducers.js';
const initialState ={
	update:false,
	initData:'',
	error:false,
	errorMsg:false,
	logiData:"",
	logiLoad:true,
	logiError:false
};

function tradeDetail( state=initialState, action ){
	switch( action.type ){
		case "initialPage":
			return initialState;
		case "getInitData":
			return Object.assign({},state,{
				update:false
			});
		case 'sucInitData':
			return Object.assign({},state,{
				update:true,
				initData:action.data
			});
			break;
		case 'failInitData':
			return Object.assign( {},state,{
				error:true,
				errorMsg:action.msg
			});
		case 'logiDataSuc':
			return Object.assign({},state,{
				logiData:action.data,
				logiLoad:false
			});
		case 'logiDataError':
			return Object.assign({},state,{
				logiError:true,
				logiLoad:false
			});
		default:
			return state;
	}
}
export default createReducers("tradeDetail",tradeDetail,initialState );