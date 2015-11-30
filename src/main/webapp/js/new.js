$(document).ready(function () {
    if (!window.EOCONTEXT){
        window.EOCONTEXT = {};
    }
    if (!!window.EOCONTEXT && !window.EOCONTEXT.MAP_CONTEXT) {
        window.EOCONTEXT.MAP_CONTEXT = new MAP_CONTEXT();
    }
    if (!!window.EOCONTEXT && !window.EOCONTEXT.PLASHKA) {
        window.EOCONTEXT.PLASHKA = new PLASHKA();
    }

    $('.selectpicker').selectpicker({style: 'btn-xs btn-xm'});
    window.EOCONTEXT.PLASHKA.getData();
    window.EOCONTEXT.MAP_CONTEXT.initMap();
});

var PLASHKA = function () {

    var ref = this;
    var y = new Date().getFullYear().toString();
    var m = new Date().getMonth() + 1;
    this.ym = y + m;
    this.fed = 0;
    this.reg = 0;
    this.mun = 0;



    this.main_selector = function(form){
        ref.fed = form.value;

        window.EOCONTEXT.MAP_CONTEXT.onMapClick(ref.fed, ref.reg);

        if (ref.fed != 0) {
            // запрашиваем список субъектов федерации по номеру ФО из рест апи
            ref.getReg();
        } else {
            $('#select__states').empty();
            $('#select__states').append('<option value="0">Все регионы</option>');
        }
        ref.reg = 0;
        ref.getData();
        $('#select__states').selectpicker('refresh');
    };

    this.slave_selector = function(form){
        ref.reg = form.value;
        window.EOCONTEXT.MAP_CONTEXT.onMapClick(ref.fed, ref.reg);
        ref.getData();

    };

    this.fill_table = function(data){

        $('.rosstat_00_80').text(accounting.formatNumber(data.rosstat_00_80), 0, " ");
        $('.in_doo_00_80').text(accounting.formatNumber(data.in_doo_00_80), 0, " ");
        $('.in_queue_00_80').text(accounting.formatNumber(data.in_queue_00_80), 0, " ");
        $('.wo_place_00_80').text(accounting.formatNumber(data.wo_place_00_80), 0, " ");

        $('.rosstat_00_70').text(accounting.formatNumber(data.rosstat_00_70), 0, " ");
        $('.in_doo_00_70').text(accounting.formatNumber(data.in_doo_00_70), 0, " ");
        $('.in_queue_00_70').text(accounting.formatNumber(data.in_queue_00_70), 0, " ");
        $('.wo_place_00_70').text(accounting.formatNumber(data.wo_place_00_70), 0, " ");

        $('.rosstat_30_70').text(accounting.formatNumber(data.rosstat_30_70), 0, " ");
        $('.in_doo_30_70').text(accounting.formatNumber(data.in_doo_30_70), 0, " ");
        $('.in_queue_30_70').text(accounting.formatNumber(data.in_queue_30_70), 0, " ");
        $('.wo_place_30_70').text(accounting.formatNumber(data.wo_place_30_70), 0, " ");

        $('.rosstat_00_30').text(accounting.formatNumber(data.rosstat_00_30), 0, " ");
        $('.in_doo_00_30').text(accounting.formatNumber(data.in_doo_00_30), 0, " ");
        $('.in_queue_00_30').text(accounting.formatNumber(data.in_queue_00_30), 0, " ");
        $('.wo_place_00_30').text(accounting.formatNumber(data.wo_place_00_30), 0, " ");
    };

    this.getData = function() {
        var url = "http://cabinetv3.do.edu.ru:8081/api/header?ym=" + ref.ym + "&fed=" + ref.fed + "&reg=" + ref.reg + "&mun=0";
        $.getJSON(url, function (resp) {
            ref.fill_table(resp);
        });
    };

    this.getReg = function(){
        var url = "http://cabinetv3.do.edu.ru:8081/api/frm?mun=0&reg=0&fed=0";
        var selectReg = $('#select__states');
        selectReg.empty();
        selectReg.selectpicker('refresh');
        $.getJSON(url, function (data) {
            data.forEach(function (item) {

                if (item.fed == ref.fed) {
                    var reg = item.reg;
                    var name = item.shortname;
                    if (reg == 0) {
                        name = "Все регионы"
                    }
                    selectReg.append('<option value="' + reg + '">' + name + '</option>');
                    selectReg.selectpicker('refresh');
                }
            });
        });
    }

    this.refresh = function(){


        // перерисоваваем селекторы

        // перерисовываем таблицу

        // перерисовываем карту
        ref.triggerMapChanged(filterData);
        ref.changeMapView(filterData);
    }
};