export  function each (obj, iteratee) {
    let i, length;
    if (Array.isArray(obj)) {
        obj.forEach((val, i) => iteratee(i, val, obj))
    } else {
        let keys = Object.keys(obj);
        for (i = 0, length = keys.length; i < length; i++) {
            iteratee(keys[i], obj[keys[i]], obj);
        }
    }
    return obj;
}

export function wrap (fnc, wrapper) {
    return function (...arg) {
        arg.unshift(fnc);
        return wrapper.apply(this, arg)
    }
}

export function filter (objOrFn) {
    if (typeof objOrFn == "function") {
        return function (items) {
            let ret = [];
            each(items, function (key, val) {
                if (objOrFn(key, val) === true) {
                    ret.push(val);
                }
            });
            return ret
        }
    }
    return objOrFn == null ? function () {} : function (property) {return objOrFn[property]}
}


export let dateUtil = {

    formatNum: function (n) {
        if (n < 10) return '0' + n;
        return n;
    },

    parse: function (dateStr, formatStr) {
        if (typeof dateStr === 'undefined') return null;
        if (typeof formatStr === 'string') {
            var _d = new Date(formatStr);

            var arrStr = formatStr.replace(/[^ymd]/g, '').split('');
            if (!arrStr && arrStr.length != 3) return null;

            var formatStr = formatStr.replace(/y|m|d/g, function (k) {
                switch (k) {
                    case 'y':
                        return '(\\d{4})';
                    case 'm':
                    case 'd':
                        return '(\\d{1,2})';
                }
            });

            var reg = new RegExp(formatStr, 'g');
            var arr = reg.exec(dateStr)

            var dateObj = {};
            for (var i = 0, len = arrStr.length; i < len; i++) {
                dateObj[arrStr[i]] = arr[i + 1];
            }
            return new Date(dateObj['y'], dateObj['m'] - 1, dateObj['d']);
        }
        return null;
    },

    format: function (date, format) {
        if (!date) {return null}
        if (arguments.length == 2 && typeof format === 'boolean') {
            format = date;
            date = new Date();
        }
        if (!date.getTime) {
            date = new Date(parseInt(date));
        }

        typeof format != 'string' && (format = 'Y年M月D日 H时F分S秒');
        return format.replace(/Y|y|M|m|D|d|H|h|F|f|S|s/g, function (a) {
            switch (a) {
                case "y":
                    return (date.getFullYear() + "").slice(2);
                case "Y":
                    return date.getFullYear();
                case "m":
                    return date.getMonth() + 1;
                case "M":
                    return dateUtil.formatNum(date.getMonth() + 1);
                case "d":
                    return date.getDate();
                case "D":
                    return dateUtil.formatNum(date.getDate());
                case "h":
                    return date.getHours();
                case "H":
                    return dateUtil.formatNum(date.getHours());
                case "f":
                    return date.getMinutes();
                case "F":
                    return dateUtil.formatNum(date.getMinutes());
                case "s":
                    return date.getSeconds();
                case "S":
                    return dateUtil.formatNum(date.getSeconds());
            }
        });
    }
};


// 编码start
var base64EncodeChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

export function base64encode(str) {
    var out, i, len;
    var c1, c2, c3;

    len = str.length;
    i = 0;
    out = "";
    while(i < len) {
        c1 = str.charCodeAt(i++) & 0xff;
        if(i == len)
        {
            out += base64EncodeChars.charAt(c1 >> 2);
            out += base64EncodeChars.charAt((c1 & 0x3) << 4);
            out += "==";
            break;
        }
        c2 = str.charCodeAt(i++);
        if(i == len)
        {
            out += base64EncodeChars.charAt(c1 >> 2);
            out += base64EncodeChars.charAt(((c1 & 0x3)<< 4) | ((c2 & 0xF0) >> 4));
            out += base64EncodeChars.charAt((c2 & 0xF) << 2);
            out += "=";
            break;
        }
        c3 = str.charCodeAt(i++);
        out += base64EncodeChars.charAt(c1 >> 2);
        out += base64EncodeChars.charAt(((c1 & 0x3)<< 4) | ((c2 & 0xF0) >> 4));
        out += base64EncodeChars.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >>6));
        out += base64EncodeChars.charAt(c3 & 0x3F);
    }
    return out;
}

export function utf16to8(str) {
    var out, i, len, c;

    out = "";
    len = str.length;
    for(i = 0; i < len; i++) {
        c = str.charCodeAt(i);
        if ((c >= 0x0001) && (c <= 0x007F)) {
            out += str.charAt(i);
        } else if (c > 0x07FF) {
            out += String.fromCharCode(0xE0 | ((c >> 12) & 0x0F));
            out += String.fromCharCode(0x80 | ((c >>  6) & 0x3F));
            out += String.fromCharCode(0x80 | ((c >>  0) & 0x3F));
        } else {
            out += String.fromCharCode(0xC0 | ((c >>  6) & 0x1F));
            out += String.fromCharCode(0x80 | ((c >>  0) & 0x3F));
        }
    }
    return out;
};
// 编码end