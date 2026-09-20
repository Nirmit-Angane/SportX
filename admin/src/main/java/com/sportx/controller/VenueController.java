package com.sportx.controller;

import com.sportx.api.ApiClient;
import com.sportx.model.Venue;
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

public class VenueController {

    @FXML private TableView<Venue> venuesTable;
    @FXML private TableColumn<Venue, Integer> idCol;
    @FXML private TableColumn<Venue, String> nameCol;
    @FXML private TableColumn<Venue, String> cityCol;
    @FXML private TableColumn<Venue, String> capacityCol;
    @FXML private TableColumn<Venue, String> sportCol;
    @FXML private TableColumn<Venue, String> statusCol;
    @FXML private TableColumn<Venue, Void> actionsCol;

    @FXML private TextField searchField;

    // Form
    @FXML private VBox formOverlay;
    @FXML private Label formTitle;
    @FXML private TextField nameInput;
    @FXML private TextField cityInput;
    @FXML private TextField addressInput;
    @FXML private TextField capacityInput;
    @FXML private TextField sportInput;
    @FXML private ComboBox<String> statusInput;

    private Integer editingVenueId = null;

    @FXML
    public void initialize() {
        idCol.setCellValueFactory(new PropertyValueFactory<>("id"));
        nameCol.setCellValueFactory(new PropertyValueFactory<>("name"));
        cityCol.setCellValueFactory(new PropertyValueFactory<>("city"));
        capacityCol.setCellValueFactory(cellData -> {
            Integer cap = cellData.getValue().getCapacity();
            return new SimpleStringProperty(cap != null ? cap.toString() : "");
        });
        sportCol.setCellValueFactory(new PropertyValueFactory<>("sport"));
        statusCol.setCellValueFactory(new PropertyValueFactory<>("status"));

        setupActionsColumn();

        statusInput.setItems(FXCollections.observableArrayList("ACTIVE", "INACTIVE", "MAINTENANCE"));
        statusInput.getSelectionModel().selectFirst();

        loadVenues();
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
                    Venue v = getTableView().getItems().get(getIndex());
                    showEditForm(v);
                });

                deleteBtn.setOnAction(event -> {
                    Venue v = getTableView().getItems().get(getIndex());
                    confirmAndDelete(v);
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
    public void loadVenues() {
        MainController.getInstance().showLoading("Loading Venues...");
        AppUtil.runAsync(() -> ApiClient.getAsync("/venues").join(), 
        response -> {
            MainController.getInstance().hideLoading();
            try {
                JSONObject json = new JSONObject(response);
                if (json.getBoolean("success")) {
                    JSONArray data = json.getJSONArray("data");
                    ObservableList<Venue> list = FXCollections.observableArrayList();
                    for (int i = 0; i < data.length(); i++) {
                        JSONObject obj = data.getJSONObject(i);
                        list.add(new Venue(
                            obj.getInt("id"),
                            obj.getString("name"),
                            obj.optString("address", null),
                            obj.optString("city", null),
                            obj.isNull("capacity") ? null : obj.getInt("capacity"),
                            obj.optString("sport", null),
                            obj.optString("status", "ACTIVE")
                        ));
                    }
                    venuesTable.setItems(list);
                }
            } catch (Exception e) {
                AppUtil.showAlert(Alert.AlertType.ERROR, "Parse Error", "Failed to parse venues data.");
            }
        }, 
        error -> {
            MainController.getInstance().hideLoading();
            AppUtil.showAlert(Alert.AlertType.ERROR, "Network Error", "Failed to fetch venues.");
        });
    }

    @FXML
    public void showCreateForm() {
        editingVenueId = null;
        formTitle.setText("ADD VENUE");
        nameInput.clear();
        cityInput.clear();
        addressInput.clear();
        capacityInput.clear();
        sportInput.clear();
        statusInput.getSelectionModel().select("ACTIVE");
        formOverlay.setVisible(true);
    }

    private void showEditForm(Venue venue) {
        editingVenueId = venue.getId();
        formTitle.setText("EDIT VENUE - #" + venue.getId());
        nameInput.setText(venue.getName());
        cityInput.setText(venue.getCity());
        addressInput.setText(venue.getAddress());
        capacityInput.setText(venue.getCapacity() != null ? String.valueOf(venue.getCapacity()) : "");
        sportInput.setText(venue.getSport());
        statusInput.getSelectionModel().select(venue.getStatus());
        formOverlay.setVisible(true);
    }

    @FXML
    public void hideForm() {
        formOverlay.setVisible(false);
    }

    @FXML
    public void saveVenue() {
        String name = nameInput.getText().trim();
        if (name.isEmpty()) {
            AppUtil.showAlert(Alert.AlertType.WARNING, "Validation Error", "Venue name is required.");
            return;
        }

        JSONObject payload = new JSONObject();
        payload.put("name", name);
        payload.put("city", cityInput.getText().trim());
        payload.put("address", addressInput.getText().trim());
        
        try {
            if (!capacityInput.getText().trim().isEmpty()) {
                payload.put("capacity", Integer.parseInt(capacityInput.getText().trim()));
            }
        } catch (NumberFormatException e) {
            AppUtil.showAlert(Alert.AlertType.WARNING, "Validation Error", "Capacity must be an integer.");
            return;
        }

        payload.put("sport", sportInput.getText().trim());
        payload.put("status", statusInput.getValue());

        MainController.getInstance().showLoading("Saving Venue...");
        
        if (editingVenueId == null) {
            AppUtil.runAsync(() -> ApiClient.postAsync("/venues", payload.toString()).join(), 
                res -> {
                    MainController.getInstance().hideLoading();
                    hideForm();
                    loadVenues();
                }, 
                err -> {
                    MainController.getInstance().hideLoading();
                    AppUtil.showAlert(Alert.AlertType.ERROR, "Error", "Failed to create venue.");
                });
        } else {
            AppUtil.runAsync(() -> ApiClient.putAsync("/venues/" + editingVenueId, payload.toString()).join(), 
                res -> {
                    MainController.getInstance().hideLoading();
                    hideForm();
                    loadVenues();
                }, 
                err -> {
                    MainController.getInstance().hideLoading();
                    AppUtil.showAlert(Alert.AlertType.ERROR, "Error", "Failed to update venue.");
                });
        }
    }

    private void confirmAndDelete(Venue venue) {
        Alert alert = new Alert(Alert.AlertType.CONFIRMATION);
        alert.setTitle("Delete Venue");
        alert.setHeaderText("Delete Venue #" + venue.getId() + "?");
        alert.setContentText("Are you sure you want to delete '" + venue.getName() + "'?");

        Optional<ButtonType> result = alert.showAndWait();
        if (result.isPresent() && result.get() == ButtonType.OK) {
            MainController.getInstance().showLoading("Deleting Venue...");
            AppUtil.runAsync(() -> ApiClient.deleteAsync("/venues/" + venue.getId()).join(),
                res -> {
                    MainController.getInstance().hideLoading();
                    loadVenues();
                },
                err -> {
                    MainController.getInstance().hideLoading();
                    AppUtil.showAlert(Alert.AlertType.ERROR, "Error", "Failed to delete venue.");
                });
        }
    }
}
