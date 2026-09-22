package com.sportx.controller;

import com.sportx.api.ApiClient;
import com.sportx.util.AppUtil;
import javafx.application.Platform;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.fxml.FXML;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.List;

public class BracketsController {

    @FXML private ComboBox<EventItem> eventSelector;
    @FXML private VBox bracketContainer;

    private static class EventItem {
        int id;
        String name;
        EventItem(int id, String name) { this.id = id; this.name = name; }
        @Override public String toString() { return name; }
    }

    private static class TeamItem {
        int id;
        String name;
        TeamItem(int id, String name) { this.id = id; this.name = name; }
        @Override public String toString() { return name; }
    }

    @FXML
    public void initialize() {
        refreshEvents();
    }

    private void refreshEvents() {
        AppUtil.runAsync(() -> ApiClient.getAsync("/events").join(),
            res -> {
                try {
                    JSONObject json = new JSONObject(res);
                    if (json.getBoolean("success")) {
                        JSONArray data = json.getJSONArray("data");
                        ObservableList<EventItem> items = FXCollections.observableArrayList();
                        for (int i = 0; i < data.length(); i++) {
                            JSONObject obj = data.getJSONObject(i);
                            items.add(new EventItem(obj.getInt("id"), obj.getString("name")));
                        }
                        eventSelector.setItems(items);
                    }
                } catch (Exception e) {}
            },
            err -> {}
        );
    }

    @FXML
    public void loadBracket() {
        EventItem selected = eventSelector.getValue();
        if (selected == null) {
            AppUtil.showAlert(Alert.AlertType.WARNING, "Warning", "Please select an event.");
            return;
        }

        MainController.getInstance().showLoading("Loading Bracket...");
        AppUtil.runAsync(() -> ApiClient.getAsync("/matches?event_id=" + selected.id).join(),
            res -> {
                MainController.getInstance().hideLoading();
                try {
                    JSONObject json = new JSONObject(res);
                    if (json.getBoolean("success")) {
                        JSONArray data = json.getJSONArray("data");
                        boolean hasBracket = false;
                        for (int i = 0; i < data.length(); i++) {
                            if (data.getJSONObject(i).optString("round", "").startsWith("Bracket:")) {
                                hasBracket = true;
                                break;
                            }
                        }

                        if (hasBracket) {
                            showBracketView(data);
                        } else {
                            showGenerateView(selected.id);
                        }
                    }
                } catch (Exception e) {
                    AppUtil.showAlert(Alert.AlertType.ERROR, "Error", "Failed to parse bracket data.");
                }
            },
            err -> {
                MainController.getInstance().hideLoading();
                AppUtil.showAlert(Alert.AlertType.ERROR, "Error", "Failed to fetch matches: " + err.getMessage());
            }
        );
    }

    private void showBracketView(JSONArray matches) {
        bracketContainer.getChildren().clear();
        
        Label lbl = new Label("Tournament Bracket");
        lbl.setStyle("-fx-font-size: 24px; -fx-font-weight: bold;");
        
        Label hint = new Label("To progress teams, go to Live Score and end the matches.");
        hint.setStyle("-fx-font-size: 14px; -fx-text-fill: -fx-text-secondary; -fx-padding: 0 0 20 0;");
        
        javafx.scene.layout.VBox list = new javafx.scene.layout.VBox(10);
        list.setAlignment(javafx.geometry.Pos.CENTER);
        list.setStyle("-fx-background-color: -fx-surface-elevated; -fx-padding: 20; -fx-background-radius: 8; -fx-border-color: -fx-border-color; -fx-border-radius: 8;");
        
        for (int i = 0; i < matches.length(); i++) {
             JSONObject match = matches.getJSONObject(i);
             String round = match.optString("round", "");
             if (round.startsWith("Bracket:")) {
                 String home = match.optString("home_team_name");
                 if (home == null || home.isEmpty() || home.equals("null")) home = "TBD";
                 String away = match.optString("away_team_name");
                 if (away == null || away.isEmpty() || away.equals("null")) away = "TBD";
                 
                 int hScore = match.optInt("home_score", 0);
                 int aScore = match.optInt("away_score", 0);
                 String status = match.optString("status", "");
                 
                 String display = round.replace("Bracket: ", "") + " | " + home + " " + (status.equals("COMPLETED") ? hScore : "-") + " vs " + (status.equals("COMPLETED") ? aScore : "-") + " " + away;
                 Label mLabel = new Label(display);
                 mLabel.setStyle("-fx-font-size: 16px; -fx-text-fill: white;");
                 list.getChildren().add(mLabel);
             }
        }
        
        bracketContainer.getChildren().addAll(lbl, hint, list);
    }

    private void showGenerateView(int eventId) {
        bracketContainer.getChildren().clear();
        
        Label lbl = new Label("No bracket exists for this event.");
        lbl.setStyle("-fx-font-size: 18px;");
        
        Button btn = new Button("GENERATE 8-TEAM BRACKET");
        btn.getStyleClass().addAll("button", "btn-primary");
        
        btn.setOnAction(e -> promptGenerateBracket(eventId));
        
        bracketContainer.getChildren().addAll(lbl, btn);
    }

    private void promptGenerateBracket(int eventId) {
        MainController.getInstance().showLoading("Fetching Teams...");
        
        AppUtil.runAsync(() -> ApiClient.getAsync("/teams?event_id=" + eventId).join(),
            res -> {
                MainController.getInstance().hideLoading();
                try {
                    JSONObject json = new JSONObject(res);
                    if (json.getBoolean("success")) {
                        JSONArray data = json.getJSONArray("data");
                        List<TeamItem> teams = new ArrayList<>();
                        for (int i = 0; i < data.length(); i++) {
                            JSONObject obj = data.getJSONObject(i);
                            teams.add(new TeamItem(obj.getInt("id"), obj.getString("name")));
                        }
                        
                        if (teams.size() < 8) {
                            // Pad with dummy teams to allow generation
                            for (int j = teams.size(); j < 8; j++) {
                                teams.add(new TeamItem(-1 * (j + 10), "TBD Team " + (j + 1)));
                            }
                        }
                        
                        // We will just pick the first 8 teams
                        List<TeamItem> selectedTeams = teams.subList(0, 8);
                        generateBracketMatches(eventId, selectedTeams);
                    }
                } catch (Exception e) {}
            },
            err -> {
                MainController.getInstance().hideLoading();
            }
        );
    }

    private void generateBracketMatches(int eventId, List<TeamItem> teams) {
        MainController.getInstance().showLoading("Generating Bracket...");
        
        new Thread(() -> {
            try {
                // QF 1: Team 0 vs 7
                createMatch(eventId, teams.get(0).id, teams.get(7).id, "Bracket: QF 1");
                createMatch(eventId, teams.get(1).id, teams.get(6).id, "Bracket: QF 2");
                createMatch(eventId, teams.get(2).id, teams.get(5).id, "Bracket: QF 3");
                createMatch(eventId, teams.get(3).id, teams.get(4).id, "Bracket: QF 4");
                
                createMatch(eventId, -1, -2, "Bracket: SF 1");
                createMatch(eventId, -3, -4, "Bracket: SF 2");
                createMatch(eventId, -5, -6, "Bracket: Final");

                Platform.runLater(() -> {
                    MainController.getInstance().hideLoading();
                    AppUtil.showAlert(Alert.AlertType.INFORMATION, "Success", "8-Team Bracket Generated Successfully!");
                    loadBracket();
                });
            } catch (Exception e) {
                Platform.runLater(() -> {
                    MainController.getInstance().hideLoading();
                    AppUtil.showAlert(Alert.AlertType.ERROR, "Error", "Failed to generate matches.");
                });
            }
        }).start();
    }

    private void createMatch(int eventId, Integer homeId, Integer awayId, String round) throws Exception {
        JSONObject payload = new JSONObject();
        payload.put("event_id", eventId);
        if (homeId != null && homeId > 0) payload.put("home_team_id", homeId);
        if (awayId != null && awayId > 0) payload.put("away_team_id", awayId);
        payload.put("sport_id", 1); 
        payload.put("match_date", java.time.LocalDate.now().toString());
        payload.put("match_time", "12:00");
        payload.put("round", round);
        payload.put("status", "SCHEDULED");
        
        ApiClient.postAsync("/matches", payload.toString()).join();
    }
}
