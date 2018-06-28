import { combineReducers } from 'redux';

import orderCancel from './orderCancel.js';
import tradeDetail from './tradeDetail.js';
import afterSaleApply from './afterSaleApply.js';
import personCenter from './personCenter.js';
import zeroBuy from './zeroBuy.js';

function initial(state={}, action) {
	let newState={};
  switch (action.type) {
    //context改变
    case 'CONTEXT_CHANGE':
	    state = action;
	    return state;
	  //弹窗控制
	  case 'POPUP':
		  return Object.assign({}, action);
    //普通订单列表
      case 'TRADE_LIST':
	      newState.type="TRADE_LIST";
	      newState.listNum =action.listNum;
        return newState;
    //拼团订单列表
    case 'MY_GROUP_LIST':
	    newState.type="MY_GROUP_LIST";
	    newState.listNum =action.listNum;
        return newState;
		//购物车
		case 'SHOP_CART':
			newState.type="SHOP_CART";
	    if( action.update ){
		    newState.update = true;
		    newState.ctrl = action.ctrl;
		    newState.data = action.data;
	    }
		  if( action.editChange ){
			  newState.editChange = true;
			  newState.edit = action.edit;
		  }
			newState.msg = action.msg;
		  return newState;
	  //搜索页面
	  case 'SEARCH_RESULT':
		  newState.type="SEARCH_RESULT";
		  if( action.update ){
			  newState.update = true;
		  }
		  newState.tabChange = action.tabChange;
		  return newState;
	  case 'ORDER_CONFIRM':
		  return Object.assign({}, action);
		//商品详情
	    case 'ITEM':
		    return Object.assign({}, state, action);
		//评价列表
		case 'EVALUATE_LIST':
			state.type = "EVALUATE_LIST";
			return state;
		//评价内容
		case 'EVALUATE_INPUT':
			state.type = "EVALUATE_INPUT";
			return state;
		//评价成功
		case 'EVALUATE_SUCCESS':
			state.type = "EVALUATE_SUCCESS";
			return state;
    default:
      return state;
  }
}

const rootReducer = combineReducers({
	initial,
	personCenter,
	orderCancel,
	tradeDetail,
	afterSaleApply,
	zeroBuy
});

export default rootReducer;