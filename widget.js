(function() {
    // Функция инициализации виджета
    var widget = {
        render: function() {
            var container = document.createElement('div');
            container.id = 'lost-deals-widget';
            container.style.padding = '10px';
            container.style.fontFamily = 'Arial, sans-serif';
            container.innerHTML = '<h3>Проигранные сделки</h3><div id="stats"></div>';

            loadLostDeals(container);

            return container;
        }
    };

    AMOCRM.addSidebarWidget(widget);

    // Функция загрузки сделок
    function loadLostDeals(container) {
        // Получаем сделки с фильтром "проиграно"
        AMOCRM.api.call('GET', '/api/v4/leads', { filter: { status: 'lost' } })
        .then(function(response) {
            let deals = response._embedded.leads || [];
            let totalLost = deals.reduce((sum, d) => sum + (d.price || 0), 0);

            let statsDiv = container.querySelector('#stats');
            statsDiv.innerHTML = `
                <p>Всего проиграно сделок: <strong>${deals.length}</strong></p>
                <p>Потерянная сумма: <strong>${totalLost} ₽</strong></p>
                <div id="lost-deals-list"></div>
            `;

            let listDiv = statsDiv.querySelector('#lost-deals-list');

            deals.forEach(d => {
                let div = document.createElement('div');
                div.style.marginBottom = '8px';
                div.innerHTML = `
                    <strong>${d.name}</strong> — ${d.price || 0} ₽
                    <select data-id="${d.id}">
                        <option value="">Выберите причину</option>
                        <option value="Цена">Цена</option>
                        <option value="Не готов клиент">Не готов клиент</option>
                        <option value="Конкурент">Конкурент</option>
                        <option value="Другая">Другая</option>
                    </select>
                `;
                listDiv.appendChild(div);

                // Сохраняем выбранную причину
                div.querySelector('select').addEventListener('change', function() {
                    let reason = this.value;
                    if (!reason) return;

                    // Сохраняем в сделку через пользовательское поле
                    let customFieldId = 'CUSTOM_FIELD_ID'; // <-- вставьте ID поля "Причина проигрыша"
                    AMOCRM.api.call('PATCH', /api/v4/leads/${d.id}, {
                        custom_fields_values: [
                            {
                                field_id: customFieldId,
                                values: [{ value: reason }]
                            }
                        ]
                    }).then(() => {
                        console.log(`Сделка ${d.id} обновлена с причиной: ${reason}`);
                        updateStats(container); // обновляем статистику
                    }).catch(err => console.error(err));
                });
            });

            // Отображаем первоначальную статистику
            updateStats(container);
        });
    }

    // Функция подсчёта статистики по причинам
    function updateStats(container) {
        let selects = container.querySelectorAll('select[data-id]');
        let reasonCount = {};
        let totalMoney = 0;

        selects.forEach(s => {
            let reason = s.value;
            let price = parseFloat(s.parentNode.textContent.match(/\d+/)) || 0;
            if (reason) {
                reasonCount[reason] = (reasonCount[reason] || 0) + price;
                totalMoney += price;
            }
        });

        // Обновляем блок статистики
        let statsDiv = container.querySelector('#stats');
        let statHtml = '<h4>Статистика по причинам</h4><ul>';
        for (let r in reasonCount) {
            statHtml += <li>${r}: ${reasonCount[r]} ₽</li>;
        }
        statHtml += </ul><p>Итого по выбранным причинам: <strong>${totalMoney} ₽</strong></p>;
        statsDiv.querySelector('#lost-deals-list').insertAdjacentHTML('afterend', statHtml);
    }

})();
