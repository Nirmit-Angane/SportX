package com.sportx.controller;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.sportx.api.ApiClient;
import com.sportx.util.AppUtil;
import javafx.embed.swing.SwingFXUtils;
import javafx.fxml.FXML;
import javafx.scene.control.Alert;
import javafx.scene.control.Label;
import javafx.scene.control.TextField;
import javafx.scene.image.Image;
import javafx.scene.image.ImageView;
import javafx.stage.FileChooser;
import org.json.JSONObject;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;

public class QRController {

    @FXML private TextField eventIdField;
    @FXML private TextField matchIdField;
    @FXML private TextField venueIdField;
    @FXML private ImageView qrImageView;
    @FXML private Label qrUrlLabel;

    private BufferedImage currentQRImage;

    @FXML
    public void generateEventQR() {
        generateQR("/qr/event/" + eventIdField.getText().trim());
    }

    @FXML
    public void generateMatchQR() {
        generateQR("/qr/match/" + matchIdField.getText().trim());
    }

    @FXML
    public void generateVenueQR() {
        generateQR("/qr/venue/" + venueIdField.getText().trim());
    }

    private void generateQR(String endpoint) {
        try {
            // Request QR URL from server
            String response = ApiClient.post(endpoint, "{}");
            JSONObject json = new JSONObject(response);
            if (json.getBoolean("success")) {
                JSONObject data = json.getJSONObject("data");
                String url = data.getString("url");
                qrUrlLabel.setText(url);
                createQRCodeImage(url);
            } else {
                AppUtil.showAlert(Alert.AlertType.ERROR, "Error", json.optString("message"));
            }
        } catch (Exception e) {
            AppUtil.showAlert(Alert.AlertType.ERROR, "Error", "Failed to generate QR: " + e.getMessage());
        }
    }

    private void createQRCodeImage(String text) {
        try {
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(text, BarcodeFormat.QR_CODE, 300, 300);
            currentQRImage = MatrixToImageWriter.toBufferedImage(bitMatrix);
            Image image = SwingFXUtils.toFXImage(currentQRImage, null);
            qrImageView.setImage(image);
        } catch (Exception e) {
            AppUtil.showAlert(Alert.AlertType.ERROR, "Error", "Could not render QR code.");
        }
    }

    @FXML
    public void saveQR() {
        if (currentQRImage == null) {
            AppUtil.showAlert(Alert.AlertType.WARNING, "Warning", "Generate a QR code first.");
            return;
        }

        FileChooser fileChooser = new FileChooser();
        fileChooser.setTitle("Save QR Code");
        fileChooser.getExtensionFilters().add(new FileChooser.ExtensionFilter("PNG Files", "*.png"));
        File file = fileChooser.showSaveDialog(qrImageView.getScene().getWindow());

        if (file != null) {
            try {
                ImageIO.write(currentQRImage, "png", file);
                AppUtil.showAlert(Alert.AlertType.INFORMATION, "Success", "QR Code saved successfully.");
            } catch (Exception e) {
                AppUtil.showAlert(Alert.AlertType.ERROR, "Error", "Failed to save file.");
            }
        }
    }
}
