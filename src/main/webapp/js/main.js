// Global objects
var table_RU,
    menu,
    chartUtils,
    colorUtils,
    waiter,
    common,
    douHistory,
    string,
    message,
    log,
    legend;

$(function() {
    'use strict';

    if (typeof Highcharts !== 'undefined') {
        // Highcharts default theme initialization
        Highcharts.theme = {
            colors: ['#4aa4be', '#75b9cd', '#a0cedc', '#cde4eb'],
            title: {
                style: {
                    color: '#000',
                    font: 'bold 16px "Trebuchet MS", Verdana, sans-serif'
                }
            },
            subtitle: {
                style: {
                    color: '#666666',
                    font: 'bold 12px "Trebuchet MS", Verdana, sans-serif'
                }
            },
            legend: {
                itemStyle: {
                    font: '9pt Trebuchet MS, Verdana, sans-serif',
                    color: 'black'
                },
                itemHoverStyle: {
                    color: 'gray'
                }
            }
        };
        Highcharts.setOptions(Highcharts.theme);
    }

    if (typeof accounting !== 'undefined') {
        accounting.settings = {
            number: {
                precision: 0,
                thousand: ' ',
                decimal: '.'
            }
        };
    }

    // Russian localization for jQuery DataTables plugin
    table_RU = {
        "sPaginationType": "full_numbers",
        "oLanguage": {
            "oAria": {
                "sSortAscending": " - нажмите для сортировки по возрастанию",
                "sSortDescending": " - нажмите для сортировки по убыванию"
            },
            "oPaginate": {
                "sFirst": "Первая",
                "sLast": "Последняя",
                "sNext": "Следущая",
                "sPrevious": "Предыдущая"
            },
            "sEmptyTable": "Нет данных",
            "sInfo": "Получено _TOTAL_ записей (_START_ до _END_)",
            "sInfoEmpty": "Нет записей для отображения",
            "sInfoFiltered": " - фильтрация _MAX_ записей",
            "sLengthMenu": "Отображать _MENU_ записей",
            "sLoadingRecords": "Пожалуйста подождите - загружается...",
            "sProcessing": "Таблица занята",
            //"sSearch": "Фильтрация записей:",
            "sSearch": "Применить фильтр _INPUT_ к таблице",
            "sZeroRecords": "Нет записей для отображения"
        }
    };

    // Common ajax setup
    // For authorised users: Do not cache all XHR requests
	// For not authorised users: Cache (if it possible by browser) all XHR requests
    var globalAjaxSetupObj = {
        cache: window.IS_PUBLIC_USER
    };

    $.ajaxSetup(globalAjaxSetupObj);

    $(document).ajaxError(function(event, jqxhr, settings, exception) {
        // Session is expired
        if (jqxhr.status === 901) {
            window.location.reload(true);
        }

        ajaxError(settings.url, settings.data);
    });

    // Override default bootstrap-select settings
    $.fn.selectpicker.defaults.noneSelectedText = ' - ';

    var mainMenu = $('#sidebar-nav .main_menu'),
        menuItems = mainMenu.find('li a'),
        firstMenuLink = mainMenu.find('li:first-child a'),
        colorMaxVal = 255,
        defaultFillColor = 'rgb(204,204,204)',
        greenStatic = 'rgb(110,210,100)',
        greenOpacityStatic = 'rgba(110,210,100,0.67)',
        colorIntervalMin = 150,
        colorIntervalMax = 230;

    // Логика по выделению активного пункта меню
    function setActiveMenuItem(el) {
        clearActiveMenuItem();
        el.parent().addClass('active');
    }

    function clearActiveMenuItem() {
        menuItems.parents('li').removeClass('active');
    }

    function getActiveMenuItemUrl() {
        return mainMenu.find('.active a').data('to');
    }
    
    function initializeMenu() {
        var content = $('.content'),
            wrapper = content.find('#pad-wrapper'),
            lockMenuHandling = false,
            lastOpenedPageName = '';
        
        $('.main_menu a[data-to]').click(menuItemCkickHandler);
        
        function menuItemCkickHandler(e, data) {
            if (lockMenuHandling) {
                return false;
            }
            
            var link = $(this),
                contentPageUrl = link.data('to'),
                targetPageName = contentPageUrl.split('=')[1].split('.jsp')[0],
                tatgetPage = wrapper.find('#' + targetPageName);
            
            if (lastOpenedPageName) {
                var lastPage = wrapper.find('#' + lastOpenedPageName);
                lastPage.hide();
                lastPage.removeClass('active_content');
            }

            if (tatgetPage.length) {
                tatgetPage.show();
                tatgetPage.addClass('active_content');

                // Fire top region filter change event
                var filterObj = getFilter();
                $('.active_content').trigger('change:filter', {
                    canton: filterObj.canton,
                    state: filterObj.state,
                    municipality: filterObj.municipality
                });
            }
            else {
                lockMenuHandling = true;
                
                var pageWrapper = $('<div>')
                    .attr('id', targetPageName)
                    .addClass('active_content');
            
                wrapper.append(pageWrapper);
                pageWrapper.load(contentPageUrl, function() {
                    lockMenuHandling = false;
                    var filterObj = getFilter();
                    // In case of existing of hot panel
                    $('.active_content').trigger('change:hot', {
                        canton: filterObj.canton,
                        state: filterObj.state,
                        municipality: filterObj.municipality
                    });
                });
            }
            lastOpenedPageName = targetPageName;

            // Hide/show top regions navigation control
            content.toggleClass('hide_top_nav_panel', !!link.data('hide-top-nav-panel'));
            content.toggleClass('hide_top_nav_municipality', !!link.data('hide-top-nav-municipality'));

            // Save menu state if the click event was not triggered programmatically
            if (data === undefined) {
                var regionFilterObj = getFilter();
                saveState(contentPageUrl, regionFilterObj);
            }

            // Activate menu item visually
            setActiveMenuItem(link);

            $(document).scrollTop(0);
        }
    }

    function triggerMenuItemClick(menuItemLink) {
        menuItemLink.trigger('click', [ { doNotSaveState: true } ]);
    }

    // Функции для корректировки представления графиков

    // Графики в скрытых контейнерах не ресайзятся автоматически со всем окном
    // Решение - принудительный вызов ресайза окна после отображения контейнеров
    function resizeHiddenCharts() {
        $(window).resize();
    }

    // Используется для изменения высоты контейнера графика с горизонтальной гистограммой
    function resizeChartContainer(seriesCount, chartContainer) {
        var chartHeight = seriesCount > 0 ? seriesCount * 100 : 200;
        // для заголовка и футера графика
        chartHeight += 100;

        chartContainer.height(chartHeight);
    }

    // Для больших значений: сокращение числа значащих цифр и округление
    function limitNumber(number) {
        if (number >= 1000 && number < 1000000) {
            return (number / 1000).toFixed(1).replace('.', ',') + ' тыс.';
        }
        else if (number >= 1000000) {
            return (number / 1000000).toFixed(1).replace('.', ',') + ' млн.';
        }
        else {
            return number;
        }
    }

    // COLORS
    function getColor(params) {
        var value = parseInt(params.value, 10),
            minValue = params.minValue,
            maxValue = params.maxValue,
            isQuality = params.isQuality,
            isInverted = params.isInverted,
            isNegativeValue = false,
            // 0 - 1
            colorIntensity,
            colorInterval,
            // result
            red,
            green,
            blue;

        if (value < 0) {
            if (!isQuality) {
                isNegativeValue = true;
                value *= -1;
                maxValue = Math.abs(minValue);
            }
            else {
                return defaultFillColor;
            }
        }

        if (maxValue === 0) {
            colorIntensity = 0;
        }
        else if (value < maxValue) {
            colorIntensity = value / maxValue;
        }
        else {
            colorIntensity = 1;
        }

        if (isInverted) {
            colorIntensity = 1 - colorIntensity;
        }

        blue = colorIntervalMin;
        if (isQuality) {
            colorInterval = colorIntervalMax - colorIntervalMin;

            // intensity     0    -   0.5   -   1
            // red           min      max       max
            // green         max      max       min
            if (colorIntensity < 0.5) {
                red = colorIntervalMin + colorInterval * colorIntensity * 2;
                green = colorIntervalMax;
            }
            else {
                red = colorIntervalMax;
                green = colorIntervalMax - colorInterval * (colorIntensity - 0.5) * 2;
            }
        }
        else {
            red = isNegativeValue ? colorIntervalMax : colorIntervalMin;
            green = isNegativeValue ? colorIntervalMin : colorIntervalMax;

            // colorMaxVal - white edge
            red = colorMaxVal - (colorMaxVal - red) * colorIntensity;
            green = colorMaxVal - (colorMaxVal - green) * colorIntensity;
            blue = colorMaxVal - (colorMaxVal - blue) * colorIntensity;
        }

        return [
            'rgb(',
            red.toFixed(0),
            ',',
            green.toFixed(0),
            ',',
            blue.toFixed(0),
            ')'
        ].join('');
    }

    // Methods for indicate loading process
    // container - string selector or DOM element or jquery object
    function showWaiter(container) {
        container = convertParamToJqueryObj(container);
        if (container.find('.loading').length === 0) {
            var el = $('<div>', {
                'class': 'loading'
            });

            container.css('position', 'relative');
            container.append(el);
        }
    }

    function hideWaiter(container) {
        container = convertParamToJqueryObj(container);
        container.find('.loading').remove();
    }

    function convertParamToJqueryObj(container) {
        if (typeof container === 'string') {
            container = $(container);
        }
        else if (container.nodeType) {
            container = $(container);
        }
        
        return container;
    }
    
    // Common helpers
    // Load and fill ages select control
    function fillAgesSelect(selectObj, callback) {
        selectObj = convertParamToJqueryObj(selectObj);
        
        return $.ajax({
            type: 'GET',
            url: 'report.htm',
            dataType : 'json',
            data: {
                action: 'getReport',
                id: 'age_types'
            },
            success: function (data) {
                if (checkJson(data)) {
                    var table = data.table;

                    selectObj.empty();
                    fillSelect(selectObj, table);
                    selectObj.selectpicker('refresh');
                    selectObj.change();

                    if (callback && typeof callback === 'function') {
                        callback();
                    }
                }
            }
        });
    }
    
    function fillMonthSelect(selectObj, callback, year, requestId){
        selectObj = convertParamToJqueryObj(selectObj);
        year = year || new Date().getUTCFullYear();
        requestId = requestId || 'monthes_asc';

        $.ajax({
            type : 'GET',
            dataType : 'json',
            url: 'report.htm',
            data: {
                action: 'getReport',
                id: requestId,
                year: year
            },
            success: function (data) {
                if (checkJson(data)) {
                    var table = data.table;
                    var curMonth = new Date().getMonth() + 1;

                    selectObj.empty();
                    fillSelect(selectObj, table);
                    selectObj.find('option[value="' + curMonth + '"]').prop('selected', true);

                    if (callback && typeof callback === 'function') {
                        callback();
                    }

                    selectObj.selectpicker('refresh');
                }
            }
        });
    }

    function fillYearSelect(selectObj, callback, requestId){
        selectObj = convertParamToJqueryObj(selectObj);
        requestId = requestId || 'years_asc';

        $.ajax({
            type : 'GET',
            dataType : 'json',
            url: 'report.htm',
            data: {
                action: 'getReport',
                id: requestId
            },
            success: function (data) {
                if (checkJson(data)) {
                    var table = data.table;
                    var curYear = new Date().getUTCFullYear();

                    selectObj.empty();
                    fillSelect(selectObj, table);
                    selectObj.find('option[value="' + curYear + '"]').prop('selected', true);
                    
                    if (callback && typeof callback === 'function') {
                        callback();
                    }
                    
                    selectObj.selectpicker('refresh');
                }
            }
        });
    }

    var fillSelect = function (selectObj, table) {
        _.forOwn(table, function (v) {
            var option = $("<option/>")
                .val(v[0])
                .html(v[1]);
        
            selectObj.append(option);
        });
    };
    
    var setAvailabilityOfBootstrapSelect = function (selectObj, doEnable) {
        if (doEnable === null) {
            doEnable = true;
        }
        selectObj = convertParamToJqueryObj(selectObj);

        selectObj.prop('disabled', !doEnable);
        selectObj.selectpicker('refresh');
    };

    var regionSelects = $('.top_nav_panel select');
    var setAvailabilityOfRegionSelects = function(doEnable) {
        var initializedRegionSelects = regionSelects.filter(function(index, domObj) {
            return $(domObj).next().hasClass('bootstrap-select');
        });
        setAvailabilityOfBootstrapSelect(initializedRegionSelects, doEnable);
    };

    var checkJson = function (json, property) {
        property = property || 'table'
        return json && json.code === 0 && json[property] && json[property].length > 0;
    };

    var downloadFile = function(downloadUrl) {
        var hiddenIFrameID = 'hiddenDownloader',
            iframe = document.getElementById(hiddenIFrameID);

        if (iframe === null) {
            iframe = document.createElement('iframe');
            iframe.id = hiddenIFrameID;
            iframe.style.display = 'none';
            document.body.appendChild(iframe);
        }
        iframe.src = downloadUrl;
    };

    // Deselect content of the page
    var clearHtmlSelection = function() {
        if(document.selection && document.selection.empty) {
            document.selection.empty();
        } else if(window.getSelection) {
            window.getSelection().removeAllRanges();
        }
    };

    function drawNoDataBlock(container, textMarginTop) {
        var noDataBlock;

        container.children().hide();
        // Set height from css rule
        container.css('height', '');

        noDataBlock = container.find('.no_data_block');
        if (noDataBlock.length) {
            noDataBlock.show();
        }
        else {
            container.append($('<div>')
                .css('margin-top', textMarginTop)
                .css('text-align', 'center')
                .addClass('no_data_block')
                .text('Нет данных'));
        }
    }

    // Browser history additional logic
    function saveState(contentPageUrl, regionFilterObj) {
        var state = getState(contentPageUrl, regionFilterObj);
        
        History.pushState(state.data, state.title, state.url);
    }

    function replaceState(contentPageUrl, regionFilterObj) {
        var state = getState(contentPageUrl, regionFilterObj);
        
        History.replaceState(state.data, state.title, state.url);
    }

    function getState(contentPageUrl, regionFilterObj) {
        var paramObj = {
            content: contentPageUrl && contentPageUrl.indexOf('=') && contentPageUrl.indexOf('.jsp') ?
                contentPageUrl.split('=')[1].split('.jsp')[0] :
                ''
        };
        
        if (regionFilterObj && !$.isEmptyObject(regionFilterObj) &&
                regionFilterObj.hasOwnProperty('canton') &&
                regionFilterObj.hasOwnProperty('state') &&
                regionFilterObj.hasOwnProperty('municipality')) {
            $.extend(paramObj, regionFilterObj);
        }

		if (window.IS_PUBLIC_USER) {
	        delete paramObj.state;
	        delete paramObj.municipality;
		}

        var stateUrl = '?' + $.param(paramObj);
        
        var state = {
            data: {
                _index: History.getCurrentIndex(),
                menuUrl: contentPageUrl,
                regionFilterObj: regionFilterObj
            },
            title: 'Дошкольное образование - Федеральный сегмент',
            url: stateUrl
        };
        
        return state;
    }

    function initialContentPageLoad() {
        // Read initial query string and go to corresponding menu item
        var initUrlParams = window.location.search,
            contentPageName = getParameterByName(initUrlParams, 'content'),
            menuItemLink,
            initRegionFilterObj;

        if (initUrlParams && contentPageName) {
            menuItemLink = mainMenu.find('a[data-to*="' + contentPageName + '"]');
            if (!menuItemLink.length) {
                // Go to first menu item
                menuItemLink = firstMenuLink;
            }
        }
        else {
            // Go to first menu item
            menuItemLink = firstMenuLink;
        }

        initRegionFilterObj = {
            canton: window.USER_CANTON_ID !== -1 ? window.USER_CANTON_ID : getFilterIntValueFromQuery(initUrlParams, 'canton'),
            state: window.USER_STATE_ID !== -1 ? window.USER_STATE_ID : getFilterIntValueFromQuery(initUrlParams, 'state'),
            municipality: getFilterIntValueFromQuery(initUrlParams, 'municipality')
        };

        // Save initial objects
        douHistory.initialRegionFilterObj = initRegionFilterObj;
        douHistory.initialMenuItemLink = menuItemLink;

        // Replace initial state
        replaceState(menuItemLink.data('to'), initRegionFilterObj);
    }

    function getParameterByName(query, name) {
        name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
        var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            results = regex.exec(query);
        return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
    }
    
    function getFilterIntValueFromQuery(query, paramName) {
        var val = getParameterByName(query, paramName);
        val = parseInt(val, 10);
        if (isNaN(val)) {
            if (paramName === "canton") {
                val = window.USER_CANTON_ID;
            }
            else if (paramName === "state") {
                val = window.USER_STATE_ID;
            }
            else {
                val = -1;
            }
        }

        return val;
    }
    
    // Handle history state changes
    History.Adapter.bind(window, 'statechange', function() {
        var state = History.getState();

        if (!$.isEmptyObject(state.data)) {
            // For workaround from handle 'statechange' immediatly after calling pushState
            var currentIndex = History.getCurrentIndex(),
                internal = state.data._index === currentIndex - 1;

            if (!internal) {
                var menuItemLink = mainMenu.find('a[data-to="' + state.data.menuUrl + '"]');
                // Prepare objects
                douHistory.initialRegionFilterObj = state.data.regionFilterObj;
                douHistory.initialMenuItemLink = menuItemLink;
                douHistory.changeFilter = true;
                setFilter();
            }
        }
    });
    
    // Date additional methods
    Date.prototype.addDays = function(d) {
        this.setDate(this.getDate() + d);
        return this;
    };

    Date.prototype.toPointFormatDateString = function(splitter, showFullYear) {
        splitter = splitter || '.';
        showFullYear = showFullYear || false;
        
        var date = this.getDate().toString(),
            month = (this.getMonth() + 1).toString(),
            year = this.getFullYear().toString();
    
        if (date.length < 2) {
            date = '0' + date;
        }
        if (month.length < 2) {
            month = '0' + month;
        }
        if (!showFullYear) {
            var l = year.length;
            year = year.substring(l - 2);
        }

        return date + splitter + month + splitter + year;
    };

    // String utils
    function htmlEncode(value){
        if (value) {
            return $('<div>').text(value).html();
        }
        else {
            return '';
        }
    }

    function htmlDecode(value) {
        if (value) {
            return $('<div>').html(value).text();
        }
        else {
            return '';
        }
    }

    // Message utils
    var messageContainer = $('#dooModalMessageContainer'),
        messageContent = $('.modal-body', messageContainer),
        messageType = {
            info: 'info',
            success: 'success',
            warning: 'warning',
            error: 'error'
        };

    // Params is object with properties:
    // className,
    // text
    function showMessage(params) {
        params.className = params.className || messageType.info;

        messageContainer.removeClass([messageType.info, messageType.success, messageType.warning, messageType.error].join(' '));
        messageContainer.addClass(params.className);
        messageContent.html(params.text);
        messageContainer.modal('show');
    }

    // Log
    function ajaxError(url, data) {
        console.error('REQUEST ERROR. Url: %s; data: %s', url, data);
    }

    // Legend
    function drawLegend(params) {
        var containerSelector = params.containerSelector,
            minValue = params.minValue,
            maxValue = params.maxValue,
            title = params.title,
            isQualityIndex = params.isQuality,
            isInverted = params.isInverted;

        // if minValue > 0 set it to 0
        // if maxValue < 0 set it to 0
        minValue = Math.min(minValue, 0);
        maxValue = Math.max(maxValue, 0);

        var legendWidth = 320,
            legendHeight = 60,
            gradientWidth = 270,
            gradientHeight = 16,
            segmentsCount = 5,
            segmentWidth = gradientWidth / segmentsCount,
            margin = {
                top: 20,
                left: 20
            },
            valueRange = maxValue - minValue,
            startColor = getColor({
                value: 0,
                maxValue: 100,
                isQuality: isQualityIndex,
                isInverted: isInverted
            }),
            stopColor = getColor({
                value: 100,
                maxValue: 100,
                isQuality: isQualityIndex,
                isInverted: isInverted
            }),
            valueTextY = gradientHeight + 10,
            textData = d3.range(segmentsCount + 1);

        // Canvas
        var svg = d3.select(containerSelector)
            .append('svg')
            .attr('width', legendWidth)
            .attr('height', legendHeight)
            .attr('style', 'position: absolute; bottom: 0; right: 0;')
            .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        // Gradient
        var gradient = svg.append('svg:defs')
            .append('svg:linearGradient')
            .attr('id', 'gradient')
            .attr('x1', '0%')
            .attr('x2', '100%')
            .attr('spreadMethod', 'pad');

        gradient.append('svg:stop')
            .attr('offset', '0%')
            .attr('stop-color', startColor);

        if (isQualityIndex) {
            var middleColor = getColor({
                value: 50,
                maxValue: 100,
                isQuality: true,
                isInverted: isInverted
            });

            gradient.append('svg:stop')
                .attr('offset', '50%')
                .attr('stop-color', middleColor);
        }

        gradient.append('svg:stop')
            .attr('offset', '100%')
            .attr('stop-color', stopColor);

        // Fill gradient
        svg.append('svg:rect')
            .attr('width', gradientWidth)
            .attr('height', gradientHeight)
            .style('fill', 'url(#gradient)');

        // Legend segments
        svg.selectAll('rect')
            .data(textData)
            .enter()
            .append('rect')
            .attr('x', function (d) {
                return (d - 1) * segmentWidth;
            })
            .attr('width', segmentWidth)
            .attr('height', gradientHeight)
            .attr('fill-opacity', 0)
            .attr('stroke', '#fff')
            .attr('stroke-width', 1);

        // Text labels
        svg.append('svg:text')
            .attr('x', gradientWidth)
            .attr('y', -15)
            .attr('text-anchor', 'end')
            .attr('dy', '.35em')
            .text(title);

        textData = d3.range(segmentsCount + 2);

        svg.selectAll('text')
            .data(textData)
            .enter()
            .append('text')
            .attr('x', function (d) {
                return (d - 1) * segmentWidth;
            })
            .attr('y', valueTextY)
            .attr('text-anchor', 'middle')
            .attr('dy', '.35em')
            .attr('font-size', '0.9em')
            .text(function (d) {
                var result = 0,
                    roundLevel = 1;

                if (d === 1) {
                    result = minValue;
                }
                else if (d === segmentsCount + 1) {
                    result = maxValue;
                }
                else {
                    result = valueRange / segmentsCount * (d - 1) + minValue;
                }

                if ((maxValue - minValue) > segmentsCount) {
                    result = Math.ceil(result);
                    roundLevel = 0;
                }
                return accounting.formatNumber(result, roundLevel);
            });

        // Marker for current value
        var mark = svg.append('svg:rect')
            .attr('width', 0)
            .attr('height', gradientHeight + 4)
            .style('fill', '#000')
            .attr('y', -2)
            .attr('x', 0);

        return function(value) {
            if (value !== null && !isNaN(value)) {
                var x = gradientWidth * (value - minValue) / (maxValue - minValue);

                mark.attr('width', 2)
                    .attr('x', x);
            }
            else {
                mark.attr('width', 0);
            }
        };
    }

    function clearLegend(containerSelector) {
        d3.selectAll(containerSelector + ' svg').remove();
    }

    function drawTotalValueForCountry(containerSelector, value) {
        var width = 200,
            height = 30;

        // Canvas
        var svg = d3.select(containerSelector)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('style', 'position: absolute; bottom: 0; right: 0;');

        // Text labels
        svg.append('svg:text')
            .attr('x', 15)
            .attr('y', 10)
            .attr('dy', '.35em')
            .text('Всего: ');
        svg.append('svg:text')
            .attr('x', 95)
            .attr('y', 10)
            .attr('font-weight', 'bold')
            .attr('dy', '.35em')
            .text(value);
    }

    // Last release info
    ({
        init: function() {
            var lastServerUpdateText = $('#lastServerUpdateText');

            if (lastServerUpdateText.length) {
                showWaiter(lastServerUpdateText);
                setTimeout(function() {
                    $.ajax({
                        url: 'report.htm',
                        data: {
                            action: 'startupDate'
                        },
                        dataType: 'json',
                        type: 'GET',
                        success: function (data) {
                            if (data.code === 0 && data.message) {
                                var dateStr = data.message;
                                lastServerUpdateText.text(dateStr);
                            }
                            else {
                                lastServerUpdateText.text('-');
                            }
                        },
                        complete: function() {
                            hideWaiter(lastServerUpdateText);
                        },
                        error: function (data) {
                            lastServerUpdateText.text('-');
                        }
                    });
                }, 5000);
            }
        }
    }.init());

    // For global access
    menu = {
        initialize: initializeMenu,
        setActiveItem: setActiveMenuItem,
        getActiveItemUrl: getActiveMenuItemUrl,
        triggerItemClick: triggerMenuItemClick
    };

    chartUtils = {
        resizeHiddenCharts: resizeHiddenCharts,
        resizeHorizontalColumnsContainer: resizeChartContainer,
        limitNumber: limitNumber
    };

    colorUtils = {
        get: getColor,
        getGreenStatic: function() {
            return greenStatic;
        },
        getGreenOpacityStatic: function() {
            return greenOpacityStatic;
        }
    };

    waiter = {
        start: showWaiter,
        stop: hideWaiter
    };
    
    common = {
        fillSelect: fillSelect,
        fillAgesSelect: fillAgesSelect,
        fillMonthSelect: fillMonthSelect,
        fillYearSelect: fillYearSelect,
        setAvailabilityOfBootstrapSelect: setAvailabilityOfBootstrapSelect,
        setAvailabilityOfRegionSelects: setAvailabilityOfRegionSelects,
        checkJson: checkJson,
        downloadFile: downloadFile,
        clearHtmlSelection: clearHtmlSelection,
        showNoData: drawNoDataBlock
    };

    douHistory = {
        saveState: saveState,
        replaceState: replaceState,
        initialContentPageLoad: initialContentPageLoad,
        initialMenuItemLink: '',
        initialRegionFilterObj: {}
    };

    string = {
        htmlEncode: htmlEncode,
        htmlDecode: htmlDecode
    };

    message = {
        showInfo: function(text) {
            showMessage({className: messageType.info, text: text})
        },
        showSuccess: function(text) {
            showMessage({className: messageType.success, text: text})
        },
        showWarning: function(text) {
            showMessage({className: messageType.warning, text: text})
        },
        showError: function(text) {
            showMessage({className: messageType.error, text: text})
        }
    };

    log = {
        ajaxError: ajaxError
    };

    legend = {
        draw: drawLegend,
        clear: clearLegend,
        drawTotalValueForCountry: drawTotalValueForCountry
    };
});