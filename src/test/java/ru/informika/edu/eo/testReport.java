package ru.informika.edu.eo;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import org.junit.Assert;
import org.junit.Test;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

/**
 * Created by Андрей on 05.11.2015.
 */
public class TestReport {
    @Test
    public void testGetFromResrApi (){
        Report r = new Report();

        JsonElement jelm = r.getFromResrApi("header?ym=201510&fed=0&reg=0&mun=0");
        JsonObject jobj = jelm.getAsJsonObject();
        Assert.assertEquals(0, jobj.get("fed").getAsInt());
    }

    @Test
    public void testJson (){
        Report r = new Report();

        JsonElement dataIn = r.getFromResrApi("frm?mun=0&reg=0&fed=0");
        System.out.println(r.convertCantons(dataIn));
    }
}
