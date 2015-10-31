/**
 * Created by Андрей on 30.10.2015.
 */
var ym;
var fed;
var reg;
var plashka;
var data;

/*$(function(){
    // как только загрузилась страница показываем плашку и график по умолчанию
    ym = '201511';
    fed = 0;
    reg = 0;

    plashka = Plashka();
    plashka.fill(fed,reg);
    fill_table();
    show_graph();

});*/

$(document).ready(function(){

    ym = '201511';
    fed = 0;
    reg = 0;

    getData();
    $().delay(3000);
    fill_table();
    show_graph();

});

function main_selector(form) {

    fed = form.value;
    var slaveSelector = $("select[id='select__states']");

    if (fed != 0) {

        // запрашиваем список субъектов федерации по номеру ФО из рест апи
        // извлекаем нужные нам данные
        // наполняем втрой селект данными
    }
    reg = 0;
    getData();
    fill_table();
    show_graph();
}

function slave_selector(form) {
    reg = form.value;
    var main_selector = $("select[id='select__cantons']");

}

function fill_table() {

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

function getREST_API() {

}

function getData(){
    var url = "http://cabinetv3.do.edu.ru:8081/api/header?ym=" + ym + "&fed=" + fed + "&reg=" + reg + "&mun=0";
    $.getJSON(url, function (resp) {
        data = resp;
        alert("data.rosstat_00_80="+data.rosstat_00_80 + " win.fed=" + fed);
    });
}