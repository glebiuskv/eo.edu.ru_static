/**
 * Created by Андрей on 30.10.2015.
 */
var ym;
var fed;
var reg;
var dataEo;

function start() {

}

$(document).ready(function () {
    var ym = '201511';
    var fed = 0;
    var reg = 0;

    //var data1 =
    getData(ym, fed, reg);
    //fill_table(data1);
    //show_graph();
    //mainSelector.change(main_selector(mainSelector[0]));
});

function main_selector(form) {

    var fed = form.value;
    var slaveSelector = $("select[id='select__states']");

    if (fed != 0) {

        // запрашиваем список субъектов федерации по номеру ФО из рест апи
        // извлекаем нужные нам данные
        // наполняем втрой селект данными
    }
    reg = 0;
    //var data =
    getData(ym, fed, reg);
    //fill_table(data);
    //show_graph();
}

function slave_selector(form) {
    reg = form.value;
    var main_selector = $("select[id='select__cantons']");

}

function fill_table(data) {

    //alert('Приступить к работе.');
    $('.rosstat_00_80').text(data.rosstat_00_80);
    $('.in_doo_00_80').text(data.in_doo_00_80);
    $('.in_queue_00_80').text(data.in_queue_00_80);
    $('.wo_place_00_80').text(data.wo_place_00_80);

    $('.rosstat_00_70').text(data.rosstat_00_70);
    $('.in_doo_00_70').text(data.in_doo_00_70);
    $('.in_queue_00_70').text(data.in_queue_00_70);
    $('.wo_place_00_70').text(data.wo_place_00_70);

    $('.rosstat_30_70').text(data.rosstat_30_70);
    $('.in_doo_30_70').text(data.in_doo_30_70);
    $('.in_queue_30_70').text(data.in_queue_30_70);
    $('.wo_place_30_70').text(data.wo_place_30_70);

    $('.rosstat_00_30').text(data.rosstat_00_30);
    $('.in_doo_00_30').text(data.in_doo_00_30);
    $('.in_queue_00_30').text(data.in_queue_00_30);
    $('.wo_place_00_30').text(data.wo_place_00_30);
}

function show_graph() {

}

function getData(ym, fed1, reg) {
    var url = "http://cabinetv3.do.edu.ru:8081/api/header?ym=" + ym + "&fed=" + fed1 + "&reg=" + reg + "&mun=0";
    $.getJSON(url, function (resp) {
        fill_table(resp);
    });
}