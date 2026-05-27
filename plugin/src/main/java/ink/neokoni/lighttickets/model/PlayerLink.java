package ink.neokoni.lighttickets.model;

public class PlayerLink {
    private final String code;
    private final String expiresAt;

    public PlayerLink(String code, String expiresAt) {
        this.code = code;
        this.expiresAt = expiresAt;
    }

    public String getCode() { return code; }
    public String getExpiresAt() { return expiresAt; }
}
