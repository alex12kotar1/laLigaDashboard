import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class ApiClient {
    private static final String BASE_URL = "https://api.football-data.org/v4";
    private final String apiToken;
    private final HttpClient httpClient;

    public ApiClient(String apiToken) {
        this.apiToken = apiToken;
        this.httpClient = HttpClient.newHttpClient();
    }

    public String fetchStandings(String competitionCode)
            throws IOException, InterruptedException {
        String endpoint = BASE_URL + "/competitions/" + competitionCode + "/standings";
        return this.executeGet(endpoint);
    }

    public String fetchUpcomingMatches(String competitionCode)
            throws IOException, InterruptedException {
        String endpoint = BASE_URL + "/competitions/" + competitionCode
                + "/matches?status=SCHEDULED";
        return this.executeGet(endpoint);
    }

    public String fetchRecentMatches(String competitionCode)
            throws IOException, InterruptedException {
        String endpoint = BASE_URL + "/competitions/" + competitionCode
                + "/matches?status=FINISHED";
        return this.executeGet(endpoint);
    }

    public String fetchTopScorers(String competitionCode)
            throws IOException, InterruptedException {
        String endpoint = BASE_URL + "/competitions/" + competitionCode + "/scorers";
        return this.executeGet(endpoint);
    }

    private String executeGet(String url) throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder().uri(URI.create(url))
                .header("X-Auth-Token", this.apiToken).GET().build();

        HttpResponse<String> response = this.httpClient.send(request,
                HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new RuntimeException(
                    "HTTP Error " + response.statusCode() + ": " + response.body());
        }

        return response.body();
    }
}
