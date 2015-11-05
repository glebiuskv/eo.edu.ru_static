/**
 * Created by Андрей on 30.10.2015.
 */

var ym = '201510';
var fed = 0;
var reg = 0;

$(document).ready(function () {
    getData(ym, fed, reg);
});

function main_selector(form) {
    fed = form.value;

    if (fed != 0) {
        // запрашиваем список субъектов федерации по номеру ФО из рест апи
        getReg(fed);
    }else{
        $('#select__states').empty();
        $('#select__states').append('<option value="0">Все регионы</option>');
    }
    reg = 0;
    getData(ym, fed, reg);
}

function slave_selector(form) {
    reg = form.value;
    getData(ym, fed, reg);

}

function fill_table(data) {

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

function getData(ym, fed1, reg) {
    var url = "http://cabinetv3.do.edu.ru:8081/api/header?ym=" + ym + "&fed=" + fed1 + "&reg=" + reg + "&mun=0";
    $.getJSON(url, function (resp) {
        fill_table(resp);
    });
}

function getReg(fed){
    var url = "http://cabinetv3.do.edu.ru:8081/api/frm?mun=0&reg=0&fed=0";
    var carenFed;
    var selectReg = $('#select__states');
    selectReg.empty();
    $.getJSON(url, function(data){
        data.forEach(function(item){

            if (item.fed == fed){
                var reg = item.reg;
                var name = item.shortname;
                if (reg == 0){name = "Все регионы"}
                selectReg.append('<option value="' + reg + '">' + name + '</option>');
            }
        });
    });
}
