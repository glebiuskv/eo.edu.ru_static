var getFilter,
    setFilter;

$(function () {
    var flag = false;
    var c_val = -1;
    var s_val = -1;
    var m_val = -1;

    var doc = document;

    var cantons = $("#select__cantons");
    var states = $("#select__states");
    var municipalities = $("#select__municipalities");

    var doNotSaveState = false;
    var doNotTriggerFilterChangeEvent = false;
    var initialCallback = null;

    var getId = function (value) {
        return _.last(value.split("#"));
    };

    var getOptionsFragment = function (table, defaultText) {
        var length = table.length;
        var fragment = doc.createDocumentFragment();

        if (defaultText) {
            var defaultOption = doc.createElement("option");

            defaultOption.setAttribute("value", -1);
            defaultOption.textContent = defaultText;

            fragment.appendChild(defaultOption);
        }

        for (var i = 0; i < length; i += 1) {
            var item = table[i];
            var option = doc.createElement("option");
            option.setAttribute("value", getId(item[0]));
            option.textContent = item[1];
            fragment.appendChild(option);
        }
        ;

        return fragment;
    };

    var builder = function (element, table, callback) {
        var defaultText = element.find("option[value='-1']").text();
        element.empty();
        var id = element.attr("id");
        if (window.USER_STATE_ID !== -1
            && (id === "select__cantons" || id === "select__states")) {
            element.append(getOptionsFragment(table, undefined));
        } else {
            element.append(getOptionsFragment(table, defaultText));
        }

        if (callback) {
            callback();
        }
    };

    var sender = function (element, params, callback) {
        var data = {
            action: "getReport",
            id: element.data("query")
        };

        if (window.USER_STATE_ID !== -1) {
            data.state_id = window.USER_STATE_ID;
        }

        if (params) {
            data = $.extend(data, params);
        }

        $.ajax({
            url: "report.htm",
            type: 'GET',
            data: data,
            dataType: "json",
            success: function (data) {
                if (data && data.code === 0 && data.table) {
                    if (initialCallback) {
                        // Defer call when val will be set
                        setTimeout(initialCallback, 0);
                    }
                    builder(element, data.table, callback);
                }
            }
        });
    };

    var getParams = function (element) {
        var params = {};
        params[element.data("param")] = window.parseInt(element.val());

        return params;
    };

    cantons.change(function () {
        var element = $(this);

        element.prop('disabled', "disabled");
        element.selectpicker('refresh');
        var callback = function () {
            if (element.find("option").size() > 1) {
                element.removeAttr("disabled");
                element.selectpicker('refresh');
            }

            c_val = window.parseInt(cantons.val());
            if (c_val === -1) {
                $("div._states").hide();
                $("div._municipalities").hide();
                //states.hide();
                //municipalities.hide();
                s_val = -1;
                m_val = -1;
                builder(states, []);
                builder(municipalities, []);
                states.selectpicker('refresh');
                states.selectpicker('setStyle', 'btn-xs', 'add');
                municipalities.selectpicker('refresh');
                municipalities.selectpicker('setStyle', 'btn-xs', 'add');
            } else {
                s_val = -1;
                m_val = -1;
                states.selectpicker('refresh');
                states.selectpicker('setStyle', 'btn-xs', 'add');
                municipalities.selectpicker('refresh');
                municipalities.selectpicker('setStyle', 'btn-xs', 'add');
                //$("div._states").show();
                $("div._municipalities").hide();
                //states.show();
            }
            if (!doNotTriggerFilterChangeEvent) {
                states.change();
            }
        };

        sender(states, getParams(element), callback);
    });

    states.change(function () {
        var element = $(this);

        cantons.attr("disabled", "disabled");
        cantons.selectpicker('refresh');
        element.attr("disabled", "disabled");
        element.selectpicker('refresh');

        var callback = function () {
            s_val = window.parseInt(states.val());

            if (cantons.find("option").size() > 1) {
                cantons.removeAttr("disabled");
                cantons.selectpicker('refresh');
            }

            if (element.find("option").size() > 1) {
                element.removeAttr("disabled");
                element.addClass("show-tick");
                element.selectpicker('refresh');
            } else {
                element.removeAttr("dataEo-live-search");
                element.selectpicker('refresh');
            }

            if (s_val === -1) {
                $("div._municipalities").hide();
                //municipalities.hide();
                m_val = -1;
                builder(municipalities, []);
                municipalities.selectpicker('refresh');
                municipalities.selectpicker('setStyle', 'btn-xs', 'add');
            } else {
                municipalities.selectpicker('refresh');
                municipalities.selectpicker('setStyle', 'btn-xs', 'add');
                $(".dropdown-menu").css("max-height", "890px");
                //$("div._municipalities").show();
                //municipalities.show();
            }
            if (!doNotTriggerFilterChangeEvent) {
                municipalities.change();
            }
        };

        sender(municipalities, getParams(element), callback);
    });

    municipalities.change(function () {
        if (c_val === -1 || s_val === -1) {
            m_val = -1;
        } else {
            m_val = window.parseInt(municipalities.val());
        }

        if (!doNotTriggerFilterChangeEvent) {
            if (flag) {
                $('.active_content').trigger("change:hot", {
                    canton: c_val,
                    state: s_val,
                    municipality: m_val
                });
                flag = false;
            } else {
                $('.active_content').trigger("change:filter", {
                    canton: c_val,
                    state: s_val,
                    municipality: m_val
                });
            }
        }
        else {
            // Last available chain of filter initial set from query string (without ajax request)
            if (initialCallback) {
                // Defer call when val will be set
                setTimeout(initialCallback, 0);
                // Control shot..
                doNotTriggerFilterChangeEvent = false;
            }
        }

        if (!doNotSaveState) {
            // Save filter state
            var contentPageUrl = menu.getActiveItemUrl(),
                regionFilterObj = getFilter();
            douHistory.saveState(contentPageUrl, regionFilterObj);
        }
        doNotSaveState = false;

        return false;
    });

    sender(cantons, undefined, function () {
        // commented it as it was initialized double requests
        //municipalities.change();
        cantons.selectpicker('refresh');
        cantons.selectpicker('setStyle', 'btn-xs', 'add');
        // START of initial content loading
        setFilter();
    });

    getFilter = function () {
        return {
            canton: c_val,
            state: s_val,
            municipality: m_val
        };
    };

    // Set of filter from initial query params or from history object
    setFilter = function () {
        var targetFilterObj = douHistory.initialRegionFilterObj,
            curFilterObj = getFilter(),
            cantonOptions = cantons.find('option'),
            stateOptions = states.find('option'),
            municipalityOptions = municipalities.find('option');

        // To try set region filter state to desirable target state Check:
        // if target region filter values differs from current filter state (-1, -1, -1)
        // if it is not that item of region filter has not available option except default with -1 value
        // if item of region filter has option with target value
        if ((targetFilterObj.canton !== curFilterObj.canton && !(cantonOptions.length === 1 && cantonOptions.first().val() === -1) && cantonOptions.filter('[value="' + targetFilterObj.canton + '"]').length) ||
            (targetFilterObj.state !== curFilterObj.state && !(stateOptions.length === 1 && stateOptions.first().val() === -1) && stateOptions.filter('[value="' + targetFilterObj.state + '"]').length) ||
            (targetFilterObj.municipality !== curFilterObj.municipality && !(municipalityOptions.length === 1 && municipalityOptions.first().val() === -1) && municipalityOptions.filter('[value="' + targetFilterObj.municipality + '"]').length)) {

            doNotTriggerFilterChangeEvent = true;
            // and set 'recursion'
            initialCallback = setFilter;

            setFilterItem(targetFilterObj);
        }
        else {
            // filter is absolutly equal or cannot be set to target
            doNotTriggerFilterChangeEvent = false;
            initialCallback = null;
            doNotSaveState = false;

            // Load content if menu item is other
            var menuItemLink = douHistory.initialMenuItemLink;
            if (!menuItemLink.parent().hasClass('active')) {
                menu.triggerItemClick(menuItemLink);
            }
            else if (douHistory.changeFilter) {
                doNotSaveState = true;
                municipalities.change();
            }

            // Replace initial url if it was wrong
            douHistory.replaceState(menuItemLink.data('to'), curFilterObj);
        }
    };

    var setFilterItem = function (filterObj) {
        if (filterObj && !$.isEmptyObject(filterObj) &&
            filterObj.hasOwnProperty('canton') &&
            filterObj.hasOwnProperty('state') &&
            filterObj.hasOwnProperty('municipality')) {
            var curFilterObj = getFilter();

            if (curFilterObj.canton !== filterObj.canton) {
                doNotSaveState = true;
                cantons.selectpicker('val', filterObj.canton);
                cantons.selectpicker('refresh');
            }
            else if (curFilterObj.state !== filterObj.state) {
                doNotSaveState = true;
                states.selectpicker('val', filterObj.state);
                states.selectpicker('refresh');
            }
            else if (curFilterObj.municipality !== filterObj.municipality) {
                doNotSaveState = true;
                municipalities.selectpicker('val', filterObj.municipality);
                municipalities.selectpicker('refresh');
            }
        }
    };

    $('.top_nav_panel').off('change:map');
    $('.top_nav_panel').on("change:map", function (e, data) {
        flag = true;
        if (data.municipality > 0) {
            municipalities.selectpicker("val", data.municipality);
        } else if (data.state > 0) {
            states.selectpicker("val", data.state);
        } else {
            cantons.selectpicker("val", data.canton);
        }
    });
});

