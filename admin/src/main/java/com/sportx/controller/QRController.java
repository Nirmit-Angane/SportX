package com.sportx.controller;

import com.sportx.api.ApiClient;
import com.sportx.util.AppUtil;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.fxml.FXML;
import javafx.scene.control.Alert;
import javafx.scene.control.Button;
import javafx.scene.control.ComboBox;
import javafx.scene.control.Label;
import javafx.scene.image.Image;
import javafx.scene.image.ImageView;
import org.json.JSONArray;
import org.json.JSONObject;
import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.net.URL;

public class QRController {

    @FXML private ComboBox<String> typeSelector;
    @FXML private ComboBox<EntityItem> entitySelector;
    @FXML private ImageView qrImageView;
    @FXML private Label qrLabel;
    @FXML private Button downloadBtn;

    private Image currentQrImage = null;

    private static class EntityItem {
        int id;
        String name;
        EntityItem(int id, String name) { this.id = id; this.name = name; }
        @Override public String toString() { return name + " (ID: " + id + ")"; }
    }

    @FXML
    public void initialize() {
        typeSelector.setItems(FXCollections.observableArrayList("Event", "Match"));
        typeSelector.getSelectionModel().selectFirst();
        onTypeSelected();
    }

    @FXML
    public void onTypeSelected() {
        String type = typeSelector.getValue();
        if (type == null) return;
        
        entitySelector.getItems().clear();
        entitySelector.setDisable(true);

        MainController.getInstance().showLoading("Loading " + type + "s...");
        
        String endpoint = "Event".equals(type) ? "/events" : "/matches";
        
        AppUtil.runAsync(() -> ApiClient.getAsync(endpoint).join(),
            res -> {
                MainController.getInstance().hideLoading();
                try {
                    JSONObject json = new JSONObject(res);
                    if (json.getBoolean("success")) {
                        JSONArray data = json.getJSONArray("data");
                        ObservableList<EntityItem> items = FXCollections.observableArrayList();
                        for (int i = 0; i < data.length(); i++) {
                            JSONObject obj = data.getJSONObject(i);
                            int id = obj.getInt("id");
                            String name;
                            if ("Event".equals(type)) {
                                name = obj.getString("name");
                            } else {
                                String home = obj.optString("home_team_name", "Team " + obj.getInt("home_team_id"));
                                String away = obj.optString("away_team_name", "Team " + obj.getInt("away_team_id"));
                                name = home + " vs " + away;
                            }
                            items.add(new EntityItem(id, name));
                        }
                        entitySelector.setItems(items);
                        entitySelector.setDisable(false);
                    }
                } catch (Exception e) {
                    AppUtil.showAlert(Alert.AlertType.ERROR, "Parse Error", "Failed to parse data.");
                }
            },
            err -> {
                MainController.getInstance().hideLoading();
                AppUtil.showAlert(Alert.AlertType.ERROR, "Network Error", "Failed to load options.");
            }
        );
    }

    @FXML
    public void generateQR() {
        EntityItem item = entitySelector.getValue();
        if (item == null) {
            AppUtil.showAlert(Alert.AlertType.WARNING, "Validation", "Please select a target.");
            return;
        }

        String type = typeSelector.getValue();
        
        String baseUrl = System.getenv("SPORTX_FRONTEND_URL");
        if (baseUrl == null || baseUrl.isEmpty()) {
            try {
                io.github.cdimascio.dotenv.Dotenv dotenv = io.github.cdimascio.dotenv.Dotenv.configure().ignoreIfMissing().load();
                baseUrl = dotenv.get("SPORTX_FRONTEND_URL");
            } catch (Exception e) {}
        }
        if (baseUrl == null || baseUrl.isEmpty()) {
            baseUrl = "https://sportxz.netlify.app"; 
        }

        String urlPath = "Match".equals(type) ? "/pages/match.html?id=" : "/pages/events.html?id=";
        String dataUrl = baseUrl + urlPath + item.id;
        
        String qrApiUrl = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" + java.net.URLEncoder.encode(dataUrl, java.nio.charset.StandardCharsets.UTF_8);

        MainController.getInstance().showLoading("Generating QR Code...");

        AppUtil.runAsync(() -> new Image(qrApiUrl, true),
            img -> {
                MainController.getInstance().hideLoading();
                if (!img.isError()) {
                    qrImageView.setImage(img);
                    currentQrImage = img;
                    qrLabel.setText(type.toUpperCase() + " #" + item.id + "\n" + item.name);
                    downloadBtn.setDisable(false);
                } else {
                    AppUtil.showAlert(Alert.AlertType.ERROR, "Error", "Failed to load QR image.");
                }
            },
            err -> {
                MainController.getInstance().hideLoading();
                AppUtil.showAlert(Alert.AlertType.ERROR, "Error", "Failed to generate QR: " + err.getMessage());
            }
        );
    }

    @FXML
    public void downloadQR() {
        if (currentQrImage == null) return;
        
        try {
            // Because JavaFX Image doesn't have a built-in "save to file" that supports all formats perfectly 
            // without AWT, and since we are downloading a remote image, we can just save it using ImageIO.
            // But we already loaded it, we'll try a fast approach:
            EntityItem item = entitySelector.getValue();
            String type = typeSelector.getValue();
            String filename = "SPORTX_" + type.toUpperCase() + "_" + item.id + "_QR.png";
            
            File file = new File(System.getProperty("user.home"), filename);
            
            String baseUrl = System.getenv("SPORTX_FRONTEND_URL");
            if (baseUrl == null || baseUrl.isEmpty()) {
                try {
                    io.github.cdimascio.dotenv.Dotenv dotenv = io.github.cdimascio.dotenv.Dotenv.configure().ignoreIfMissing().load();
                    baseUrl = dotenv.get("SPORTX_FRONTEND_URL");
                } catch (Exception e) {}
            }
            if (baseUrl == null || baseUrl.isEmpty()) {
                baseUrl = "https://sportxz.netlify.app"; 
            }
            
            String urlPath = "Match".equals(type) ? "/pages/match.html?id=" : "/pages/events.html?id=";
            String dataUrl = baseUrl + urlPath + item.id;
            
            String qrApiUrl = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" + java.net.URLEncoder.encode(dataUrl, java.nio.charset.StandardCharsets.UTF_8);
            
            MainController.getInstance().showLoading("Saving QR Code...");
            
            AppUtil.runAsync(() -> {
                try {
                    BufferedImage bi = ImageIO.read(new URL(qrApiUrl));
                    ImageIO.write(bi, "png", file);
                    return file.getAbsolutePath();
                } catch (Exception e) {
                    throw new RuntimeException(e);
                }
            }, 
            path -> {
                MainController.getInstance().hideLoading();
                AppUtil.showAlert(Alert.AlertType.INFORMATION, "Success", "QR Code saved to:\n" + path);
            },
            err -> {
                MainController.getInstance().hideLoading();
                AppUtil.showAlert(Alert.AlertType.ERROR, "Save Error", "Failed to save file: " + err.getMessage());
            });
            
        } catch (Exception e) {
            AppUtil.showAlert(Alert.AlertType.ERROR, "Error", "Could not initiate download.");
        }
    }
}
