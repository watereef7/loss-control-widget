define(['jquery'], function($) {
    console.log('🟢 [LOSS CONTROL] Виджет загружен в память');
    
    var Widget = function() {
        console.log('🟢 [LOSS CONTROL] Конструктор вызван');
        
        return {
            init: function(data) {
                console.log('🟢 [LOSS CONTROL] INIT', data);
                return true;
            },

            render: function(data) {
                console.log('🎨 [LOSS CONTROL] RENDER начат');
                console.log('📍 Контейнер:', data.container);
                console.log('📊 Данные сделки:', data.entity);
                
                // ПРОСТЕЙШИЙ HTML для теста
                var html = `
                    <div style="
                        background: red;
                        color: white;
                        padding: 20px;
                        border-radius: 5px;
                        margin: 10px;
                        border: 3px solid yellow;
                    ">
                        <h3 style="margin:0;">🚨 ТЕСТОВЫЙ ВИДЖЕТ</h3>
                        <p>Если вы это видите - виджет работает!</p>
                        <p style="font-size:10px;">ID: ${data.entity ? data.entity.id : 'нет'}</p>
                    </div>
                `;
                
                // Вставляем HTML
                $(data.container).html(html);
                console.log('✅ [LOSS CONTROL] Виджет отрисован');
                
                return true;
            },

            bind_actions: function() {
                console.log('🔗 [LOSS CONTROL] bind_actions');
                return true;
            },

            settings: function() {
                console.log('⚙️ [LOSS CONTROL] settings');
                return true;
            },

            onSave: function() {
                console.log('💾 [LOSS CONTROL] onSave');
                return true;
            },

            destroy: function() {
                console.log('🗑️ [LOSS CONTROL] destroy');
                return true;
            }
        };
    };

    return Widget;
});
