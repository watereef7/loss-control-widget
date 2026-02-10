// ================================
// Loss Control Widget для amoCRM
// Версия 2.0 (новый формат)
// ================================

console.log('🚀 Loss Control Widget загружен!');

// Ждем полной загрузки страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM загружен, инициализируем виджет...');
    
    // Ждем немного, чтобы amoCRM успел загрузиться
    setTimeout(initWidget, 2000);
});

function initWidget() {
    console.log('🎯 Начинаем инициализацию виджета...');
    
    // Проверяем, есть ли API amoCRM
    if (typeof Amo !== 'undefined' && Amo.API) {
        console.log('✅ Amo API доступен');
        initWithAmoAPI();
    } else {
        console.log('⚠️ Amo API не найден, используем fallback');
        initWithoutAPI();
    }
}

// Инициализация с API amoCRM
function initWithAmoAPI() {
    Amo.API.init().then(function() {
        console.log('✅ Amo API инициализирован');
        
        // Получаем текущую сделку
        Amo.API.getCurrentCard().then(function(card) {
            console.log('📊 Получена сделка:', card);
            renderWidget(card);
        }).catch(function(error) {
            console.error('❌ Ошибка получения сделки:', error);
            renderError('Не удалось загрузить данные сделки');
        });
    }).catch(function(error) {
        console.error('❌ Ошибка инициализации API:', error);
        initWithoutAPI();
    });
}

// Инициализация без API (fallback)
function initWithoutAPI() {
    console.log('🔄 Используем fallback инициализацию');
    
    // Пробуем найти данные сделки в DOM
    var cardData = extractCardDataFromDOM();
    if (cardData) {
        renderWidget(cardData);
    } else {
        renderError('Не удалось найти данные сделки. Виджет работает в тестовом режиме.');
        renderTestWidget();
    }
}

// Извлекаем данные сделки из DOM (fallback)
function extractCardDataFromDOM() {
    try {
        // Попробуем найти ID сделки в URL
        var match = window.location.href.match(/leads\/detail\/(\d+)/);
        var dealId = match ? match[1] : 'unknown';
        
        // Попробуем найти название сделки
        var dealNameElement = document.querySelector('.card-title h1, .card-header h1, [data-qa="card-title"]');
        var dealName = dealNameElement ? dealNameElement.textContent.trim() : 'Без названия';
        
        return {
            id: dealId,
            name: dealName,
            price: 0,
            status_id: null,
            status_name: 'Неизвестно',
            pipeline_id: null,
            updated_at: Math.floor(Date.now() / 1000)
        };
    } catch(e) {
        console.error('Ошибка извлечения данных:', e);
        return null;
    }
}

// Рендерим виджет
function renderWidget(card) {
    console.log('🎨 Рендерим виджет для сделки:', card);
    
    // Создаем контейнер для виджета
    var widgetContainer = createWidgetContainer();
    
    // Проверяем статус сделки
    var isLost = checkIfDealIsLost(card);
    var isStuck = checkIfDealIsStuck(card);
    
    // Генерируем HTML
    var html = generateWidgetHTML(card, isLost, isStuck);
    
    // Вставляем HTML в контейнер
    widgetContainer.innerHTML = html;
    
    // Добавляем обработчики событий
    addEventListeners(card, widgetContainer);
    
    // Показываем статистику, если сделка проиграна
    if (isLost || isStuck) {
        showLossStatistics(widgetContainer);
    }
    
    console.log('✅ Виджет успешно отрендерен!');
}

// Создаем контейнер для виджета
function createWidgetContainer() {
    // Сначала ищем существующий контейнер
    var existingContainer = document.querySelector('#loss-control-widget');
    if (existingContainer) {
        existingContainer.remove();
    }
    
    // Создаем новый контейнер
    var container = document.createElement('div');
    container.id = 'loss-control-widget';
    container.style.cssText = `
        margin: 10px 0;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    `;
    
    // Ищем, куда вставить виджет
    var targetContainers = [
        '.card-right', 
        '.card-widgets',
        '[data-widgets-container]',
        '.card-sidebar',
        '.widgets-container'
    ];
    
    var inserted = false;
    for (var i = 0; i < targetContainers.length; i++) {
        var target = document.querySelector(targetContainers[i]);
        if (target) {
            target.prepend(container);
            console.log('📍 Виджет вставлен в:', targetContainers[i]);
            inserted = true;
            break;
        }
    }
    
    // Если не нашли подходящий контейнер, вставляем в тело
    if (!inserted) {
        console.warn('⚠️ Не нашли контейнер для виджета, вставляем в body');
        document.body.prepend(container);
    }
    
    return container;
}

// Проверяем, проиграна ли сделка
function checkIfDealIsLost(card) {
    // Проверяем разные признаки проигранной сделки
    if (card.status_id === 143) return true; // Стандартный ID для "Закрыто и не реализовано"
    if (card.status_name && (
        card.status_name.toLowerCase().includes('проигр') ||
        card.status_name.toLowerCase().includes('не реализ') ||
        card.status_name.toLowerCase().includes('отказ') ||
        card.status_name.toLowerCase().includes('loss')
    )) return true;
    
    return false;
}

// Проверяем, зависла ли сделка
function checkIfDealIsStuck(card) {
    if (checkIfDealIsLost(card)) return false;
    
    // Если сделка не обновлялась 7+ дней
    if (card.updated_at) {
        var lastUpdate = new Date(card.updated_at * 1000);
        var now = new Date();
        var diffDays = Math.floor((now - lastUpdate) / (1000 * 60 * 60 * 24));
        return diffDays >= 7;
    }
    
    return false;
}

// Генерируем HTML виджета
function generateWidgetHTML(card, isLost, isStuck) {
    var statusColor = '#2ecc71'; // зеленый - активна
    var statusText = '✅ Активна';
    var buttonText = '📊 Статистика';
    var buttonColor = '#3498db';
    
    if (isLost) {
        statusColor = '#e74c3c'; // красный - проиграна
        statusText = '🔴 Проиграна';
        buttonText = '📝 Указать причину';
        buttonColor = '#e74c3c';
    } else if (isStuck) {
        statusColor = '#f39c12'; // оранжевый - зависла
        statusText = '🟡 Зависла';
        buttonText = '⏱️ Отметить причину';
        buttonColor = '#f39c12';
    }
    
    return `
        <div style="background: white; padding: 0;">
            <!-- Заголовок -->
            <div style="background: linear-gradient(135deg, ${statusColor}, ${statusColor}99); 
                        padding: 15px; color: white;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div>
                        <h3 style="margin: 0; font-size: 16px; display: flex; align-items: center;">
                            🎯 Контроль потерь
                        </h3>
                        <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.9;">
                            ${statusText}
                        </p>
                    </div>
                    <div style="font-size: 12px; background: rgba(255,255,255,0.2); 
                                padding: 3px 8px; border-radius: 10px;">
                        ID: ${card.id}
                    </div>
                </div>
            </div>
            
            <!-- Контент -->
            <div style="padding: 15px;">
                <p style="margin: 0 0 10px 0; font-size: 14px;">
                    <strong>Сделка:</strong> ${card.name || 'Без названия'}
                </p>
                <p style="margin: 0 0 10px 0; font-size: 14px;">
                    <strong>Сумма:</strong> ${card.price ? card.price.toLocaleString() + ' ₽' : '0 ₽'}
                </p>
                <p style="margin: 0 0 15px 0; font-size: 14px;">
                    <strong>Статус:</strong> ${card.status_name || 'Неизвестно'}
                </p>
                
                <button id="loss-control-action-btn" 
                        style="width: 100%; 
                               padding: 10px; 
                               background: ${buttonColor}; 
                               color: white; 
                               border: none; 
                               border-radius: 5px; 
                               cursor: pointer; 
                               font-size: 14px;
                               margin-bottom: 10px;">
                    ${buttonText}
                </button>
                
                <!-- Место для статистики -->
                <div id="loss-control-stats"></div>
                
                <!-- Место для формы причины -->
                <div id="loss-control-reason-form" style="display: none;"></div>
            </div>
            
            <!-- Футер -->
            <div style="background: #f8f9fa; padding: 10px 15px; font-size: 11px; color: #666; 
                        border-top: 1px solid #eee; display: flex; justify-content: space-between;">
                <span>Версия 2.0</span>
                <span>${new Date().toLocaleDateString()}</span>
            </div>
        </div>
    `;
}

// Добавляем обработчики событий
function addEventListeners(card, container) {
    var actionBtn = container.querySelector('#loss-control-action-btn');
    if (actionBtn) {
        actionBtn.addEventListener('click', function() {
            var isLost = checkIfDealIsLost(card);
            var isStuck = checkIfDealIsStuck(card);
            
            if (isLost || isStuck) {
                showReasonForm(card, container);
            } else {
                showStatisticsModal();
            }
        });
    }
}

// Показываем статистику проигрышей
function showLossStatistics(container) {
    var statsContainer = container.querySelector('#loss-control-stats');
    if (!statsContainer) return;
    
    statsContainer.innerHTML = `
        <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin-top: 10px;">
            <p style="margin: 0 0 8px 0; font-size: 13px; color: #666;">
                <strong>📈 Анализ потерь:</strong>
            </p>
            <div style="font-size: 12px;">
                <div style="display: flex; justify-content: space-between; margin: 3px 0;">
                    <span>Всего проиграно:</span>
                    <span style="color: #e74c3c;">0 сделок</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin: 3px 0;">
                    <span>Общая сумма:</span>
                    <span style="color: #e74c3c;">0 ₽</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin: 3px 0;">
                    <span>Основная причина:</span>
                    <span>Нет данных</span>
                </div>
            </div>
        </div>
    `;
}

// Показываем форму для указания причины
function showReasonForm(card, container) {
    var formContainer = container.querySelector('#loss-control-reason-form');
    if (!formContainer) return;
    
    var reasons = [
        {id: 1, name: "Дорого", emoji: "💰"},
        {id: 2, name: "Нет потребности", emoji: "🚫"},
        {id: 3, name: "Выбрали конкурента", emoji: "🥇"},
        {id: 4, name: "Недозвон", emoji: "📞"},
        {id: 5, name: "Некачественный продукт", emoji: "📉"},
        {id: 6, name: "Другое", emoji: "❓"}
    ];
    
    var reasonOptions = reasons.map(function(reason) {
        return `<option value="${reason.id}">${reason.emoji} ${reason.name}</option>`;
    }).join('');
    
    formContainer.style.display = 'block';
    formContainer.innerHTML = `
        <div style="background: #fff9e6; padding: 15px; border-radius: 5px; margin-top: 10px; 
                    border: 1px solid #ffd166;">
            <h4 style="margin: 0 0 10px 0; color: #e67e22;">📝 Укажите причину</h4>
            
            <div style="margin-bottom: 10px;">
                <label style="display: block; margin-bottom: 5px; font-size: 13px;">
                    Причина проигрыша:
                </label>
                <select id="reason-select" 
                        style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    <option value="">-- Выберите причину --</option>
                    ${reasonOptions}
                </select>
            </div>
            
            <div style="margin-bottom: 10px;">
                <label style="display: block; margin-bottom: 5px; font-size: 13px;">
                    Комментарий:
                </label>
                <textarea id="reason-comment" 
                          style="width: 100%; padding: 8px; border: 1px solid #ddd; 
                                 border-radius: 4px; min-height: 60px; font-size: 13px;"
                          placeholder="Дополнительные детали..."></textarea>
            </div>
            
            <div style="display: flex; gap: 10px;">
                <button id="save-reason-btn" 
                        style="flex: 1; padding: 10px; background: #27ae60; color: white; 
                               border: none; border-radius: 4px; cursor: pointer;">
                    💾 Сохранить
                </button>
                <button id="cancel-reason-btn" 
                        style="flex: 1; padding: 10px; background: #95a5a6; color: white; 
                               border: none; border-radius: 4px; cursor: pointer;">
                    Отмена
                </button>
            </div>
        </div>
    `;
    
    // Обработчики для формы
    formContainer.querySelector('#save-reason-btn').addEventListener('click', function() {
        var reasonId = formContainer.querySelector('#reason-select').value;
        var comment = formContainer.querySelector('#reason-comment').value;
        
        if (!reasonId) {
            alert('Пожалуйста, выберите причину');
            return;
        }
        
        var selectedReason = reasons.find(function(r) { return r.id == reasonId; });
        
        // В реальном приложении здесь будет сохранение в базу данных
        console.log('Сохранена причина:', {
            dealId: card.id,
            dealName: card.name,
            reason: selectedReason.name,
            comment: comment,
            amount: card.price || 0,
            timestamp: new Date().toISOString()
        });
        
        // Показываем уведомление
        alert(`✅ Причина "${selectedReason.name}" сохранена!`);
        
        // Скрываем форму
        formContainer.style.display = 'none';
        
        // Обновляем виджет
        container.querySelector('#loss-control-action-btn').textContent = '✏️ Изменить причину';
        container.querySelector('#loss-control-action-btn').style.background = '#27ae60';
    });
    
    formContainer.querySelector('#cancel-reason-btn').addEventListener('click', function() {
        formContainer.style.display = 'none';
    });
}

// Показываем модальное окно со статистикой
function showStatisticsModal() {
    alert('В реальной версии здесь будет открываться подробная статистика по всем проигранным сделкам!');
}

// Показываем ошибку
function renderError(message) {
    console.error('❌ Ошибка виджета:', message);
    
    var container = createWidgetContainer();
    container.innerHTML = `
        <div style="background: #ffeaea; padding: 15px; border-radius: 5px; color: #c0392b;">
            <h4 style="margin: 0 0 10px 0;">⚠️ Ошибка виджета</h4>
            <p style="margin: 0; font-size: 13px;">${message}</p>
            <button onclick="location.reload()" 
                    style="margin-top: 10px; padding: 5px 10px; background: #c0392b; 
                           color: white; border: none; border-radius: 3px; cursor: pointer;">
                Обновить
            </button>
        </div>
    `;
}

// Тестовый виджет (если не удалось получить данные)
function renderTestWidget() {
    var container = createWidgetContainer();
    container.innerHTML = `
        <div style="background: #fff3cd; padding: 15px; border-radius: 5px; color: #856404;">
            <h4 style="margin: 0 0 10px 0;">🧪 Тестовый режим</h4>
            <p style="margin: 0 0 10px 0; font-size: 13px;">
                Виджет работает в тестовом режиме. Откройте сделку для полной функциональности.
            </p>
            <div style="font-size: 12px;">
                <p>Доступные функции:</p>
                <ul style="margin: 5px 0; padding-left: 20px;">
                    <li>Отслеживание проигранных сделок</li>
                    <li>Указание причин проигрыша</li>
                    <li>Аналитика по потерям</li>
                </ul>
            </div>
        </div>
    `;
}

// Запускаем проверку виджета каждые 5 секунд (на случай динамической загрузки)
setInterval(function() {
    if (!document.querySelector('#loss-control-widget')) {
        console.log('🔄 Проверяем наличие виджета...');
        initWidget();
    }
}, 5000);
