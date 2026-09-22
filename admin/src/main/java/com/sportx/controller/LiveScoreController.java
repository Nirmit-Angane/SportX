package com.sportx.controller;

import com.sportx.api.ApiClient;
import com.sportx.util.AppUtil;
import javafx.animation.Animation;
import javafx.animation.KeyFrame;
import javafx.animation.Timeline;
import javafx.fxml.FXML;
import javafx.scene.control.Alert;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.layout.VBox;
import javafx.scene.shape.Circle;
import javafx.scene.paint.Color;
import javafx.util.Duration;
import org.json.JSONArray;
import org.json.JSONObject;

import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.scene.control.ComboBox;

public class LiveScoreController {

    @FXML private ComboBox<MatchItem> matchSelector;
    @FXML private VBox liveConsole;
    
    @FXML private Label matchStatusLabel;
    @FXML private Circle liveIndicator;
    @FXML private Label timerLabel;
    @FXML private Button timerToggleBtn;

    @FXML private Label homeTeamName;
    @FXML private Label homeScoreLabel;
    @FXML private Label awayTeamName;
    @FXML private Label awayScoreLabel;

    private int currentMatchId = -1;
    private int currentEventId = -1;
    private String currentRound = "";
    private int homeTeamId = -1;
    private int awayTeamId = -1;
    private int homeScore = 0;
    private int awayScore = 0;

    // Timer logic
    private Timeline timeline;
    private int secondsElapsed = 0;
    private boolean isTimerRunning = false;

    private static class MatchItem {
        int id;
        String label;
        MatchItem(int id, String label) { this.id = id; this.label = label; }
        @Override public String toString() { return label; }
    }

    @FXML
    public void initialize() {
        timeline = new Timeline(new KeyFrame(Duration.seconds(1), e -> updateTimerDisplay()));
        timeline.setCycleCount(Animation.INDEFINITE);
        
        // When this view becomes visible or active, we should load matches.
        // For simplicity, we just trigger it immediately.
        refreshMatches();
    }

    public void refreshMatches() {
        AppUtil.runAsync(() -> ApiClient.getAsync("/matches").join(),
            res -> {
                try {
                    JSONObject json = new JSONObject(res);
                    if (json.getBoolean("success")) {
                        JSONArray data = json.getJSONArray("data");
                        ObservableList<MatchItem> items = FXCollections.observableArrayList();
                        for (int i = 0; i < data.length(); i++) {
                            JSONObject obj = data.getJSONObject(i);
                            String status = obj.optString("status", "");
                            if ("LIVE".equals(status) || "UPCOMING".equals(status) || "TIMEOUT".equals(status) || "UNDER REVIEW".equals(status)) {
                                int id = obj.getInt("id");
                                String home = obj.optString("home_team_name", "Team " + obj.getInt("home_team_id"));
                                String away = obj.optString("away_team_name", "Team " + obj.getInt("away_team_id"));
                                items.add(new MatchItem(id, id + ": " + home + " vs " + away + " (" + status + ")"));
                            }
                        }
                        matchSelector.setItems(items);
                    }
                } catch (Exception e) {}
            },
            err -> {}
        );
    }

    @FXML
    public void loadMatch() {
        MatchItem selected = matchSelector.getValue();
        if (selected == null) {
            AppUtil.showAlert(Alert.AlertType.WARNING, "Warning", "Please select a match.");
            return;
        }

        try {
            int matchId = selected.id;
            MainController.getInstance().showLoading("Loading Match...");
            
            AppUtil.runAsync(() -> ApiClient.getAsync("/matches/" + matchId).join(), 
                response -> {
                    MainController.getInstance().hideLoading();
                    try {
                        JSONObject json = new JSONObject(response);
                        if (json.getBoolean("success")) {
                            JSONObject data = json.getJSONObject("data");
                            
                            currentMatchId = data.getInt("id");
                            currentEventId = data.optInt("event_id", -1);
                            currentRound = data.optString("round", "");
                            homeTeamId = data.optInt("home_team_id", -1);
                            awayTeamId = data.optInt("away_team_id", -1);
                            homeTeamName.setText(data.optString("home_team_name", "HOME"));
                            awayTeamName.setText(data.optString("away_team_name", "AWAY"));
                            homeScore = data.optInt("home_score", 0);
                            awayScore = data.optInt("away_score", 0);
                            updateScoreDisplay();

                            String status = data.optString("status", "UPCOMING");
                            matchStatusLabel.setText(status);
                            if ("LIVE".equalsIgnoreCase(status)) {
                                matchStatusLabel.setStyle("-fx-text-fill: -fx-live-red; -fx-font-size: 16px; -fx-font-weight: 900;");
                                liveIndicator.setFill(Color.valueOf("#FF3B45"));
                            } else if ("TIMEOUT".equalsIgnoreCase(status)) {
                                matchStatusLabel.setStyle("-fx-text-fill: #F5A623; -fx-font-size: 16px; -fx-font-weight: 900;");
                                liveIndicator.setFill(Color.valueOf("#F5A623"));
                            } else if ("UNDER REVIEW".equalsIgnoreCase(status)) {
                                matchStatusLabel.setStyle("-fx-text-fill: #F8E71C; -fx-font-size: 16px; -fx-font-weight: 900;");
                                liveIndicator.setFill(Color.valueOf("#F8E71C"));
                            } else {
                                matchStatusLabel.setStyle("-fx-text-fill: -fx-text-secondary; -fx-font-size: 16px; -fx-font-weight: 900;");
                                liveIndicator.setFill(Color.valueOf("#91A4BC"));
                            }

                            // parse timer if present, e.g. "45:00"
                            String t = data.optString("timer", "00:00");
                            try {
                                String[] parts = t.split(":");
                                secondsElapsed = Integer.parseInt(parts[0]) * 60 + Integer.parseInt(parts[1]);
                            } catch (Exception e) {
                                secondsElapsed = 0;
                            }
                            forceTimerUpdate();

                            liveConsole.setVisible(true);
                        } else {
                            AppUtil.showAlert(Alert.AlertType.ERROR, "Error", "Match not found.");
                        }
                    } catch (Exception e) {
                        AppUtil.showAlert(Alert.AlertType.ERROR, "Parse Error", "Failed to parse match data.");
                    }
                }, 
                error -> {
                    MainController.getInstance().hideLoading();
                    AppUtil.showAlert(Alert.AlertType.ERROR, "Network Error", "Failed to fetch match: " + error.getMessage());
                });

        } catch (Exception e) {
            AppUtil.showAlert(Alert.AlertType.WARNING, "Warning", "Failed to parse selection.");
        }
    }

    private void updateScoreDisplay() {
        homeScoreLabel.setText(String.valueOf(homeScore));
        awayScoreLabel.setText(String.valueOf(awayScore));
    }

    @FXML public void homePlus() { homeScore++; updateScoreDisplay(); }
    @FXML public void homeMinus() { if(homeScore > 0) homeScore--; updateScoreDisplay(); }
    @FXML public void awayPlus() { awayScore++; updateScoreDisplay(); }
    @FXML public void awayMinus() { if(awayScore > 0) awayScore--; updateScoreDisplay(); }

    @FXML
    public void toggleTimer() {
        if (isTimerRunning) {
            timeline.pause();
            timerToggleBtn.setText("Resume Timer");
            isTimerRunning = false;
        } else {
            timeline.play();
            timerToggleBtn.setText("Pause Timer");
            isTimerRunning = true;
        }
    }

    private void updateTimerDisplay() {
        secondsElapsed++;
        forceTimerUpdate();
    }

    private void forceTimerUpdate() {
        int m = secondsElapsed / 60;
        int s = secondsElapsed % 60;
        timerLabel.setText(String.format("%02d:%02d", m, s));
    }

    @FXML
    public void updateScore() {
        if (currentMatchId == -1) return;

        JSONObject scorePayload = new JSONObject();
        scorePayload.put("home_score", homeScore);
        scorePayload.put("away_score", awayScore);
        scorePayload.put("timer", timerLabel.getText());

        JSONObject matchPayload = new JSONObject();
        matchPayload.put("status", "LIVE"); 

        MainController.getInstance().showLoading("Publishing Update...");

        AppUtil.runAsync(() -> {
            ApiClient.putAsync("/matches/" + currentMatchId + "/score", scorePayload.toString()).join();
            ApiClient.putAsync("/matches/" + currentMatchId, matchPayload.toString()).join();
            return "OK";
        },
            res -> {
                MainController.getInstance().hideLoading();
                matchStatusLabel.setText("LIVE");
                matchStatusLabel.setStyle("-fx-text-fill: -fx-live-red; -fx-font-size: 16px; -fx-font-weight: 900;");
                liveIndicator.setFill(Color.valueOf("#FF3B45"));
            },
            err -> {
                MainController.getInstance().hideLoading();
                AppUtil.showAlert(Alert.AlertType.ERROR, "Error", "Failed to publish score: " + err.getMessage());
            }
        );
    }

    @FXML
    public void endMatch() {
        if (currentMatchId == -1) return;
        
        timeline.pause();
        isTimerRunning = false;
        timerToggleBtn.setText("Start Timer");

        JSONObject scorePayload = new JSONObject();
        scorePayload.put("home_score", homeScore);
        scorePayload.put("away_score", awayScore);
        scorePayload.put("timer", "FT");

        JSONObject matchPayload = new JSONObject();
        matchPayload.put("status", "COMPLETED");

        MainController.getInstance().showLoading("Ending Match...");

        AppUtil.runAsync(() -> {
            ApiClient.putAsync("/matches/" + currentMatchId + "/score", scorePayload.toString()).join();
            ApiClient.putAsync("/matches/" + currentMatchId, matchPayload.toString()).join();
            return "OK";
        },
            res -> {
                MainController.getInstance().hideLoading();
                matchStatusLabel.setText("COMPLETED");
                matchStatusLabel.setStyle("-fx-text-fill: -fx-text-secondary; -fx-font-size: 16px; -fx-font-weight: 900;");
                liveIndicator.setFill(Color.valueOf("#91A4BC"));
                timerLabel.setText("FT");
                
                checkAndProcessBracketProgression();
            },
            err -> {
                MainController.getInstance().hideLoading();
                AppUtil.showAlert(Alert.AlertType.ERROR, "Error", "Failed to end match: " + err.getMessage());
            }
        );
    }
    
    private void checkAndProcessBracketProgression() {
        if (!currentRound.startsWith("Bracket: ")) return;
        
        int winnerTeamId = (homeScore > awayScore) ? homeTeamId : awayTeamId;
        if (winnerTeamId == -1) return;
        
        String nextRound = "";
        String nextPosition = "";
        
        if (currentRound.equals("Bracket: QF 1")) { nextRound = "Bracket: SF 1"; nextPosition = "home_team_id"; }
        else if (currentRound.equals("Bracket: QF 2")) { nextRound = "Bracket: SF 1"; nextPosition = "away_team_id"; }
        else if (currentRound.equals("Bracket: QF 3")) { nextRound = "Bracket: SF 2"; nextPosition = "home_team_id"; }
        else if (currentRound.equals("Bracket: QF 4")) { nextRound = "Bracket: SF 2"; nextPosition = "away_team_id"; }
        else if (currentRound.equals("Bracket: SF 1")) { nextRound = "Bracket: Final"; nextPosition = "home_team_id"; }
        else if (currentRound.equals("Bracket: SF 2")) { nextRound = "Bracket: Final"; nextPosition = "away_team_id"; }
        
        if (nextRound.isEmpty()) return;
        
        final String targetRound = nextRound;
        final String targetPos = nextPosition;
        
        AppUtil.runAsync(() -> ApiClient.getAsync("/matches?event_id=" + currentEventId).join(),
            res -> {
                try {
                    JSONObject json = new JSONObject(res);
                    if (json.getBoolean("success")) {
                        JSONArray data = json.getJSONArray("data");
                        for (int i = 0; i < data.length(); i++) {
                            JSONObject match = data.getJSONObject(i);
                            if (targetRound.equals(match.optString("round", ""))) {
                                int nextMatchId = match.getInt("id");
                                JSONObject updatePayload = new JSONObject();
                                updatePayload.put(targetPos, winnerTeamId);
                                
                                ApiClient.putAsync("/matches/" + nextMatchId, updatePayload.toString()).join();
                                break;
                            }
                        }
                    }
                } catch (Exception e) {}
            },
            err -> {}
        );
    }
    
    @FXML
    public void resetScore() {
        if (currentMatchId == -1) return;
        homeScore = 0;
        awayScore = 0;
        updateScoreDisplay();
        updateScore();
    }

    @FXML
    public void setMatchTimeout() {
        updateMatchState("TIMEOUT", "#F5A623");
    }

    @FXML
    public void setMatchUnderReview() {
        updateMatchState("UNDER REVIEW", "#F8E71C");
    }

    private void updateMatchState(String status, String color) {
        if (currentMatchId == -1) return;
        
        timeline.pause();
        isTimerRunning = false;
        timerToggleBtn.setText("Start Timer");

        JSONObject payload = new JSONObject();
        payload.put("home_score", homeScore);
        payload.put("away_score", awayScore);
        payload.put("timer", timerLabel.getText());
        payload.put("status", status);

        MainController.getInstance().showLoading("Updating State...");

        AppUtil.runAsync(() -> ApiClient.putAsync("/matches/" + currentMatchId, payload.toString()).join(),
            res -> {
                MainController.getInstance().hideLoading();
                matchStatusLabel.setText(status);
                matchStatusLabel.setStyle("-fx-text-fill: " + color + "; -fx-font-size: 16px; -fx-font-weight: 900;");
                liveIndicator.setFill(Color.valueOf(color));
            },
            err -> {
                MainController.getInstance().hideLoading();
                AppUtil.showAlert(Alert.AlertType.ERROR, "Error", "Failed to update match state: " + err.getMessage());
            }
        );
    }
}
