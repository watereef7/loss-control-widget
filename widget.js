// widget.js - Виджет контроля проигранных сделок

// Эта функция вызывается автоматически при загрузке виджета
define(['jquery'], function ($) {
    
    var Widget = function () {
        // Переменные для хранения данных
        var currentDeal = null;  // Текущая сделка
        var widgetApi = null;    // API amoCRM
        
        // Список причин проигрыша (можно потом расширить)
        var lossReasons = [
            {id: 1, name: "Дорого", color: "#ff6b6b"},
            {id: 2, name: "Нет потребности", color: "#4ecdc4"},
            {id: 3, name: "Выбрали конкурента", color: "#45b7d1"},
            {id: 4, name: "Недозвон", color: "#96ceb4"},
            {id: 5, name: "Некачественный продукт", color: "#ffcc5c"},
            {id: 6, name: "Другое", color: "#999"}
        ];
        
        // =============== ОСНОВНЫЕ ФУНКЦИИ ===============
        
        // 1. Проверка: сделка проиграна?
        function isDealLost(deal) {
            // Статус 143 - обычно это "Закрыто и не реализовано"
            // НО: нужно проверить ID статуса в вашем amoCRM!
            if (deal.status_id === 143) {
                return true;
            }
            
            // Дополнительная проверка по названию статуса
            if (deal.status_name && (
                deal.status_name.toLowerCase().includes('проигр') ||
                deal.status_name.toLowerCase().includes('не реализ') ||
                deal.status_name.toLowerCase().includes('отказ')
            )) {
                return true;
            }
            
            return false;
        }
        
        // 2. Проверка: сделка без движения 7+ дней?
        function isDealStuck(deal) {
            // Если сделка уже проиграна - не считаем её "зависшей"
            if (isDealLost(deal)) return false;
            
            // Получаем дату последнего обновления
            var lastUpdate = new Date(deal.updated_at * 1000); // converted from seconds
            var now = new Date();
            var diffDays = Math.floor((now - lastUpdate) / (1000 * 60 * 60 * 24));
            
            // Если не было движения 7 или более дней
            return diffDays >= 7;
        }
        
        // 3. Показать попап для выбора причины
        function showReasonPopup() {
            // Создаем HTML для попапа
            var popupHtml = `
                <div class="loss-control-popup" style="
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.7);
                    z-index: 999999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">
                    <div style="
                        background: white;
                        padding: 25px;
                        border-radius: 10px;
                        width: 500px;
                        max-width: 90%;
                        max-height: 80vh;
                        overflow-y: auto;
                        box-shadow: 0 5px 20px rgba(0,0,0,0.3);
                    ">
                        <h3 style="margin-top: 0; color: #e74c3c;">
                            ⚠️ Требуется указать причину
                        </h3>
                        
                        <p><strong>Сделка:</strong> ${currentDeal.name || 'Без названия'}</p>
                        <p><strong>Сумма:</strong> ${currentDeal.price || 0} ₽</p>
                        
                        <p>Эта сделка была проиграна или не обновлялась более 7 дней.</p>
                        <p><strong>Пожалуйста, выберите причину:</strong></p>
                        
                        <div class="reasons-list" style="margin: 20px 0;">
            `;
            
            // Добавляем варианты причин
            lossReasons.forEach(function(reason) {
                popupHtml += `
                    <label style="
                        display: block;
                        padding: 10px;
                        margin: 5px 0;
                        border: 2px solid #eee;
                        border-radius: 5px;
                        cursor: pointer;
                        transition: all 0.2s;
                    " onmouseover="this.style.borderColor='${reason.color}'" 
                      onmouseout="this.style.borderColor='#eee'">
                        <input type="radio" name="loss_reason" value="${reason.id}" 
                               style="margin-right: 10px;">
                        <span style="color: ${reason.color}; font-weight: bold;">
                            ${reason.name}
                        </span>
                    </label>
                `;
            });
            
            popupHtml += `
                        </div>
                        
                        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
                            <textarea id="reason_comment" placeholder="Комментарий (необязательно)" 
                                      style="width: 100%; padding: 10px; border: 1px solid #ddd; 
                                             border-radius: 5px; margin-bottom: 15px; 
                                             min-height: 60px;"></textarea>
                            
                            <button id="save_reason_btn" style="
                                background: #e74c3c;
                                color: white;
                                border: none;
                                padding: 12px 25px;
                                border-radius: 5px;
                                font-size: 16px;
                                cursor: pointer;
                                width: 100%;
                            ">
                                💾 Сохранить причину и продолжить
                            </button>
                            
                            <p style="font-size: 12px; color: #777; margin-top: 10px;">
                                Без указания причины работа со сделкой будет ограничена
                            </p>
                        </div>
                    </div>
                </div>
            `;
            
            // Добавляем попап на страницу
            $('body').append(popupHtml);
            
            // Обработчик сохранения
            $('#save_reason_btn').click(function() {
                saveLossReason();
            });
        }
        
        // 4. Сохранить причину проигрыша
        function saveLossReason() {
            // Получаем выбранную причину
            var selectedReason = $('input[name="loss_reason"]:checked').val();
            var comment = $('#reason_comment').val();
            
            if (!selectedReason) {
                alert('Пожалуйста, выберите причину проигрыша');
                return;
            }
            
            // Находим название выбранной причины
            var reasonName = lossReasons.find(function(r) {
                return r.id == selectedReason;
            }).name;
            
            // Создаем заметку в сделке с причиной
            var noteText = `🎯 Причина проигрыша: ${reasonName}`;
            if (comment) {
                noteText += `\n📝 Комментарий: ${comment}`;
            }
            noteText += `\n💰 Сумма сделки: ${currentDeal.price || 0} ₽`;
            noteText += `\n📅 Дата: ${new Date().toLocaleDateString()}`;
            
            // Сохраняем заметку через API amoCRM
            widgetApi.request({
                url: '/api/v4/leads/notes',
                method: 'POST',
                data: [{
                    entity_id: currentDeal.id,
                    note_type: 'common',
                    params: {
                        text: noteText
                    }
                }]
            }).then(function(response) {
                console.log('Причина сохранена!', response);
                
                // Закрываем попап
                $('.loss-control-popup').remove();
                
                // Показываем уведомление
                alert('✅ Причина проигрыша сохранена!');
                
                // Обновляем виджет (показываем статистику)
                renderWidget();
            }).fail(function(error) {
                console.error('Ошибка сохранения:', error);
                alert('Ошибка при сохранении. Проверьте консоль.');
            });
        }
        
        // 5. Показать статистику по проигрышам
        function showStatistics() {
            // Загружаем все проигранные сделки
            widgetApi.request({
                url: '/api/v4/leads',
                method: 'GET',
                params: {
                    with: 'contacts',
                    filter[statuses][0][pipeline_id]: currentDeal.pipeline_id,
                    filter[statuses][0][status_id]: 143 // Проигранные
                }
            }).then(function(response) {
                var deals = response._embedded.leads;
                var totalLost = 0;
                var reasonsCount = {};
                
                // Анализируем заметки для подсчета причин
                // В реальном приложении нужно хранить причины в отдельной базе
                
                // Простая статистика по суммам
                deals.forEach(function(deal) {
                    totalLost += parseInt(deal.price || 0);
                });
                
                // Показываем статистику
                $('#loss_stats').html(`
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 15px;">
                        <h4 style="margin-top: 0; color: #e74c3c;">
                            📊 Статистика проигрышей
                        </h4>
                        <p><strong>Всего проиграно:</strong> ${deals.length} сделок</p>
                        <p><strong>Общая сумма потерь:</strong> ${totalLost.toLocaleString()} ₽</p>
                        <p><strong>Средний чек проигранных:</strong> ${Math.round(totalLost/deals.length).toLocaleString()} ₽</p>
                        
                        <div style="margin-top: 10px; padding: 10px; background: white; border-radius: 3px;">
                            <p style="margin: 5px 0;">
                                <span style="color: #ff6b6b">●</span> Дорого: 0 сделок (0 ₽)
                            </p>
                            <p style="margin: 5px 0;">
                                <span style="color: #4ecdc4">●</span> Нет потребности: 0 сделок (0 ₽)
                            </p>
                            <p style="margin: 5px 0;">
                                <span style="color: #45b7d1">●</span> Конкурент: 0 сделок (0 ₽)
                            </p>
                            <button onclick="alert('В реальном приложении здесь будет детальная аналитика с графиками!')" 
                                    style="background: #3498db; color: white; border: none; padding: 8px 15px; 
                                           border-radius: 3px; margin-top: 10px; cursor: pointer;">
                                📈 Подробная аналитика
                            </button>
                        </div>
                    </div>
                `);
            });
        }
        
        // 6. Основная функция отрисовки виджета
        function renderWidget() {
            // Очищаем контейнер
            $('.widget-container').empty();
            
            // Проверяем условия
            var isLost = isDealLost(currentDeal);
            var isStuck = isDealStuck(currentDeal);
            
            // Если сделка проиграна или зависла
            if (isLost || isStuck) {
                var statusText = isLost ? '🔴 Проиграна' : '🟡 Зависла';
                
                $('.widget-container').html(`
                    <div style="border-left: 4px solid ${isLost ? '#e74c3c' : '#f39c12'}; 
                                padding: 15px; background: #fff; border-radius: 4px;">
                        <h4 style="margin-top: 0; color: ${isLost ? '#e74c3c' : '#f39c12'};">
                            ${statusText}
                        </h4>
                        
                        <div id="reason_status"></div>
                        
                        <button id="check_reason_btn" style="
                            background: ${isLost ? '#e74c3c' : '#f39c12'};
                            color: white;
                            border: none;
                            padding: 8px 15px;
                            border-radius: 4px;
                            margin-top: 10px;
                            cursor: pointer;
                            width: 100%;
                        ">
                            ${isLost ? '📝 Указать причину проигрыша' : '⏱️ Отметить причину задержки'}
                        </button>
                        
                        <div id="loss_stats" style="margin-top: 15px;"></div>
                    </div>
                `);
                
                // Проверяем, есть ли уже заметка с причиной
                widgetApi.request({
                    url: '/api/v4/leads/' + currentDeal.id + '/notes',
                    method: 'GET'
                }).then(function(response) {
                    var hasReasonNote = false;
                    var notes = response._embedded.notes || [];
                    
                    notes.forEach(function(note) {
                        if (note.params && note.params.text && 
                            note.params.text.includes('Причина проигрыша')) {
                            hasReasonNote = true;
                            $('#reason_status').html(`
                                <p style="color: #27ae60; background: #d5f4e6; 
                                          padding: 8px; border-radius: 3px;">
                                    ✅ Причина уже указана
                                </p>
                            `);
                            $('#check_reason_btn').text('✏️ Изменить причину');
                        }
                    });
                    
                    if (!hasReasonNote) {
                        // Если причины нет - ПОКАЗЫВАЕМ ПОПАП СРАЗУ
                        // (можно закомментировать, если хотите показывать по кнопке)
                        showReasonPopup();
                    }
                });
                
                // Показываем статистику
                showStatistics();
                
                // Обработчик кнопки
                $('#check_reason_btn').click(function() {
                    showReasonPopup();
                });
                
            } else {
                // Если сделка активна
                $('.widget-container').html(`
                    <div style="padding: 15px; background: #f8f9fa; border-radius: 4px;">
                        <h4 style="margin-top: 0; color: #2ecc71;">
                            ✅ Сделка активна
                        </h4>
                        <p>Статус: ${currentDeal.status_name || 'Активна'}</p>
                        <p>Последнее обновление: ${new Date(currentDeal.updated_at * 1000).toLocaleDateString()}</p>
                        
                        <button onclick="showStatistics()" 
                                style="background: #3498db; color: white; border: none; 
                                       padding: 8px 15px; border-radius: 4px; 
                                       margin-top: 10px; cursor: pointer; width: 100%;">
                            📊 Посмотреть статистику проигрышей
                        </button>
                    </div>
                `);
            }
        }
        
        // =============== МЕТОДЫ ВИДЖЕТА ===============
        
        return {
            // Инициализация виджета (вызывается первой)
            init: function (data) {
                console.log('✅ Виджет Loss Control инициализирован');
                
                // Сохраняем API виджета
                widgetApi = data.widget_api;
                
                return true;
            },

            // Отрисовка виджета (вызывается после init)
            render: function (data) {
                console.log('🎨 Начинаю отрисовку виджета');
                
                // Сохраняем данные о сделке
                currentDeal = data.entity;
                console.log('Текущая сделка:', currentDeal);
                
                // Создаем контейнер для виджета
                var container = '<div class="widget-container"></div>';
                $(data.container).html(container);
                
                // Рендерим виджет
                renderWidget();
                
                return true;
            },

            // Дополнительные методы (можно оставить пустыми)
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
