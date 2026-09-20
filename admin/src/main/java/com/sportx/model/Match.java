package com.sportx.model;

public class Match {
    private int id;
    private int eventId;
    private int venueId;
    private int homeTeamId;
    private int awayTeamId;
    private String status;
    
    private String homeTeamName;
    private String awayTeamName;
    private int homeScore;
    private int awayScore;
    private String timer;

    public Match(int id, int eventId, int venueId, int homeTeamId, int awayTeamId, String status) {
        this.id = id;
        this.eventId = eventId;
        this.venueId = venueId;
        this.homeTeamId = homeTeamId;
        this.awayTeamId = awayTeamId;
        this.status = status;
    }

    public int getId() { return id; }
    public int getEventId() { return eventId; }
    public int getVenueId() { return venueId; }
    public int getHomeTeamId() { return homeTeamId; }
    public int getAwayTeamId() { return awayTeamId; }
    public String getStatus() { return status; }
    
    public String getHomeTeamName() { return homeTeamName; }
    public String getAwayTeamName() { return awayTeamName; }
    public int getHomeScore() { return homeScore; }
    public int getAwayScore() { return awayScore; }
    public String getTimer() { return timer; }

    public void setHomeTeamName(String homeTeamName) { this.homeTeamName = homeTeamName; }
    public void setAwayTeamName(String awayTeamName) { this.awayTeamName = awayTeamName; }
    public void setHomeScore(int homeScore) { this.homeScore = homeScore; }
    public void setAwayScore(int awayScore) { this.awayScore = awayScore; }
    public void setTimer(String timer) { this.timer = timer; }
    public void setStatus(String status) { this.status = status; }
}
