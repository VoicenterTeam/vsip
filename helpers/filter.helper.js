export function filterObjectkeys (fullObj, keys) {
    return Object.keys(fullObj)
        .filter(key => keys.includes(key))
        .reduce((obj, key) => {
            obj[key] = fullObj[key];
            return obj;
        }, {});
}