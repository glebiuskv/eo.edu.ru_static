/**
 * Created by Андрей on 27.11.2015.
 */

    $(function (){
        var canton = -1;
        var state = -1;
        var municipality = -1;
        var names = null;

        var normalNames = [
            "child_all_public",
            "child_3_7_public",
            "child_0_3_public",
            "child_0_7_public",
            "child_in_org_all_public",
            "child_in_org_3_7_public",
            "child_in_org_0_3_public",
            "child_in_org_0_7_public",
            "child_in_queue_wo_place_public",
            "child_in_queue_wo_place_3_7_public",
            "child_in_queue_wo_place_0_3_public",
            "child_in_queue_wo_place_0_7_public",
            "child_in_queue_all_public",
            "child_in_queue_3_7_public",
            "child_in_queue_0_7_public",
            "child_in_queue_0_3_public"
        ];

        var additionalNames = [
            "child_all",
            "child_3_7",
            "child_0_3",
            "child_0_7",
            "child_in_org_all_additional",
            "child_in_org_3_7_additional",
            "child_in_org_0_3_additional",
            "child_in_org_0_7_additional",
            "child_in_queue_wo_place_additional",
            "child_in_queue_wo_place_3_7_additional",
            "child_in_queue_wo_place_0_3_additional",
            "child_in_queue_wo_place_0_7_additional",
            "child_in_queue_all_additional",
            "child_in_queue_3_7_additional",
            "child_in_queue_0_7_additional",
            "child_in_queue_0_3_additional"
        ];

        (function() {
            var userShouldSeeHotDataOnCurrentDate = true;
            if (userShouldSeeHotDataOnCurrentDate) {
                _.forOwn(normalNames, function (k, i) {
                    $('.table_marks .' + k).addClass(additionalNames[i]);
                });
                names = additionalNames;
            }
            else {
                names = normalNames;
            }
        }());

        var getFilterName = function (a) {
            if (municipality > -1) {
                return a + "municipality_id";
            } else if (state > -1) {
                return a + "state_id";
            } else if (canton > -1) {
                return a + "canton_id";
            }
            return "";
        };

        var getFilterValue = function () {
            if (municipality > -1) {
                return municipality;
            } else if (state > -1) {
                return state;
            } else if (canton > -1) {
                return canton;
            }
            return null;
        };

        var queryBuilder = function () {
            var start = "top_";
            var end = "_for_year_month";
            var list = [];

            _.forOwn(names, function (k) {
                var filter = getFilterName("_for_");
                //var val = getFilterValue();
                var s = start + k + filter + end;

                var o = {
                    id: s,
                    action: "getReport"
                };
                //o[getFilterName("")] = val;
                o['canton_id'] = canton;
                o['state_id'] = state;
                o['municipality_id'] = municipality;

                list.push($.extend(o, {
                    el: $(".table_marks ." + k)
                }));
            });

            return list;
        };

        var getMonth = function(date) {
            return date.getMonth() + 1;
        };

        var changer = function (el) {
            return function (data) {
                var defaultText = ' - ';
                if (data && data.table
                    && data.table.length > 0
                    && data.table[0].length > 0
                    && data.table[0][0] !== 'null') {
                    //el.text(data.table[0][0]);
                    var text = accounting.formatNumber(parseFloat(data.table[0][0]));
                    var klass = el.attr("class");
                    if (klass == "availability" || klass == "availability_3y_7p5y") {
                        // Ugly hardcode for big bosses
                        if (text === '0') {
                            text = defaultText;
                        }
                        else {
                            text += " %";
                        }
                    }
                }
                else {
                    text = defaultText;
                }

                el.text(text);
                waiter.stop(el);
            };
        };

        var loadTable = function () {
            var list = queryBuilder();
            var date = new Date();
            var data = {
                year: date.getFullYear(),
                month: getMonth(date)
            };
            for (var i = 0, l = list.length; i < l; i++) {
                var k = list[i];
                var success = changer(k.el);
                waiter.start(k.el);
                delete k.el;

                $.extend(data, k);
                $.ajax({
                    url: "report.htm",
                    type : 'GET',
                    data: data,
                    dataType: "json",
                    success: success
                });
            }
        };

        var updater = function (e, object) {
            canton = object.canton;
            state = object.state;
            municipality = object.municipality;

            var childAllIndexName = 'Общая численность детей на территории Российской Федерации <i>(данные Росстата на 1 января 2015 г.)</i>';

            if (state > -1 || municipality > -1) {
                childAllIndexName = 'Общая численность детей на территории субъекта РФ <i>(данные Росстата на 1 января 2015 г.)</i>';
            }
            else if (canton > -1) {
                childAllIndexName = 'Общая численность детей на территории федерального округа РФ <i>(данные Росстата на 1 января 2015 г.)</i>';
            }
            $('.child_all_title').html(childAllIndexName);

            loadTable();
        };

        $('.active_content').off('change:filter', updater);
        $('.active_content').on("change:filter", updater);
        $('.active_content').off('change:hot', updater);
        $('.active_content').on("change:hot", updater);

        $('.table_marks th > span').each(function (index, el) {
            $(el).tooltip({
                container: '.hot_indexes'
            });
        });
    });
