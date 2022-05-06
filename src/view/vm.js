f6rp.util.afterLoad(function(){
    const el = document.createElement('div');
    const component = {
        template: f6rp.uiTemplate,
        watch:{
        },
        data(){return {
            total: 100,
            showAll:true,
            f6rpVersion: f6rp.package.version,
            status: fsm.repr(),
        }},
        computed:{
        },
        methods:{
         },
        mounted(){
            // this.listenUrlChange();
            // pxer.loaded = true;
            //pxer.sendEvent('pv');
        },
    };

    // find a element as anchor
    [
        elt => {
            const target = document.querySelector('#root > header');
            if (!target) return false;

            target.appendChild(elt);
            return true;
        },
        elt => {
            const target = document.querySelector('._global-header');
            if (!target) return false;

            target.appendChild(elt);
            return true;
        },
        elt => {
            const target = document.getElementById('wrapper');
            if (!target) return false;

            target.insertBefore(elt, target.firstChild);

            return true;
        },
        elt => {
            document.body.insertBefore(elt, document.body.firstChild);
            return true;
        },
    ].some(fn => fn(el));

    // mount UI
    f6rp.vm = new Vue(component).$mount(el);
});