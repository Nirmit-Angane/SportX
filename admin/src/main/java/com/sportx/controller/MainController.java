package com.sportx.controller;

import com.sportx.App;
import javafx.application.Platform;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.layout.HBox;
import javafx.scene.layout.StackPane;
import javafx.scene.layout.VBox;
import javafx.stage.Stage;
import java.io.IOException;

public class MainController {

    private static MainController instance;

    @FXML private StackPane contentArea;
    @FXML private VBox loadingOverlay;
    @FXML private Label loadingLabel;
    @FXML private Label pageTitleLabel;
    
    @FXML private Button btnDashboard;
    @FXML private Button btnEvents;
    @FXML private Button btnTeams;
    @FXML private Button btnPlayers;
    @FXML private Button btnVenues;
    @FXML private Button btnMatches;
    @FXML private Button btnLiveScore;
    @FXML private Button btnQRCodes;
    
    @FXML private HBox topBar;
    @FXML private Button btnMinimizeWindow;
    @FXML private Button btnMaximizeWindow;
    @FXML private Button btnCloseWindow;

    private Button currentActiveButton;
    
    private double xOffset = 0;
    private double yOffset = 0;

    public MainController() {
        instance = this;
    }

    public static MainController getInstance() {
        return instance;
    }

    @FXML
    public void initialize() {
        showDashboard();
        setupWindowControls();
    }
    
    private void setupWindowControls() {
        if (topBar != null) {
            topBar.setOnMousePressed(event -> {
                Stage stage = (Stage) topBar.getScene().getWindow();
                if (!stage.isMaximized()) {
                    xOffset = event.getSceneX();
                    yOffset = event.getSceneY();
                }
            });
            topBar.setOnMouseDragged(event -> {
                Stage stage = (Stage) topBar.getScene().getWindow();
                if (!stage.isMaximized()) {
                    stage.setX(event.getScreenX() - xOffset);
                    stage.setY(event.getScreenY() - yOffset);
                }
            });
            topBar.setOnMouseClicked(event -> {
                if (event.getClickCount() == 2) {
                    maximizeWindow();
                }
            });
        }
    }

    @FXML
    private void minimizeWindow() {
        Stage stage = (Stage) contentArea.getScene().getWindow();
        stage.setIconified(true);
    }

    @FXML
    private void maximizeWindow() {
        Stage stage = (Stage) contentArea.getScene().getWindow();
        if (stage.isMaximized()) {
            stage.setMaximized(false);
            btnMaximizeWindow.setText("□");
        } else {
            stage.setMaximized(true);
            btnMaximizeWindow.setText("❐");
        }
    }

    @FXML
    private void closeWindow() {
        Platform.exit();
        System.exit(0);
    }

    @FXML public void showDashboard() { loadView("Dashboard", "Operations Overview", btnDashboard); }
    @FXML public void showEvents() { loadView("Events", "Event Management", btnEvents); }
    @FXML public void showTeams() { loadView("Teams", "Team Management", btnTeams); }
    @FXML public void showPlayers() { loadView("Players", "Player Management", btnPlayers); }
    @FXML public void showVenues() { loadView("Venues", "Venue Management", btnVenues); }
    @FXML public void showMatches() { loadView("Matches", "Match Management", btnMatches); }
    @FXML public void showLiveScore() { loadView("LiveScore", "Live Match Control", btnLiveScore); }
    @FXML public void showQRCodes() { loadView("QR", "QR Code Center", btnQRCodes); }

    private void loadView(String fxml, String title, Button sourceButton) {
        if (currentActiveButton != null) {
            currentActiveButton.getStyleClass().remove("active-btn");
        }
        sourceButton.getStyleClass().add("active-btn");
        currentActiveButton = sourceButton;
        pageTitleLabel.setText(title);

        try {
            FXMLLoader fxmlLoader = new FXMLLoader(App.class.getResource("/fxml/" + fxml + ".fxml"));
            Parent view = fxmlLoader.load();
            contentArea.getChildren().clear();
            contentArea.getChildren().add(view);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public void showLoading(String message) {
        Platform.runLater(() -> {
            loadingLabel.setText(message != null ? message : "Loading...");
            loadingOverlay.setVisible(true);
        });
    }

    public void hideLoading() {
        Platform.runLater(() -> {
            loadingOverlay.setVisible(false);
        });
    }
}
