
# 核心Class

源码地址位于：[https://github.com/nokiam9/Pxer/tree/master/src/app](https://github.com/nokiam9/Pxer/tree/master/src/app)

## 1. 任务对象：class PxerRequest

### [属性]

- `this.url`：导入时只有url
- `this.html` ：异步xhr完成后，读取数据存入html，并设置completed=true
- `this.completed=false`：完成标志

### [方法 N/A]  

## 2. 事件对象：Class PxerEvent

### [属性]

- `this._pe_eventList` = eventList; // 子类初始化时导入状态列表，例如[‘load' ,'error' ,'fail' ,'warn'])
- `this._pe_event` = {};    // 运行结果类似:{'load':[listen1, listern2...], 'error':[], ''fail':[], 'warn':[]}
- `this._pe_oneEvent` = {};

> 构造函数时PROXY是个什么鬼？拦截get方法

``` js
constructor(eventList=[] ,shortName =true) {
    ......
    if(!shortName || typeof Proxy==='undefined') return this
    else return new Proxy(this ,{
        get(target ,property){
            if(property in target){
                return target[property];
            }else if(target._pe_eventList.indexOf(property) !== -1){
                return target.dispatch.bind(target ,property);  // 这是重点！
            }else{
                return target[property];
            };
        },
    });
```

  
### [方法]

- `on(type,listener)`:              //针对_pe_event，如果type已存在，this._pe_event[type].push(listener)

``` js
// ptm.on('error'  ,(...argn)=>this.dispatch('error',argn));
on(type, listener) {
    if(!this._pe_event[type]) this._pe_event[type]=[];          // 如果type不存在，则创建之
    this._pe_event[type].push(listener);                        // 存入listener数组
```

- `one(type, listener)`;            // 针对_pe_one_event，如果type已存在，this._pe_oneEvent[type].push(listener)

``` js
// this.one('finishWorksTask',()=>this.printWorks());
one(type, listener) {
    if(!this._pe_oneEvent[type]) this._pe_oneEvent[type]=[];    // 如果type不存在，则创建之
    this._pe_oneEvent[type].push(listener);                     // 存入listener数组
```

- `dispatch(type ,...data)`	        // 似乎是输出信息，被PxerThreadManager.run调用？

``` js
// this.dispatch('error' ,`PxerThread#${this.id}.init: unknown task`);
dispatch(type ,...data){
    // on模式下，依次处理各个lisnter ？
    if(this._pe_event[type]) this._pe_event[type].forEach(fn => fn(...data));

    // one模式下，依次处理各个lisnter，然后删除该type ？？？
    if(this._pe_oneEvent[type]) {
        this._pe_oneEvent[type].forEach(fn => fn(...data));
        delete this._pe_oneEvent[type];
    }

    // event type = '*' 是一个全量模式 ？
    if(this._pe_event['*']) this._pe_event['*'].forEach(fn=>fn(...data));
    if(this._pe_oneEvent['*']){
        this._pe_oneEvent['*'].forEach(fn=>fn(...data));
        delete this._pe_oneEvent['*'];
    }
    return true;
```

- `off(eventType, listener)`        // 根据eventType和 listener，依次删除_pe_event和pe_oneEvent的指定行，或者清空

## 3. 线程对象：class PxerThread extends PxerEvent

### [属性]

- `super(['load','error','fail'])`
- `this.id` =id;	// 当前线程的ID
- `this.state`='free'; 	// 当前线程的状态. [free, ready, error, fail, runnning]
- `this.task` =null;	// 线程执行的任务
- `this.config` =config ||{  timeout:8000, retry:5} 	// 线程配置信息：超时，重试
- `this.runtime` ={};	// 运行时参数
- `this.xhr` =null;	// 使用的xhr对象

### [方法]

- `init(task)`：初始化：state:free->ready,各种格式检查

``` js
PxerThread.prototype['init'] =function(task) {
    this.task = task;
    this.runtime = {};
    this.state ='ready';
```

- `run()`：运行线程(递归调用):发出XHR并设置timeout, load ,error事件；成功后数据存入this.task.html

``` js
PxerThread.prototype['run'] =function _self() {
    ...... // 各种参数检查
    this.xhr =new XMLHttpRequest();

    ...... // 处理‘timeout’事件

    // 核心逻辑，处理‘load’事件
    XHR.addEventListener("load" ,()=>{
        if(XHR.status.toString()[0]!=='2' &&XHR.status!==304){
            this.state ='fail';
            this.dispatch('fail' ,new PxerFailInfo({
                task :this.task,
                url  :URL,
                type :'http:'+XHR.status,
            }));
            return false;
        }
        ...... // 检查是否真的请求成功

        // xhr处理成功，结果存入this.task.html，并执行成功回调
        if(this.task instanceof PxerWorksRequest) this.task.html[URL] =XHR.responseText;
        else this.task.html =XHR.responseText;

        _self.call(this);   // 注意：这里是递归调用？
        return true;
    });

    ...... // 处理error事件
    this.xhr.send();       // 开始执行XHR
```

- `stop()`：简单中止xhr：xor.abort()

## 4. 线程管理器：Class PxerThreadManager extends PxerEvent

### [属性]

- `super(['load' ,'error' ,'fail' ,'warn']`
- `this.config` ={timeout,retry,thread};
- `this.taskList` =[];  // 输入任务列表，`PxerRequest[]`，[{url, html. completed?}]
- `this.pointer` =0;    // 指派了下一条要执行的任务
- `this.threads` =[];   //  存放的线程对象，`PxerThread[]`
- `this.middleware` = [function(task) { return !!task; }];  //任务开始前调用的中间件，type {Function[]} 返回true继续执行，false终止
- `this.runtime ={`};	// 运行时用到的变量

### [方法]

- `init(taskList)`  // 初始化：导入任务taskList，压入线程列表threads

```js
// 建立线程对象
PxerThreadManager.prototype['init'] =function(taskList) {
    this.taskList = taskList;
    this.runtime = {};
    this.pointer = 0;

    this.threads = [];
    for(let i=0 ;i<this.config.thread ;i++) {
        this.threads.push(new PxerThread({
            id:i,
            config:{
                timeout :this.config.timeout,
                retry :this.config.retry,
            },
        }));
    };
```

- `run()`           // 启动：逐一设置线程的load/fail/error的回调函数，以及中间件调用next，然后init+run

``` js
PxerThreadManager.prototype['run'] =function() {
    for(let thread of this.threads){
        thread.on('load' ,data=>{
            next(this,thread);
        });
        thread.on('fail' ,(pfi)=>{
            this.dispatch('fail',pfi);
            next(this,thread);
        });
        thread.on('error' ,this.dispatch.bind(this ,'error'));
        next(this,thread);
    };

    function next(ptm ,thread){
        // 首先逐一处理每个中间件
        if (ptm.middleware.every(fn => fn(ptm.taskList[ptm.pointer]))) {
            // 再执行thread核心逻辑，init() + run()
            thread.init(ptm.taskList[ptm.pointer++]);
            thread.run();
        } else if (ptm.threads.every(thread => ['free','fail','error'].indexOf(thread.state)!==-1)) {
            ptm.dispatch('load' ,ptm.taskList);
        };
    }
```

- `stop()`          // pointer设置为tasklist长度+1 。停止线程的执行，实际上假装任务都执行完了

## 5. 页面请求对象：class PxerPageRequest extends PxerRequest

### [属性]

- `super(...argn)`
- `this.type` = argn[0].type;

### [方法 N/A]  

## 多图片页面请求对象 class PxerWorksRequest extends PxerRequest

### [属性]

- `super({url ,html})`
- `this.type` =type;				//[manga|ugoira|illust]
- `this.isMultiple` =isMultiple;	//[true|false]
- `this.id` =id;

### [方法 N/A]  

## 6. 错误处理对象：class PxerFailInfo

- this.url  =url;
- this.type =type;
- this.task =task;

## 说明事项

1. analytics.js 中设置了pxer.sendEvent，偷偷向https://point.pea3nut.org/events发送日志

    `pxer.sendEvent = eventSender.send.bind(eventSender);`

2. 无法继续运行的严重错误，处理方式为：

    ``` js
    throw new Error(`PxerThread#init: ${this.id} config illegal`);
    ```

3. 关于Class的实例方法和原型方法

    以 PxerEvent为例，其将`init()`,`run()`等方法设为实例方法，必须`new`以后才能使用，等价于写在class内部。

    ```js
    PxerThread.prototype['init'] =function(task) {
    PxerThread.prototype['run'] =function _self() {
    ```

    而将格式检查等与`this`无关的方法，作为原型方法使用，无需`new`即可使用。此时，必须在Class外部定义

    ```js
    PxerEvent.check = function(pe ,eventType ,listener) {
    PxerEvent.checkEvent = function(pe ,eventType) {
    PxerEvent.checkListener = function(listener) {
    ```
