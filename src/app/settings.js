// 全局配置信息
f6rp.settings = f6rp.settings || {
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