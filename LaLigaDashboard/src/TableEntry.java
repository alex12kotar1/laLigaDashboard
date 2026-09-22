public class TableEntry {
    private int position;
    private Team team;
    private int playedGames;
    private String form;
    private int won;
    private int draw;
    private int lost;
    private int points;
    private int goalsFor;
    private int goalsAgainst;
    private int goalDifference;

    public TableEntry() {
    }

    public int getPosition() {
        return this.position;
    }

    public Team getTeam() {
        return this.team;
    }

    public int getPlayedGames() {
        return this.playedGames;
    }

    public String getForm() {
        return this.form;
    }

    public int getWon() {
        return this.won;
    }

    public int getDraw() {
        return this.draw;
    }

    public int getLost() {
        return this.lost;
    }

    public int getPoints() {
        return this.points;
    }

    public int getGoalsFor() {
        return this.goalsFor;
    }

    public int getGoalsAgainst() {
        return this.goalsAgainst;
    }

    public int getGoalDifference() {
        return this.goalDifference;
    }
}
