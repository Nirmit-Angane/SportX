package com.sportx.model;

public class Venue {
    private int id;
    private String name;
    private String address;
    private String city;
    private Integer capacity;
    private String sport;
    private String status;

    public Venue(int id, String name, String address, String city, Integer capacity, String sport, String status) {
        this.id = id;
        this.name = name;
        this.address = address;
        this.city = city;
        this.capacity = capacity;
        this.sport = sport;
        this.status = status;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public Integer getCapacity() { return capacity; }
    public void setCapacity(Integer capacity) { this.capacity = capacity; }

    public String getSport() { return sport; }
    public void setSport(String sport) { this.sport = sport; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
