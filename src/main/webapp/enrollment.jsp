<div class="row header_row">
    <h3>Запись в ДОО</h3>
</div>
<div class="row row_top_margin" style="margin-top: 30px; position: relative;">
    <hr/>
    <div class="select_panel">
        <span class="select_group">
            <select id="enrollmentRegions" class="show-menu-arrow show-tick" data-live-search="true" data-container="body" data-width="500px" title="Выберите регион"></select>
        </span>
    </div>
</div>
<div class="row row_top_margin">
    <a id="enrollmentBackToCountryViewBtn" class="passive black_color" href="javascript:void(0);"><i class="icon-reply"></i> Российская Федерация</a>
</div>
<div class="row row_top_margin">
    <div id="yamap2" class="map_container map_disabled_pointer" style="height: 500px; padding: 0; position: relative;"></div>
</div>
<div id="redirectToRegionModal" class="modal fade doo_enrollment_modal" tabindex="-1" role="dialog" aria-labelledby="modalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
                <h4 class="modal-title" id="modalLabel">Запись в ДОО</h4>
            </div>
            <div class="modal-body" style="font-size: 1.2em; word-wrap: break-word;">
                <div>
                    <label id="redirectToRegionLabel"></label> (<label>количество МО:</label> <label id="redirectToRegionMoCountLabel"></label>)
                </div>
                <span>Адрес получения услуги: </span>
                <a id="redirectToRegionLink" target="_blank" href="#"></a>
                <span id="redirectToRegionLinkAbsence" style="display: none;">-</span>
                <div class="mo_selector_container">
                    <label>МО:</label>
                    <select id="redirectToRegionMoSelector" class="show-menu-arrow show-tick" data-live-search="true" data-width="500px"></select>
                </div>
                <div class="mo_link">
                    <a id="redirectToRegionLink1" target="_blank" href="#">Ссылка на РПГУ</a>
                </div>
                <div class="mo_link">
                    <a id="redirectToRegionLink2" target="_blank" href="#">Ссылка на ЕПГУ</a>
                </div>
                <div id="enrollmentNoMoLinks" style="display: none;">
                    Для Вашего региона услуга оказывается в электронном виде через орган местного самоуправления муниципального района в сфере образования.
                </div>
            </div>
        </div>
    </div>
</div>

<script type="text/javascript">
(function () {
    //0. Результат запроса для показателя в разрезе Субъекта РФ (ключ - osm_id)
    var reportValues = {};
    //1. Список всех объектов "Регион" для карты
    var allRegions = null,
        selectedRegions = [],
        allRegionsReserve = [];
    //2. Ссылка на карту
    var geoMap = {};
    //3. Прошлый выбранный регион
    var oldRegion = null;
    
    var $window = $(window);

    var mapContainer = $('#yamap2'),
        regionSelector = $('#enrollmentRegions'),
        backToCountryViewBtn = $('#enrollmentBackToCountryViewBtn'),
        redirectToRegionModal = $('#redirectToRegionModal'),
        redirectToRegionLabel = $('#redirectToRegionLabel'),
        redirectToRegionMoCountLabel = $('#redirectToRegionMoCountLabel'),
        redirectToRegionMoSelector = $('#redirectToRegionMoSelector'),
        redirectToRegionLink = $('#redirectToRegionLink'),
        redirectToRegionLinkAbsence = $('#redirectToRegionLinkAbsence'),
        redirectToRegionLink1 = $('#redirectToRegionLink1'),
        redirectToRegionLink2 = $('#redirectToRegionLink2'),
        enrollmentNoMoLinks = $('#enrollmentNoMoLinks'),
        modalContent = $('#redirectToRegionModal .modal-content');

    var defaultFillColor = 'cccccc',
        hoverFillColor = 'ff9e3f50',
        defaultStrokeColor = '999999',
        hoverStrokeColor = 'ff9e3f99',
        enrollEnableColor = colorUtils.getGreenOpacityStatic();

    var mapDefaultCenter = [64, 105],
        mapMinZoom = 1,
        mapMaxZoom = 7,
        mapViewLevels = {
            country: 0,
            federalDistrict: 1,
            region: 2,
            municipality: 3
        },
        curMapViewLevel = mapViewLevels.country,
        curFederalDistrictId = -1,
        curRegionId = -1,
        curMunicipalityId = -1,
        mapResizingOrdered = false,
        fixMapZoomBugOnlyOnce = true;

    var federalDistrictsInfo = {},
        regionsInfo = {},
        isMapInitialized = false,
        changeMapViewOrdered = false,
        doLoadChartForMunicipalities = true,
        municipalitiesLoadedCallback = null;

    //Обрабатывает загрузку регионов
    function processRegions(result) {
        //скрываем панели зума
        $('.ymaps-b-zoom').hide();

//        //Навешиваем обработчик клика на Субъект РФ
//        result.geoObjects.events.add('click', onMapClick );
//        //Навешиваем обработчики наведения мыши на регион
//        result.geoObjects.events.add('mouseenter', onMapEnter );    
//        result.geoObjects.events.add('mouseleave', onMapLeave );
        //Запоминыем все регионы
        allRegions = result.geoObjects;
        // резерв для добавления/удаления объектов регионов
        allRegions.each(function(r) {
            selectedRegions.push(r);
            allRegionsReserve.push(r);
            
//            r.events.add('click', onMapClick );
//            r.events.add('mouseenter', onMapEnter );    
//            r.events.add('mouseleave', onMapLeave );
        });

        // Sort regions by osmId
        allRegionsReserve.sort(function(a, b) {
            var aOsmId = parseInt(a.properties.get('osmId'), 10),
                bOsmId = parseInt(b.properties.get('osmId'), 10);
                
            if (aOsmId > bOsmId) {
                return 1;
            }
            else if (aOsmId < bOsmId) {
                return -1;
            }
            else {
                return 0;
            }
        });

        // Set z-index of regions corresponding to osmId order to inner regions were on the top
        // (As I have investigated fex. osmId of SPb  > osmId of LenObl)
        for (var i in allRegionsReserve) {
            allRegionsReserve[i].options.set('zIndex', i);
            allRegionsReserve[i].options.set('zIndexHover', i);
        }

        //Добавляем на карту после модификации свойств
        geoMap.geoObjects.add(allRegions);
        onWindowResize(100);

        //Красим карту
        setDefaultStyleForRegions();

        initializeRegions();
    }

    function initializeRegions() {
        $.ajax({
            url: 'report.htm?action=getReport&id=map_russia_structure',
            dataType : 'json',
            type : 'GET',
            success: function (data) {
                if (data) {
                    var regionTable = data.table;
                    if (regionTable) {
                        for (var i in regionTable) {
                            var item = regionTable[i],
                                fedDistrId = item[0],
                                fedDistrName = item[2],
                                osmId = item[3],
                                regionId = item[4],
                                regionName = item[5],
                                regionsOptgroup,
                                regionsOption;
                        
                            if (!federalDistrictsInfo.hasOwnProperty(fedDistrId)) {
                                federalDistrictsInfo[fedDistrId] = {
                                    shortName: item[1],
                                    name: item[2],
                                    regionOsmIds: []
                                };
                                
                                // Fill regions select
                                regionsOptgroup = $('<optgroup>')
                                    .prop('label', fedDistrName);
                                regionSelector.append(regionsOptgroup);
                            }

                            federalDistrictsInfo[fedDistrId].regionOsmIds.push(osmId);

                            regionsInfo[osmId] = {
                                regionId: regionId,
                                regionName: regionName,
                                federalDistrictId: fedDistrId
                            };
                            
                            // Fill regions select
                            regionsOption = $('<option>')
                                //.data('color-inverted', data.table[i][5] === '1')
                                .val(osmId)
                                .text(regionName);
                        
                            regionsOptgroup.append(regionsOption);
                        }
                        regionSelector.selectpicker('refresh');

                        if (!$.isEmptyObject(federalDistrictsInfo) && !$.isEmptyObject(regionsInfo)) {
                            allRegions.each(function(region) {
                                var osmId = region.properties.get('osmId');
                                if (osmId && regionsInfo.hasOwnProperty(osmId)) {
                                    region.properties.set({
                                        regionId: regionsInfo[osmId].regionId,
                                        federalDistrictId: regionsInfo[osmId].federalDistrictId,
                                        hintContent: federalDistrictsInfo[regionsInfo[osmId].federalDistrictId].name
                                    });
                                }
                            });
                        }
                        
                        var filter = getFilter();
                        if (filter.canton !== -1) {
                            changeMapViewOrdered = true;
                        }
                    }
                }

                loadRegionsData();
            },
            error: function(data){
            }
        });
    }

    function loadRegionsData() {
        $.ajax({
            url: 'report.htm?action=getReport&id=report_url_mapping_for_redirect',
            dataType : 'json',
            type : 'GET',
            success: function (data) {
                if (data && data.code === 0 && data.table) {
                    var table = data.table;
                
                    for (var i in table) {
                        var item = table[i],
                            osmId = item[0],
                            contacts = item[1],
                            link = item[2];
                    
                        if (!regionsInfo.hasOwnProperty(osmId)) {
                            regionsInfo[osmId] = {};
                        }
                        regionsInfo[osmId].contacts = contacts;
                        regionsInfo[osmId].link = link;
                    }

                    if (!$.isEmptyObject(regionsInfo)) {
                        allRegions.each(function(region) {
                            var osmId = region.properties.get('osmId');
                            
                            if (osmId && regionsInfo.hasOwnProperty(osmId) && regionsInfo[osmId].link) {
                                region.options.set({
                                    fillColor: enrollEnableColor,
                                    originColor: enrollEnableColor
                                });
                            }
                            
                            region.events.add('click', onMapClick );
                            region.events.add('mouseenter', onMapEnter );    
                            region.events.add('mouseleave', onMapLeave );
                        });
                    }
                }
            },
            error: function(data){
            }
        });
    }

    function setDefaultStyleForRegions() {
        for (var i in allRegionsReserve) {
            allRegionsReserve[i].options.set({
                fillColor: defaultFillColor,
                originColor: defaultFillColor,
                strokeColor: defaultStrokeColor
            });

            if (!$.isEmptyObject(federalDistrictsInfo) && !$.isEmptyObject(regionsInfo)) {
                var osmId = allRegionsReserve[i].properties.get('osmId');
                var hint = curMapViewLevel === mapViewLevels.country ?
                    federalDistrictsInfo[regionsInfo[osmId].federalDistrictId].name :
                    regionsInfo[osmId].regionName;

                allRegionsReserve[i].properties.set({
                    hintContent: hint,
                    value: 0
                });
            }
        }
    }
    
    //обработка клика по карте
    function onMapClick(event){
        var target = event.get('target'),
            osmId = target.properties.get('osmId'),
            federalDistrictId = regionsInfo[osmId].federalDistrictId;

        if (curMapViewLevel === mapViewLevels.country) {
            changeMapView(curMapViewLevel + 1, federalDistrictId, target);

            //$document.on('change:hot', onFilterByMapChanged);
//            $.event.trigger('change:map', {
//                canton: window.parseInt(curFederalDistrictId),
//                state: window.parseInt(curRegionId)
//            });
        }
        else {
            showRedirectPopup(osmId);
        }
        
        // Clear last region highlight
        onMapLeave();
    }

    //обработка наведения мыши на карту
    function onMapEnter(event){
        var target = event.get('target');
        //запоминаем старый цвет
        //target.options.set('oldColor', target.options.get('fillColor'));

        if (curMapViewLevel === mapViewLevels.country) {
            var osmId = target.properties.get('osmId');
            highlightDistrict(regionsInfo[osmId].federalDistrictId, true);
        }

        //меняем цвет
        target.options.set('fillColor', hoverFillColor);
        target.options.set('strokeColor', hoverStrokeColor);
        //делаем текущий старым
        oldRegion = target;
        
        mapContainer.removeClass('map_disabled_pointer');
    }

    function onMapLeave(event){
        //если был выбран другой регион
        if (oldRegion) {
            if (curMapViewLevel === mapViewLevels.country) {
                var osmId = oldRegion.properties.get('osmId');
                highlightDistrict(regionsInfo[osmId].federalDistrictId, false);
            }

            //восстанавливаем настройки
            oldRegion.options.set('fillColor', oldRegion.options.get('originColor'));
            oldRegion.options.set('strokeColor', defaultStrokeColor);
        }
        oldRegion = null;
        
        mapContainer.addClass('map_disabled_pointer');
    }

    function changeMapView(targetMapViewLevel, federalDistrictId, targetRegion) {
        waiter.start(mapContainer);
        
        if (targetMapViewLevel === mapViewLevels.country) {
            showCountry();

            curMapViewLevel = mapViewLevels.country;
            onWindowResize(10);
        }
        else if (targetMapViewLevel === mapViewLevels.federalDistrict) {
            showDistrict(federalDistrictId);

            curMapViewLevel = mapViewLevels.federalDistrict;
            onWindowResize(10);
        }
        else if (targetMapViewLevel === mapViewLevels.region) {
            var regionId = null;
            if (targetRegion) {
                showRegion(targetRegion);
                regionId = targetRegion.properties.get('regionId');
            }
            
            curMapViewLevel = mapViewLevels.region;
        }
    }
    
    function showCountry() {
        clearMap();

        // Add selected regions to map
        for (var i in allRegionsReserve) {
            // Actualize hints for lasr selected regions
            var hint = federalDistrictsInfo[allRegionsReserve[i].properties.get('federalDistrictId')].name;
            allRegionsReserve[i].properties.set('hintContent', hint);
            
            geoMap.geoObjects.add(allRegionsReserve[i]);
            selectedRegions.push(allRegionsReserve[i]);                    
        }

        curFederalDistrictId = -1;
        curRegionId = -1;
        curMunicipalityId = -1;
        
        backToCountryViewBtn.off('click');
        backToCountryViewBtn.removeClass('black_color');
        backToCountryViewBtn.addClass('passive');
    }
    
    function showDistrict(federalDistrictId) {
        var district = federalDistrictsInfo[federalDistrictId],
            osmIds = district.regionOsmIds.join();

        clearMap();

        for (var i in allRegionsReserve) {
            var osmId = allRegionsReserve[i].properties.get('osmId');//,
//                contacts = regionsInfo[osmId].contacts;

            if (osmIds.indexOf(osmId) !== -1) {
//                var hint = regionsInfo[osmId].regionName +
//                        (contacts ?
//                            (' (' + contacts + ')') :
//                            '');
                var hint = regionsInfo[osmId].regionName;

                allRegionsReserve[i].options.set('fillColor', allRegionsReserve[i].options.get('originColor'));
                allRegionsReserve[i].options.set('strokeColor', defaultStrokeColor);
                allRegionsReserve[i].properties.set('hintContent', hint);
                
                geoMap.geoObjects.add(allRegionsReserve[i]);
                selectedRegions.push(allRegionsReserve[i]);
            }
        }
        
        curFederalDistrictId = federalDistrictId;
        curRegionId = -1;
        curMunicipalityId = -1;
        
        backToCountryViewBtn.click(function() {
            changeMapView(mapViewLevels.country, -1, null);
        });
        backToCountryViewBtn.removeClass('passive');
        backToCountryViewBtn.addClass('black_color');
    }

    // region - geometry object
    // Accent on region
    function showRegion(region) {
        geoMap.setBounds(region.geometry.getBounds());
        
        curRegionId = region.properties.get('regionId');
        curMunicipalityId = -1;
    }

    function clearMap() {
        if (curMapViewLevel === mapViewLevels.country) {
            geoMap.geoObjects.remove(allRegions);
        }

        // Remove previous selected regions to map
        for (var i in selectedRegions) {
            geoMap.geoObjects.remove(selectedRegions[i]);
        }
        selectedRegions = [];
    }
    
    function highlightDistrict(federalDistrictId, doHighlight) {
        var district = federalDistrictsInfo[federalDistrictId],
            osmIds = district.regionOsmIds.join();

        for (var i in selectedRegions) {
            if (osmIds.indexOf(selectedRegions[i].properties.get('osmId')) !== -1) {
                selectedRegions[i].options.set('fillColor', doHighlight ? hoverFillColor : selectedRegions[i].options.get('originColor'));
                selectedRegions[i].options.set('strokeColor', doHighlight ? hoverStrokeColor : defaultStrokeColor);
            }
        }
    }
    
    function onRegionSelectorChanged() {
        var osmId = regionSelector.val();

        showRedirectPopup(osmId);
    }

    function showRedirectPopup(osmId) {
        var region = regionsInfo[osmId],
            link = region.link;
        
            fillMoSelect(region.regionId);
            
            redirectToRegionLabel.text(regionsInfo[osmId].regionName);
        if (link) {
            redirectToRegionLink.show();
            redirectToRegionLink.text(link);
            redirectToRegionLink.attr('href', link);
            redirectToRegionLinkAbsence.hide();
        }
        else {
            redirectToRegionLink.hide();
            redirectToRegionLinkAbsence.show();
        }

        redirectToRegionLink1.hide();
        redirectToRegionLink2.hide();
        enrollmentNoMoLinks.hide();
        // For Muscovites
        enrollmentNoMoLinks.text(
                        osmId === '102269' ?
                        'Для Вашего региона услуга оказывается в электронном виде органом исполнительной власти - Департаментом образования города Москвы.' :
                        'Для Вашего региона услуга оказывается в электронном виде через орган местного самоуправления муниципального района в сфере образования.'
        );

        redirectToRegionModal.modal('show');
        regionSelector.val('-1');
        regionSelector.selectpicker('refresh');
    }

    function onMainFilterChanged(e, data) {
        var targetMapViewLevel = mapViewLevels.country,
            federalDistrictId = -1,
            regionId;

        if (data.canton > 0) {
            federalDistrictId = data.canton;
            targetMapViewLevel = mapViewLevels.federalDistrict;
        }
        if (data.state > 0) {
            regionId = data.state;
            targetMapViewLevel = mapViewLevels.region;
        }
        if (data.municipality > 0) {
            curMunicipalityId = data.municipality;
            targetMapViewLevel = mapViewLevels.municipality;
        }

//        if (isMapInitialized) {
            changeMapView(targetMapViewLevel, federalDistrictId, null);
//        }
    }

    function initMap() {
        // Инициализируем карту при ее готовности
        ymaps.ready(function() {
            var zoom = 2.0;

            // Нарисовать карту
            geoMap = new ymaps.Map('yamap2',
                {
                    center: mapDefaultCenter,
                    type: "yandex#map",
                    zoom: zoom
                },
                {
                    autoFitToViewport: 'always',
                    avoidFractionalZoom: false,
                    minZoom: mapMinZoom,
                    maxZoom: mapMaxZoom
                });

            //Настраиваем поведения
            geoMap.behaviors.disable('drag');
            geoMap.behaviors.disable('dblClickZoom');
            geoMap.behaviors.disable('scrollZoom');
            geoMap.behaviors.disable('multiTouch');

            geoMap.controls.remove('zoomControl');

            geoMap.layers.add(new ymaps.Layer('img/layer.png', {tileTransparent: true, brightness: 0.5}));

            //Формируем свойства отображения регионов
            ymaps.regions.load('RU', {lang: 'ru', quality: 1}).then(processRegions);

            //скрываем панели зума
            $('.ymaps-b-zoom').hide();
            $('.ymaps-b-zoom__sprite').hide();
            //скрываем панели лого
            $('.ymaps-logotype-div').hide();
            $('.ymaps-copyright-legend-container').hide();
        });

        $window.off('resize', onWindowResize);
        $window.on('resize', onWindowResize);
    }

    function onWindowResize(timeout) {
        if (!mapContainer.is(':visible')) {
            return;
        }
        
        if (timeout !== 0) {
            timeout = timeout || 300;
        }

        if (!mapResizingOrdered) {
            setTimeout(function() {
                resizeMap();
                mapResizingOrdered = false;
            }, timeout);
            mapResizingOrdered = true;
        }
    }

    // Auto-adjust size of visible map to map container
    function resizeMap() {
        if (!mapContainer.is(':visible')) {
            return;
        }
        
        try {
            var bounds = geoMap.geoObjects.getBounds(),
                defaultMargin = 3,
                bottomMargin = curMapViewLevel === mapViewLevels.country ?
                    30 :
                    50;

            geoMap.setBounds(bounds, {
                checkZoomRange: false,
                preciseZoom: true,
                zoomMargin: [defaultMargin, defaultMargin, bottomMargin, defaultMargin],
                callback: function() {
                    // Fix for BUG in CHROME (maybe in FF too) with wrong map positioning on correct bounds.
                    // The bug is reproduced when map container was shown again (show all District after view of some Region on chart).
                    var curZoom = geoMap.getZoom();
                    // At that zoom is set to minimal of available zoom range.
                    if (curZoom === mapMinZoom && fixMapZoomBugOnlyOnce) {
                        waiter.start(mapContainer);

                        setTimeout(function() {
                            onWindowResize();
                        });
                        fixMapZoomBugOnlyOnce = false;
                    }
                    else {
                        fixMapZoomBugOnlyOnce = true;
                    }
                }
            });
        }
        catch(ex) {
        }

        waiter.stop(mapContainer);
    }

    function fillMoSelect(regionId) {
        $.ajax({
            type : 'GET',
            dataType : 'json',
            url: 'report.htm',
            data: {
                action: 'getReport',
                id: 'rpgu_epgu_urls',
                state_id: regionId
            },
            success: function (data) {
                if (common.checkJson(data)) {
                    var table = data.table,
                        fragment = $(document.createDocumentFragment());
                    
                    redirectToRegionMoCountLabel.text(table.length);
                    _.forOwn(table, function (v) {
                        var option = $("<option/>")
                            .val(v[0])
                            .text(v[1])
                            .data('link1', v[2])
                            .data('link2', v[3]);

                        fragment.append(option);
                    });
                    redirectToRegionMoSelector.append(fragment);
                    redirectToRegionMoSelector.selectpicker('refresh');
                    redirectToRegionMoSelector.change();
                }
            },
            complete: function() {
                waiter.stop(modalContent);
            }
        });
        redirectToRegionMoSelector.empty();
        waiter.start(modalContent);
    }

    function onMoSelectorChanged() {
        var selOption = $(this).find('option:selected'),
            link1 = selOption.data('link1'),
            link2 = selOption.data('link2'),
            link1IsHidden = false,
            link2IsHidden = false;

        if (link1 !== 'null' && link1 !== '') {
            redirectToRegionLink1.attr('href', link1);
            redirectToRegionLink1.show();
        }
        else {
            redirectToRegionLink1.hide();
            link1IsHidden = true;
        }

        if (link2 !== 'null' && link2 !== '') {
            redirectToRegionLink2.attr('href', link2);
            redirectToRegionLink2.show();
        }
        else {
            redirectToRegionLink2.hide();
            link2IsHidden = true;
        }

        enrollmentNoMoLinks.toggle(link1IsHidden && link2IsHidden);
    }

    waiter.start(mapContainer);

    //При готовности документа
    $(function() {
        // Add default value to regions select
        var option = $('<option>')
            .val(-1)
            .text('Выберите регион');
        regionSelector.append(option);
        regionSelector.selectpicker();

        initMap();

        // Main region navigation handlers
//        $document.off('change:filter', onMainFilterChanged);
//        $document.on('change:filter', onMainFilterChanged);

        regionSelector.change(onRegionSelectorChanged);
        
        redirectToRegionMoSelector.change(onMoSelectorChanged);
    });
}());
</script>