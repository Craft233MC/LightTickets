package ink.neokoni.lighttickets;

import com.mojang.brigadier.arguments.StringArgumentType;
import ink.neokoni.lighttickets.command.CommandRegistration;
import ink.neokoni.lighttickets.config.PluginConfig;
import ink.neokoni.lighttickets.gui.MenuManager;
import ink.neokoni.lighttickets.handler.LinkHandler;
import ink.neokoni.lighttickets.handler.NotificationHandler;
import ink.neokoni.lighttickets.lang.LangManager;
import ink.neokoni.lighttickets.network.ApiClient;
import ink.neokoni.lighttickets.network.WebSocketClient;
import ink.neokoni.lighttickets.storage.NotificationStore;
import io.papermc.paper.plugin.lifecycle.event.types.LifecycleEvents;
import net.kyori.adventure.text.Component;
import org.bukkit.entity.Player;
import org.bukkit.event.player.PlayerJoinEvent;
import org.bukkit.plugin.java.JavaPlugin;

import java.io.File;

public class LightTickets extends JavaPlugin {
    private static LightTickets instance;

    private PluginConfig pluginConfig;
    private LangManager langManager;
    private ApiClient apiClient;
    private WebSocketClient webSocketClient;
    private NotificationStore notificationStore;
    private NotificationHandler notificationHandler;
    private LinkHandler linkHandler;
    private MenuManager menuManager;

    @Override
    public void onEnable() {
        instance = this;

        saveDefaultConfig();
        saveResource("lang.yml", false);

        pluginConfig = new PluginConfig(getConfig());
        langManager = new LangManager(getDataFolder());
        apiClient = new ApiClient(pluginConfig.getServerUrl(), pluginConfig.getServerKey());

        File dbFile = new File(getDataFolder(), "notifications.db");
        notificationStore = new NotificationStore(dbFile.getAbsolutePath());

        notificationHandler = new NotificationHandler(notificationStore, langManager);
        linkHandler = new LinkHandler(this, apiClient, langManager);

        menuManager = new MenuManager();
        getServer().getPluginManager().registerEvents(menuManager, this);

        getServer().getPluginManager().registerEvents(new org.bukkit.event.Listener() {
            @org.bukkit.event.EventHandler
            public void onJoin(PlayerJoinEvent event) {
                if (!pluginConfig.isShowOnJoin()) return;
                Player player = event.getPlayer();
                getServer().getAsyncScheduler().runNow(LightTickets.this, task ->
                    notificationHandler.deliverOfflineNotifications(player));
            }
        }, this);

        new CommandRegistration(this, apiClient, langManager, linkHandler).register();

        webSocketClient = new WebSocketClient(this, pluginConfig, notificationHandler);
        webSocketClient.connect();

        getLogger().info("LightTickets enabled!");
    }

    @Override
    public void onDisable() {
        if (webSocketClient != null) {
            webSocketClient.disconnect();
        }
        if (notificationStore != null) {
            notificationStore.close();
        }
        getLogger().info("LightTickets disabled!");
    }

    public static LightTickets getInstance() { return instance; }
    public MenuManager getMenuManager() { return menuManager; }
    public PluginConfig getPluginConfig() { return pluginConfig; }
    public LangManager getLangManager() { return langManager; }
    public ApiClient getApiClient() { return apiClient; }
}
