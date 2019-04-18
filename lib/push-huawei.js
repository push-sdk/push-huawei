const axios = require('axios');
const _moment = require('moment');
const querystring = require('querystring');

class Huawei {
  constructor(options = {}) {
    options.getTokenUrl = options.getTokenUrl || 'https://login.cloud.huawei.com/oauth2/v2/token';
    options.pushUrl = options.pushUrl || 'https://api.push.hicloud.com/pushsend.do';
    options.grant_type = options.grant_type || 'client_credentials';
    options.nsp_svc = options.nsp_svc || 'openpush.message.api.send';
    options.maxLength = options.maxLength || 100;
    this.options = options;
  }

  async push(data) {
    const { access_token } = await this.getToken();
    const customize = [];
    for (const i in data.extras) {
      const arr = {};
      arr[i] = data.extras[i];
      customize.push(arr);
    }

    const device_token_list = [];
    while (data.list.length > 0) {
      device_token_list.push(data.list.splice(0, this.options.maxLength));
    }

    const payload = JSON.stringify({
      hps: {
        msg: {
          type: 3,
          body: {
            title: data.title,
            content: data.content
          },
          action: {
            type: 3,
            param: {
              appPkgName: this.options.appPkgName
            }
          }
        },
        ext: {
          customize
        }
      }
    });

    for (const i in device_token_list) {
      axios({
        url: this.options.pushUrl + '?nsp_ctx=' + encodeURIComponent(JSON.stringify({
          ver: 1,
          appId: this.options.client_id
        })),
        method: 'POST',
        data: querystring.stringify({
          access_token,
          nsp_svc: this.options.nsp_svc,
          nsp_ts: Math.floor(new Date() / 1000),
          device_token_list: JSON.stringify(device_token_list[i]),
          expire_time: _moment((new Date().getTime()) + 86400000).format('YYYY-MM-DDTHH:mm:ss'),
          payload
        }),
      }).then(data.success).catch(data.error);
    }
  }

  async getToken() {
    const res = await axios({
      url: this.options.getTokenUrl,
      method: 'POST',
      data: querystring.stringify({
        grant_type: this.options.grant_type,
        client_id: this.options.client_id,
        client_secret: this.options.client_secret
      }),
    });
    return res.data;
  }

}

module.exports = Huawei;