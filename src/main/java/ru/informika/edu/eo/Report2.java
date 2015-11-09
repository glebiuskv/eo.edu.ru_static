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


import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;

/**
 * Created by Андрей on 05.11.2015.
 */
public class Report2 extends HttpServlet {
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {

        resp.setContentType("text/html; charset=UTF-8");

        if (req.getParameter("action")!=null)
        if(req.getParameter("action").equals("getReport")){
            switch (req.getParameter("id")) {
                case "cantons":
                    resp.getWriter().println(cantons(getFromResrApi("frm?mun=0&reg=0&fed=0")).toString());
                    break;
                case "map_russia_structure":
                    resp.getWriter().println(mapRussiaStructure());
                    break;
                case "report_url_mapping_for_redirect":
                    resp.getWriter().println(urlMappingForRedirect());
                    break;
                case "top_child_all_for_year_month":
                    resp.getWriter().println("{'table':[['11111']],'code':0}");
                    break;
                case "top_child_3_7_for_year_month":
                    resp.getWriter().println("{ 'table': [ [ '22222' ] ], 'code': 0 }");
                default:
                    //resp.getWriter().println("Not support yet.");
                    break;
            }}
            /*if(req.getParameter("id").equals("cantons")){
                resp.getWriter().println(cantons(getFromResrApi("frm?mun=0&reg=0&fed=0")).toString());
            }
        }else{
            resp.getWriter().println("Not support yet.");
        }*/

        if(req.getParameter("target")!= null)
        if(req.getParameter("target").equals("charts__map.jsp")){
            // очень не правильное решение!!!
            List<String> lines = Files.readAllLines(Paths.get("d:\\apache-tomcat-7.0.65\\webapps\\ROOT\\map.jsp"), StandardCharsets.UTF_8);
                for(String line:lines){
                    resp.getWriter().println(line);
                }
        }
    }

    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.sendError(404, "Not supported.");
    }

    public JsonElement getFromResrApi (String parameters){
        JsonElement result = null;
        Document doc = null;
        Elements sections;
        String url = "http://cabinetv3.do.edu.ru:8081/api/" + parameters;

        try {
            doc = Jsoup.connect(url).timeout(3000).ignoreContentType(true).userAgent("Mozilla").get();
        } catch (IOException e1) {
            e1.printStackTrace();
        }
        sections = doc.getElementsByTag("body");
        for (Element section:sections){
            result = new JsonParser().parse(section.text());
        }
        return result;
    }

    public JsonObject cantons(JsonElement dataIn){
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

    public String mapRussiaStructure (){
        String result = null;
        Document doc = null;
        Elements sections;
        String url = "http://cabinetv2.do.edu.ru:8080/report.htm?action=getReport&id=map_russia_structure";

        try {
            doc = Jsoup.connect(url).timeout(3000).ignoreContentType(true).userAgent("Mozilla").get();
        } catch (IOException e1) {
            e1.printStackTrace();
        }
        sections = doc.getElementsByTag("body");
        for (Element section:sections){
            result = section.text();
        }
        return result;
    }

    public String urlMappingForRedirect (){
        String result = null;
        Document doc = null;
        Elements sections;
        String url = "http://cabinetv2.do.edu.ru:8080/report.htm?action=getReport&id=report_url_mapping_for_redirect";

        try {
            doc = Jsoup.connect(url).timeout(3000).ignoreContentType(true).userAgent("Mozilla").get();
        } catch (IOException e1) {
            e1.printStackTrace();
        }
        sections = doc.getElementsByTag("body");
        for (Element section:sections){
            result = section.text();
        }
        return result;
    }

    public

}
