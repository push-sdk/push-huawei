const axios = require('axios');
const _moment = require('moment');
const querystring = require('querystring');
const _ = require('lodash');

class Huawei {
    constructor(options = {}) {
        options.getTokenUrl = options.getTokenUrl || 'https://login.cloud.huawei.com/oauth2/v2/token';
        options.pushUrl = options.pushUrl || 'https://api.push.hicloud.com/pushsend.do';
        options.grant_type = options.grant_type || 'client_credentials';
        options.nsp_svc = options.nsp_svc || 'openpush.message.api.send';
        options.maxLength = options.maxLength || 100;
        options.timeout = options.timeout || 300000;

        if (!options.appId) throw new Error('Huawei AppId 不能为空');
        if (!options.appSecret) throw new Error('Huawei appSecret 不能为空');
        if (!options.appPkgName) throw new Error('Huawei appPkgName 不能为空');
        this.options = options;
        this.cache = {};
    }

    async sleep(time) {
        return new Promise((reslove) => {
            setTimeout(() => {
                reslove({});
            }, time);
        })
    }

    async push(data) {


        const customize = [];
        let n = 0;
        let success_total = 0;
        let fail_total = 0;
        const action = _.merge({
            type: 3,
            param: {
                appPkgName: this.options.appPkgName
            }
        }, data.action);
        for (const i in data.extras) {
            const arr = {};
            arr[i] = data.extras[i];
            customize.push(arr);
        }
        const device_token_list = _.chunk(data.list, this.options.maxLength);

        const payload = JSON.stringify({
            hps: {
                msg: {
                    type: 3,
                    body: {
                        title: data.title,
                        content: data.content
                    },
                    action
                },
                ext: {
                    customize,
                    biTag: data.biTag,
                    ...data.ext
                }
            }
        });

        data.success = data.success || function () { };
        data.fail = data.fail || function () { };
        data.finish = data.finish || function () { };

        for (const i in device_token_list) {
            const { access_token } = await this.getToken().catch((err) => {
                data.fail(err);
                return {
                    access_token: null
                }
            });

            if (!access_token) {
                data.fail('token获取失败');
                fail_total += device_token_list[i].length;
                continue;
            }

            axios({
                url: this.options.pushUrl + '?nsp_ctx=' + encodeURIComponent(JSON.stringify({
                    ver: 1,
                    appId: this.options.appId
                })),
                method: 'POST',
                timeout: this.options.timeout,
                headers: {
                    Authorization: access_token
                },
                data: querystring.stringify({
                    access_token,
                    nsp_svc: this.options.nsp_svc,
                    nsp_ts: Math.floor(new Date() / 1000),
                    device_token_list: JSON.stringify(device_token_list[i]),
                    expire_time: _moment((new Date().getTime()) + 86400000).format('YYYY-MM-DDTHH:mm:ss'),
                    payload
                }),
            }).then(res => {
                data.success(res);
                if (res.data.code == '80100000') {
                    let msg = JSON.parse(res.data.msg);
                    success_total += msg.success;
                    fail_total += msg.failure;
                } else if (res.data.code == '80000000') {
                    success_total += device_token_list[i].length;
                } else {
                    fail_total += device_token_list[i].length;
                }

            }).catch((err) => {
                fail_total += device_token_list[i].length;
                data.fail(err);
            }).then(() => {
                n++;
                if (n >= device_token_list.length) {
                    data.finish({
                        status: 'success',
                        maxLength: this.options.maxLength,
                        group: device_token_list.length,
                        success_total,
                        fail_total
                    });
                }
            });

            await this.sleep(data.sleep);
        }
    }

    async getToken() {
        if (this.cache.access_token && this.cache.time - new Date().getTime() > 30000) {
            return { access_token: this.cache.access_token }
        }
        const res = await axios({
            url: this.options.getTokenUrl,
            method: 'POST',
            timeout: this.options.timeout,
            data: querystring.stringify({
                grant_type: this.options.grant_type,
                client_id: this.options.appId,
                client_secret: this.options.appSecret
            }),
        });

        if (res.data.access_token) {
            this.cache.access_token = res.data.access_token;
            this.cache.time = new Date().getTime() + (res.data.expires_in * 1000);
        }

        return res.data;
    }

}

module.exports = Huawei;