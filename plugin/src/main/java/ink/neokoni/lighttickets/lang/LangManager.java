package ink.neokoni.lighttickets.lang;

import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.serializer.legacy.LegacyComponentSerializer;
import org.bukkit.configuration.file.FileConfiguration;
import org.bukkit.configuration.file.YamlConfiguration;

import java.io.File;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

public class LangManager {
    private static final LegacyComponentSerializer SERIALIZER = LegacyComponentSerializer.legacySection();

    private final File dataFolder;
    private FileConfiguration langConfig;
    private final Map<String, Component> cache = new HashMap<>();
    private final Map<String, String> rawCache = new HashMap<>();

    public LangManager(File dataFolder) {
        this.dataFolder = dataFolder;
        reload();
    }

    public void reload() {
        File langFile = new File(dataFolder, "lang.yml");
        if (!langFile.exists()) {
            dataFolder.mkdirs();
            saveDefaultLang();
        }
        langConfig = YamlConfiguration.loadConfiguration(langFile);

        InputStream defStream = getClass().getClassLoader().getResourceAsStream("lang.yml");
        if (defStream != null) {
            YamlConfiguration defaults = YamlConfiguration.loadConfiguration(
                new InputStreamReader(defStream, StandardCharsets.UTF_8));
            langConfig.setDefaults(defaults);
        }

        cache.clear();
        rawCache.clear();
        for (String key : langConfig.getKeys(true)) {
            if (langConfig.isString(key)) {
                String value = langConfig.getString(key);
                rawCache.put(key, value);
                cache.put(key, SERIALIZER.deserialize(value));
            }
        }
    }

    private void saveDefaultLang() {
        InputStream stream = getClass().getClassLoader().getResourceAsStream("lang.yml");
        if (stream != null) {
            File langFile = new File(dataFolder, "lang.yml");
            try {
                java.nio.file.Files.copy(stream, langFile.toPath());
            } catch (Exception e) {
                // ignore
            }
        }
    }

    public Component get(String key) {
        return cache.getOrDefault(key, Component.text(key));
    }

    public String getRaw(String key) {
        return rawCache.getOrDefault(key, key);
    }

    public Component format(String key, String... replacements) {
        String msg = getRaw(key);
        for (int i = 0; i < replacements.length - 1; i += 2) {
            msg = msg.replace(replacements[i], replacements[i + 1]);
        }
        return SERIALIZER.deserialize(msg);
    }

    public Component prefix(String key) {
        return get("prefix").append(Component.space()).append(get(key));
    }

    public Component prefixFormat(String key, String... replacements) {
        return get("prefix").append(Component.space()).append(format(key, replacements));
    }

    public Component prefixRaw(Component message) {
        return get("prefix").append(Component.space()).append(message);
    }

    public Component prefixRaw(String message) {
        return get("prefix").append(Component.space()).append(SERIALIZER.deserialize(message));
    }

    public Component[] helpLines() {
        String help = getRaw("cmd-help");
        if (help == null) return new Component[0];
        return help.lines()
            .map(SERIALIZER::deserialize)
            .toArray(Component[]::new);
    }
}
