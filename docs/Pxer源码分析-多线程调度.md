
# 核心Class

## 1. 任务对象：class PxerRequest

### [属性]

- `this.url`：导入时只有url
- `this.html` ：异步xhr完成后，读取数据存入html，并设置completed=true
- `this.completed=false`：完成标志

### [方法 N/A]  

## 2. 事件对象：Class PxerEvent

### [属性]

- `this._pe_eventList` =eventList;  // 子类初始化时导入状态列表，例如[‘load' ,'error' ,'fail' ,'warn'])
- `this._pe_event` ={};
- `this._pe_oneEvent` ={};

> 构造函数时PROXY是个什么鬼？拦截get方法
  
### [方法]

- `on(type,listener)`:              //针对_pe_event，如果type已存在，this._pe_event[type].push(listener)
- `one(type, listener)`;            // 针对_pe_one_event，如果type已存在，this._pe_oneEvent[type].push(listener)
- `dispatch(type ,...data)`	        // 似乎是输出信息，被PxerThreadManager.run调用？
- `off(eventType, listener)`        // 根据eventType和 listener，依次删除_pe_event和pe_oneEvent的指定行

``` js
throw new Error(`PxerThread#init: ${this.id} config illegal`);

ptm.on('error'  ,(...argn)=>this.dispatch('error',argn));
this.one('finishWorksTask',()=>this.printWorks());
this.dispatch('error' ,`PxerThread#${this.id}.init: unknown task`);
```

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
- `run()`：运行线程(递归调用):发出XHR并设置timeout, load ,error事件；成功后数据存入this.task.html
- `stop()`：简单中止xhr：xor.abort()

## 4. 线程管理器：Class PxerThreadManager extends PxerEvent

### [属性]

- `super(['load' ,'error' ,'fail' ,'warn']`
- `this.config` ={timeout,retry,thread};
- `this.taskList` =[];	// 输入任务列表，`PxerRequest[]`，[{url, html. completed?}]
- `this.pointer` =0;	// 指派了下一条要执行的任务
- `this.threads` =[];	//  存放的线程对象，`PxerThread[]`
- `this.middleware` =[function(task){  return !!task; }];  //任务开始前调用的中间件，type {Function[]} 返回true继续执行，false终止
- `this.runtime ={`};	// 运行时用到的变量

### [方法]

- `init(taskList)`  // 初始化：导入任务taskList，压入线程列表threads
- `run()`           // 启动：逐一设置线程的load/fail/error的回调函数，以及中间件调用next，然后init+run
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
