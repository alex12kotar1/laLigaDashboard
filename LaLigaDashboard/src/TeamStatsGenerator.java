import java.io.FileReader;
import java.io.FileWriter;
import java.util.HashMap;
import java.util.Map;

import com.google.gson.GsonBuilder;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

public class TeamStatsGenerator {

    public static void main(String[] args) {
        generate();
    }

    public static void generate() {
        try (FileReader reader = new FileReader("src/results.json")) {
            JsonObject root = JsonParser.parseReader(reader).getAsJsonObject();
            JsonArray matches = root.getAsJsonArray("matches");

            Map<Integer, JsonObject> teamStatsMap = new HashMap<>();

            // 1. Process matches to calculate team stats
            for (JsonElement elem : matches) {
                JsonObject match = elem.getAsJsonObject();
                if (!"FINISHED".equals(match.get("status").getAsString())) {
                    continue;
                }

                int matchday = match.get("matchday").getAsInt();
                JsonObject homeTeam = match.getAsJsonObject("homeTeam");
                JsonObject awayTeam = match.getAsJsonObject("awayTeam");
                JsonObject score = match.getAsJsonObject("score")
                        .getAsJsonObject("fullTime");

                int homeId = homeTeam.get("id").getAsInt();
                int awayId = awayTeam.get("id").getAsInt();
                int homeGoals = score.get("home").getAsInt();
                int awayGoals = score.get("away").getAsInt();

                initTeam(teamStatsMap, homeId, homeTeam);
                initTeam(teamStatsMap, awayId, awayTeam);

                // Update Home Team Stats
                updateTeamMatch(teamStatsMap.get(homeId), homeGoals, awayGoals, true,
                        matchday, awayTeam, match);
                // Update Away Team Stats
                updateTeamMatch(teamStatsMap.get(awayId), awayGoals, homeGoals, false,
                        matchday, homeTeam, match);
            }

            // 2. Compute final averages and formatted structures
            JsonObject finalOutput = new JsonObject();
            for (Map.Entry<Integer, JsonObject> entry : teamStatsMap.entrySet()) {
                JsonObject stats = entry.getValue();
                int totalGames = stats.get("played").getAsInt();

                if (totalGames > 0) {
                    double gpg = (double) stats.get("goalsScored").getAsInt()
                            / totalGames;
                    double cpg = (double) stats.get("goalsConceded").getAsInt()
                            / totalGames;
                    double csRate = (double) stats.get("cleanSheets").getAsInt()
                            / totalGames;

                    stats.addProperty("goalsPerGame", Math.round(gpg * 100.0) / 100.0);
                    stats.addProperty("concededPerGame", Math.round(cpg * 100.0) / 100.0);
                    stats.addProperty("cleanSheetRate",
                            Math.round(csRate * 100.0) / 100.0);

                    // Home Advantage calculation
                    int homeWins = stats.get("homeWins").getAsInt();
                    int homeGames = stats.get("homeGames").getAsInt();
                    int awayWins = stats.get("awayWins").getAsInt();
                    int awayGames = stats.get("awayGames").getAsInt();

                    double homeWinRate = homeGames > 0
                            ? ((double) homeWins / homeGames) * 100
                            : 0;
                    double awayWinRate = awayGames > 0
                            ? ((double) awayWins / awayGames) * 100
                            : 0;
                    stats.addProperty("homeAdvantageDifferential",
                            Math.round(homeWinRate - awayWinRate));
                }

                finalOutput.add(String.valueOf(entry.getKey()), stats);
            }

            // Write to team_stats.json
            try (FileWriter writer = new FileWriter("src/team_stats.json")) {
                new GsonBuilder().setPrettyPrinting().create().toJson(finalOutput,
                        writer);
                System.out.println("Successfully generated src/team_stats.json!");
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static void initTeam(Map<Integer, JsonObject> map, int teamId,
            JsonObject teamObj) {
        if (!map.containsKey(teamId)) {
            JsonObject stats = new JsonObject();
            stats.addProperty("id", teamId);
            stats.addProperty("name", teamObj.get("name").getAsString());
            stats.addProperty("shortName",
                    teamObj.has("shortName") && !teamObj.get("shortName").isJsonNull()
                            ? teamObj.get("shortName").getAsString()
                            : teamObj.get("name").getAsString());
            stats.addProperty("crest",
                    teamObj.has("crest") ? teamObj.get("crest").getAsString() : "");
            stats.addProperty("played", 0);
            stats.addProperty("goalsScored", 0);
            stats.addProperty("goalsConceded", 0);
            stats.addProperty("cleanSheets", 0);
            stats.addProperty("homeWins", 0);
            stats.addProperty("homeGames", 0);
            stats.addProperty("awayWins", 0);
            stats.addProperty("awayGames", 0);
            stats.add("lastFive", new JsonArray());
            stats.add("matchdayGoals", new JsonArray());
            stats.add("recentMatches", new JsonArray());
            map.put(teamId, stats);
        }
    }

    private static void updateTeamMatch(JsonObject stats, int gf, int ga, boolean isHome,
            int matchday, JsonObject opponent, JsonObject rawMatch) {
        stats.addProperty("played", stats.get("played").getAsInt() + 1);
        stats.addProperty("goalsScored", stats.get("goalsScored").getAsInt() + gf);
        stats.addProperty("goalsConceded", stats.get("goalsConceded").getAsInt() + ga);

        if (ga == 0) {
            stats.addProperty("cleanSheets", stats.get("cleanSheets").getAsInt() + 1);
        }

        String result = gf > ga ? "W" : (gf == ga ? "D" : "L");

        if (isHome) {
            stats.addProperty("homeGames", stats.get("homeGames").getAsInt() + 1);
            if (result.equals("W")) {
                stats.addProperty("homeWins", stats.get("homeWins").getAsInt() + 1);
            }
        } else {
            stats.addProperty("awayGames", stats.get("awayGames").getAsInt() + 1);
            if (result.equals("W")) {
                stats.addProperty("awayWins", stats.get("awayWins").getAsInt() + 1);
            }
        }

        // Maintain last 5
        JsonArray lastFive = stats.getAsJsonArray("lastFive");
        if (lastFive.size() == 5) {
            lastFive.remove(0);
        }
        lastFive.add(result);

        // Track goals by matchday
        JsonObject mdStat = new JsonObject();
        mdStat.addProperty("matchday", matchday);
        mdStat.addProperty("scored", gf);
        mdStat.addProperty("conceded", ga);
        stats.getAsJsonArray("matchdayGoals").add(mdStat);

        // Store recent match details for H2H/Recent results
        JsonObject matchDetails = new JsonObject();
        matchDetails.addProperty("opponent",
                opponent.has("shortName") ? opponent.get("shortName").getAsString()
                        : opponent.get("name").getAsString());
        matchDetails.addProperty("opponentId", opponent.get("id").getAsInt());
        matchDetails.addProperty("gf", gf);
        matchDetails.addProperty("ga", ga);
        matchDetails.addProperty("isHome", isHome);
        matchDetails.addProperty("utcDate", rawMatch.get("utcDate").getAsString());
        stats.getAsJsonArray("recentMatches").add(matchDetails);
    }
}
