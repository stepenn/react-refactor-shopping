export const ownAjax =function( options,data ){
	return new Promise(function(resolve,reject){
		$.ajax({
			url:options.url,
			type:options.type,
			data:data,
			success:function( result ){resolve( result );},
			error:function(xhr){ reject( xhr );}
		})
	});
};