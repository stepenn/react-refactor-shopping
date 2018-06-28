
function checkDeliveryRegions (deliveryRegionsData, nowData) {
    let i = nowData.length,
        par = deliveryRegionsData,
        item;

    if (par === true) {
        return true
    }

    while(i--) {
        item = nowData[i];
        if (par && item in par) {
            if (par[item] === true) {
                return true
            } else {
                par = par[item]
            }
        } else {
            return false
        }
    }
    return true
}

export function onAreaResultJSBrige (deliveryRegions, cb) {
    return function onAreaResult (data) {
        data = JSON.parse(data)
        let ret, flag;

        if (/110100|120100|500100|310100/.test(data.provinceCode)) {
            ret = data.provinceName + data.cityName
        } else {
            ret = data.cityName + data.countyName
        }

        flag = checkDeliveryRegions(deliveryRegions,[data.provinceCode, data.cityCode,data.countyCode].filter(function (a) {return a}));

        cb && cb(ret, flag);
    }
}
