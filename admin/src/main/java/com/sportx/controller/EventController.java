package com.sportx.controller;

import com.sportx.api.ApiClient;
import com.sportx.model.Event;
import com.sportx.util.AppUtil;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.fxml.FXML;
import javafx.scene.control.Alert;
import javafx.scene.control.TableColumn;
import javafx.scene.control.TableView;
import javafx.scene.control.cell.PropertyValueFactory;
import org.json.JSONArray;
import org.json.JSONObject;

public class EventController {

    @FXML private TableView<Event> eventsTable;
    @FXML private TableColumn<Event, Integer> idCol;
    @FXML private TableColumn<Event, String> nameCol;
    @FXML private TableColumn<Event, String> statusCol;

    @FXML
    public void initialize() {
        idCol.setCellValueFactory(new PropertyValueFactory<>("id"));
        nameCol.setCellValueFactory(new PropertyValueFactory<>("name"));
        statusCol.setCellValueFactory(new PropertyValueFactory<>("status"));
        loadEvents();
    }

    @FXML
    public void loadEvents() {
        try {
            String response = ApiClient.get("/events");
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
            AppUtil.showAlert(Alert.AlertType.ERROR, "Error", "Failed to load events: " + e.getMessage());
        }
    }
}
