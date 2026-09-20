package com.sportx.util;

import javafx.application.Platform;
import javafx.scene.control.Alert;
import java.util.concurrent.CompletableFuture;
import java.util.function.Consumer;
import java.util.function.Supplier;

public class AppUtil {
    
    public static void showAlert(Alert.AlertType type, String title, String content) {
        if (Platform.isFxApplicationThread()) {
            show(type, title, content);
        } else {
            Platform.runLater(() -> show(type, title, content));
        }
    }
    
    private static void show(Alert.AlertType type, String title, String content) {
        Alert alert = new Alert(type);
        alert.setTitle(title);
        alert.setHeaderText(null);
        alert.setContentText(content);
        // Apply custom stylesheet to alert if possible, or leave default for now
        // alert.getDialogPane().getStylesheets().add(AppUtil.class.getResource("/css/sportx.css").toExternalForm());
        alert.showAndWait();
    }

    /**
     * Executes a background task and then updates the UI.
     * @param backgroundTask The task to run in the background.
     * @param onSuccess Callback for when the task completes successfully, runs on the JavaFX Application Thread.
     * @param onError Callback for when an exception is thrown, runs on the JavaFX Application Thread.
     */
    public static <T> void runAsync(Supplier<T> backgroundTask, Consumer<T> onSuccess, Consumer<Throwable> onError) {
        CompletableFuture.supplyAsync(backgroundTask)
            .whenComplete((result, ex) -> {
                if (ex != null) {
                    if (onError != null) {
                        Platform.runLater(() -> onError.accept(ex));
                    } else {
                        Platform.runLater(() -> showAlert(Alert.AlertType.ERROR, "Error", ex.getMessage()));
                    }
                } else {
                    if (onSuccess != null) {
                        Platform.runLater(() -> onSuccess.accept(result));
                    }
                }
            });
    }
}
