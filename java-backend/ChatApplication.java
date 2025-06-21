import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.net.Socket;

public class ClientChat {
    public static void main(String[] args) {
        try (Socket socket = new Socket("localhost", 5000);
                BufferedReader reader = new BufferedReader(new InputStreamReader(socket.getInputStream()));
                PrintWriter writer = new PrintWriter(socket.getOutputStream(), true);
                BufferedReader consoleReader = new BufferedReader(new InputStreamReader(System.in))) {

            System.out.print("Enter your username: ");
            String username = consoleReader.readLine();
            writer.println(username);

            System.out.println("Start chatting (type 'exit' to leave the chat):");
            new Thread(() -> readMessages(reader)).start();

            String message;
            while (!(message = consoleReader.readLine()).equalsIgnoreCase("exit")) {
                writer.println(message);
            }

        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private static void readMessages(BufferedReader reader) {
        try {
            String message;
            while ((message = reader.readLine()) != null) {
                System.out.println(message);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
