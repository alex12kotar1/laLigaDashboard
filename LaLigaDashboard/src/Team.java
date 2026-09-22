public class Team {
    private int id;
    private String name;
    private String shortName;
    private String tla;
    private String crest;

    public Team() {
    }

    public Team(int id, String name, String shortName, String tla, String crest) {
        this.id = id;
        this.name = name;
        this.shortName = shortName;
        this.tla = tla;
        this.crest = crest;
    }

    public int getId() {
        return this.id;
    }

    public String getName() {
        return this.name;
    }

    public String getShortName() {
        return this.shortName;
    }

    public String getTla() {
        return this.tla;
    }

    public String getCrest() {
        return this.crest;
    }
}
