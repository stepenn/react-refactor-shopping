import { ownAjax } from '../common/ajax.js';

 function concatPageAndType( pageName ){
	return function( type,options ){
		return {
			type:pageName+type,
			...options
		}
	}
}

export function ownFetchPage( pageName ){
	let createActions = concatPageAndType( pageName );
	return function( options,data ){
		return function (dispatch){
			dispatch( createActions("loadData"));
			return ownAjax( options,data )
				.then( result => {
					dispatch( createActions( "successData",{ result:data }) );
				})
				.catch( xhr =>{
					dispatch( "errorData",{ error:xhr } );
				});
		}
	}

}

export default concatPageAndType;