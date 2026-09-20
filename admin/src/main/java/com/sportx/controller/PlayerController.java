package com.sportx.controller;

import com.sportx.api.ApiClient;
import com.sportx.model.Player;
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

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

public class PlayerController {

    @FXML private TableView<Player> playersTable;
    @FXML private TableColumn<Player, Integer> idCol;
    @FXML private TableColumn<Player, String> nameCol;
    @FXML private TableColumn<Player, String> jerseyCol;
    @FXML private TableColumn<Player, String> teamCol;
    @FXML private TableColumn<Player, String> positionCol;
    @FXML private TableColumn<Player, String> statusCol;
    @FXML private TableColumn<Player, Void> actionsCol;

    @FXML private TextField searchField;

    // Form
    @FXML private VBox formOverlay;
    @FXML private Label formTitle;
    @FXML private TextField nameInput;
    @FXML private TextField jerseyInput;
    @FXML private ComboBox<TeamItem> teamInput;
    @FXML private TextField positionInput;
    @FXML private TextField dobInput;
    @FXML private ComboBox<String> statusInput;

    private Integer editingPlayerId = null;
    private final Map<Integer, String> teamNameMap = new HashMap<>();

    private static class TeamItem {
        int id;
        String name;
        TeamItem(int id, String name) { this.id = id; this.name = name; }
        @Override public String toString() { return name; }
    }

    @FXML
    public void initialize() {
        idCol.setCellValueFactory(new PropertyValueFactory<>("id"));
        nameCol.setCellValueFactory(new PropertyValueFactory<>("fullName"));
        jerseyCol.setCellValueFactory(cellData -> {
            Integer jersey = cellData.getValue().getJerseyNumber();
            return new SimpleStringProperty(jersey != null ? jersey.toString() : "");
        });
        teamCol.setCellValueFactory(cellData -> {
            String tName = cellData.getValue().getTeamName();
            if (tName == null && cellData.getValue().getTeamId() != null) {
                tName = teamNameMap.getOrDefault(cellData.getValue().getTeamId(), "Team " + cellData.getValue().getTeamId());
            }
            return new SimpleStringProperty(tName != null ? tName : "");
        });
        positionCol.setCellValueFactory(new PropertyValueFactory<>("position"));
        statusCol.setCellValueFactory(new PropertyValueFactory<>("status"));

        setupActionsColumn();

        statusInput.setItems(FXCollections.observableArrayList("ACTIVE", "INACTIVE", "INJURED"));
        statusInput.getSelectionModel().selectFirst();

        loadTeamsAndPlayers();
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
                    Player p = getTableView().getItems().get(getIndex());
                    showEditForm(p);
                });

                deleteBtn.setOnAction(event -> {
                    Player p = getTableView().getItems().get(getIndex());
                    confirmAndDelete(p);
                });
            }

            @Override
            protected void updateItem(Void item, boolean empty) {
                super.updateItem(item, empty);
                setGraphic(empty ? null : pane);
            }
        });
    }

    private void loadTeamsAndPlayers() {
        MainController.getInstance().showLoading("Loading Players...");
        AppUtil.runAsync(() -> {
            String teamsJson = ApiClient.getAsync("/teams").join();
            String playersJson = ApiClient.getAsync("/players").join();
            return new JSONObject().put("teams", new JSONObject(teamsJson)).put("players", new JSONObject(playersJson));
        }, result -> {
            MainController.getInstance().hideLoading();
            processTeamsData(result.getJSONObject("teams"));
            processPlayersData(result.getJSONObject("players"));
        }, err -> {
            MainController.getInstance().hideLoading();
            AppUtil.showAlert(Alert.AlertType.ERROR, "Network Error", "Failed to load players and teams.");
        });
    }

    @FXML
    public void loadPlayers() {
        loadTeamsAndPlayers();
    }

    private void processTeamsData(JSONObject json) {
        if (json.getBoolean("success")) {
            JSONArray data = json.getJSONArray("data");
            ObservableList<TeamItem> items = FXCollections.observableArrayList();
            teamNameMap.clear();
            for (int i = 0; i < data.length(); i++) {
                JSONObject obj = data.getJSONObject(i);
                int id = obj.getInt("id");
                String name = obj.getString("name");
                teamNameMap.put(id, name);
                items.add(new TeamItem(id, name));
            }
            teamInput.setItems(items);
        }
    }

    private void processPlayersData(JSONObject json) {
        if (json.getBoolean("success")) {
            JSONArray data = json.getJSONArray("data");
            ObservableList<Player> list = FXCollections.observableArrayList();
            for (int i = 0; i < data.length(); i++) {
                JSONObject obj = data.getJSONObject(i);
                Player p = new Player(
                    obj.getInt("id"),
                    obj.getString("full_name"),
                    obj.isNull("jersey_number") ? null : obj.getInt("jersey_number"),
                    obj.isNull("team_id") ? null : obj.getInt("team_id"),
                    obj.optString("position", null),
                    obj.optString("date_of_birth", null),
                    obj.optString("photo", null),
                    obj.optString("status", "ACTIVE")
                );
                p.setTeamName(teamNameMap.get(p.getTeamId()));
                list.add(p);
            }
            playersTable.setItems(list);
        }
    }

    @FXML
    public void showCreateForm() {
        editingPlayerId = null;
        formTitle.setText("ADD PLAYER");
        nameInput.clear();
        jerseyInput.clear();
        teamInput.getSelectionModel().clearSelection();
        positionInput.clear();
        dobInput.clear();
        statusInput.getSelectionModel().select("ACTIVE");
        formOverlay.setVisible(true);
    }

    private void showEditForm(Player player) {
        editingPlayerId = player.getId();
        formTitle.setText("EDIT PLAYER - #" + player.getId());
        nameInput.setText(player.getFullName());
        jerseyInput.setText(player.getJerseyNumber() != null ? String.valueOf(player.getJerseyNumber()) : "");
        
        TeamItem selectedTeam = null;
        for (TeamItem ti : teamInput.getItems()) {
            if (player.getTeamId() != null && ti.id == player.getTeamId()) {
                selectedTeam = ti;
                break;
            }
        }
        teamInput.getSelectionModel().select(selectedTeam);
        positionInput.setText(player.getPosition());
        dobInput.setText(player.getDateOfBirth());
        statusInput.getSelectionModel().select(player.getStatus());
        formOverlay.setVisible(true);
    }

    @FXML
    public void hideForm() {
        formOverlay.setVisible(false);
    }

    @FXML
    public void savePlayer() {
        String name = nameInput.getText().trim();
        if (name.isEmpty()) {
            AppUtil.showAlert(Alert.AlertType.WARNING, "Validation Error", "Player name is required.");
            return;
        }

        JSONObject payload = new JSONObject();
        payload.put("full_name", name);
        
        try {
            if (!jerseyInput.getText().trim().isEmpty()) {
                payload.put("jersey_number", Integer.parseInt(jerseyInput.getText().trim()));
            }
        } catch (NumberFormatException e) {
            AppUtil.showAlert(Alert.AlertType.WARNING, "Validation Error", "Jersey number must be an integer.");
            return;
        }

        TeamItem team = teamInput.getValue();
        if (team != null) {
            payload.put("team_id", team.id);
        }

        payload.put("position", positionInput.getText().trim());
        payload.put("date_of_birth", dobInput.getText().trim());
        payload.put("status", statusInput.getValue());

        MainController.getInstance().showLoading("Saving Player...");
        
        if (editingPlayerId == null) {
            AppUtil.runAsync(() -> ApiClient.postAsync("/players", payload.toString()).join(), 
                res -> {
                    MainController.getInstance().hideLoading();
                    hideForm();
                    loadPlayers();
                }, 
                err -> {
                    MainController.getInstance().hideLoading();
                    AppUtil.showAlert(Alert.AlertType.ERROR, "Error", "Failed to create player.");
                });
        } else {
            AppUtil.runAsync(() -> ApiClient.putAsync("/players/" + editingPlayerId, payload.toString()).join(), 
                res -> {
                    MainController.getInstance().hideLoading();
                    hideForm();
                    loadPlayers();
                }, 
                err -> {
                    MainController.getInstance().hideLoading();
                    AppUtil.showAlert(Alert.AlertType.ERROR, "Error", "Failed to update player.");
                });
        }
    }

    private void confirmAndDelete(Player player) {
        Alert alert = new Alert(Alert.AlertType.CONFIRMATION);
        alert.setTitle("Delete Player");
        alert.setHeaderText("Delete Player #" + player.getId() + "?");
        alert.setContentText("Are you sure you want to delete '" + player.getFullName() + "'?");

        Optional<ButtonType> result = alert.showAndWait();
        if (result.isPresent() && result.get() == ButtonType.OK) {
            MainController.getInstance().showLoading("Deleting Player...");
            AppUtil.runAsync(() -> ApiClient.deleteAsync("/players/" + player.getId()).join(),
                res -> {
                    MainController.getInstance().hideLoading();
                    loadPlayers();
                },
                err -> {
                    MainController.getInstance().hideLoading();
                    AppUtil.showAlert(Alert.AlertType.ERROR, "Error", "Failed to delete player.");
                });
        }
    }
}
