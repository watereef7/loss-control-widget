define(['jquery'], function ($) {
    var Widget = function () {
        return {
            render: function () {
                console.log('Widget render');
                return true;
            },

            init: function () {
                console.log('Widget init');
                return true;
            },

            bind_actions: function () {
                console.log('Widget bind_actions');
                return true;
            },

            settings: function () {
                console.log('Widget settings');
                return true;
            },

            onSave: function () {
                console.log('Widget onSave');
                return true;
            },

            destroy: function () {
                console.log('Widget destroy');
                return true;
            }
        };
    };

    return Widget;
});
