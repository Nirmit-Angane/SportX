package com.sportx.controller;

import com.sportx.api.ApiClient;
import com.sportx.model.Match;
import com.sportx.util.AppUtil;
import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.fxml.FXML;
import javafx.scene.control.*;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.scene.layout.HBox;
import javafx.scene.layout.VBox;
import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Optional;

public class MatchController {

    @FXML private TableView<Match> matchesTable;
    @FXML private TableColumn<Match, Integer> idCol;
    @FXML private TableColumn<Match, Integer> eventCol;
    @FXML private TableColumn<Match, String> teamsCol;
    @FXML private TableColumn<Match, String> scoreCol;
    @FXML private TableColumn<Match, String> statusCol;
    @FXML private TableColumn<Match, Void> actionsCol;

    @FXML private TextField searchField;

    // Form
    @FXML private VBox formOverlay;
    @FXML private Label formTitle;
    @FXML private TextField eventIdInput;
    @FXML private TextField venueIdInput;
    @FXML private TextField homeTeamInput;
    @FXML private TextField awayTeamInput;
    @FXML private ComboBox<String> statusInput;

    private Integer editingMatchId = null;

    @FXML
    public void initialize() {
        idCol.setCellValueFactory(new PropertyValueFactory<>("id"));
        eventCol.setCellValueFactory(new PropertyValueFactory<>("eventId"));
        
        teamsCol.setCellValueFactory(cellData -> {
            Match m = cellData.getValue();
            String home = m.getHomeTeamName() != null ? m.getHomeTeamName() : "Team " + m.getHomeTeamId();
            String away = m.getAwayTeamName() != null ? m.getAwayTeamName() : "Team " + m.getAwayTeamId();
            return new SimpleStringProperty(home + " vs " + away);
        });

        scoreCol.setCellValueFactory(cellData -> {
            Match m = cellData.getValue();
            return new SimpleStringProperty(m.getHomeScore() + " - " + m.getAwayScore());
        });

        statusCol.setCellValueFactory(new PropertyValueFactory<>("status"));

        setupActionsColumn();

        statusInput.setItems(FXCollections.observableArrayList("UPCOMING", "LIVE", "COMPLETED"));
        statusInput.getSelectionModel().selectFirst();

        loadMatches();
    }

    private void setupActionsColumn() {
        actionsCol.setCellFactory(param -> new TableCell<>() {
            private final Button editBtn = new Button("Edit");
            private final Button deleteBtn = new Button("Delete");
            private final HBox pane = new HBox(10, editBtn, deleteBtn);

            {
                editBtn.getStyleClass().addAll("button");
                deleteBtn.getStyleClass().addAll("button", "btn-danger");

                editBtn.setOnAction(event -> {
                    Match m = getTableView().getItems().get(getIndex());
                    showEditForm(m);
                });

                deleteBtn.setOnAction(event -> {
                    Match m = getTableView().getItems().get(getIndex());
                    confirmAndDelete(m);
                });
            }

            @Override
            protected void updateItem(Void item, boolean empty) {
                super.updateItem(item, empty);
                setGraphic(empty ? null : pane);
            }
        });
    }

    @FXML
    public void loadMatches() {
        MainController.getInstance().showLoading("Loading Matches...");
        AppUtil.runAsync(() -> ApiClient.getAsync("/matches").join(), 
        response -> {
            MainController.getInstance().hideLoading();
            try {
                JSONObject json = new JSONObject(response);
                if (json.getBoolean("success")) {
                    JSONArray data = json.getJSONArray("data");
                    ObservableList<Match> list = FXCollections.observableArrayList();
                    for (int i = 0; i < data.length(); i++) {
                        JSONObject obj = data.getJSONObject(i);
                        Match m = new Match(
                            obj.getInt("id"),
                            obj.getInt("event_id"),
                            obj.optInt("venue_id", 0),
                            obj.getInt("home_team_id"),
                            obj.getInt("away_team_id"),
                            obj.optString("status", "UPCOMING")
                        );
                        m.setHomeTeamName(obj.optString("home_team_name", null));
                        m.setAwayTeamName(obj.optString("away_team_name", null));
                        m.setHomeScore(obj.optInt("home_score", 0));
                        m.setAwayScore(obj.optInt("away_score", 0));
                        list.add(m);
                    }
                    matchesTable.setItems(list);
                }
            } catch (Exception e) {
                AppUtil.showAlert(Alert.AlertType.ERROR, "Parse Error", "Failed to parse matches data.");
            }
        }, 
        error -> {
            MainController.getInstance().hideLoading();
            AppUtil.showAlert(Alert.AlertType.ERROR, "Network Error", "Failed to fetch matches.");
        });
    }

    @FXML
    public void showCreateForm() {
        editingMatchId = null;
        formTitle.setText("CREATE MATCH");
        eventIdInput.clear();
        venueIdInput.clear();
        homeTeamInput.clear();
        awayTeamInput.clear();
        statusInput.getSelectionModel().select("UPCOMING");
        formOverlay.setVisible(true);
    }

    private void showEditForm(Match match) {
        editingMatchId = match.getId();
        formTitle.setText("EDIT MATCH - #" + match.getId());
        eventIdInput.setText(String.valueOf(match.getEventId()));
        venueIdInput.setText(String.valueOf(match.getVenueId()));
        homeTeamInput.setText(String.valueOf(match.getHomeTeamId()));
        awayTeamInput.setText(String.valueOf(match.getAwayTeamId()));
        statusInput.getSelectionModel().select(match.getStatus());
        formOverlay.setVisible(true);
    }

    @FXML
    public void hideForm() {
        formOverlay.setVisible(false);
    }

    @FXML
    public void saveMatch() {
        try {
            int eventId = Integer.parseInt(eventIdInput.getText().trim());
            int venueId = Integer.parseInt(venueIdInput.getText().trim());
            int homeTeam = Integer.parseInt(homeTeamInput.getText().trim());
            int awayTeam = Integer.parseInt(awayTeamInput.getText().trim());
            String status = statusInput.getValue();

            JSONObject payload = new JSONObject();
            payload.put("event_id", eventId);
            payload.put("venue_id", venueId);
            payload.put("home_team_id", homeTeam);
            payload.put("away_team_id", awayTeam);
            payload.put("status", status);

            MainController.getInstance().showLoading("Saving Match...");
            
            if (editingMatchId == null) {
                AppUtil.runAsync(() -> ApiClient.postAsync("/matches", payload.toString()).join(), 
                    res -> {
                        MainController.getInstance().hideLoading();
                        hideForm();
                        loadMatches();
                    }, 
                    err -> {
                        MainController.getInstance().hideLoading();
                        AppUtil.showAlert(Alert.AlertType.ERROR, "Error", "Failed to create match.");
                    });
            } else {
                AppUtil.runAsync(() -> ApiClient.putAsync("/matches/" + editingMatchId, payload.toString()).join(), 
                    res -> {
                        MainController.getInstance().hideLoading();
                        hideForm();
                        loadMatches();
                    }, 
                    err -> {
                        MainController.getInstance().hideLoading();
                        AppUtil.showAlert(Alert.AlertType.ERROR, "Error", "Failed to update match.");
                    });
            }
        } catch (NumberFormatException e) {
            AppUtil.showAlert(Alert.AlertType.WARNING, "Validation Error", "IDs must be numeric.");
        }
    }

    private void confirmAndDelete(Match match) {
        Alert alert = new Alert(Alert.AlertType.CONFIRMATION);
        alert.setTitle("Delete Match");
        alert.setHeaderText("Delete Match #" + match.getId() + "?");
        alert.setContentText("Are you sure you want to delete this match?");

        Optional<ButtonType> result = alert.showAndWait();
        if (result.isPresent() && result.get() == ButtonType.OK) {
            MainController.getInstance().showLoading("Deleting Match...");
            AppUtil.runAsync(() -> ApiClient.deleteAsync("/matches/" + match.getId()).join(),
                res -> {
                    MainController.getInstance().hideLoading();
                    loadMatches();
                },
                err -> {
                    MainController.getInstance().hideLoading();
                    AppUtil.showAlert(Alert.AlertType.ERROR, "Error", "Failed to delete match.");
                });
        }
    }
}
