package ink.neokoni.lighttickets.model;

public class Notification {
    private final int id;
    private final String playerUuid;
    private final String message;
    private final long createdAt;

    public Notification(int id, String playerUuid, String message, long createdAt) {
        this.id = id;
        this.playerUuid = playerUuid;
        this.message = message;
        this.createdAt = createdAt;
    }

    public int getId() { return id; }
    public String getPlayerUuid() { return playerUuid; }
    public String getMessage() { return message; }
    public long getCreatedAt() { return createdAt; }
}
