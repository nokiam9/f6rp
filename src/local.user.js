// ==UserScript==
// @name          f6rp-local
// @grant         unsafeWindow
// @noframes
// @include       https://b2b.10086.cn*
// @include       http://b2b.10086.cn*
// @include       http://f6rp.caogo.cn*
// @include       https://127.0.0.1*
// @include       http://127.0.0.1*
// ==/UserScript==
javascript: void(function() {
    unsafeWindow['F6RP_URL'] = 'https://127.0.0.1:7302/';
    unsafeWindow['F6RP_MODE'] = 'local';

    // add enter point script in page
    document.documentElement.appendChild(
        document.createElement('script')
    ).src = unsafeWindow['F6RP_URL'] + 'src/launcher.js?' + (+new Date);

}());