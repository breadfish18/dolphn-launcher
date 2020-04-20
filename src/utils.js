const request = require("request")

module.exports = function (url, data) {
    return new Promise(function (resolve, reject) {
        request.post(url, data, (err, res, body) => {
            if (err) return reject(err)
            console.log(res.statusCode)
            if (!res.statusCode === 200) return reject(res.statusCode)
            resolve(body)
        })
    });
}