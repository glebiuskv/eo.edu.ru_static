/**
 * Created by Андрей on 30.10.2015.
 */
var ym = '201510';
var fed = 0;
var reg = 0;
var plashka = Plashka();

$(function(){
    // как только загрузилась страница показываем плашку и график по умолчанию
    plashka.fill(fed,reg);
    show_plashka();
    show_graph();

});

function main_selector(doc, form) {

    fed = form.value;
    var slaveSelector = $("select[id='select__states']");

    if (fed != 0) {

        // запрашиваем список субъектов федерации по номеру ФО из рест апи
        // извлекаем нужные нам данные
        // наполняем втрой селект данными
    }
    plashka.fill(fed,"0");
    show_plashka();
    show_graph();
}

function slave_selector(doc, form) {
    reg = form.value;
    var main_selector = $("select[id='select__cantons']");

}

function show_plashka() {

}

function show_graph() {

}

function getREST_API() {

}

function Plashka() {
    return {
        data: "",
        fill: function (fed, reg) {
            var url = "http://cabinetv3.do.edu.ru:8081/api/header?ym=" + ym + "&fed=" + fed + "&reg=" + reg + "&mun=0";
            $.getJSON(url, function (resp) {
                data = resp;
            });
        }
    }
}