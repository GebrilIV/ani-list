// Vue.js app entry point - Assemblage modulaire
const app = new Vue({
    el: '#app',
    data() {
        return getInitialData();
    },
    computed: getComputedProperties(),
    methods: Object.assign(
        getSearchMethods(),
        getUIMethods(),
        getAniListMethods(),
        getCRUDMethods(),
        getEditMethods()
    ),
    watch: getWatchers(),
    ...getLifecycleHooks(),
    template: getTemplate()
});

