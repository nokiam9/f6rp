'use strict';

const LocalStorageStatusKey = 'F6rpStatus';


// F6rpStatus：保存爬虫的滑动窗口信息，并通过浏览器的LocalStroage完成持久化
class F6rpStatus {
    // 构造函数：设置status数组，并持久化存储在LocalStorage（实际存储在浏览器缓存中，以网站域名隔离）
    constructor() {
        const v = localStorage.getItem(LocalStorageStatusKey);
        this.list = (v)? JSON.parse(v) : [];
    }

    // 持久化存储
    _flush(type_id, status) {
        const index = this.list.findIndex(elt => elt.type_id==type_id);

        if (index < 0) this.list.push({type_id:type_id, status:status});
        else this.list[index] = {type_id:type_id, status:status};

        localStorage.setItem(LocalStorageStatusKey, JSON.stringify(this.list));
    }

    _repr(type_id, status) {
        return 'type_id=' + type_id + ': total=' + status.total.toString() + ', start=' + status.start.toString()
            +', end=' + status.end.toString() + ', direction=' + status.direction
            + ', timestamp=' + new Date(status.timestamp).toISOString();
    }

    // 清除UID和所有Status状态数据
    reset() {
        this.list = [];
        localStorage.removeItem(LocalStorageStatusKey);
    }

    // 根据type_id，设置status并持久化
    set(type_id, input={total:total, start:start, end:end}) {
        if (start < 0 || start > total) f6rp.log('Error: set status failed! input=', input);
        else if (end < 0 || end > total) f6rp.log('Error: set status failed! input=', input);
        else {
            let direction = 'stop';     // [stop| forward| backward]，默认stop代表头尾都为空，即将结束退出
            if (total > start) direction = 'backward'; // 优先读取头部
            else if (end > 0) direction = 'forward';

            this._flush(type_id, {total:total, start:start, end:end, direction:direction, timestamp: new Date().getTime()});
            f6rp.log('Debug: set status = ', this.repr(type_id));
            return this.get(type_id);
        }
        return null;
    }

    // 根据tpye_id，读取status
    get(type_id) {
        const index = this.list.findIndex(elt => elt.type_id==type_id);
        return (index < 0)? null : this.list[index].status;
    }

    // 字符串输出status
    repr(type_id) {
        const status = this.get(type_id);
        return (status) ? this._repr(type_id, status) : null;
    }

    // 根据新的记录总数，刷新status状态
    update(type_id, new_total) {
        const now = this.get(type_id);

        if (!Number(new_total) || !Number(now.total)) {
            f6rp.log('Error: parameters illegally! type_id=', type_id, ', new_total=', new_total);
            return null;
        } else if (new_total < now.total) {
            f6rp.log('Error: update status of new total error! new_total=', new_total, ', status=', this.repr(type_id));
            return null;
        } else if (new_total > now.total) {
            f6rp.log('Info: 发现', new_total-now.total, '条新纪录！！！ total=', now.total, ', new total=', new_total);
            this.set(type_id, {total:new_total, start:now.start, end:now.end});
            return this.get(type_id);
        }
    }

    // 根据status的timestamp信息，返回TM最近一次运行的时间
    lastRuntime(type_id) {
        const status = this.get(type_id);
        return (status) ? status.timestamp : 0;
    }
}
