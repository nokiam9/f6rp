'use strict';

const LocalStorageStatusKey = 'F6rpStatus';

/** F6rpStatusManger：
*       管理爬虫的全部滑动窗口信息，并通过浏览器的LocalStroage完成持久化（以网站域名隔离）
*       核心数据 = [{type_id, total, start, end, timestamp}]
*/
class F6rpStatusManager {
    // 构造函数：设置status数组，并持久化存储在LocalStorage
    constructor() {
        const v = localStorage.getItem(LocalStorageStatusKey);
        this.list = (v)? JSON.parse(v) : []; 
    }

    // 持久化存储
    _flush() {
        localStorage.setItem(LocalStorageStatusKey, JSON.stringify(this.list));
    }

    _repr(status) {
        return 'type_id=' + status.type_id + ': total=' + status.total.toString() + ', start=' + status.start.toString()
            +', end=' + status.end.toString() + ', timestamp=' + new Date(status.timestamp).toISOString();
    }

    // 清除UID和所有Status状态数据
    reset() {
        this.list = [];
        localStorage.removeItem(LocalStorageStatusKey);
    }

    // 根据type_id，设置status并持久化
    set(type_id, total, start, end) {
        if ((typeof(total) == 'number' && typeof(start) == 'number' && typeof(end) == 'number' && typeof(type_id) == 'string')) {
            if (start >= 0 && end >= 0 && total >= start && total >= end && start >= end) {
                // 生成新的status记录
                const status = {type_id:type_id, total:total, start:start, end:end, timestamp:new Date().getTime()};

                const index = this.list.findIndex(elt => elt.type_id==type_id);
                if (index < 0) this.list.push(status);
                else this.list[index] = status;

                this._flush();
                return this.get(type_id);
            }
        }
        f6rp.log('Error: parameters illegally when set status! type_id=%s total=%s start=%s end=%s', type_id, total, start, end);
        return false;
    }

    // 根据tpye_id，读取status
    get(type_id) {
        const index = this.list.findIndex(elt => elt.type_id==type_id);

        return (index < 0)? false : this.list[index];
    }

    // 字符串输出status
    repr(type_id) {
        if (!type_id) {     // 不带参数时全量输出
            let str = '';
            this.list.forEach(elt => { str += this._repr(elt) + '\n'});
            return str;
        }
        else {
            const status = this.get(type_id);
            return (status) ? this._repr(status) : false
        }
    }

    // 计算当前爬取数据的方向，[ stop| forward| backward| false ]
    direction(type_id) {
        const status = this.get(type_id);

        if (!status) return false;
        else if (status.total > status.start) return 'backward'; // 优先读取头部
        else if (status.end > 0) return 'forward';
        else return 'stop';     // stop代表头尾都为空，即将结束退出
    }

    // 根据新的记录总数，刷新status状态
    updateTotal(type_id, new_total) {
        const status = this.get(type_id);

        if (!Number(new_total) || !status || (new_total < status.total) ) {
            f6rp.log('Error: parameters illegally when update total! status=%s, new_total=%s', status, new_total);
            return false;
        } else if (new_total > status.total) {
            f6rp.log('Info: 发现 %s 条新纪录！！！ status=%s, new_total=%s', new_total-status.total, status, new_total);
            this.set(type_id, new_total, status.start, status.end);
            return this.get(type_id);
        }
    }

    // 完成数据列表处理之后，更新滑动窗口的步长信息
    // Todo: 参数pagination是一个object？
    updateStep(type_id, pagination) {
        if (!(pagination instanceof F6rpPagination)) {
            f6rp.log('Error: parameters illegally when nextPage().');
            return false;
        }

        const status = this.get(type_id);
        if (!status) return false;   // type_id不存在

        const top = pagination.total - ((pagination.current_page - 1) * pagination.page_size);
        const bottom = top - pagination.records_in_page;

        // 本次读取头部，并确保start在正确区间内的条件下，刷新滑动窗口
        if (status.total > status.start) {
            if ((status.start + 1) >= bottom && (status.start + 1) <= top) {
                this.set(type_id, status.total, top, status.end);
            } else return false;
        }
        // 本次读取尾部，并确保end在正确区间内的条件下，刷新滑动窗口
        if (status.end > 0) {
            if ((status.end - 1) >= bottom && (status.end - 1) <= top) {
                this.set(type_id, status.total, status.start, bottom);
            } else return false;
        }
        return this.get(type_id);
    }

    // 计算下一个将要跳转的页面序号
    // Todo: 参数pagination是一个object？
    nextPage(type_id, pagination){
        if (!(pagination instanceof F6rpPagination)) {
            f6rp.log('Error: parameters illegally when nextPage().');
            return false;
        }
        const status = this.get(type_id);
        if (!status) return false;

        if (status.total > status.start) {   // backward
            return Math.floor((pagination.total - status.start - 1) / pagination.page_size) + 1; 
        } else if (end > 0) {               // forward
            return Math.floor((pagination.total - status.end) / pagination.page_size) + 1;
        } else return 0;                    // stop
    }

    // 根据status的timestamp信息，返回TM最近一次运行的时间
    lastRuntime(type_id) {
        const status = this.get(type_id);
        
        return (status) ? status.timestamp : 0;
    }
}
