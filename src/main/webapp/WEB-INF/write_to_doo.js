/**
 * Created by ������ on 03.11.2015.
 */
    (function () {
        var map,
        // Object with values of main index for all regions (keys = osmId of regions)
        // mapRegionsData[osmId] = { value: float, hint: '', color: '' }
            mapRegionsData = {},
            additionalRegionsData = {},
            minRegionValue = null,
            maxRegionValue = 0,
            mapContainer = $('#yamap'),
            mapRedirectToRegionModal = $('#mapRedirectToRegionModal'),
            mapRedirectToRegionLabel = $('#mapRedirectToRegionLabel'),
            mapRedirectToRegionMoCountLabel = $('#mapRedirectToRegionMoCountLabel'),
            mapRedirectToRegionMoSelector = $('#mapRedirectToRegionMoSelector'),
            mapRedirectToRegionLink = $('#mapRedirectToRegionLink'),
            mapRedirectToRegionLinkAbsence = $('#mapRedirectToRegionLinkAbsence'),
            mapRedirectToRegionLink1 = $('#mapRedirectToRegionLink1'),
            mapRedirectToRegionLink2 = $('#mapRedirectToRegionLink2'),
            mapNoMoLinks = $('#mapNoMoLinks'),
            modalContent = $('.modal-content', mapRedirectToRegionModal),
            setLegendMark,
            curYear = new Date().getUTCFullYear(),
            curMonth = new Date().getMonth() + 1;

        function loadRegionsLinkForEnrollment() {
            $.ajax({
                url: 'report.htm',
                dataType: 'json',
                type: 'GET',
                data: {
                    action: 'getReport',
                    id: 'report_url_mapping_for_redirect'
                },
                success: function (data) {
                    if (common.checkJson(data)) {
                        var table = data.table,
                            i,
                            length;

                        for (i = 0, length = table.length; i < length; i += 1) {
                            var item = table[i],
                                osmId = item[0],
                                link = item[2];

                            if (!additionalRegionsData.hasOwnProperty(osmId)) {
                                additionalRegionsData[osmId] = {};
                            }
                            additionalRegionsData[osmId].link = link;
                        }
                    }
                }
            });
        }

        // Load main for map colors and additional indexes for map hints
        function loadIndexValuesForMap() {
            $.ajax({
                url: 'report.htm',
                dataType: 'json',
                type: 'GET',
                data: {
                    action: 'getReport',
                    id: 'map_eo_queue_for_year_month',
                    year: curYear,
                    month: curMonth
                },
                success: function (data) {
                    if (common.checkJson(data)) {
                        var table = data.table,
                            i,
                            length,
                            item,
                            osmId,
                            index1,
                            index2,
                            index3;

                        for (i = 0, length = table.length; i < length; i += 1) {
                            item = table[i];
                            osmId = item[0];
                            index1 = parseFloat(item[2]);
                            index2 = item[3];
                            index3 = item[4];

                            if (!additionalRegionsData.hasOwnProperty(osmId)) {
                                additionalRegionsData[osmId] = {};
                            }
                            additionalRegionsData[osmId].addIndex1 = index2;
                            additionalRegionsData[osmId].addIndex2 = index3;

                            mapRegionsData[osmId] = {
                                value: index1,
                                hint: '',
                                color: ''
                            };

                            // Define min, max values
                            if (!isNaN(index1)) {
                                if (minRegionValue === null) {
                                    minRegionValue = index1;
                                }
                                else if (index1 < minRegionValue) {
                                    minRegionValue = index1;
                                }

                                maxRegionValue = Math.max(index1, maxRegionValue);
                            }
                        }

                        if (minRegionValue === null) {
                            minRegionValue = 0;
                        }

                        for (osmId in mapRegionsData) {
                            item = mapRegionsData[osmId];
                            index1 = item.value;

                            item.hint = getRegionHint(osmId, index1);
                            if (!isNaN(index1)) {
                                item.color = colorUtils.get({
                                    value: index1,
                                    minValue: minRegionValue,
                                    maxValue: maxRegionValue,
                                    isQuality: false,
                                    isInverted: false
                                });
                            }
                        }

                        applyDataToMap();
                    }
                }
            });

            var getRegionHint = function(osmId, value) {
                var addIndex1 = additionalRegionsData[osmId].addIndex1,
                    addIndex2 = additionalRegionsData[osmId].addIndex2;

                value = !isNaN(value) ?
                    ('<b>' + accounting.formatNumber(value) + '</b>') :
                    '-';

                addIndex1 = !isNaN(addIndex1) ?
                    ('<b>' + accounting.formatNumber(addIndex1) + '</b>') :
                    '-';

                addIndex2 = !isNaN(addIndex2) ?
                    ('<b>' + accounting.formatNumber(addIndex2) + '</b>') :
                    '-';

                var hint = [
                    '<div style="font-size: 1.3em;"><b>',
                    map.regionsInfo[osmId].name,
                    '</b></br>',
                    '����������� �����, ���������� ���������� ������������ �� 3 �� 7 ��� (������� �� �����): ',
                    value,
                    '<br/>',
                    '����������� ����� � ������� �� 3 �� 7 ���: ',
                    addIndex1,
                    '<br/>',
                    '����������� �����, ������������ �� ���� �� 3 �� 7 ���: ',
                    addIndex2,
                    '</div>'
                ];

                return hint.join('');
            };
        }

        function applyDataToMap() {
            legend.clear('#yamap');

            if ($.isEmptyObject(mapRegionsData) || !map.isInitialized()) {
                waiter.stop(mapContainer);
                return;
            }

            // Send dataEo to map
            map.applyRegionsData(mapRegionsData);

            if (minRegionValue !== 0 || maxRegionValue !== 0) {
                setLegendMark = legend.draw({
                    containerSelector: '#yamap',
                    minValue: minRegionValue,
                    maxValue: maxRegionValue,
                    title: '����������� � ���, ���. (�� ��)',
                    isQuality: false,
                    isInverted: false
                });
            }

            waiter.stop(mapContainer);
        }

        function onMainFilterChangedByItself(e, data) {
            changeMapView(data);
        }

        function changeMapView(filterData) {
            waiter.start(mapContainer);

            if (filterData.canton > 0) {
                map.showFederalDistrict(filterData.canton);
            }
            else {
                map.showCountry();
            }

            fixFireFoxGradientDisappearing();
        }

        function onMapClick(federalDistrictId, regionId) {
            var filterData = getFilter();
            regionId = regionId || filterData.state;

            // Replace districtId (canton) and regionId (state) in filter dataEo object
            filterData.canton = federalDistrictId;
            filterData.state = regionId;

            if (filterData.state > -1) {
                showRedirectPopup(filterData.state);
            }
            else {
                triggerMapChanged(filterData);
                changeMapView(filterData);
            }
        }

        function triggerMapChanged(filterData) {
            // Raise update of all dataEo blocks, that listen to change:hot event
            $('.top_nav_panel').trigger('change:map', filterData);
        }

        function fixFireFoxGradientDisappearing() {
            if (window.navigator.userAgent.toLowerCase().indexOf('firefox') > -1 && maxRegionValue !== 0) {
                if (minRegionValue === 0 && maxRegionValue === 0) {
                    return false;
                }

                legend.clear('#yamap');
                setTimeout(function () {
                    setLegendMark = legend.draw({
                        containerSelector: '#yamap',
                        minValue: minRegionValue,
                        maxValue: maxRegionValue,
                        title: '����������� � ���, ���. (�� ��)',
                        isQuality: false,
                        isInverted: false
                    });
                }, 0);
            }
        }

        function onMoSelectorChanged() {
            var selOption = $(this).find('option:selected'),
                link1 = selOption.data('link1'),
                link2 = selOption.data('link2'),
                link1IsHidden = false,
                link2IsHidden = false;

            if (link1 !== 'null' && link1 !== '') {
                mapRedirectToRegionLink1.attr('href', link1);
                mapRedirectToRegionLink1.show();
            }
            else {
                mapRedirectToRegionLink1.hide();
                link1IsHidden = true;
            }

            if (link2 !== 'null' && link2 !== '') {
                mapRedirectToRegionLink2.attr('href', link2);
                mapRedirectToRegionLink2.show();
            }
            else {
                mapRedirectToRegionLink2.hide();
                link2IsHidden = true;
            }

            mapNoMoLinks.toggle(link1IsHidden && link2IsHidden);
        }

        function showRedirectPopup(regionId) {
            var osmId = map.getOsmIdByRegionId(regionId),
                regionName = map.regionsInfo[osmId].name,
                link = additionalRegionsData[osmId].link;

            fillMoSelect(regionId);

            mapRedirectToRegionLabel.text(regionName);
            if (link) {
                mapRedirectToRegionLink.show();
                mapRedirectToRegionLink.text(link);
                mapRedirectToRegionLink.attr('href', link);
                mapRedirectToRegionLinkAbsence.hide();
            }
            else {
                mapRedirectToRegionLink.hide();
                mapRedirectToRegionLinkAbsence.show();
            }

            mapRedirectToRegionLink1.hide();
            mapRedirectToRegionLink2.hide();
            mapNoMoLinks.hide();
            // For Muscovites
            mapNoMoLinks.text(
                osmId === '102269' ?
                    '��� ������ ������� ������ ����������� � ����������� ���� ������� �������������� ������ - ������������� ����������� ������ ������.' :
                    '��� ������ ������� ������ ����������� � ����������� ���� ����� ����� �������� �������������� �������������� ������ � ����� �����������.'
            );

            mapRedirectToRegionModal.modal('show');

            waiter.stop(mapContainer);
        }

        function fillMoSelect(regionId) {
            $.ajax({
                type: 'GET',
                dataType: 'json',
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

                        mapRedirectToRegionMoCountLabel.text(table.length);
                        _.forOwn(table, function (v) {
                            var option = $("<option/>")
                                .val(v[0])
                                .text(v[1])
                                .data('link1', v[2])
                                .data('link2', v[3]);

                            fragment.append(option);
                        });
                        mapRedirectToRegionMoSelector.append(fragment);
                        mapRedirectToRegionMoSelector.selectpicker('refresh');
                        mapRedirectToRegionMoSelector.change();
                    }
                },
                complete: function () {
                    waiter.stop(modalContent);
                }
            });
            mapRedirectToRegionMoSelector.empty();
            waiter.start(modalContent);
        }

        function initPage() {
            loadRegionsLinkForEnrollment();

            map = new Map({
                containerId: 'yamap',
                viewMargin: [5, 5, 40, 5],
                onClick: onMapClick,
                onReady: function () {
                    loadIndexValuesForMap();
                    changeMapView(getFilter());
                },
                onChanged: function () {
                    waiter.stop(mapContainer);
                },
                onRegionHover: function (value) {
                    if (typeof setLegendMark === 'function') {
                        setLegendMark(value);
                    }
                }
            });

            // Main region navigation changed by itself
            $('.active_content')
                .off('change:filter', onMainFilterChangedByItself)
                .on('change:filter', onMainFilterChangedByItself);

            mapRedirectToRegionMoSelector.change(onMoSelectorChanged);

            mapContainer.show();
            waiter.start(mapContainer);
        }

        initPage();
    }());
