public class Score {
    private String winner; // "HOME_TEAM", "AWAY_TEAM", "DRAW"
    private String duration; // "REGULAR"
    private GoalCount fullTime;
    private GoalCount halfTime;

    public static class GoalCount {
        private Integer home;
        private Integer away;

        public GoalCount() {
        }

        public Integer getHome() {
            return this.home;
        }

        public Integer getAway() {
            return this.away;
        }
    }

    public Score() {
    }

    public String getWinner() {
        return this.winner;
    }

    public String getDuration() {
        return this.duration;
    }

    public GoalCount getFullTime() {
        return this.fullTime;
    }

    public GoalCount getHalfTime() {
        return this.halfTime;
    }
}
