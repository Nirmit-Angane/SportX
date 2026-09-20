package com.sportx.controller;

import com.sportx.api.ApiClient;
import com.sportx.util.AppUtil;
import javafx.fxml.FXML;
import javafx.scene.control.Alert;
import javafx.scene.control.Label;
import javafx.scene.control.TextField;
import org.json.JSONObject;

public class LiveScoreController {

    @FXML private TextField matchIdField;
    @FXML private Label homeTeamName;
    @FXML private Label awayTeamName;
    @FXML private Label homeScoreLabel;
    @FXML private Label awayScoreLabel;
    @FXML private Label timerLabel;

    private int homeScore = 0;
    private int awayScore = 0;
    private int matchId = -1;

    @FXML
    public void loadMatch() {
        try {
            matchId = Integer.parseInt(matchIdField.getText().trim());
            // Fetch match details
            String response = ApiClient.get("/matches/" + matchId);
            JSONObject json = new JSONObject(response);
            if (json.getBoolean("success")) {
                JSONObject data = json.getJSONObject("data");
                homeTeamName.setText(data.optString("home_team_name", "HOME"));
                awayTeamName.setText(data.optString("away_team_name", "AWAY"));
                homeScore = data.optInt("home_score", 0);
                awayScore = data.optInt("away_score", 0);
                timerLabel.setText(data.optString("timer", "00:00"));
                updateScoreLabels();
            } else {
                AppUtil.showAlert(Alert.AlertType.ERROR, "Error", json.optString("message", "Failed to load"));
            }
        } catch (Exception e) {
            AppUtil.showAlert(Alert.AlertType.ERROR, "Connection Error", "Server offline or invalid Match ID.");
        }
    }

    @FXML public void homePlus() { homeScore++; updateScoreLabels(); }
    @FXML public void homeMinus() { if (homeScore > 0) homeScore--; updateScoreLabels(); }
    @FXML public void awayPlus() { awayScore++; updateScoreLabels(); }
    @FXML public void awayMinus() { if (awayScore > 0) awayScore--; updateScoreLabels(); }

    private void updateScoreLabels() {
        homeScoreLabel.setText(String.valueOf(homeScore));
        awayScoreLabel.setText(String.valueOf(awayScore));
    }

    @FXML
    public void updateScore() {
        if (matchId == -1) {
            AppUtil.showAlert(Alert.AlertType.WARNING, "Warning", "Load a match first.");
            return;
        }
        
        try {
            JSONObject body = new JSONObject();
            body.put("home_score", homeScore);
            body.put("away_score", awayScore);
            body.put("timer", timerLabel.getText());
            
            String response = ApiClient.put("/matches/" + matchId + "/score", body.toString());
            JSONObject json = new JSONObject(response);
            if (json.getBoolean("success")) {
                System.out.println("Score updated successfully in central DB.");
            } else {
                AppUtil.showAlert(Alert.AlertType.ERROR, "Server Error", json.optString("message"));
            }
        } catch (Exception e) {
            AppUtil.showAlert(Alert.AlertType.ERROR, "Connection Lost", "Unable to update score. Server connection lost.\nPlease verify server is running.");
        }
    }

    @FXML
    public void endMatch() {
        if (matchId == -1) return;
        try {
            ApiClient.post("/matches/" + matchId + "/end", "{}");
            AppUtil.showAlert(Alert.AlertType.INFORMATION, "Match Ended", "The match has been marked as COMPLETED.");
        } catch (Exception e) {
            AppUtil.showAlert(Alert.AlertType.ERROR, "Connection Error", "Failed to end match.");
        }
    }
}
