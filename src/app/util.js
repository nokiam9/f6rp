'use strict';

f6rp.util = f6rp.util || {};

// Func: 获取公告列表的底部页面信息
f6rp.util.getNoticeListInfo = function(doc=document) {
    try {
        const str = doc.querySelector(f6rp.settings.selector.total_records).innerText.trim(); // 典型格式为：‘共292,298条数据/14,615页’
        return {
            total: Number(str.split('/')[0].slice(1,-3).replace(',','')),
            current_page: Number(doc.querySelector(f6rp.settings.selector.current_page).value), // 当前页面序号
            page_size: Number(doc.querySelector(f6rp.settings.selector.page_size).value),
            //previous_page_button: doc.querySelector(settings.selector.previous_page_button), // ‘上一页’按钮
            //next_page_button: doc.querySelector(settings.selector.next_page_button), // ‘下一页’按钮
            records_in_page: doc.querySelectorAll(f6rp.settings.selector.notice_list).length - 2, // 带2个表头行
        }
    }
    catch (err) {
        console.log('Error(getNoticeListInfo): field type error in DOM, msg=', err);
        return null;
    }
};

// Func: 读取公告列表数据
f6rp.util.getNoticeList = function(doc=document) {
    let notices = [];
    let line = doc.querySelectorAll(f6rp.settings.selector.notice_list)[2]; // 表头2行，数据从第三行开始

    while (line) {
        notices.push({
            spider: 'spider',       // Todo:
            //type_id: type_id,
            nid: line.getAttribute('onclick').split("'")[1],
            source_ch: line.children[0].textContent,
            notice_type: line.children[1].textContent,
            title: line.children[2].children[0].textContent,
            published_date: line.children[3].textContent,
        }); // 获得公告列表的基础信息
        line = line.nextElementSibling; // 循环提取下一行
    }

    return notices;
}

// Func: 从url获取type_id
f6rp.util.getTypeID = function(url=window.location) {
    const type_id = url.search.split('=')[1]; // 取出url的参数值 [1,2,3,7,8,16]

    if (f6rp.settings.TYPE_ID_GROUPS.indexOf(type_id) < 0) throw new Error('未知的type_id');
    else return type_id;
}

// Func: 跳转到指定页面
f6rp.util.gotoPage = function(page_no) {
    if (typeof(page_no) != 'number' || page_no <= 0 ) {
        console.log('Error(gotoPage): 输入参数错误， page_no=' + String(page_no));
        return -1;
    }
    document.querySelector(f6rp.settings.selector.page_number_input).value = page_no; // 模拟输入‘页码’
    document.querySelector(f6rp.settings.selector.goto_page_button).onclick(); //模拟点击‘GO’按钮
    // 等待页面刷新
    // await f6rp.util.sleep(5000);
    // await waitForSelector(window, settings.selector.current_page);

    let x = document.querySelector(f6rp.settings.selector.current_page).value;
    if (Number(x) == page_no) console.log('Info(gotoPage): 成功调转到断点页码， 当前页码=', x );
    else {
        console.log('Error(gotoPage): 无法调转到断点页码， page_no=' + String(page_no));
        return -2;
    }
}

f6rp.util.sleep = function(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}