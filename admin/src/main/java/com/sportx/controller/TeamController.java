package com.sportx.controller;

import com.sportx.api.ApiClient;
import com.sportx.model.Team;
import com.sportx.util.AppUtil;
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

public class TeamController {

    @FXML private TableView<Team> teamsTable;
    @FXML private TableColumn<Team, Integer> idCol;
    @FXML private TableColumn<Team, String> nameCol;
    @FXML private TableColumn<Team, String> sportCol;
    @FXML private TableColumn<Team, Void> actionsCol;

    @FXML private TextField searchField;

    // Form
    @FXML private VBox formOverlay;
    @FXML private Label formTitle;
    @FXML private TextField nameInput;
    @FXML private TextField sportInput;

    private Integer editingTeamId = null;

    @FXML
    public void initialize() {
        idCol.setCellValueFactory(new PropertyValueFactory<>("id"));
        nameCol.setCellValueFactory(new PropertyValueFactory<>("name"));
        sportCol.setCellValueFactory(new PropertyValueFactory<>("sport"));

        setupActionsColumn();
        loadTeams();
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
                    Team t = getTableView().getItems().get(getIndex());
                    showEditForm(t);
                });

                deleteBtn.setOnAction(event -> {
                    Team t = getTableView().getItems().get(getIndex());
                    confirmAndDelete(t);
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
    public void loadTeams() {
        MainController.getInstance().showLoading("Loading Teams...");
        AppUtil.runAsync(() -> ApiClient.getAsync("/teams").join(), 
        response -> {
            MainController.getInstance().hideLoading();
            try {
                JSONObject json = new JSONObject(response);
                if (json.getBoolean("success")) {
                    JSONArray data = json.getJSONArray("data");
                    ObservableList<Team> list = FXCollections.observableArrayList();
                    for (int i = 0; i < data.length(); i++) {
                        JSONObject obj = data.getJSONObject(i);
                        list.add(new Team(
                            obj.getInt("id"),
                            obj.getString("name"),
                            obj.optString("sport", "Football")
                        ));
                    }
                    teamsTable.setItems(list);
                }
            } catch (Exception e) {
                AppUtil.showAlert(Alert.AlertType.ERROR, "Parse Error", "Failed to parse teams data.");
            }
        }, 
        error -> {
            MainController.getInstance().hideLoading();
            AppUtil.showAlert(Alert.AlertType.ERROR, "Network Error", "Failed to fetch teams.");
        });
    }

    @FXML
    public void showCreateForm() {
        editingTeamId = null;
        formTitle.setText("ADD TEAM");
        nameInput.clear();
        sportInput.clear();
        formOverlay.setVisible(true);
    }

    private void showEditForm(Team team) {
        editingTeamId = team.getId();
        formTitle.setText("EDIT TEAM - #" + team.getId());
        nameInput.setText(team.getName());
        sportInput.setText(team.getSport());
        formOverlay.setVisible(true);
    }

    @FXML
    public void hideForm() {
        formOverlay.setVisible(false);
    }

    @FXML
    public void saveTeam() {
        String name = nameInput.getText().trim();
        String sport = sportInput.getText().trim();
        
        if (name.isEmpty() || sport.isEmpty()) {
            AppUtil.showAlert(Alert.AlertType.WARNING, "Validation Error", "All fields are required.");
            return;
        }

        JSONObject payload = new JSONObject();
        payload.put("name", name);
        payload.put("sport", sport);

        MainController.getInstance().showLoading("Saving Team...");
        
        if (editingTeamId == null) {
            AppUtil.runAsync(() -> ApiClient.postAsync("/teams", payload.toString()).join(), 
                res -> {
                    MainController.getInstance().hideLoading();
                    hideForm();
                    loadTeams();
                }, 
                err -> {
                    MainController.getInstance().hideLoading();
                    AppUtil.showAlert(Alert.AlertType.ERROR, "Error", "Failed to create team.");
                });
        } else {
            AppUtil.runAsync(() -> ApiClient.putAsync("/teams/" + editingTeamId, payload.toString()).join(), 
                res -> {
                    MainController.getInstance().hideLoading();
                    hideForm();
                    loadTeams();
                }, 
                err -> {
                    MainController.getInstance().hideLoading();
                    AppUtil.showAlert(Alert.AlertType.ERROR, "Error", "Failed to update team.");
                });
        }
    }

    private void confirmAndDelete(Team team) {
        Alert alert = new Alert(Alert.AlertType.CONFIRMATION);
        alert.setTitle("Delete Team");
        alert.setHeaderText("Delete Team #" + team.getId() + "?");
        alert.setContentText("Are you sure you want to delete '" + team.getName() + "'?");

        Optional<ButtonType> result = alert.showAndWait();
        if (result.isPresent() && result.get() == ButtonType.OK) {
            MainController.getInstance().showLoading("Deleting Team...");
            AppUtil.runAsync(() -> ApiClient.deleteAsync("/teams/" + team.getId()).join(),
                res -> {
                    MainController.getInstance().hideLoading();
                    loadTeams();
                },
                err -> {
                    MainController.getInstance().hideLoading();
                    AppUtil.showAlert(Alert.AlertType.ERROR, "Error", "Failed to delete team.");
                });
        }
    }
}
