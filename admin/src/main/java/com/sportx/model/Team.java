package com.sportx.model;

public class Team {
    private int id;
    private String name;
    private String sport;

    public Team(int id, String name, String sport) {
        this.id = id;
        this.name = name;
        this.sport = sport;
    }

    public int getId() { return id; }
    public String getName() { return name; }
    public String getSport() { return sport; }

    public void setId(int id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setSport(String sport) { this.sport = sport; }
}
