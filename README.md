# push-huawei

> 华为推送Node服务

根据华为提供的推送服务实现的 Node 版SDK。支持华为通知栏推送功能，欢迎大家使用。

[小米推送](https://www.npmjs.com/package/push-xiaomi)

[魅族推送](https://www.npmjs.com/package/push-meizu)

[oppo推送](https://www.npmjs.com/package/push-oppo)

[友盟推送](https://www.npmjs.com/package/push-umeng)

[ios推送](https://www.npmjs.com/package/push-ios)


## 安装
```
npm install push-huawei --save-dev
```

## 实例
```javascript
const Huawei = require('push-huawei');
const huawei = new Huawei({
  appId: 'appId',
  appSecret: 'appSecret',
  appPkgName: '应用包名'
});

huawei.push({
  title: '标题',
  content: '内容',
  list: ['pushId'], 
  sleep: 0, // 请求间隔时间/毫秒
  extras: {
    // ... 额外信息
  },
  success(res){}, // 成功回调
  error(err){}, // 失败回调
  finish(){} // 所有请求回调
});
```

> 因为华为api最多支持100台机器推送，如果 list 长度超过100，则内部会发起 Math.ceil(n / 100) 条请求, 同时也会有 Math.ceil(n / 100) 条回调。

## 参数

| key | value |
|:----|:----|
|appId|appID|
|$appSecret|appSecret|
|appPkgName|应用包名|
|getTokenUrl|获取token URL 默认 https://login.cloud.huawei.com/oauth2/v2/token|
|pushUrl|推送URL 默认 https://api.push.hicloud.com/pushsend.do|
|grant_type|华为接口参数 默认 'grant_type'|
|nsp_svc|华为接口参数 默认 'openpush.message.api.send'|
|maxLength|华为推送限制长度 默认100|


[华为官方文档](https://developer.huawei.com/consumer/cn/doc/development/HMS-2-References/hmssdk_huaweipush_api_reference_agent_s2)