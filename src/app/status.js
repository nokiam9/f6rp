'use strict';

const LocalStorageKey = 'F6rpStatus';

class F6rpStatus {
    constructor() {
        const val = localStorage.getItem(LocalStorageKey);
        
        if (!val) this.list=[];
        else this.list = JSON.parse(val);
    }

    _flush(type_id, status) {
        const index = this.list.findIndex(x=>x.type_id==type_id);

        if (index < 0) this.list.push({type_id:type_id, status:status});
        else this.list[index] = {type_id:type_id, status:status};

        localStorage.setItem(LocalStorageKey, JSON.stringify(this.list));
    }

    _repr(type_id, status) {
        return 'type_id=' + type_id + ': total=' + status.total.toString() + ', start=' + status.start.toString()
            +', end=' + status.end.toString() + ', direction=' + status.direction
            + ', timestamp=' + new Date(status.timestamp).toISOString();
    }

    reset() {
        this.list = [];
        console.log('Info(clearAllStatus): delete value of name=', name, ', value=', GM_getValue(name));
        localStorage.removeItem(LocalStorageKey);
    }

    set(type_id, {total:total, start:start, end:end}) {
        if (start < 0 || start > total) {
            console.log('Error: value of start error! start=', start);
            return null;
        }
        else if (end < 0 || end > total) {
            console.log('Error: value of end error! end=', end);
            return null;
        }
        else {
            let direction = 'stop';     // [stop| forward| backward]，默认stop代表头尾都为空，即将结束退出
            if (total > start) direction = 'backward'; // 优先读取头部
            else if (end > 0) direction = 'forward';

            this._flush(type_id, {total:total, start:start, end:end, direction:direction, timestamp: new Date().getTime()});
            console.log('Debug(setStatus): ', this.repr(type_id));
            return this.get(type_id);
        }
    }

    get(type_id) {
        const index = this.list.findIndex(x=>x.type_id==type_id);

        if (index >= 0) return this.list[index].status;
        else return null;
    }

    repr(type_id) {
        if (!type_id) {
            let str = null;
            for (let element of this.list) {
                str += this._repr(element.type_id, element.status) + '\n'
            }
            return str;
        }
        else {
            const status = this.get(type_id);
            if (!status) return null;
            else return this._repr(type_id, status);
        }
    }

    update(type_id, new_total) {
        const now = this.get(type_id);
        if (new_total < now.total) {
            console.log('Error(updateStatus): update status of new total error! new_total=', new_total, ', status=', reprStatus(type_id));
            return null;
        } else if (new_total > now.total) {
            console.log('Info(updateStatus): 发现', new_total-now.total, '条新纪录！！！ total=', now.total, ', new total=', new_total);
            this.set(type_id, {total:new_total, start:now.start, end:now.end});
        }
        return this.get(type_id);
    }
}
