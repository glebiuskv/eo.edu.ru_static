// The object (result of the function calling) provides info data and geometry data of Russian regions.
// osmId: string !
var MapRegions = function () {
    'use strict';

    // The object (result of the function calling) provides
    // data for structure of Russian federal districts.
    // It will be common data for several maps.
    var MapRegionsInfo = function () {
        var initialized = false,
            // federalDistrictsInfo[fedDistrId] = { shortName: '', name: '', regionOsmIds: [] }
            federalDistrictsInfo = {},
            // regionsInfo[osmId] = { federalDistrictId: int, id: int, name: '' }
            regionsInfo = {},
            // object for mapping regionId to osmId: regionIdOsmIdPairs[regionId] = osmId
            regionIdOsmIdPairs = {},
            callbackFunc;

        function _init() {
            // Get Russian structure info
            _getFederalDistrictsStructure();
        }

        function _getFederalDistrictsStructure() {
            $.ajax({
                type: 'GET',
                dataType: 'json',
                url: 'report.htm',
                data: {
                    action: 'getReport',
                    id: 'map_russia_structure'
                },
                success: function (data) {
                    if (common.checkJson(data)) {
                        var regionTable = data.table,
                            i,
                            n,
                            item,
                            fedDistrId,
                            osmId,
                            regionId,
                            regionName;

                        for (i = 0, n = regionTable.length; i < n; i += 1) {
                            item = regionTable[i];
                            fedDistrId = window.parseInt(item[0], 10);
                            osmId = item[3];
                            regionId = window.parseInt(item[4], 10);
                            regionName = item[5];

                            if (!federalDistrictsInfo.hasOwnProperty(fedDistrId)) {
                                federalDistrictsInfo[fedDistrId] = {
                                    shortName: item[1],
                                    name: item[2],
                                    regionOsmIds: []
                                };
                            }

                            federalDistrictsInfo[fedDistrId].regionOsmIds.push(osmId);

                            regionsInfo[osmId] = {
                                federalDistrictId: fedDistrId,
                                id: regionId,
                                name: regionName
                            };

                            regionIdOsmIdPairs[regionId] = osmId;
                        }

                        initialized = true;
                        _processExternalRequest();
                    }
                }
            });
        }

        // Func that start external callback func when data (structure of Russia) for map is ready
        function _processExternalRequest() {
            if (callbackFunc && typeof callbackFunc === 'function') {
                callbackFunc();
            }
        }

        function _getOsmIdByRegionId(regionId) {
            if (!regionId || typeof regionIdOsmIdPairs[regionId] === 'undefined') {
                return null;
            }
            return regionIdOsmIdPairs[regionId];
        }

        return {
            init: function (callback) {
                callbackFunc = callback;

                _init();
                this.init = function () {
                    // MapRegionsInfo is already initialized (close future init availability)
                }
            },
            getFederalDistrictsInfo: function () {
                return $.extend(true, {}, federalDistrictsInfo);
            },
            getRegionsInfo: function (doCopy) {
                return doCopy ?
                    $.extend(true, {}, regionsInfo):
                    regionsInfo;
            },
            getOsmIdByRegionId: _getOsmIdByRegionId,
            isInitialized: function () {
                return initialized;
            }
        };
    };

    // The object (result of the function calling) provides
    // geo objects of Russian regions by yandex.map.api
    // (geo objects can be added only on one map at the same time,
    // so each map will have own geometry objects of regions).
    var MapRegionsGeometry = function (ymaps) {
        var crimeaSearchName = 'крым',
            sevastopolSearchName = 'севастополь',
            regionsQuality = 1,
            // Regions hash by osmId
            allRegionsReserve,
            regionsInfo,
            callbackFunc;

        function _start() {
            allRegionsReserve = {};

                // When Yandex.map api is ready
            ymaps.ready(function () {
                // First of all Crimea then Russia
                ymaps.regions.load('UA', {lang: 'ru', quality: regionsQuality}).then(_processCrimeaRegion);
            });
        }

        function _processCrimeaRegion(result) {
            ymaps.ready(function () {
                result.geoObjects.each(function (r) {
                    if (r.properties.get('name').toLowerCase().indexOf(crimeaSearchName) > -1 || r.properties.get('name').toLowerCase().indexOf(sevastopolSearchName) > -1) {
                        _addRegionToReserve(r);
                    }
                });

                ymaps.regions.load('RU', {lang: 'ru', quality: regionsQuality}).then(_processRussianRegions);
            });
        }

        function _processRussianRegions(result) {
            result.geoObjects.each(function (r) {
                _addRegionToReserve(r);
            });

            _saveInfoInRegionsGeoObjects();
        }

        function _addRegionToReserve(region) {
            var osmId = region.properties.get('osmId');

            allRegionsReserve[osmId] = region;
        }

        function _saveInfoInRegionsGeoObjects() {
            var osmId,
                region,
                zIndex,
                regionInfo;

            if (!$.isEmptyObject(regionsInfo)) {
                for (osmId in allRegionsReserve) {
                    region = allRegionsReserve[osmId];

                    // Set z-index of regions corresponding to osmId order to inner regions were on the top
                    // (as I have investigated, fex. osmId of SPb > osmId of LenObl - problem is solved)
                    zIndex = parseInt(osmId, 10);
                    region.options.set({
                        zIndex: zIndex,
                        zIndexHover: zIndex
                    });

                    if (regionsInfo.hasOwnProperty(osmId)) {
                        regionInfo = regionsInfo[osmId];
                        region.properties.set({
                            regionId: regionInfo.id,
                            federalDistrictId: regionInfo.federalDistrictId
                        });
                    }
                }
            }

            _processExternalRequest();
        }

        // Func that start external callback func when geometry objects (by Yandex.Map) for map is ready
        function _processExternalRequest() {
            if (callbackFunc && typeof callbackFunc === 'function') {
                callbackFunc(allRegionsReserve);
            }
        }

        return {
            init: function(regionsInfoParam, callback) {
                regionsInfo = regionsInfoParam;
                callbackFunc = callback;

                _start();
            }
        };
    };

    function _provideResultWhenInfoIsReady(func) {
        if (MapRegionsInfo.isInitialized()) {
            func && func();
        }
        else {
            MapRegionsInfo.init(function () {
                func && func();
            });
        }
    }

    return {
        // result geoObjectsDictionary will be send to callback func as parameter
        init: function(callback) {
            // If MapRegionsInfo or MapRegionsGeometry were not called yet
            if (typeof MapRegionsInfo === 'function') {
                MapRegionsInfo = MapRegionsInfo();
            }
            if (typeof MapRegionsGeometry === 'function') {
                MapRegionsGeometry = MapRegionsGeometry(ymaps);
            }

            _provideResultWhenInfoIsReady(function() {
                var regionsInfo = MapRegionsInfo.getRegionsInfo(false);

                MapRegionsGeometry.init(regionsInfo, callback);
            });
        },
        getFederalDistrictsInfo: function() {
            return MapRegionsInfo.isInitialized() ?
                MapRegionsInfo.getFederalDistrictsInfo() :
                null;
        },
        getRegionsInfo: function() {
            return MapRegionsInfo.isInitialized() ?
                MapRegionsInfo.getRegionsInfo(true) :
                null;
        },
        getOsmIdByRegionId: function(regionId) {
            return MapRegionsInfo.isInitialized() ?
                MapRegionsInfo.getOsmIdByRegionId(regionId) :
                null;
        }
    };
};

// params:
// containerId - client html id (required)
// viewMargin - visible map margins to container border, it's number or array [top, right, bottom, left]
// onClick - handler
// onReady - handler when map is initialized
// onChanged - handler when map is changed and resized
function Map(params) {
    'use strict';

    // checks
    var paramsType = typeof params;

    if (paramsType === 'undefined' || paramsType !== 'object') {
        console.warn('Map init check: define params object');
        return;
    }
    if (typeof params.containerId === 'undefined' || !params.containerId) {
        console.warn('Map init check: define property containerId in params object');
        return;
    }

    // Check calling the constructor through new operator
    if (!this instanceof Map) {
        return new Map(params);
    }

    // private fields
    var self = this,

        mapContainerId = params.containerId,
        mapContainer = $('#' + mapContainerId),
        mapViewMargin = params.viewMargin,
        onMapClickCallback = params.onClick,
        onMapReadyCallback = params.onReady,
        onMapChangedCallback = params.onChanged,
        onMapRegionHoverCallback = params.onRegionHover,

        yaMap,
        mapDefaultViewMargin = 5,
        mapDefaultCenter = [64, 105],
        mapMinZoom = 1,
        mapMaxZoom = 15,
        mapBoundsPreciseCheckVal = 0.01,
        allRegionsReserve = {},
        // Array of osmId of selected regions
        selectedRegions = [],
        federalDistrictsInfo = {},
        regionsInfo = {},

        mapViewLevels = {
            country: 0,
            federalDistrict: 1,
            region: 2,
            municipality: 3
        },
        curMapViewLevel = mapViewLevels.country,

        prevHoveredRegion = null,
        defaultFillColor = 'cccccc',
        hoverFillColor = 'ff9e3f50',
        defaultStrokeColor = '999999',
        hoverStrokeColor = 'ff9e3f99',

        initialized = false,
        $window = $(window),
        mapResizingOrdered = false,
        fixMapZoomBugOnlyOnce = true;

    // private methods
    function _init(geoObjectsDictionary) {
        // rest initialization
        _saveRegionsGeometryAndInfo(geoObjectsDictionary);

        if (mapViewMargin === undefined) {
            mapViewMargin = mapDefaultViewMargin;
        }

        ymaps.ready(function () {
            var zoom = 2.0,
                osmId;

            yaMap = new ymaps.Map(mapContainerId,
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
            yaMap.behaviors.disable(['drag', 'dblClickZoom', 'scrollZoom', 'multiTouch']);
            yaMap.controls.remove('zoomControl');
            yaMap.layers.add(new ymaps.Layer('img/layer.png', {tileTransparent: true}));

            // Add regions to map
            for (osmId in allRegionsReserve) {
                var region = allRegionsReserve[osmId];
                yaMap.geoObjects.add(region);
                _setDefaultStyleForRegion(region);

                region.events.add('click', _onMapClick);
                region.events.add('mouseenter', _onMapEnter);
                region.events.add('mouseleave', _onMapLeave);
            }

            _onWindowResize(100);

            // Hide Yandex logo
            mapContainer.find('.ymaps-logotype-div').hide();
            mapContainer.find('.ymaps-copyright-legend-container').hide();

            // Actualize size of map with visible container only (not for all opened maps)
            $window.off('resize', _onWindowResize);
            $window.on('resize', _onWindowResize);

            initialized = !$.isEmptyObject(allRegionsReserve) && !$.isEmptyObject(federalDistrictsInfo) && !$.isEmptyObject(regionsInfo);

            if (onMapReadyCallback && typeof onMapReadyCallback === 'function') {
                // Call when instance is ready
                setTimeout(onMapReadyCallback, 0);
            }
        });
    }

    function _saveRegionsGeometryAndInfo(geoObjectsDictionary) {
        var osmId;

        allRegionsReserve = geoObjectsDictionary;
        for (osmId in allRegionsReserve) {
            selectedRegions.push(osmId);
        }
        federalDistrictsInfo = MapRegions.getFederalDistrictsInfo();
        regionsInfo = MapRegions.getRegionsInfo();
    }

    // regionsData - object with osmIds that contains objects with value, hint, color
    function _applyRegionsData(regionsData) {
        var osmId,
            region,
            regionInfo,
            regionData,
            regionValue,
            regionHint,
            hint,
            color;

        if (typeof regionsData !== 'object' || $.isEmptyObject(regionsData)) {
            // Clear regions style
            _setDefaultStyleForAllRegions();
            return;
        }

        for (osmId in allRegionsReserve) {
            region = allRegionsReserve[osmId];

            // Clear region style
            _setDefaultStyleForRegion(region);

            if (regionsData.hasOwnProperty(osmId)) {
                regionData = regionsData[osmId];
                regionValue = regionData.value;
                if (!isNaN(regionValue)) {
                    regionInfo = regionsInfo[osmId];
                    regionHint = regionData.hint || regionInfo.name;
                    hint = _isCountryView() ?
                        federalDistrictsInfo[regionInfo.federalDistrictId].name :
                        regionHint;
                    color = regionData.color;

                    region.properties.set({
                        hintContent: hint,
                        regionHint: regionHint,
                        value: regionValue
                    });

                    region.options.set({
                        fillColor: color,
                        originColor: color,
                        strokeColor: defaultStrokeColor
                    });
                }
            }
        }
    }

    function _setDefaultStyleForRegion(region) {
        var osmId,
            regionInfo,
            hint;

        region.options.set({
            fillColor: defaultFillColor,
            originColor: defaultFillColor,
            strokeColor: defaultStrokeColor
        });

        if (initialized) {
            osmId = region.properties.get('osmId');

            if (!_doesRegionHaveInfo(osmId)) {
                return;
            }

            regionInfo = regionsInfo[osmId];
            hint = _isCountryView() ?
                federalDistrictsInfo[regionInfo.federalDistrictId].name :
                regionInfo.name;

            region.properties.set({
                hintContent: hint,
                regionHint: '',
                value: null
            });
        }
    }

    function _setDefaultStyleForAllRegions() {
        var osmId,
            region;

        for (osmId in allRegionsReserve) {
            region = allRegionsReserve[osmId];

            _setDefaultStyleForRegion(region);
        }
    }

    function _onWindowResize(timeout) {
        if (!mapContainer.is(':visible')) {
            return;
        }

        if (timeout !== 0) {
            timeout = timeout || 300;
        }

        if (!mapResizingOrdered) {
            setTimeout(function () {
                _resize();
                mapResizingOrdered = false;
            }, timeout);
            mapResizingOrdered = true;
        }

        // Auto-adjust size of visible map to map container
        function _resize() {
            if (!mapContainer.is(':visible')) {
                return;
            }

            try {
                var bounds = yaMap.geoObjects.getBounds();

                yaMap.setBounds(bounds, {
                    preciseZoom: true,
                    zoomMargin: mapViewMargin,
                    callback: function () {
                        // Fix for BUG in CHROME (maybe in FF too) with wrong map positioning on correct bounds.
                        // The bug is reproduced when map container was shown again (show all District after view of some Region on chart).
                        var curZoom = yaMap.getZoom();
                        // At that zoom is set to minimal of available zoom range.
                        if (curZoom === mapMinZoom && fixMapZoomBugOnlyOnce) {
                            setTimeout(_onWindowResize, 0);
                            fixMapZoomBugOnlyOnce = false;
                        }
                        else {
                            fixMapZoomBugOnlyOnce = true;

                            // Control shot because not for all small objects bounds set correctly
                            var curBounds = yaMap.geoObjects.getBounds(),
                                point1Diffs = Math.abs((curBounds[0][0] + curBounds[0][1]) - (bounds[0][0] + bounds[0][1])),
                                point2Diffs = Math.abs((curBounds[1][0] + curBounds[1][1]) - (bounds[1][0] + bounds[1][1]));

                            if (point1Diffs > mapBoundsPreciseCheckVal || point2Diffs > mapBoundsPreciseCheckVal) {
                                yaMap.setBounds(curBounds, { preciseZoom: true, zoomMargin: mapViewMargin });
                            }
                        }

                        _onChanged();
                    }
                });
            }
            catch (ex) {
            }
        }
    }

    function _onChanged() {
        if (onMapChangedCallback && typeof onMapChangedCallback === 'function') {
            onMapChangedCallback();
        }
    }

    function _onMapClick(event) {
        var region = event.get('target'),
            osmId = region.properties.get('osmId'),
            regionInfo,
            federalDistrictId,
            regionId;

        if (!_doesRegionHaveInfo(osmId)) {
            return false;
        }

        // Clear last region highlight
        _onRegionHover(prevHoveredRegion, false);

        regionInfo = regionsInfo[osmId];
        federalDistrictId = regionInfo.federalDistrictId;

        if (onMapClickCallback && typeof onMapClickCallback === 'function') {
            if (_isCountryView()) {
                onMapClickCallback(federalDistrictId);
            }
            else {
                regionId = regionInfo.id;
                onMapClickCallback(federalDistrictId, regionId);
            }
        }
    }

    function _onMapEnter(event) {
        var region = event.get('target');

        return _onRegionHover(region, true);
    }

    function _onMapLeave() {
        return _onRegionHover(prevHoveredRegion, false);
    }

    function _onRegionHover(region, isRegionHovered) {
        var regionValue,
            osmId,
            federalDistrictId;

        if (isRegionHovered) {
            prevHoveredRegion = region;
            mapContainer.removeClass('map_disabled_pointer');
        } else {
            prevHoveredRegion = null;
            mapContainer.addClass('map_disabled_pointer');
        }

        if (!region) {
            return false;
        }

        if (onMapRegionHoverCallback && typeof onMapRegionHoverCallback === 'function') {
            regionValue = isRegionHovered ? region.properties.get('value') : null;
            onMapRegionHoverCallback(regionValue);
        }

        if (_isCountryView()) {
            osmId = region.properties.get('osmId');

            if (!_doesRegionHaveInfo(osmId)) {
                return false;
            }

            federalDistrictId = regionsInfo[osmId].federalDistrictId;
            _highlightDistrict(federalDistrictId, isRegionHovered);
        }
        else {
            _highlightRegion(region, isRegionHovered);
        }

        return true;
    }

    function _highlightDistrict(federalDistrictId, doHighlight) {
        var districtInfo = federalDistrictsInfo[federalDistrictId],
            osmIds = districtInfo.regionOsmIds,
            i,
            length,
            osmId,
            region;

        for (i = 0, length = osmIds.length; i < length; i += 1) {
            osmId = osmIds[i];
            region = allRegionsReserve[osmId];

            _highlightRegion(region, doHighlight);
        }
    }

    function _highlightRegion(region, doHighlight) {
        region.options.set('fillColor', doHighlight ? hoverFillColor : region.options.get('originColor'));
        region.options.set('strokeColor', doHighlight ? hoverStrokeColor : defaultStrokeColor);
    }

    function _isCountryView() {
        return curMapViewLevel === mapViewLevels.country;
    }

    function _doesRegionHaveInfo(osmId) {
        return regionsInfo.hasOwnProperty(osmId);
    }

    function _showCountry() {
        var osmId,
            region,
            regionFederalDistrictId,
            hint;

        if (_isCountryView()) {
            _onWindowResize(10);
            return;
        }

        for (osmId in allRegionsReserve) {
            region = allRegionsReserve[osmId];
            regionFederalDistrictId = region.properties.get('federalDistrictId');

            if (federalDistrictsInfo.hasOwnProperty(regionFederalDistrictId)) {
                // Actualize hints for last selected regions
                hint = federalDistrictsInfo[regionFederalDistrictId].name;

                _addRegion(region, osmId, hint);
            }
        }

        curMapViewLevel = mapViewLevels.country;
        _onWindowResize(10);
    }

    function _showFederalDistrict(federalDistrictId) {
        var i,
            regionsLength,
            osmId,
            districtInfo = federalDistrictsInfo[federalDistrictId],
            osmIds = districtInfo.regionOsmIds;

        _clear(osmIds);
        for (i = 0, regionsLength = osmIds.length; i < regionsLength; i += 1) {
            osmId = osmIds[i];
            _addRegionWithHint(osmId);
        }

        curMapViewLevel = mapViewLevels.federalDistrict;
        _onWindowResize(10);
    }

    function _showRegion(regionId) {
        var osmId = this.getOsmIdByRegionId(regionId);

        if (selectedRegions.length !== 1 || selectedRegions[0] !== osmId) {
            _clear(osmId);
            _addRegionWithHint(osmId);
        }

        curMapViewLevel = mapViewLevels.region;
        _onWindowResize(200);
    }

    function _addRegionWithHint(osmId) {
        var region = allRegionsReserve[osmId],
            regionHint,
            hint;

        if (region && _doesRegionHaveInfo(osmId)) {
            regionHint = region.properties.get('regionHint');
            hint = regionHint || regionsInfo[osmId].name;

            _addRegion(region, osmId, hint);
        }
    }

    function _addRegion(region, osmId, hint) {
        var osmIdIndex = selectedRegions.indexOf(osmId);

        if (osmIdIndex === -1) {
            yaMap.geoObjects.add(region);
            // Synchronize selected regions
            selectedRegions.push(osmId);
        }
        region.properties.set('hintContent', hint);
    }

    // excludeOsmIds - array or number
    function _clear(excludeOsmIds) {
        var i,
            regionsLength,
            osmId,
            region,
            newStateOfSelectedRegions = [];

        if (Object.prototype.toString.call(excludeOsmIds) === '[object String]') {
            excludeOsmIds = [excludeOsmIds];
        }
        else if (Object.prototype.toString.call(excludeOsmIds) !== '[object Array]') {
            excludeOsmIds = [];
        }

        for (i = 0, regionsLength = selectedRegions.length; i < regionsLength; i += 1) {
            osmId = selectedRegions[i];

            if (excludeOsmIds.indexOf(osmId) > -1) {
                newStateOfSelectedRegions.push(osmId);
                continue;
            }

            region = allRegionsReserve[osmId];
            yaMap.geoObjects.remove(region);
        }

        selectedRegions = newStateOfSelectedRegions;
    }

    // public
    this.showCountry = _showCountry;
    this.showFederalDistrict = _showFederalDistrict;
    this.showRegion = _showRegion;
    this.isInitialized = function() {
        return initialized;
    };
    this.applyRegionsData = _applyRegionsData;
    // Method refresh map layout when size of container is changed fex.
    this.refresh = function() {
        _onWindowResize();
    };

    // init
    // If MapRegions was not called yet
    if (typeof MapRegions === 'function') {
        MapRegions = MapRegions();
    }
    MapRegions.init(function(geoObjectsDictionary) {
        _init(geoObjectsDictionary);

        // public
        // Share MapRegions method
        self.getOsmIdByRegionId = MapRegions.getOsmIdByRegionId;
        // Share info objects
        self.federalDistrictsInfo = federalDistrictsInfo;
        self.regionsInfo = regionsInfo;
    });
}