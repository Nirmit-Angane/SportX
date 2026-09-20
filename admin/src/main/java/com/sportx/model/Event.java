package com.sportx.model;

public class Event {
    private int id;
    private String name;
    private String status;

    public Event(int id, String name, String status) {
        this.id = id;
        this.name = name;
        this.status = status;
    }

    public int getId() { return id; }
    public String getName() { return name; }
    public String getStatus() { return status; }
    
    @Override
    public String toString() {
        return name;
    }
}
