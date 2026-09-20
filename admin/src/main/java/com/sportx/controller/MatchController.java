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
    @FXML private ComboBox<EntityItem> eventInput;
    @FXML private ComboBox<EntityItem> venueInput;
    @FXML private ComboBox<EntityItem> homeTeamInput;
    @FXML private ComboBox<EntityItem> awayTeamInput;
    @FXML private ComboBox<String> statusInput;

    private Integer editingMatchId = null;

    private static class EntityItem {
        int id;
        String name;
        EntityItem(int id, String name) { this.id = id; this.name = name; }
        @Override public String toString() { return name; }
    }

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
        MainController.getInstance().showLoading("Loading Matches and Dependencies...");
        AppUtil.runAsync(() -> {
            String eventsJson = ApiClient.getAsync("/events").join();
            String venuesJson = ApiClient.getAsync("/venues").join();
            String teamsJson = ApiClient.getAsync("/teams").join();
            String matchesJson = ApiClient.getAsync("/matches").join();
            
            return new JSONObject()
                .put("events", new JSONObject(eventsJson))
                .put("venues", new JSONObject(venuesJson))
                .put("teams", new JSONObject(teamsJson))
                .put("matches", new JSONObject(matchesJson));
        }, 
        response -> {
            MainController.getInstance().hideLoading();
            processDropdownData(response);
            processMatchesData(response.getJSONObject("matches"));
        }, 
        error -> {
            MainController.getInstance().hideLoading();
            AppUtil.showAlert(Alert.AlertType.ERROR, "Network Error", "Failed to fetch match data.");
        });
    }

    private void processDropdownData(JSONObject response) {
        try {
            ObservableList<EntityItem> events = extractEntityItems(response.getJSONObject("events"), "name");
            ObservableList<EntityItem> venues = extractEntityItems(response.getJSONObject("venues"), "name");
            ObservableList<EntityItem> teams = extractEntityItems(response.getJSONObject("teams"), "name");

            eventInput.setItems(events);
            venueInput.setItems(venues);
            homeTeamInput.setItems(teams);
            awayTeamInput.setItems(teams);
        } catch (Exception e) {
            System.err.println("Failed to process dropdown data: " + e.getMessage());
        }
    }

    private ObservableList<EntityItem> extractEntityItems(JSONObject json, String nameKey) {
        ObservableList<EntityItem> items = FXCollections.observableArrayList();
        if (json.getBoolean("success")) {
            JSONArray data = json.getJSONArray("data");
            for (int i = 0; i < data.length(); i++) {
                JSONObject obj = data.getJSONObject(i);
                items.add(new EntityItem(obj.getInt("id"), obj.getString(nameKey)));
            }
        }
        return items;
    }

    private void processMatchesData(JSONObject json) {
        try {
            if (json.getBoolean("success")) {
                JSONArray data = json.getJSONArray("data");
                ObservableList<Match> list = FXCollections.observableArrayList();
                for (int i = 0; i < data.length(); i++) {
                    JSONObject obj = data.getJSONObject(i);
                    Match m = new Match(
                        obj.getInt("id"),
                        obj.getInt("event_id"),
                        obj.isNull("venue_id") ? null : obj.getInt("venue_id"),
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
    }

    @FXML
    public void showCreateForm() {
        editingMatchId = null;
        formTitle.setText("CREATE MATCH");
        eventInput.getSelectionModel().clearSelection();
        venueInput.getSelectionModel().clearSelection();
        homeTeamInput.getSelectionModel().clearSelection();
        awayTeamInput.getSelectionModel().clearSelection();
        statusInput.getSelectionModel().select("UPCOMING");
        formOverlay.setVisible(true);
    }

    private void showEditForm(Match match) {
        editingMatchId = match.getId();
        formTitle.setText("EDIT MATCH - #" + match.getId());
        
        selectEntity(eventInput, match.getEventId());
        selectEntity(venueInput, match.getVenueId());
        selectEntity(homeTeamInput, match.getHomeTeamId());
        selectEntity(awayTeamInput, match.getAwayTeamId());
        
        statusInput.getSelectionModel().select(match.getStatus());
        formOverlay.setVisible(true);
    }

    private void selectEntity(ComboBox<EntityItem> combo, Integer id) {
        if (id == null) {
            combo.getSelectionModel().clearSelection();
            return;
        }
        for (EntityItem item : combo.getItems()) {
            if (item.id == id) {
                combo.getSelectionModel().select(item);
                return;
            }
        }
    }

    @FXML
    public void hideForm() {
        formOverlay.setVisible(false);
    }

    @FXML
    public void saveMatch() {
        if (eventInput.getValue() == null || homeTeamInput.getValue() == null || awayTeamInput.getValue() == null) {
            AppUtil.showAlert(Alert.AlertType.WARNING, "Validation Error", "Event and Teams are required.");
            return;
        }
        
        int eventId = eventInput.getValue().id;
        Integer venueId = venueInput.getValue() != null ? venueInput.getValue().id : null;
        int homeTeam = homeTeamInput.getValue().id;
        int awayTeam = awayTeamInput.getValue().id;
        String status = statusInput.getValue();

        if (homeTeam == awayTeam) {
            AppUtil.showAlert(Alert.AlertType.WARNING, "Validation Error", "Home and Away teams must be different.");
            return;
        }

        JSONObject payload = new JSONObject();
        payload.put("event_id", eventId);
        if (venueId != null) payload.put("venue_id", venueId);
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
                    AppUtil.showAlert(Alert.AlertType.ERROR, "Error", "Failed to create match: " + err.getMessage());
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
                    AppUtil.showAlert(Alert.AlertType.ERROR, "Error", "Failed to update match: " + err.getMessage());
                });
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
