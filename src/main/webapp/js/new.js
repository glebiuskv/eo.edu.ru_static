$(document).ready(function () {
    if (!window.EOCONTEXT.filterData){
        window.EOCONTEXT = new EOCONTEXT();
        window.EOCONTEXT.filterData = window.EOCONTEXT.getFilter();
    }
    if (!!window.EOCONTEXT && !window.EOCONTEXT.MAP_CONTEXT) {
        window.EOCONTEXT.MAP_CONTEXT = new MAP_CONTEXT();
    }
    if (!!window.EOCONTEXT && !window.EOCONTEXT.PLASHKA) {
        window.EOCONTEXT.PLASHKA = new PLASHKA();
    }

    $('.selectpicker').selectpicker({style: 'btn-xs btn-xm'});
    //window.EOCONTEXT.PLASHKA.paintTable(window.EOCONTEXT.filterData);
    window.EOCONTEXT.MAP_CONTEXT.initMap();
    window.EOCONTEXT.PLASHKA.refresh(window.EOCONTEXT.filterData);
});

var EOCONTEXT = function (){
    this.getFilter = function () {
        var c_val = 0;
        var s_val = 0;
        var m_val = 0;
        var slaveSelect = false;
        return {
            canton: c_val,
            state: s_val,
            municipality: m_val,
            isSlave: slaveSelect
        };
    };
};

var PLASHKA = function () {

    var ref = this;
    var y = new Date().getFullYear().toString();
    var m = new Date().getMonth() + 1;
    this.ym = y + m;


    this.main_selector = function(form){
        window.EOCONTEXT.filterData.canton = form.value;
        window.EOCONTEXT.PLASHKA.refresh(window.EOCONTEXT.filterData);
    };

    this.slave_selector = function(form){
        window.EOCONTEXT.filterData.state = form.value;
        window.EOCONTEXT.filterData.isSlave = true;
        window.EOCONTEXT.PLASHKA.refresh(window.EOCONTEXT.filterData);
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

    this.paintTable = function(filterData) {
        var url = "http://cabinetv3.do.edu.ru:8081/api/header?ym=" + ref.ym + "&fed=" + filterData.canton + "&reg=" + filterData.state + "&mun=0";
        $.getJSON(url, function (resp) {
            ref.fill_table(resp);
        });
    };

    this.getReg = function(filterData){
        var url = "http://cabinetv3.do.edu.ru:8081/api/frm?mun=0&reg=0&fed=0";
        var selectReg = $('#select__states');
        selectReg.empty();
        selectReg.selectpicker('refresh');
        $.getJSON(url, function (data) {
            data.forEach(function (item) {

                if (item.fed == filterData.canton) {
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

    this.refresh = function(filterData){

        // перерисоваваем селекторы
        if (!filterData.isSlave) {
            if (filterData.canton == 0) {
                $('#select__states').empty();
                $('#select__states').append('<option value="0">Все регионы</option>');
                $('#select__states').selectpicker('refresh');
                filterData.state = 0;
            } else {
                filterData.state = 0;
                ref.getReg(filterData);
            }
        }else{
            filterData.isSlave = false;
        }

        // перерисовываем таблицу
        ref.paintTable(filterData);

        // перерисовываем карту
        window.EOCONTEXT.MAP_CONTEXT.triggerMapChanged(filterData);
        window.EOCONTEXT.MAP_CONTEXT.changeMapView(filterData);
    }
};