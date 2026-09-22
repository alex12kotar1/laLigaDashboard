public class Match {
    private int id;
    private String utcDate;
    private String status; // "SCHEDULED", "TIMED", "IN_PLAY", "FINISHED"
    private int matchday;
    private Team homeTeam;
    private Team awayTeam;
    private Score score;

    public Match() {
    }

    public int getId() {
        return this.id;
    }

    public String getUtcDate() {
        return this.utcDate;
    }

    public String getStatus() {
        return this.status;
    }

    public int getMatchday() {
        return this.matchday;
    }

    public Team getHomeTeam() {
        return this.homeTeam;
    }

    public Team getAwayTeam() {
        return this.awayTeam;
    }

    public Score getScore() {
        return this.score;
    }
}
