
import java.net.InetSocketAddress;
import java.nio.file.Path;

import com.sun.net.httpserver.SimpleFileServer;
import com.sun.net.httpserver.SimpleFileServer.OutputLevel;

public class Main {
    private static final String API_KEY = "your_api_key";
    private static final String COMPETITION_CODE = "PD"; // La Liga

    public static void main(String[] args) {
        ApiClient client = new ApiClient(API_KEY);
        DashboardGenerator generator = new DashboardGenerator(client);

        // 1. Generate the data into the src/ folder
        generator.generateDashboardData(COMPETITION_CODE);
        TeamStatsGenerator.generate();

        // 2. Start a local HTTP server directly from Eclipse
        var server = SimpleFileServer.createFileServer(new InetSocketAddress(8025),
                Path.of("src").toAbsolutePath(), OutputLevel.INFO);

        System.out.println("Server started! Open http://localhost:8002 in your browser.");
        server.start();
    }
}
