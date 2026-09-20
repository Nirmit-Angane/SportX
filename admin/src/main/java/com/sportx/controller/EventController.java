package com.sportx.controller;

import com.sportx.api.ApiClient;
import com.sportx.model.Event;
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

public class EventController {

    @FXML private TableView<Event> eventsTable;
    @FXML private TableColumn<Event, Integer> idCol;
    @FXML private TableColumn<Event, String> nameCol;
    @FXML private TableColumn<Event, String> statusCol;
    @FXML private TableColumn<Event, Void> actionsCol;

    @FXML private TextField searchField;

    // Form
    @FXML private VBox formOverlay;
    @FXML private Label formTitle;
    @FXML private TextField nameInput;
    @FXML private ComboBox<String> statusInput;

    private Integer editingEventId = null;

    @FXML
    public void initialize() {
        idCol.setCellValueFactory(new PropertyValueFactory<>("id"));
        nameCol.setCellValueFactory(new PropertyValueFactory<>("name"));
        statusCol.setCellValueFactory(new PropertyValueFactory<>("status"));

        setupActionsColumn();

        statusInput.setItems(FXCollections.observableArrayList("UPCOMING", "ACTIVE", "COMPLETED"));
        statusInput.getSelectionModel().selectFirst();

        loadEvents();
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
                    Event e = getTableView().getItems().get(getIndex());
                    showEditForm(e);
                });

                deleteBtn.setOnAction(event -> {
                    Event e = getTableView().getItems().get(getIndex());
                    confirmAndDelete(e);
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
    public void loadEvents() {
        MainController.getInstance().showLoading("Loading Events...");
        AppUtil.runAsync(() -> ApiClient.getAsync("/events").join(), 
        response -> {
            MainController.getInstance().hideLoading();
            try {
                JSONObject json = new JSONObject(response);
                if (json.getBoolean("success")) {
                    JSONArray data = json.getJSONArray("data");
                    ObservableList<Event> list = FXCollections.observableArrayList();
                    for (int i = 0; i < data.length(); i++) {
                        JSONObject obj = data.getJSONObject(i);
                        list.add(new Event(
                            obj.getInt("id"),
                            obj.getString("name"),
                            obj.optString("status", "UPCOMING")
                        ));
                    }
                    eventsTable.setItems(list);
                }
            } catch (Exception e) {
                AppUtil.showAlert(Alert.AlertType.ERROR, "Parse Error", "Failed to parse events data.");
            }
        }, 
        error -> {
            MainController.getInstance().hideLoading();
            AppUtil.showAlert(Alert.AlertType.ERROR, "Network Error", "Failed to fetch events: " + error.getMessage());
        });
    }

    @FXML
    public void showCreateForm() {
        editingEventId = null;
        formTitle.setText("CREATE EVENT");
        nameInput.clear();
        statusInput.getSelectionModel().select("UPCOMING");
        formOverlay.setVisible(true);
    }

    private void showEditForm(Event event) {
        editingEventId = event.getId();
        formTitle.setText("EDIT EVENT - #" + event.getId());
        nameInput.setText(event.getName());
        statusInput.getSelectionModel().select(event.getStatus());
        formOverlay.setVisible(true);
    }

    @FXML
    public void hideForm() {
        formOverlay.setVisible(false);
    }

    @FXML
    public void saveEvent() {
        String name = nameInput.getText().trim();
        if (name.isEmpty()) {
            AppUtil.showAlert(Alert.AlertType.WARNING, "Validation Error", "Event name is required.");
            return;
        }

        JSONObject payload = new JSONObject();
        payload.put("name", name);
        payload.put("status", statusInput.getValue());

        MainController.getInstance().showLoading("Saving Event...");
        
        if (editingEventId == null) {
            AppUtil.runAsync(() -> ApiClient.postAsync("/events", payload.toString()).join(), 
                res -> {
                    MainController.getInstance().hideLoading();
                    hideForm();
                    loadEvents();
                }, 
                err -> {
                    MainController.getInstance().hideLoading();
                    AppUtil.showAlert(Alert.AlertType.ERROR, "Error", "Failed to create event.");
                });
        } else {
            AppUtil.runAsync(() -> ApiClient.putAsync("/events/" + editingEventId, payload.toString()).join(), 
                res -> {
                    MainController.getInstance().hideLoading();
                    hideForm();
                    loadEvents();
                }, 
                err -> {
                    MainController.getInstance().hideLoading();
                    AppUtil.showAlert(Alert.AlertType.ERROR, "Error", "Failed to update event.");
                });
        }
    }

    private void confirmAndDelete(Event event) {
        Alert alert = new Alert(Alert.AlertType.CONFIRMATION);
        alert.setTitle("Delete Event");
        alert.setHeaderText("Delete Event #" + event.getId() + "?");
        alert.setContentText("Are you sure you want to delete '" + event.getName() + "'? This cannot be undone.");

        Optional<ButtonType> result = alert.showAndWait();
        if (result.isPresent() && result.get() == ButtonType.OK) {
            MainController.getInstance().showLoading("Deleting Event...");
            AppUtil.runAsync(() -> ApiClient.deleteAsync("/events/" + event.getId()).join(),
                res -> {
                    MainController.getInstance().hideLoading();
                    loadEvents();
                },
                err -> {
                    MainController.getInstance().hideLoading();
                    AppUtil.showAlert(Alert.AlertType.ERROR, "Error", "Failed to delete event.");
                });
        }
    }
}
