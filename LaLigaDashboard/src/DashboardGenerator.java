import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

public class DashboardGenerator {
    private final ApiClient apiClient;

    public DashboardGenerator(ApiClient apiClient) {
        this.apiClient = apiClient;
    }

    public void generateDashboardData(String competitionCode) {
        try {
            System.out.println("Fetching standings for " + competitionCode + "...");
            String standingsJson = this.apiClient.fetchStandings(competitionCode);
            // Write directly into the src directory
            Files.writeString(Path.of("src/standings.json"), standingsJson);

            System.out
                    .println("Fetching scheduled matches for " + competitionCode + "...");
            String matchesJson = this.apiClient.fetchUpcomingMatches(competitionCode);
            // Write directly into the src directory
            Files.writeString(Path.of("src/matches.json"), matchesJson);

            System.out.println("Fetching recent results for " + competitionCode + "...");
            String resultsJson = this.apiClient.fetchRecentMatches(competitionCode);

            Files.writeString(Path.of("src/results.json"), resultsJson);

            System.out.println("Fetching top scorers for " + competitionCode + "...");
            String scorersJson = this.apiClient.fetchTopScorers(competitionCode);
            Files.writeString(Path.of("src/scorers.json"), scorersJson);

            System.out.println(
                    "Dashboard export complete: standings, matches, results, and scorers updated.");
        } catch (IOException | InterruptedException e) {
            System.err.println("Failed to export dashboard data: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
