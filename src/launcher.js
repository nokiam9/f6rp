window['f6rp'] = window['f6rp'] || {};
f6rp.util = f6rp.util || {};
f6rp.util.afterLoad =function(fn){
    if(document.readyState !== 'loading'){
        setTimeout(fn);
    }else{
        document.addEventListener('DOMContentLoaded', fn);
    }
};
f6rp.util.compile = function (str, scope = window) {
    let matchResult = null;
    while (matchResult = str.match(/{{\s*([\w]+)\s*}}/)) {
        str = str.replace(matchResult[0], scope[matchResult[1]]);
    }
    return str;
};
f6rp.util.set = function (obj, key, val) {
    const keys = key.split('.');
    let pointer = obj;
    for (let i = 0; i < keys.length; i++) {
        if (i === keys.length - 1) {
            pointer[keys[i]] = val;
        } else {
            pointer[keys[i]] = pointer[keys[i]] || {};
            pointer = pointer[keys[i]];
        }
    }
};
// @ref https://www.jianshu.com/p/162dad820f48
f6rp.util.get = function self(data,f){
    if(f.substr) f = f.split(/\.|\\|\//);

    if(f.length && data){
        return self(data[f.shift()],f)
    }else if(!f.length && data){
        return data
    }else {
        return "";
    }
};
f6rp.util.addFile = async function (url) {
    const sector = url.includes('?') ? '&' : '?';
    const f6rpVersion = /*@auto-fill*/'0.1.0'/*@auto-fill*/;

    if (!/^(https?:)?\/\//.test(url)) url = f6rp.url + url;
    url = url + sector + `f6rp-version=${f6rpVersion}`;

    const createScript = () => new Promise(function (resolve, reject) {
        const elt = document.createElement('script');
        elt.addEventListener('error', reject);
        elt.addEventListener('load', resolve);
        elt.addEventListener('load', () => f6rp.log('Loaded ' + url));
        elt.src = url;
        document.documentElement.appendChild(elt);
        return elt;
    });
    const createCss = () => new Promise(function (resolve) {
        const elt = document.createElement('link');
        elt.rel = 'stylesheet';
        elt.href = url;
        document.documentElement.appendChild(elt);
        resolve();
    });
    const createIcon = () => new Promise(function (resolve) {
        f6rp.util.afterLoad(() => {
            Array.from(document.querySelectorAll("link[rel*='icon']")).forEach(elt => elt.href = url);
        });
        (document.head || document.documentElement).appendChild(function(){
            const elt = document.createElement('link');
            elt.rel = 'shortcut icon';
            elt.type = 'image/x-icon';
            elt.href = url;
            return elt;
        }());
        resolve();
    });

    const fileFormat = url.match(/\.([^.]+?)(\?.+?)?$/)[1];
    switch (fileFormat) {
        case 'js':
            return createScript();
        case 'css':
            return createCss();
        case 'ico':
            return createIcon();
        case 'json':
            return fetch(url).then(res => res.json());
        default:
            return fetch(url).then(res => res.text());
    }
};

(async function(){
    window['F6RP_URL'] = window['F6RP_URL'] || 'https://f6rp.caogo.cn/';
    window['F6RP_MODE'] = window['F6RP_MODE'] || 'native';
    window['F6RP_LANG'] = window['F6RP_LANG'] || (document.documentElement.lang || window.navigator.language).split('-')[0];

    f6rp.url = F6RP_URL;
    f6rp.mode = F6RP_MODE;
    f6rp.lang = F6RP_LANG;
    f6rp.log = (...msg) => console.log('[F6RP]', ...msg);

    // 全局配置信息
    f6rp.settings = {
        //RESET_MODE: true, // 默认是断点恢复模式
        NUMBER_OF_PAGES_READ_PER_STARTUP: 25, // 每次运行读取的页面数量
        SECONDS_BEFORE_LAST_RUNTIME: 60*0, // 上次运行的间隔时间，以防止插件重复运行
        SPIDER: 'TM',
        TYPE_ID_GROUPS: ['1','2','3','7','8','16'],
        PAGE_SIZE: 20,
        selector: {
            page_size: '[name="page.perPageSize"]', // 页面尺寸
            // 还有一个方法是：document.querySelector('a.current').innerText
            current_page: '[name="page.currentPage"]', // .value是当前页面序号
            // 还有一个方法是：document.querySelector('[name="page.totalRecordNum"').value
            total_records: '#pageid2 > table > tbody > tr > td:nth-last-child(3)', // 全部记录数信息，‘共292,298条数据/14,615页’
            previous_page_button: '#pageid2 > table > tbody > tr > td:nth-child(2) > a', // 上一页按钮
            next_page_button: '#pageid2 > table > tbody > tr > td:nth-child(4) > a', // 下一页按钮
            page_number_input: '#pageNumber', // 输入将要跳转的页面号
            goto_page_button: '#pageid2 > table > tbody > tr > td:nth-child(8) > input[type=button]', // go按钮
            notice_list: '#searchResult > table > tbody > tr', // 数据列表
            notice_content: '#contentInfo', // 用于判断新开content页面的完全加载
        },
        content_base_url: 'https://b2b.10086.cn/b2b/main/viewNoticeContent.html?noticeBean.id=',
        post_base_url: 'https://www.caogo.cn/notices',
        //post_base_url: 'http://127.0.0.1/api/notices/',
    };

    switch (F6RP_MODE) {
        case 'dev':
        case 'master':
            // old version doesn't declare "@require vuejs"
            await f6rp.util.addFile('https://cdn.jsdelivr.net/npm/vue@2.6/dist/vue.min.js');
        case 'native':
            await f6rp.util.addFile('native.js');
            break;
        case 'local':
            await f6rp.util.addFile('src/local.js');
            break;
        case 'sfp':
            break;
    }
})().catch(console.error);