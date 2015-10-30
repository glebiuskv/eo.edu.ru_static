/**
 * Created by Андрей on 30.10.2015.
 */
var ym = '201510';

function main_selector(doc, form) {
    //alert("doc=" + $("select[id='select__states']") + " form=" + form.value);
    var fed = form.value;
    var slaveSelector = $("select[id='select__states']");

    if (fed == -1) {
        //просто шлём запрос в рест апи
        p = Plashka().fill(0,0);
        alert(p.data.rosstat_00_30);
    } else {
        // запрашиваем список субъектов федерации по номеру ФО из рест апи
        // извлекаем нужные нам данные
        // наполняем втрой селект данными и вызываем рест апи для ФО
    }

}

function slave_selector(doc, form) {
    var reg = form.value;
    var main_selector = $("select[id='select__cantons']");

}

function show_plashka() {
    p1 = Plashka().fill();
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
                $.each(resp, function(key, val){
                    alert(key,val);
                })
                data = $.parseJSON(resp);
            });
        }
    }
}