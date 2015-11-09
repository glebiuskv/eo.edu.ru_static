package ru.informika.edu.eo;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import org.junit.Assert;
import org.junit.Test;

/**
 * Created by Андрей on 05.11.2015.
 */
public class TestReport2 {
    @Test
    public void testGetFromResrApi (){
        Report2 r = new Report2();

        JsonElement jelm = r.getFromResrApi("header?ym=201510&fed=0&reg=0&mun=0");
        JsonObject jobj = jelm.getAsJsonObject();
        Assert.assertEquals(0, jobj.get("fed").getAsInt());
    }

    @Test
    public void testJson (){
        Report2 r = new Report2();

        JsonElement dataIn = r.getFromResrApi("frm?mun=0&reg=0&fed=0");
        System.out.println(r.cantons(dataIn));
    }

    @Test
    public void testGetData(){
        Report2 r = new Report2();
        System.out.println(r.getData("in_doo_00_80", "201510","0","0","0"));
    }
}
