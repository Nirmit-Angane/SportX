package com.sportx.model;

public class Match {
    private int id;
    private String homeTeamName;
    private String awayTeamName;
    private int homeScore;
    private int awayScore;
    private String timer;
    private String status;

    public Match(int id, String homeTeamName, String awayTeamName, int homeScore, int awayScore, String timer, String status) {
        this.id = id;
        this.homeTeamName = homeTeamName;
        this.awayTeamName = awayTeamName;
        this.homeScore = homeScore;
        this.awayScore = awayScore;
        this.timer = timer;
        this.status = status;
    }

    public int getId() { return id; }
    public String getHomeTeamName() { return homeTeamName; }
    public String getAwayTeamName() { return awayTeamName; }
    public int getHomeScore() { return homeScore; }
    public int getAwayScore() { return awayScore; }
    public String getTimer() { return timer; }
    public String getStatus() { return status; }
    
    @Override
    public String toString() {
        return homeTeamName + " vs " + awayTeamName;
    }
}
