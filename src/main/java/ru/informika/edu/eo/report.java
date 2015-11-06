package ru.informika.edu.eo;

import com.google.gson.*;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;


import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.Enumeration;

/**
 * Created by Андрей on 05.11.2015.
 */
public class Report extends HttpServlet {
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {

        //action=getReport&id=cantons
        // resp = JSON {table:[{0:"4", 1:"ДФО", 2:"canton"}, ...], code:0}

        //action=getReport &id= "report_url_mapping_for_redirect"
        // JSON {table:[0:51490, 1:начальник дошкольного и общего образования Министерства образования Московской области И.В. Морозова 8-498-602-10-41 начальник управления стратегического развития и стандартизации Министерства государственного управления, информационных технологий и связи Московской области Д.Б. Усенков 8-498-602-02-46, 2:http://lk.mosreg.ru/lkmo/dou_main.htm}], code:0}

        // map_russia_structure
        // {0:"1", 1:"ЦФО", 2:Центральный федеральный округ, 3:83184, 4:5, 5:Белгородская область}

        //http://cabinetv2.do.edu.ru:8080/report.htm?year=2015&month=11&id=top_child_all_public_for_year_month&action=getReport&canton_id=-1&state_id=-1&municipality_id=-1
        //12355835

        //http://cabinetv2.do.edu.ru:8080/report.htm?year=2015&month=11&id=top_child_3_7_public_for_year_month&action=getReport&canton_id=-1&state_id=-1&municipality_id=-1
        //6810404

        //http://cabinetv2.do.edu.ru:8080/report.htm?action=getReport&id=map_eo_queue_for_year_month&year=2015&month=11
        //[]
        //
        // http://cabinetv2.do.edu.ru:8080/report.htm?action=getReport&id=cantons
        //

        if(req.getParameter("action").equals("getReport")){
            if(req.getParameter("id").equals("cantons")){
                resp.getWriter().println(convertCantons(getFromResrApi("frm?mun=0&reg=0&fed=0")).toString());
            }
        }else{
            resp.getWriter().println("Not support yet.");
        }

    }
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.sendError(404, "Not supported.");
    }

    public JsonElement getFromResrApi (String parameters){
        JsonElement result;
        URL url = null;

        try {
            url = new URL("http://cabinetv3.do.edu.ru:8081/api/" + parameters);
            BufferedReader reader = new BufferedReader(new InputStreamReader(url.openStream()));
            result = new JsonParser().parse(reader);
            return result;
        } catch (MalformedURLException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        }
        //TODO пееписать без использования jsoup


        Document doc = null;
        Elements sections;

        try {
            doc = Jsoup.connect(url + parameters).timeout(3000).ignoreContentType(true).userAgent("Mozilla").get();
        } catch (IOException e1) {
            e1.printStackTrace();
        }
        sections = doc.getElementsByTag("body");
        for (Element section:sections){
            result = new JsonParser().parse(section.text());
        }
        return null;//result;
    }

    public JsonObject convertCantons (JsonElement dataIn){
        JsonObject result = new JsonObject();
        JsonArray cantons = new JsonArray();

        for(JsonElement jelm:dataIn.getAsJsonArray()){
            JsonObject fed = jelm.getAsJsonObject();
            if (fed.get("reg").getAsInt() == 0){
                JsonArray canton = new JsonArray();
                canton.add(fed.get("fed").getAsString());
                canton.add(fed.get("shortname").getAsString());
                canton.add("canton");
                cantons.add(canton);
            }
        }
        result.add("table", cantons);
        result.addProperty("code",0);
        return result;
    }
}
