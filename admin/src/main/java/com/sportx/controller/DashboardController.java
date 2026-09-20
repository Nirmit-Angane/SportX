package com.sportx.controller;

import com.sportx.api.ApiClient;
import com.sportx.util.AppUtil;
import javafx.application.Platform;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.fxml.FXML;
import javafx.scene.control.Label;
import javafx.scene.control.ListView;
import org.json.JSONArray;
import org.json.JSONObject;

public class DashboardController {

    @FXML private Label totalEventsLabel;
    @FXML private Label activeEventsLabel;
    @FXML private Label upcomingMatchesLabel;
    @FXML private Label liveMatchesLabel;
    
    @FXML private ListView<String> liveMatchesList;
    @FXML private ListView<String> upcomingMatchesList;

    @FXML
    public void initialize() {
        loadDashboardData();
    }

    private void loadDashboardData() {
        MainController.getInstance().showLoading("Loading Operations Overview...");

        AppUtil.runAsync(() -> {
            // Because the backend might not have a unified /dashboard endpoint yet,
            // we will simulate gathering stats by querying /events and /matches
            try {
                String eventsResp = ApiClient.getAsync("/events").join();
                String matchesResp = ApiClient.getAsync("/matches").join();
                return new JSONObject()
                        .put("events", new JSONObject(eventsResp))
                        .put("matches", new JSONObject(matchesResp));
            } catch (Exception e) {
                throw new RuntimeException("Failed to fetch dashboard data: " + e.getMessage());
            }
        }, result -> {
            MainController.getInstance().hideLoading();
            processDashboardData(result);
        }, error -> {
            MainController.getInstance().hideLoading();
            System.err.println("Dashboard error: " + error.getMessage());
            totalEventsLabel.setText("ERR");
            activeEventsLabel.setText("ERR");
            upcomingMatchesLabel.setText("ERR");
            liveMatchesLabel.setText("ERR");
        });
    }

    private void processDashboardData(JSONObject result) {
        try {
            JSONObject eventsData = result.getJSONObject("events");
            JSONObject matchesData = result.getJSONObject("matches");

            int totalEvents = 0, activeEvents = 0;
            if (eventsData.getBoolean("success")) {
                JSONArray evs = eventsData.getJSONArray("data");
                totalEvents = evs.length();
                for (int i = 0; i < evs.length(); i++) {
                    String status = evs.getJSONObject(i).optString("status", "");
                    if ("ACTIVE".equalsIgnoreCase(status)) activeEvents++;
                }
            }

            int upcomingMatches = 0, liveMatches = 0;
            ObservableList<String> liveList = FXCollections.observableArrayList();
            ObservableList<String> upcomingList = FXCollections.observableArrayList();

            if (matchesData.getBoolean("success")) {
                JSONArray mts = matchesData.getJSONArray("data");
                for (int i = 0; i < mts.length(); i++) {
                    JSONObject m = mts.getJSONObject(i);
                    String status = m.optString("status", "");
                    String label = m.optString("home_team_name", "Home") + " vs " + m.optString("away_team_name", "Away");

                    if ("LIVE".equalsIgnoreCase(status)) {
                        liveMatches++;
                        String score = m.optInt("home_score", 0) + " - " + m.optInt("away_score", 0);
                        liveList.add("● LIVE: " + label + " [" + score + "] " + m.optString("timer", ""));
                    } else if ("UPCOMING".equalsIgnoreCase(status)) {
                        upcomingMatches++;
                        upcomingList.add(label);
                    }
                }
            }

            totalEventsLabel.setText(String.format("%02d", totalEvents));
            activeEventsLabel.setText(String.format("%02d", activeEvents));
            upcomingMatchesLabel.setText(String.format("%02d", upcomingMatches));
            liveMatchesLabel.setText(String.format("%02d", liveMatches));

            if (liveList.isEmpty()) liveList.add("No live matches currently in progress.");
            if (upcomingList.isEmpty()) upcomingList.add("No upcoming matches scheduled.");

            liveMatchesList.setItems(liveList);
            upcomingMatchesList.setItems(upcomingList);

        } catch (Exception e) {
            System.err.println("Error processing dashboard data: " + e.getMessage());
        }
    }

    @FXML public void goToCreateEvent() { MainController.getInstance().showEvents(); }
    @FXML public void goToTeams() { MainController.getInstance().showTeams(); }
    @FXML public void goToPlayers() { MainController.getInstance().showPlayers(); }
    @FXML public void goToCreateMatch() { MainController.getInstance().showMatches(); }
    @FXML public void goToLiveScore() { MainController.getInstance().showLiveScore(); }
    @FXML public void goToQR() { MainController.getInstance().showQRCodes(); }
}
