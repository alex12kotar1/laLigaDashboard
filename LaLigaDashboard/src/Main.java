
import java.net.InetSocketAddress;
import java.nio.file.Path;

import com.sun.net.httpserver.SimpleFileServer;
import com.sun.net.httpserver.SimpleFileServer.OutputLevel;

public class Main {
    // api keys / codes for football-data.org
    private static final String API_KEY = "your_api_key";
    private static final String COMPETITION_CODE = "PD"; // la liga

    public static void main(String[] args) {
        ApiClient client = new ApiClient(API_KEY);
        DashboardGenerator generator = new DashboardGenerator(client);

        // generate dashboard and advanced team stats
        generator.generateDashboardData(COMPETITION_CODE);
        TeamStatsGenerator.generate();

        // host locally through java
        var server = SimpleFileServer.createFileServer(new InetSocketAddress(8002),
                Path.of("src").toAbsolutePath(), OutputLevel.INFO);

        System.out.println("Server started! Open http://localhost:8002 in your browser.");
        server.start();
    }
}
