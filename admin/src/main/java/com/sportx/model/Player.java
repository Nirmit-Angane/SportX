package com.sportx.model;

public class Player {
    private int id;
    private String fullName;
    private Integer jerseyNumber;
    private Integer teamId;
    private String position;
    private String dateOfBirth;
    private String photo;
    private String status;
    private String teamName; // For UI display

    public Player(int id, String fullName, Integer jerseyNumber, Integer teamId, String position, String dateOfBirth, String photo, String status) {
        this.id = id;
        this.fullName = fullName;
        this.jerseyNumber = jerseyNumber;
        this.teamId = teamId;
        this.position = position;
        this.dateOfBirth = dateOfBirth;
        this.photo = photo;
        this.status = status;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public Integer getJerseyNumber() { return jerseyNumber; }
    public void setJerseyNumber(Integer jerseyNumber) { this.jerseyNumber = jerseyNumber; }

    public Integer getTeamId() { return teamId; }
    public void setTeamId(Integer teamId) { this.teamId = teamId; }

    public String getPosition() { return position; }
    public void setPosition(String position) { this.position = position; }

    public String getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(String dateOfBirth) { this.dateOfBirth = dateOfBirth; }

    public String getPhoto() { return photo; }
    public void setPhoto(String photo) { this.photo = photo; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getTeamName() { return teamName; }
    public void setTeamName(String teamName) { this.teamName = teamName; }
}
