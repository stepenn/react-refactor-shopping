export const timeUtils = {
	//时间格式化
	timeFormat( time ){
		time = new Date( time*1000 );
		let year = time.getFullYear(),
			month = this.toTwoDigit(time.getMonth()+1 ),
			date = this.toTwoDigit(time.getDate());
		return year+"."+month+"."+date;
	},
	//具体时间格式化
	detailFormat( time ){
		if( isNaN( Number(time) ) ) return "";
		time = new Date( time*1000 );
		let year = time.getFullYear(),
			month = this.toTwoDigit(time.getMonth()+1 ),
			date = this.toTwoDigit(time.getDate()),
			hour = this.toTwoDigit( time.getHours()),
			minute = this.toTwoDigit(time.getMinutes()),
			second = this.toTwoDigit(time.getSeconds());
		return  `${year}-${month}-${date} ${hour}:${minute}:${second}`;
	},
	toTwoDigit( num ){
		return num<10? "0"+num:num;
	}
};