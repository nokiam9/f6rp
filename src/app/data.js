'use strict';

// 任务队列中的任务对象
 class F6rpRequest{
    constructor({url ,html}={}) {
        this.url=url;
        this.html =html;
        this.completed =false;
    }
}
// 页面的任务对象
class F6rpPageRequest extends F6rpRequest{
    constructor(...argn) {
        super(...argn);
        this.type_id = argn[0].type_id;
    }
}

// 构造对象PageInfo，对应Page底部的pageination信息
class F6rpPagination {
    constructor(type_id, total, current_page, records_in_page, page_size=20) {
        this.type_id = type_id;
        this.total = total;
        this.current_page = current_page;   // key info
        this.page_size = page_size;
        this.records_in_page = records_in_page;
    }
}

// 构造对象Notice，对应列表的一行信息
class F6rpPageLine {
    constructor({nid, source_ch, notice_type, title, publish_date}) {
        this.nid = nid;                     // primary key！
        this.source_ch = source_ch;
        this.notice_type = notice_type;
        this.title = title;
        this.publish_date = publish_date;
    }
}
