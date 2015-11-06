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
                    resp.getWriter().println();
                    break;
                default:
                    resp.getWriter().println("Not support yet.");
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
            //System.out.println(getServletContext().getContextPath());

                //URI uri = Report2.class.getResource("map.jsp").toURI();
                //Path path = Paths.get(uri);

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

        /*URL url = null;
        try {
            url = new URL("http://cabinetv3.do.edu.ru:8081/api/" + parameters);
            BufferedReader reader = new BufferedReader(new InputStreamReader(url.openStream().));
            result = new JsonParser().parse(reader);

        } catch (MalformedURLException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        }
        return result;*/
        //пееписать без использования jsoup
        //


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

    public JsonObject mapRussiaStructure (JsonElement dataIn){
        JsonObject result = new JsonObject();
        JsonArray states = new JsonArray();

        JsonObject jobj = cantons(dataIn);
        JsonArray cantons = jobj.get("table").getAsJsonArray();

        for(JsonElement jelm:dataIn.getAsJsonArray()) {
            JsonObject fed = jelm.getAsJsonObject();
            if (fed.get("reg").getAsInt()!=0){
                JsonArray state = new JsonArray();
                state.add(fed.get("fed").getAsString());
                state.add(fed.get("shortname").getAsString());
                state.add(fed.get("fullname").getAsString());
                state.add(fed.get(""));
            }
        }

        return result;
    }

}
