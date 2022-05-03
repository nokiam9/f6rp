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