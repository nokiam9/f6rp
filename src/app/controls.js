'use strict';

const LocalStorageStatusKey = 'F6rpStatus';

/** F6rpStatusManger：
*       管理爬虫的全部滑动窗口信息，并通过浏览器的LocalStroage完成持久化（以网站域名隔离）
*       核心数据 = [{type_id, total, start, end, timestamp}]
*/
class F6rpStatusManager {
    // 根据ES6标准，这种写法比构造函数更方便，也更能凸显实例属性
    statusList = [];

    // 从LocalStorage中获取持久化数据，作为初值，但new()之后要马上init()
    init() {
        const v = localStorage.getItem(LocalStorageStatusKey);
        if (v) this.statusList = JSON.parse(v);
    }

    // 清除UID和所有Status状态数据
    reset() {
        this.statusList = [];
        localStorage.removeItem(LocalStorageStatusKey);
    }

    // Todo: 可能同时开了2个窗口，此时LocalStorage如何确保互斥？？？
    // Todo：这是实例方法的写法，等价于 F6rpStatusManager.prototype.'set' = function(type, total, start, end) {...}
    // 根据type_id，设置status并持久化
    set(type_id, total, start, end) {
        if ((typeof(total) == 'number' && typeof(start) == 'number' && typeof(end) == 'number' && typeof(type_id) == 'string')) {
            if (start >= 0 && end >= 0 && total >= start && total >= end && start >= end) {
                // 生成新的status记录
                const status = {type_id:type_id, total:total, start:start, end:end, timestamp:new Date().getTime()};

                const index = this.statusList.findIndex(elt => elt.type_id==type_id);
                if (index < 0) this.statusList.push(status);
                else this.statusList[index] = status;

                // 持久化存储
                localStorage.setItem(LocalStorageStatusKey, JSON.stringify(this.statusList)); 
                return this.get(type_id);
            }
        }

        // Todo：改为Event.dispatch ?
        f6rp.log('Error: parameters illegally when set status! type_id=%s total=%s start=%s end=%s', type_id, total, start, end);
        return false;
    }

    // 根据tpye_id，读取status
    get(type_id) {
        const index = this.statusList.findIndex(elt => elt.type_id==type_id);
        return (index < 0)? false : this.statusList[index];
    }

    // 字符串输出status
    repr(type_id) {
        if (!type_id) {     // 不带参数时全量输出
            let str = '';
            this.statusList.forEach(elt => { str += _repr(elt) + '\n'});
            return str;
        }
        else {
            const status = this.get(type_id);
            return (status) ? _repr(status) : false
        }

        // 根据ES标准，反引号模版字符串``是一个更好的写法
        // 这是一个内置函数，外部无法访问
        function _repr(status) {
            return `type_id=${status.type_id}: total=${status.total}, start=${status.start}, end=${status.end}, timestampe=${new Date(status.timestamp)}`
            // return 'type_id=' + status.type_id + ': total=' + status.total.toString() + ', start=' + status.start.toString()
            //    +', end=' + status.end.toString() + ', timestamp=' + new Date(status.timestamp).toISOString();
        }
    }

    // Todo: 考虑改写为静态方方法？
    // 计算当前爬取数据的方向，[ stop| forward| backward| false ]
    direction(type_id) {
        const status = this.get(type_id);
        if (!status) return false;

        if (status.total > status.start) return 'backward'; // 优先读取头部
        else if (status.end > 0) return 'forward';
        else return 'stop';     // stop代表头尾都为空，即将结束退出
    }

    // 根据新的记录总数，刷新status状态
    updateTotal(type_id, new_total) {
        const status = this.get(type_id);
        if (!status || !Number(new_total) || (new_total < status.total) ) {
            f6rp.log('Error: parameters illegally when update total! status=%s, new_total=%s', status, new_total);
            return false;
        } 
        
        if (new_total > status.total) {
            f6rp.log('Info: 发现 %s 条新纪录！！！ status=%s, new_total=%s', new_total-status.total, status, new_total);
            this.set(type_id, new_total, status.start, status.end);
            return this.get(type_id);
        } else return false; // 记录总数没变化！
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
