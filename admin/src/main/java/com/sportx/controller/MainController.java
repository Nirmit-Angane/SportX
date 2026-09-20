package com.sportx.controller;

import com.sportx.App;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.layout.StackPane;
import java.io.IOException;

public class MainController {

    @FXML private StackPane contentArea;

    @FXML
    public void initialize() {
        loadView("Dashboard");
    }

    @FXML public void showDashboard() { loadView("Dashboard"); }
    @FXML public void showEvents() { loadView("Events"); }
    @FXML public void showTeams() { loadView("Teams"); }
    @FXML public void showPlayers() { loadView("Players"); }
    @FXML public void showVenues() { loadView("Venues"); }
    @FXML public void showMatches() { loadView("Matches"); }
    @FXML public void showLiveScore() { loadView("LiveScore"); }
    @FXML public void showQRCodes() { loadView("QR"); }

    private void loadView(String fxml) {
        try {
            FXMLLoader fxmlLoader = new FXMLLoader(App.class.getResource("/fxml/" + fxml + ".fxml"));
            Parent view = fxmlLoader.load();
            contentArea.getChildren().clear();
            contentArea.getChildren().add(view);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
