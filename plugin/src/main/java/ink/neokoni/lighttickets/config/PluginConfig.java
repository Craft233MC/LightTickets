package ink.neokoni.lighttickets.config;

import org.bukkit.configuration.file.FileConfiguration;

public class PluginConfig {
    private final String serverUrl;
    private final String serverKey;
    private final int maxRetries;
    private final int retryInterval;
    private final boolean offlineQueue;
    private final boolean showOnJoin;
    private final int refreshInterval;
    private final int placeholderItem;

    public PluginConfig(FileConfiguration config) {
        this.serverUrl = config.getString("server.url", "http://localhost:3000");
        this.serverKey = config.getString("server.key", "");
        this.maxRetries = config.getInt("server.maxRetries", 20);
        this.retryInterval = config.getInt("server.retryInterval", 3);
        this.offlineQueue = config.getBoolean("notifications.offlineQueue", true);
        this.showOnJoin = config.getBoolean("notifications.showOnJoin", true);
        this.refreshInterval = config.getInt("gui.refreshInterval", 0);
        this.placeholderItem = config.getInt("gui.placeholderItem", 160);
    }

    public String getServerUrl() { return serverUrl; }
    public String getServerKey() { return serverKey; }
    public int getMaxRetries() { return maxRetries; }
    public int getRetryInterval() { return retryInterval; }
    public boolean isOfflineQueue() { return offlineQueue; }
    public boolean isShowOnJoin() { return showOnJoin; }
    public int getRefreshInterval() { return refreshInterval; }
    public int getPlaceholderItem() { return placeholderItem; }
}
