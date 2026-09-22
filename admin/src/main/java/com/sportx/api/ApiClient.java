package com.sportx.api;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.concurrent.CompletableFuture;
import io.github.cdimascio.dotenv.Dotenv;

public class ApiClient {
    private static final String BASE_URL = loadBaseUrl();
    
    private static String loadBaseUrl() {
        String url = System.getenv("SPORTX_API_URL");
        if (url != null && !url.isEmpty()) return url;
        
        try {
            Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
            url = dotenv.get("SPORTX_API_URL");
            if (url != null && !url.isEmpty()) return url;
        } catch (Exception e) {
            // Ignore if .env can't be parsed
        }
        
        return "https://sportx-api-izap.onrender.com/api";
    }
    
    private static final HttpClient client = HttpClient.newBuilder()
            .version(HttpClient.Version.HTTP_2)
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    public static CompletableFuture<String> getAsync(String endpoint) {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + endpoint))
                .GET()
                .build();
        return sendRequestAsync(request);
    }

    public static CompletableFuture<String> postAsync(String endpoint, String jsonBody) {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + endpoint))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody != null ? jsonBody : "{}"))
                .build();
        return sendRequestAsync(request);
    }

    public static CompletableFuture<String> putAsync(String endpoint, String jsonBody) {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + endpoint))
                .header("Content-Type", "application/json")
                .PUT(HttpRequest.BodyPublishers.ofString(jsonBody != null ? jsonBody : "{}"))
                .build();
        return sendRequestAsync(request);
    }

    public static CompletableFuture<String> deleteAsync(String endpoint) {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + endpoint))
                .DELETE()
                .build();
        return sendRequestAsync(request);
    }

    private static CompletableFuture<String> sendRequestAsync(HttpRequest request) {
        return client.sendAsync(request, HttpResponse.BodyHandlers.ofString())
                .thenCompose(response -> {
                    if (response.statusCode() >= 200 && response.statusCode() < 300) {
                        return CompletableFuture.completedFuture(response.body());
                    } else {
                        return CompletableFuture.failedFuture(new RuntimeException("API Request failed with status " + response.statusCode() + ": " + response.body()));
                    }
                });
    }
    
    // Kept for backward compatibility while migrating, will be removed later
    public static String get(String endpoint) throws Exception {
        return getAsync(endpoint).join();
    }
    public static String post(String endpoint, String jsonBody) throws Exception {
        return postAsync(endpoint, jsonBody).join();
    }
    public static String put(String endpoint, String jsonBody) throws Exception {
        return putAsync(endpoint, jsonBody).join();
    }
    public static String delete(String endpoint) throws Exception {
        return deleteAsync(endpoint).join();
    }
}
