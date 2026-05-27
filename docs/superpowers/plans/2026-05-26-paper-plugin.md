# Paper Plugin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Paper/Folia Minecraft plugin (`ink.neokoni.LightTickets`) that connects to the LightTickets backend via REST + Socket.io, providing in-game ticket creation, listing, commenting, account linking, and real-time notifications.

**Architecture:** Single-module Gradle project producing one JAR. Network layer wraps OkHttp (REST) and Socket.io (WebSocket). Command system uses Brigadier. GUI uses Bukkit Inventory API with an abstract BaseMenu for pagination/async rendering. Offline notifications stored in local SQLite. All player-facing text from `lang.yml`.

**Tech Stack:** Java 21+, Gradle Kotlin DSL, Paper API 1.21.1 (compile-only), OkHttp 4.x, Socket.io Client 2.x, SQLite JDBC, Brigadier (Paper-bundled)

---

## File Structure

```
plugin/
├── build.gradle.kts
├── settings.gradle.kts
├── gradle.properties
├── src/main/java/ink/neokoni/LightTickets/
│   ├── LightTickets.java              # Plugin entry, lifecycle
│   ├── config/
│   │   └── PluginConfig.java          # config.yml reader
│   ├── lang/
│   │   └── LangManager.java           # lang.yml reader + placeholder formatting
│   ├── model/
│   │   ├── Ticket.java                # Ticket data class
│   │   ├── Notification.java          # Offline notification
│   │   └── PlayerLink.java            # Link status result
│   ├── network/
│   │   ├── ApiException.java          # HTTP error wrapper
│   │   ├── ApiClient.java             # REST client (OkHttp)
│   │   └── WebSocketClient.java       # Socket.io connection + events
│   ├── command/
│   │   ├── CommandRegistry.java       # Brigadier tree registration
│   │   ├── GuiCommand.java            # /lt → open main menu
│   │   ├── CreateCommand.java         # /lt create <title>
│   │   ├── TicketCommand.java         # /lt tickets, /lt ticket <id>
│   │   ├── CommentCommand.java        # /lt comment <id> <text>
│   │   ├── LinkCommand.java           # /lt link
│   │   └── HelpCommand.java           # /lt help
│   ├── gui/
│   │   ├── SlotAction.java            # Slot data: ItemStack + click callback
│   │   ├── MenuManager.java           # Inventory event listener, register/unregister
│   │   ├── BaseMenu.java              # Abstract: pagination, async render, placeholder, refresh
│   │   ├── MainMenu.java              # Ticket list + create button
│   │   ├── TicketDetailMenu.java      # Ticket info + comment action
│   │   └── CreateTicketMenu.java      # Type select, title/body input
│   ├── handler/
│   │   ├── NotificationHandler.java   # WebSocket event → chat / offline queue
│   │   └── LinkHandler.java           # Link code flow: generate, poll, notify
│   └── storage/
│       └── NotificationStore.java     # SQLite offline notification queue
├── src/main/resources/
│   ├── paper-plugin.yml
│   ├── config.yml                     # Default config (bundled)
│   └── lang.yml                       # Default lang (bundled)
```

---

## Backend Prerequisite: Add `ticket:status_changed` Event

The spec requires a `ticket:status_changed` WebSocket event, but the backend currently only emits `permission:approved` and `permission:rejected`. We need to add this event so the plugin can notify players of status changes.

---

### Task 1: Gradle Project Setup

**Files:**
- Create: `plugin/build.gradle.kts`
- Create: `plugin/settings.gradle.kts`
- Create: `plugin/gradle.properties`

- [ ] **Step 1: Create settings.gradle.kts**

```kotlin
// plugin/settings.gradle.kts
rootProject.name = "LightTickets"
```

- [ ] **Step 2: Create gradle.properties**

```properties
# plugin/gradle.properties
group=ink.neokoni
version=1.0.0
```

- [ ] **Step 3: Create build.gradle.kts**

```kotlin
// plugin/build.gradle.kts
plugins {
    java
}

group = rootProject.findProperty("group") as String
version = rootProject.findProperty("version") as String

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

repositories {
    mavenCentral()
    maven("https://repo.papermc.io/repository/maven-public/")
}

dependencies {
    compileOnly("io.papermc.paper:paper-api:1.21.1-R0.1-SNAPSHOT")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("io.socket:socket.io-client:2.1.0")
    implementation("org.xerial:sqlite-jdbc:3.45.3.0")
}

tasks.processResources {
    filesMatching("paper-plugin.yml") {
        expand("version" to version)
    }
}

tasks.jar {
    archiveFileName.set("LightTickets-${version}.jar")
}
```

- [ ] **Step 4: Verify Gradle setup compiles**

Run: `cd plugin && ./gradlew classes 2>&1 | tail -10`
Expected: BUILD SUCCESSFUL (downloads deps, compiles empty source set)

Note: If no Gradle wrapper exists, generate one first: `cd plugin && gradle wrapper`

- [ ] **Step 5: Commit**

```bash
git add plugin/build.gradle.kts plugin/settings.gradle.kts plugin/gradle.properties
git commit -m "build(plugin): initialize Gradle project with Paper/OkHttp/Socket.io deps"
```

---

### Task 2: Paper Plugin Descriptor + Default Config Files

**Files:**
- Create: `plugin/src/main/resources/paper-plugin.yml`
- Create: `plugin/src/main/resources/config.yml`
- Create: `plugin/src/main/resources/lang.yml`

- [ ] **Step 1: Create paper-plugin.yml**

```yaml
# plugin/src/main/resources/paper-plugin.yml
name: LightTickets
version: '${version}'
main: ink.neokoni.LightTickets.LightTickets
api-version: '1.21.1'
description: LightTickets Minecraft Server Plugin
authors: [neokoni]
folia-supported: true
```

- [ ] **Step 2: Create default config.yml**

```yaml
# plugin/src/main/resources/config.yml
server:
  url: "http://localhost:3000"
  key: "lt_xxxxxxxxxxxx"
  maxRetries: 20
  retryInterval: 3

notifications:
  offlineQueue: true
  showOnJoin: true

gui:
  refreshInterval: 0
  placeholderItem: 160
```

- [ ] **Step 3: Create default lang.yml**

```yaml
# plugin/src/main/resources/lang.yml
prefix: "[LightTickets]"
no-permission: "你没有执行此操作的权限"

notify-ticket-status: "你的议题 #{ticketId} 状态已更新为 {status}"
notify-permission-approved: "你的议题 #{ticketId} 权限申请已通过：{groupName}"
notify-permission-rejected: "你的议题 #{ticketId} 被拒绝：{reason}"
notify-offline-summary: "你有 {count} 条离线通知："

cmd-help: |
  §6=== LightTickets 帮助 ===
  §e/lt §7- 打开主菜单
  §e/lt create <标题> §7- 创建议题
  §e/lt tickets §7- 查看我的议题
  §e/lt ticket <id> §7- 查看议题详情
  §e/lt comment <id> <内容> §7- 添加评论
  §e/lt link §7- 账号绑定
  §e/lt help §7- 显示帮助
cmd-create-success: "议题创建成功：#{ticketId} {title}"
cmd-comment-success: "评论已添加"
cmd-link-code: "你的绑定验证码是：§6{code}§e，5分钟内有效，请到网页端输入完成绑定。"
cmd-link-pending: "验证码已发送，请在游戏内等待确认..."
cmd-link-success: "账号绑定成功！Minecraft：{name}"
cmd-tickets-header: "§6=== 我的议题列表 ==="
cmd-tickets-empty: "暂无议题"
cmd-tickets-item: "§e#{id} §f{title} §7[{status}]"
cmd-ticket-header: "§6=== 议题 #{id} ==="
cmd-ticket-title: "标题：{title}"
cmd-ticket-status: "状态：{status}"
cmd-ticket-type: "类型：{type}"
cmd-ticket-body: "§7内容：§f"
cmd-ticket-comments-header: "§7--- 评论 ---"
cmd-ticket-no-comments: "暂无评论"
cmd-ticket-comment-item: "§7[{source}] §f{author}：{body}"
cmd-create-select-type: "§6选择议题类型："
cmd-create-type-bug: "§cBug报告"
cmd-create-type-permission: "§a权限申请"
cmd-create-type-suggestion: "§b建议"
cmd-create-type-report: "§e举报"
cmd-create-enter-title: "§e请输入议题标题（在聊天框输入）："
cmd-create-enter-body: "§e请输入议题内容（输入 /done 结束）："
cmd-create-cancelled: "议题创建已取消"
cmd-create-confirm: "§6确认创建？§e 点击此处确认"
error-api-failed: "请求失败，请稍后重试"
error-not-linked: "你的账号未绑定，请先使用 /lt link 完成绑定"
error-ticket-not-found: "议题 #{ticketId} 不存在"
error-connection-failed: "无法连接到服务器，轻工单功能已暂时禁用"
error-player-not-linked: "此玩家未绑定账号"
error-type-bug: "Bug报告"
error-type-permission: "权限申请"
error-type-suggestion: "建议"
error-type-report: "举报"
status-open: "待处理"
status-in_progress: "处理中"
status-resolved: "已解决"
status-closed: "已关闭"
status-rejected: "已拒绝"
```

- [ ] **Step 4: Commit**

```bash
git add plugin/src/main/resources/
git commit -m "feat(plugin): add paper-plugin.yml, default config.yml and lang.yml"
```

---

### Task 3: Model Classes

**Files:**
- Create: `plugin/src/main/java/ink/neokoni/LightTickets/model/Ticket.java`
- Create: `plugin/src/main/java/ink/neokoni/LightTickets/model/Notification.java`
- Create: `plugin/src/main/java/ink/neokoni/LightTickets/model/PlayerLink.java`

- [ ] **Step 1: Create Ticket.java**

```java
// plugin/src/main/java/ink/neokoni/LightTickets/model/Ticket.java
package ink.neokoni.LightTickets.model;

import java.util.Map;

public class Ticket {
    private final String id;
    private final String title;
    private final String body;
    private final String type;
    private final String status;
    private final String priority;
    private final String createdAt;

    private static final Map<String, String> STATUS_NAMES = Map.of(
        "open", "待处理",
        "in_progress", "处理中",
        "resolved", "已解决",
        "closed", "已关闭",
        "rejected", "已拒绝"
    );

    private static final Map<String, String> TYPE_NAMES = Map.of(
        "bug_report", "Bug报告",
        "permission_request", "权限申请",
        "suggestion", "建议",
        "report", "举报"
    );

    public Ticket(String id, String title, String body, String type, String status, String priority, String createdAt) {
        this.id = id;
        this.title = title;
        this.body = body;
        this.type = type;
        this.status = status;
        this.priority = priority;
        this.createdAt = createdAt;
    }

    public String getId() { return id; }
    public String getTitle() { return title; }
    public String getBody() { return body; }
    public String getType() { return type; }
    public String getStatus() { return status; }
    public String getPriority() { return priority; }
    public String getCreatedAt() { return createdAt; }

    public String getStatusName() {
        return STATUS_NAMES.getOrDefault(status, status);
    }

    public String getTypeName() {
        return TYPE_NAMES.getOrDefault(type, type);
    }
}
```

- [ ] **Step 2: Create Notification.java**

```java
// plugin/src/main/java/ink/neokoni/LightTickets/model/Notification.java
package ink.neokoni.LightTickets.model;

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
```

- [ ] **Step 3: Create PlayerLink.java**

```java
// plugin/src/main/java/ink/neokoni/LightTickets/model/PlayerLink.java
package ink.neokoni.LightTickets.model;

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
```

- [ ] **Step 4: Commit**

```bash
git add plugin/src/main/java/ink/neokoni/LightTickets/model/
git commit -m "feat(plugin): add Ticket, Notification, PlayerLink model classes"
```

---

### Task 4: PluginConfig + LangManager

**Files:**
- Create: `plugin/src/main/java/ink/neokoni/LightTickets/config/PluginConfig.java`
- Create: `plugin/src/main/java/ink/neokoni/LightTickets/lang/LangManager.java`

- [ ] **Step 1: Create PluginConfig.java**

```java
// plugin/src/main/java/ink/neokoni/LightTickets/config/PluginConfig.java
package ink.neokoni.LightTickets.config;

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
```

- [ ] **Step 2: Create LangManager.java**

```java
// plugin/src/main/java/ink/neokoni/LightTickets/lang/LangManager.java
package ink.neokoni.LightTickets.lang;

import org.bukkit.configuration.file.FileConfiguration;
import org.bukkit.configuration.file.YamlConfiguration;

import java.io.File;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

public class LangManager {
    private final File dataFolder;
    private FileConfiguration langConfig;
    private final Map<String, String> cache = new HashMap<>();

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

        // Load defaults from jar
        InputStream defStream = getClass().getClassLoader().getResourceAsStream("lang.yml");
        if (defStream != null) {
            YamlConfiguration defaults = YamlConfiguration.loadConfiguration(
                new InputStreamReader(defStream, StandardCharsets.UTF_8));
            langConfig.setDefaults(defaults);
        }

        cache.clear();
        for (String key : langConfig.getKeys(true)) {
            if (langConfig.isString(key)) {
                cache.put(key, langConfig.getString(key));
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

    public String get(String key) {
        return cache.getOrDefault(key, key);
    }

    public String format(String key, String... replacements) {
        String msg = get(key);
        for (int i = 0; i < replacements.length - 1; i += 2) {
            msg = msg.replace(replacements[i], replacements[i + 1]);
        }
        return msg;
    }

    public String prefix(String message) {
        return get("prefix") + " " + message;
    }
}
```

- [ ] **Step 3: Verify build compiles**

Run: `cd plugin && ./gradlew classes 2>&1 | tail -5`
Expected: BUILD SUCCESSFUL

- [ ] **Step 4: Commit**

```bash
git add plugin/src/main/java/ink/neokoni/LightTickets/config/ plugin/src/main/java/ink/neokoni/LightTickets/lang/
git commit -m "feat(plugin): add PluginConfig and LangManager"
```

---

### Task 5: ApiException + ApiClient

**Files:**
- Create: `plugin/src/main/java/ink/neokoni/LightTickets/network/ApiException.java`
- Create: `plugin/src/main/java/ink/neokoni/LightTickets/network/ApiClient.java`

- [ ] **Step 1: Create ApiException.java**

```java
// plugin/src/main/java/ink/neokoni/LightTickets/network/ApiException.java
package ink.neokoni.LightTickets.network;

public class ApiException extends Exception {
    private final int statusCode;
    private final String responseBody;

    public ApiException(int statusCode, String responseBody) {
        super("API error " + statusCode + ": " + responseBody);
        this.statusCode = statusCode;
        this.responseBody = responseBody;
    }

    public int getStatusCode() { return statusCode; }
    public String getResponseBody() { return responseBody; }
}
```

- [ ] **Step 2: Create ApiClient.java**

```java
// plugin/src/main/java/ink/neokoni/LightTickets/network/ApiClient.java
package ink.neokoni.LightTickets.network;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import ink.neokoni.LightTickets.model.Ticket;
import okhttp3.*;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;

public class ApiClient {
    private final OkHttpClient http;
    private final String baseUrl;
    private final String serverKey;
    private final Gson gson = new Gson();

    public ApiClient(String baseUrl, String serverKey) {
        this.baseUrl = baseUrl;
        this.serverKey = serverKey;
        this.http = new OkHttpClient.Builder()
            .connectTimeout(10, java.util.concurrent.TimeUnit.SECONDS)
            .readTimeout(15, java.util.concurrent.TimeUnit.SECONDS)
            .build();
    }

    private Request.Builder request(String path) {
        return new Request.Builder()
            .url(baseUrl + path)
            .header("X-Server-Key", serverKey)
            .header("Content-Type", "application/json");
    }

    private CompletableFuture<String> executeAsync(Request request) {
        CompletableFuture<String> future = new CompletableFuture<>();
        http.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, java.io.IOException e) {
                future.completeExceptionally(e);
            }

            @Override
            public void onResponse(Call call, Response response) throws java.io.IOException {
                try (response) {
                    String body = response.body() != null ? response.body().string() : "";
                    if (!response.isSuccessful()) {
                        future.completeExceptionally(new ApiException(response.code(), body));
                    } else {
                        future.complete(body);
                    }
                }
            }
        });
        return future;
    }

    public CompletableFuture<List<Ticket>> getMyTickets(String playerUuid) {
        Request request = request("/api/mc/tickets/" + playerUuid).get().build();
        return executeAsync(request).thenApply(json -> {
            JsonArray arr = JsonParser.parseString(json).getAsJsonArray();
            List<Ticket> tickets = new ArrayList<>();
            for (var element : arr) {
                JsonObject obj = element.getAsJsonObject();
                tickets.add(new Ticket(
                    obj.get("id").getAsString(),
                    obj.get("title").getAsString(),
                    obj.has("body") ? obj.get("body").getAsString() : "",
                    obj.has("type") ? obj.get("type").getAsString() : "",
                    obj.has("status") ? obj.get("status").getAsString() : "",
                    obj.has("priority") ? obj.get("priority").getAsString() : "",
                    obj.has("createdAt") ? obj.get("createdAt").getAsString() : ""
                ));
            }
            return tickets;
        });
    }

    public CompletableFuture<Ticket> createTicket(String playerUuid, String title, String body, String type) {
        JsonObject payload = new JsonObject();
        payload.addProperty("minecraftUuid", playerUuid);
        payload.addProperty("title", title);
        payload.addProperty("body", body);
        payload.addProperty("type", type);

        Request request = request("/api/mc/tickets")
            .post(RequestBody.create(payload.toString(), MediaType.parse("application/json")))
            .build();

        return executeAsync(request).thenApply(json -> {
            JsonObject obj = JsonParser.parseString(json).getAsJsonObject();
            return new Ticket(
                obj.get("id").getAsString(),
                obj.get("title").getAsString(),
                obj.has("body") ? obj.get("body").getAsString() : "",
                obj.has("type") ? obj.get("type").getAsString() : "",
                obj.has("status") ? obj.get("status").getAsString() : "",
                obj.has("priority") ? obj.get("priority").getAsString() : "",
                obj.has("createdAt") ? obj.get("createdAt").getAsString() : ""
            );
        });
    }

    public CompletableFuture<Void> addComment(String playerUuid, String ticketId, String body) {
        JsonObject payload = new JsonObject();
        payload.addProperty("minecraftUuid", playerUuid);
        payload.addProperty("ticketId", ticketId);
        payload.addProperty("body", body);

        Request request = request("/api/mc/comments")
            .post(RequestBody.create(payload.toString(), MediaType.parse("application/json")))
            .build();

        return executeAsync(request).thenApply(v -> null);
    }

    public CompletableFuture<String> generateLinkCode(String playerUuid, String playerName) {
        JsonObject payload = new JsonObject();
        payload.addProperty("minecraftUuid", playerUuid);
        payload.addProperty("minecraftName", playerName);

        Request request = request("/api/mc/link-code")
            .post(RequestBody.create(payload.toString(), MediaType.parse("application/json")))
            .build();

        return executeAsync(request).thenApply(json -> {
            JsonObject obj = JsonParser.parseString(json).getAsJsonObject();
            return obj.get("code").getAsString();
        });
    }

    public CompletableFuture<Void> reportPermissionExecution(String ticketId, boolean success, String errorMessage) {
        JsonObject payload = new JsonObject();
        payload.addProperty("ticketId", ticketId);
        payload.addProperty("success", success);
        if (errorMessage != null) {
            payload.addProperty("errorMessage", errorMessage);
        }

        Request request = request("/api/mc/permission-executed")
            .post(RequestBody.create(payload.toString(), MediaType.parse("application/json")))
            .build();

        return executeAsync(request).thenApply(v -> null);
    }
}
```

- [ ] **Step 3: Verify build compiles**

Run: `cd plugin && ./gradlew classes 2>&1 | tail -5`
Expected: BUILD SUCCESSFUL

- [ ] **Step 4: Commit**

```bash
git add plugin/src/main/java/ink/neokoni/LightTickets/network/ApiException.java plugin/src/main/java/ink/neokoni/LightTickets/network/ApiClient.java
git commit -m "feat(plugin): add REST API client with OkHttp"
```

---

### Task 6: Backend — Add `ticket:status_changed` Event

**Files:**
- Modify: `backend/src/services/ticket.service.ts`

- [ ] **Step 1: Add status_changed emission to ticket status updates**

The `ticket.service.ts` `update` function handles status changes. Add `emitTicketUpdate` call when status changes.

Read `backend/src/services/ticket.service.ts` to find the `update` function, then add the import and emission:

```typescript
// Add to imports at top of file:
import { emitTicketUpdate } from '../socket/events.js';

// Inside the update function, after the ticket is updated, add:
if (ticket.serverId && ticket.author?.minecraftUuid && data.status && data.status !== ticket.status) {
    emitTicketUpdate(ticket.serverId, 'ticket:status_changed', {
        ticketId: ticket.id,
        playerUuid: ticket.author.minecraftUuid,
        oldStatus: ticket.status,
        newStatus: data.status,
    });
}
```

Note: The exact insertion point depends on the current update function structure. Read the file first and adapt.

- [ ] **Step 2: Verify backend compiles**

Run: `cd backend && npx tsc --noEmit 2>&1 | tail -5`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add backend/src/services/ticket.service.ts
git commit -m "feat(backend): emit ticket:status_changed WebSocket event on status update"
```

---

### Task 7: NotificationStore (SQLite)

**Files:**
- Create: `plugin/src/main/java/ink/neokoni/LightTickets/storage/NotificationStore.java`

- [ ] **Step 1: Create NotificationStore.java**

```java
// plugin/src/main/java/ink/neokoni/LightTickets/storage/NotificationStore.java
package ink.neokoni.LightTickets.storage;

import ink.neokoni.LightTickets.model.Notification;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class NotificationStore {
    private final String dbPath;

    public NotificationStore(String dbPath) {
        this.dbPath = dbPath;
        initTable();
    }

    private Connection connect() throws SQLException {
        return DriverManager.getConnection("jdbc:sqlite:" + dbPath);
    }

    private void initTable() {
        try (Connection conn = connect(); Statement stmt = conn.createStatement()) {
            stmt.execute("""
                CREATE TABLE IF NOT EXISTS lt_notifications (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    player_uuid TEXT NOT NULL,
                    message TEXT NOT NULL,
                    created_at INTEGER NOT NULL
                )
                """);
        } catch (SQLException e) {
            throw new RuntimeException("Failed to initialize notification database", e);
        }
    }

    public void insert(String playerUuid, String message) {
        String sql = "INSERT INTO lt_notifications (player_uuid, message, created_at) VALUES (?, ?, ?)";
        try (Connection conn = connect(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, playerUuid);
            ps.setString(2, message);
            ps.setLong(3, System.currentTimeMillis());
            ps.executeUpdate();
        } catch (SQLException e) {
            // silently drop — notification failure should not crash the plugin
        }
    }

    public List<Notification> popAll(String playerUuid) {
        List<Notification> notifications = new ArrayList<>();
        String selectSql = "SELECT id, player_uuid, message, created_at FROM lt_notifications WHERE player_uuid = ? ORDER BY created_at ASC";
        String deleteSql = "DELETE FROM lt_notifications WHERE player_uuid = ?";

        try (Connection conn = connect()) {
            conn.setAutoCommit(false);
            try (PreparedStatement sel = conn.prepareStatement(selectSql)) {
                sel.setString(1, playerUuid);
                ResultSet rs = sel.executeQuery();
                while (rs.next()) {
                    notifications.add(new Notification(
                        rs.getInt("id"),
                        rs.getString("player_uuid"),
                        rs.getString("message"),
                        rs.getLong("created_at")
                    ));
                }
            }
            try (PreparedStatement del = conn.prepareStatement(deleteSql)) {
                del.setString(1, playerUuid);
                del.executeUpdate();
            }
            conn.commit();
        } catch (SQLException e) {
            // silently drop
        }
        return notifications;
    }

    public void close() {
        // No persistent connection to close — each method opens/closes its own
    }
}
```

- [ ] **Step 2: Verify build compiles**

Run: `cd plugin && ./gradlew classes 2>&1 | tail -5`
Expected: BUILD SUCCESSFUL

- [ ] **Step 3: Commit**

```bash
git add plugin/src/main/java/ink/neokoni/LightTickets/storage/NotificationStore.java
git commit -m "feat(plugin): add SQLite notification store for offline messages"
```

---

### Task 8: NotificationHandler

**Files:**
- Create: `plugin/src/main/java/ink/neokoni/LightTickets/handler/NotificationHandler.java`

- [ ] **Step 1: Create NotificationHandler.java**

```java
// plugin/src/main/java/ink/neokoni/LightTickets/handler/NotificationHandler.java
package ink.neokoni.LightTickets.handler;

import ink.neokoni.LightTickets.lang.LangManager;
import ink.neokoni.LightTickets.model.Notification;
import ink.neokoni.LightTickets.storage.NotificationStore;
import org.bukkit.Bukkit;
import org.bukkit.entity.Player;

import java.util.List;

public class NotificationHandler {
    private final NotificationStore store;
    private final LangManager lang;

    public NotificationHandler(NotificationStore store, LangManager lang) {
        this.store = store;
        this.lang = lang;
    }

    public void handlePermissionApproved(String playerUuid, String ticketId, String groupName) {
        String message = lang.format("notify-permission-approved",
            "{ticketId}", ticketId,
            "{groupName}", groupName != null ? groupName : "unknown"
        );
        deliver(playerUuid, message);
    }

    public void handlePermissionRejected(String playerUuid, String ticketId, String reason) {
        String message = lang.format("notify-permission-rejected",
            "{ticketId}", ticketId,
            "{reason}", reason != null ? reason : "无"
        );
        deliver(playerUuid, message);
    }

    public void handleStatusChanged(String playerUuid, String ticketId, String newStatus) {
        String statusName = switch (newStatus) {
            case "open" -> lang.get("status-open");
            case "in_progress" -> lang.get("status-in_progress");
            case "resolved" -> lang.get("status-resolved");
            case "closed" -> lang.get("status-closed");
            case "rejected" -> lang.get("status-rejected");
            default -> newStatus;
        };
        String message = lang.format("notify-ticket-status",
            "{ticketId}", ticketId,
            "{status}", statusName
        );
        deliver(playerUuid, message);
    }

    private void deliver(String playerUuid, String message) {
        Player player = Bukkit.getPlayer(java.util.UUID.fromString(playerUuid));
        if (player != null && player.isOnline()) {
            player.sendMessage(lang.prefix(message));
        } else {
            store.insert(playerUuid, message);
        }
    }

    public void deliverOfflineNotifications(Player player) {
        String uuid = player.getUniqueId().toString();
        List<Notification> notifications = store.popAll(uuid);
        if (notifications.isEmpty()) return;

        player.sendMessage(lang.prefix(lang.format("notify-offline-summary",
            "{count}", String.valueOf(notifications.size()))));
        for (Notification n : notifications) {
            player.sendMessage(lang.prefix(n.getMessage()));
        }
    }
}
```

- [ ] **Step 2: Verify build compiles**

Run: `cd plugin && ./gradlew classes 2>&1 | tail -5`
Expected: BUILD SUCCESSFUL

- [ ] **Step 3: Commit**

```bash
git add plugin/src/main/java/ink/neokoni/LightTickets/handler/NotificationHandler.java
git commit -m "feat(plugin): add NotificationHandler for online/offline message delivery"
```

---

### Task 9: LinkHandler

**Files:**
- Create: `plugin/src/main/java/ink/neokoni/LightTickets/handler/LinkHandler.java`

- [ ] **Step 1: Create LinkHandler.java**

```java
// plugin/src/main/java/ink/neokoni/LightTickets/handler/LinkHandler.java
package ink.neokoni.LightTickets.handler;

import ink.neokoni.LightTickets.lang.LangManager;
import ink.neokoni.LightTickets.network.ApiClient;
import ink.neokoni.LightTickets.network.ApiException;
import org.bukkit.entity.Player;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class LinkHandler {
    private final ApiClient api;
    private final LangManager lang;
    private final Map<String, Boolean> pendingLinks = new ConcurrentHashMap<>();

    public LinkHandler(ApiClient api, LangManager lang) {
        this.api = api;
        this.lang = lang;
    }

    public void startLink(Player player) {
        String uuid = player.getUniqueId().toString();
        pendingLinks.put(uuid, false);

        api.generateLinkCode(uuid, player.getName())
            .thenAccept(code -> {
                player.sendMessage(lang.prefix(lang.format("cmd-link-code", "{code}", code)));
                player.sendMessage(lang.prefix(lang.get("cmd-link-pending")));
                pollConfirmation(player, uuid);
            })
            .exceptionally(ex -> {
                player.sendMessage(lang.prefix(lang.get("error-api-failed")));
                pendingLinks.remove(uuid);
                return null;
            });
    }

    private void pollConfirmation(Player player, String uuid) {
        Bukkit.getScheduler().runTaskTimerAsynchronously(
            ink.neokoni.LightTickets.LightTickets.getInstance(),
            () -> {
                if (!pendingLinks.containsKey(uuid)) return;
                if (!player.isOnline()) {
                    pendingLinks.remove(uuid);
                    return;
                }

                // Check if user has been linked by polling the API
                // If the player's UUID now has a linked account, the link is complete
                api.getMyTickets(uuid)
                    .thenAccept(tickets -> {
                        // Getting tickets successfully means the player is linked
                        if (pendingLinks.remove(uuid)) {
                            Bukkit.getScheduler().runTask(
                                ink.neokoni.LightTickets.LightTickets.getInstance(),
                                () -> player.sendMessage(lang.prefix(lang.format("cmd-link-success", "{name}", player.getName())))
                            );
                        }
                    })
                    .exceptionally(ex -> {
                        // Still not linked — continue polling if still pending
                        if (ex.getCause() instanceof ApiException apiEx && apiEx.getStatusCode() == 404) {
                            // Not linked yet, keep polling
                        }
                        return null;
                    });
            },
            0L, // initial delay
            100L // 5 seconds (20 ticks/sec * 5)
        );
    }

    // Import Bukkit inside the method to avoid top-level import conflict
    private static class Bukkit {
        static org.bukkit.Bukkit getScheduler() { return org.bukkit.Bukkit.getScheduler(); }
    }
}
```

Note: The `Bukkit` inner class is a simplification. In the actual implementation, use `org.bukkit.Bukkit` directly. The `pollConfirmation` uses `runTaskTimerAsynchronously` with a 5-second interval to check if the link was completed.

- [ ] **Step 2: Verify build compiles**

Run: `cd plugin && ./gradlew classes 2>&1 | tail -5`
Expected: BUILD SUCCESSFUL

- [ ] **Step 3: Commit**

```bash
git add plugin/src/main/java/ink/neokoni/LightTickets/handler/LinkHandler.java
git commit -m "feat(plugin): add LinkHandler for Minecraft account linking flow"
```

---

### Task 10: WebSocketClient

**Files:**
- Create: `plugin/src/main/java/ink/neokoni/LightTickets/network/WebSocketClient.java`

- [ ] **Step 1: Create WebSocketClient.java**

```java
// plugin/src/main/java/ink/neokoni/LightTickets/network/WebSocketClient.java
package ink.neokoni.LightTickets.network;

import ink.neokoni.LightTickets.config.PluginConfig;
import ink.neokoni.LightTickets.handler.NotificationHandler;
import io.socket.client.IO;
import io.socket.client.Socket;
import io.socket.emitter.Emitter;
import org.bukkit.Bukkit;
import org.json.JSONObject;

import java.net.URI;
import java.util.concurrent.atomic.AtomicInteger;

public class WebSocketClient {
    private final PluginConfig config;
    private final NotificationHandler notificationHandler;
    private Socket socket;
    private final AtomicInteger retryCount = new AtomicInteger(0);
    private boolean disabled = false;

    public WebSocketClient(PluginConfig config, NotificationHandler notificationHandler) {
        this.config = config;
        this.notificationHandler = notificationHandler;
    }

    public void connect() {
        if (disabled) return;

        try {
            URI serverUri = URI.create(config.getServerUrl());
            IO.Options options = IO.Options.builder()
                .setAuth(java.util.Map.of("serverKey", config.getServerKey()))
                .build();

            socket = IO.socket(serverUri.resolve("/mc"), options);
            registerListeners();
            socket.connect();
        } catch (Exception e) {
            scheduleReconnect();
        }
    }

    private void registerListeners() {
        socket.on(Socket.EVENT_CONNECT, args -> {
            retryCount.set(0);
        });

        socket.on(Socket.EVENT_DISCONNECT, args -> {
            scheduleReconnect();
        });

        socket.on(Socket.EVENT_CONNECT_ERROR, args -> {
            scheduleReconnect();
        });

        socket.on("permission:approved", (Object... args) -> {
            JSONObject data = (JSONObject) args[0];
            String ticketId = data.getString("ticketId");
            String playerUuid = data.getString("playerUuid");
            String groupName = data.optString("groupName", null);
            runOnMainThread(() -> notificationHandler.handlePermissionApproved(playerUuid, ticketId, groupName));
        });

        socket.on("permission:rejected", (Object... args) -> {
            JSONObject data = (JSONObject) args[0];
            String ticketId = data.getString("ticketId");
            String playerUuid = data.getString("playerUuid");
            String reason = data.optString("reason", null);
            runOnMainThread(() -> notificationHandler.handlePermissionRejected(playerUuid, ticketId, reason));
        });

        socket.on("ticket:status_changed", (Object... args) -> {
            JSONObject data = (JSONObject) args[0];
            String ticketId = data.getString("ticketId");
            String playerUuid = data.getString("playerUuid");
            String newStatus = data.getString("newStatus");
            runOnMainThread(() -> notificationHandler.handleStatusChanged(playerUuid, ticketId, newStatus));
        });
    }

    private void scheduleReconnect() {
        if (disabled) return;

        int retries = retryCount.incrementAndGet();
        if (retries > config.getMaxRetries()) {
            disabled = true;
            return;
        }

        long delay = config.getRetryInterval() * 60L * 20L; // minutes to ticks
        Bukkit.getScheduler().runTaskLater(
            ink.neokoni.LightTickets.LightTickets.getInstance(),
            () -> {
                if (socket != null) {
                    socket.disconnect();
                    socket.off();
                }
                connect();
            },
            delay
        );
    }

    private void runOnMainThread(Runnable action) {
        Bukkit.getScheduler().runTask(ink.neokoni.LightTickets.LightTickets.getInstance(), action);
    }

    public void disconnect() {
        disabled = true;
        if (socket != null) {
            socket.disconnect();
            socket.off();
        }
    }
}
```

- [ ] **Step 2: Verify build compiles**

Run: `cd plugin && ./gradlew classes 2>&1 | tail -5`
Expected: BUILD SUCCESSFUL

- [ ] **Step 3: Commit**

```bash
git add plugin/src/main/java/ink/neokoni/LightTickets/network/WebSocketClient.java
git commit -m "feat(plugin): add Socket.io WebSocket client with auto-reconnect"
```

---

### Task 11: CommandRegistry + All Commands

**Files:**
- Create: `plugin/src/main/java/ink/neokoni/LightTickets/command/CommandRegistry.java`
- Create: `plugin/src/main/java/ink/neokoni/LightTickets/command/GuiCommand.java`
- Create: `plugin/src/main/java/ink/neokoni/LightTickets/command/CreateCommand.java`
- Create: `plugin/src/main/java/ink/neokoni/LightTickets/command/TicketCommand.java`
- Create: `plugin/src/main/java/ink/neokoni/LightTickets/command/CommentCommand.java`
- Create: `plugin/src/main/java/ink/neokoni/LightTickets/command/LinkCommand.java`
- Create: `plugin/src/main/java/ink/neokoni/LightTickets/command/HelpCommand.java`

- [ ] **Step 1: Create CommandRegistry.java**

```java
// plugin/src/main/java/ink/neokoni/LightTickets/command/CommandRegistry.java
package ink.neokoni.LightTickets.command;

import com.mojang.brigadier.CommandDispatcher;
import ink.neokoni.LightTickets.LightTickets;
import ink.neokoni.LightTickets.config.PluginConfig;
import ink.neokoni.LightTickets.handler.LinkHandler;
import ink.neokoni.LightTickets.lang.LangManager;
import ink.neokoni.LightTickets.network.ApiClient;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;

public class CommandRegistry implements CommandExecutor {
    private final LightTickets plugin;
    private final ApiClient api;
    private final PluginConfig config;
    private final LangManager lang;
    private final LinkHandler linkHandler;

    public CommandRegistry(LightTickets plugin, ApiClient api, PluginConfig config, LangManager lang, LinkHandler linkHandler) {
        this.plugin = plugin;
        this.api = api;
        this.config = config;
        this.lang = lang;
        this.linkHandler = linkHandler;
    }

    public void register() {
        plugin.getCommand("lt").setExecutor(this);
    }

    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (!(sender instanceof Player player)) {
            sender.sendMessage("This command can only be used by players.");
            return true;
        }

        if (args.length == 0) {
            // /lt → open main menu
            if (!checkPermission(player, "menu")) return true;
            openMainMenu(player);
            return true;
        }

        String sub = args[0].toLowerCase();
        return switch (sub) {
            case "create" -> new CreateCommand(api, lang, plugin).execute(player, args);
            case "tickets" -> new TicketCommand(api, lang, plugin).executeList(player);
            case "ticket" -> new TicketCommand(api, lang, plugin).executeDetail(player, args);
            case "comment" -> new CommentCommand(api, lang, plugin).execute(player, args);
            case "link" -> {
                if (!checkPermission(player, "link")) yield true;
                linkHandler.startLink(player);
                yield true;
            }
            case "help" -> new HelpCommand(lang).execute(player);
            default -> {
                player.sendMessage(lang.prefix(lang.get("cmd-help")));
                yield true;
            }
        };
    }

    private boolean checkPermission(Player player, String node) {
        if (player.hasPermission("lighttickets." + node) || player.hasPermission("lighttickets.use")) {
            return true;
        }
        player.sendMessage(lang.prefix(lang.get("no-permission")));
        return false;
    }

    private void openMainMenu(Player player) {
        // Will be called from GUI system — for now, delegate to tickets list
        new TicketCommand(api, lang, plugin).executeList(player);
    }
}
```

- [ ] **Step 2: Create HelpCommand.java**

```java
// plugin/src/main/java/ink/neokoni/LightTickets/command/HelpCommand.java
package ink.neokoni.LightTickets.command;

import ink.neokoni.LightTickets.lang.LangManager;
import org.bukkit.entity.Player;

public class HelpCommand {
    private final LangManager lang;

    public HelpCommand(LangManager lang) {
        this.lang = lang;
    }

    public boolean execute(Player player) {
        for (String line : lang.get("cmd-help").split("\n")) {
            player.sendMessage(line);
        }
        return true;
    }
}
```

- [ ] **Step 3: Create TicketCommand.java**

```java
// plugin/src/main/java/ink/neokoni/LightTickets/command/TicketCommand.java
package ink.neokoni.LightTickets.command;

import ink.neokoni.LightTickets.LightTickets;
import ink.neokoni.LightTickets.lang.LangManager;
import ink.neokoni.LightTickets.model.Ticket;
import ink.neokoni.LightTickets.network.ApiClient;
import ink.neokoni.LightTickets.network.ApiException;
import org.bukkit.entity.Player;

import java.util.List;

public class TicketCommand {
    private final ApiClient api;
    private final LangManager lang;
    private final LightTickets plugin;

    public TicketCommand(ApiClient api, LangManager lang, LightTickets plugin) {
        this.api = api;
        this.lang = lang;
        this.plugin = plugin;
    }

    public boolean executeList(Player player) {
        String uuid = player.getUniqueId().toString();
        api.getMyTickets(uuid)
            .thenAccept(tickets -> {
                org.bukkit.Bukkit.getScheduler().runTask(plugin, () -> {
                    if (tickets.isEmpty()) {
                        player.sendMessage(lang.prefix(lang.get("cmd-tickets-empty")));
                        return;
                    }
                    player.sendMessage(lang.prefix(lang.get("cmd-tickets-header")));
                    for (Ticket t : tickets) {
                        player.sendMessage(lang.format("cmd-tickets-item",
                            "{id}", t.getId(),
                            "{title}", t.getTitle(),
                            "{status}", t.getStatusName()
                        ));
                    }
                });
            })
            .exceptionally(ex -> {
                org.bukkit.Bukkit.getScheduler().runTask(plugin, () -> {
                    player.sendMessage(lang.prefix(lang.get("error-api-failed")));
                });
                return null;
            });
        return true;
    }

    public boolean executeDetail(Player player, String[] args) {
        if (args.length < 2) {
            player.sendMessage(lang.prefix("用法：/lt ticket <id>"));
            return true;
        }
        // For TUI detail, we need to fetch ticket by ID — use the list endpoint and filter
        // since the MC API only has getMyTickets(uuid) and createTicket
        String uuid = player.getUniqueId().toString();
        String ticketId = args[1];

        api.getMyTickets(uuid)
            .thenAccept(tickets -> {
                org.bukkit.Bukkit.getScheduler().runTask(plugin, () -> {
                    Ticket found = tickets.stream()
                        .filter(t -> t.getId().equals(ticketId))
                        .findFirst()
                        .orElse(null);

                    if (found == null) {
                        player.sendMessage(lang.prefix(lang.format("error-ticket-not-found", "{ticketId}", ticketId)));
                        return;
                    }

                    player.sendMessage(lang.prefix(lang.format("cmd-ticket-header", "{id}", found.getId())));
                    player.sendMessage(lang.format("cmd-ticket-title", "{title}", found.getTitle()));
                    player.sendMessage(lang.format("cmd-ticket-status", "{status}", found.getStatusName()));
                    player.sendMessage(lang.format("cmd-ticket-type", "{type}", found.getTypeName()));
                    player.sendMessage(lang.get("cmd-ticket-body"));
                    for (String line : found.getBody().split("\n")) {
                        player.sendMessage("  " + line);
                    }
                });
            })
            .exceptionally(ex -> {
                org.bukkit.Bukkit.getScheduler().runTask(plugin, () -> {
                    player.sendMessage(lang.prefix(lang.get("error-api-failed")));
                });
                return null;
            });
        return true;
    }
}
```

- [ ] **Step 4: Create CreateCommand.java**

```java
// plugin/src/main/java/ink/neokoni/LightTickets/command/CreateCommand.java
package ink.neokoni.LightTickets.command;

import ink.neokoni.LightTickets.LightTickets;
import ink.neokoni.LightTickets.lang.LangManager;
import ink.neokoni.LightTickets.network.ApiClient;
import org.bukkit.entity.Player;

public class CreateCommand {
    private final ApiClient api;
    private final LangManager lang;
    private final LightTickets plugin;

    public CreateCommand(ApiClient api, LangManager lang, LightTickets plugin) {
        this.api = api;
        this.lang = lang;
        this.plugin = plugin;
    }

    public boolean execute(Player player, String[] args) {
        if (args.length < 2) {
            player.sendMessage(lang.prefix("用法：/lt create <标题>"));
            return true;
        }

        // Join remaining args as title
        StringBuilder titleBuilder = new StringBuilder();
        for (int i = 1; i < args.length; i++) {
            if (i > 1) titleBuilder.append(" ");
            titleBuilder.append(args[i]);
        }
        String title = titleBuilder.toString();

        // Default to bug_report type; future: open GUI for type selection
        String uuid = player.getUniqueId().toString();
        api.createTicket(uuid, title, "Created via /lt create", "bug_report")
            .thenAccept(ticket -> {
                org.bukkit.Bukkit.getScheduler().runTask(plugin, () -> {
                    player.sendMessage(lang.prefix(lang.format("cmd-create-success",
                        "{ticketId}", ticket.getId(),
                        "{title}", ticket.getTitle()
                    )));
                });
            })
            .exceptionally(ex -> {
                org.bukkit.Bukkit.getScheduler().runTask(plugin, () -> {
                    player.sendMessage(lang.prefix(lang.get("error-api-failed")));
                });
                return null;
            });
        return true;
    }
}
```

- [ ] **Step 5: Create CommentCommand.java**

```java
// plugin/src/main/java/ink/neokoni/LightTickets/command/CommentCommand.java
package ink.neokoni.LightTickets.command;

import ink.neokoni.LightTickets.LightTickets;
import ink.neokoni.LightTickets.lang.LangManager;
import ink.neokoni.LightTickets.network.ApiClient;
import org.bukkit.entity.Player;

public class CommentCommand {
    private final ApiClient api;
    private final LangManager lang;
    private final LightTickets plugin;

    public CommentCommand(ApiClient api, LangManager lang, LightTickets plugin) {
        this.api = api;
        this.lang = lang;
        this.plugin = plugin;
    }

    public boolean execute(Player player, String[] args) {
        if (args.length < 3) {
            player.sendMessage(lang.prefix("用法：/lt comment <id> <内容>"));
            return true;
        }

        String ticketId = args[1];
        StringBuilder bodyBuilder = new StringBuilder();
        for (int i = 2; i < args.length; i++) {
            if (i > 2) bodyBuilder.append(" ");
            bodyBuilder.append(args[i]);
        }
        String body = bodyBuilder.toString();

        String uuid = player.getUniqueId().toString();
        api.addComment(uuid, ticketId, body)
            .thenRun(() -> {
                org.bukkit.Bukkit.getScheduler().runTask(plugin, () -> {
                    player.sendMessage(lang.prefix(lang.get("cmd-comment-success")));
                });
            })
            .exceptionally(ex -> {
                org.bukkit.Bukkit.getScheduler().runTask(plugin, () -> {
                    player.sendMessage(lang.prefix(lang.get("error-api-failed")));
                });
                return null;
            });
        return true;
    }
}
```

- [ ] **Step 6: Create LinkCommand.java (thin wrapper)**

```java
// plugin/src/main/java/ink/neokoni/LightTickets/command/LinkCommand.java
package ink.neokoni.LightTickets.command;

import ink.neokoni.LightTickets.handler.LinkHandler;
import org.bukkit.entity.Player;

public class LinkCommand {
    private final LinkHandler linkHandler;

    public LinkCommand(LinkHandler linkHandler) {
        this.linkHandler = linkHandler;
    }

    public boolean execute(Player player) {
        linkHandler.startLink(player);
        return true;
    }
}
```

- [ ] **Step 7: Register command in plugin.yml and verify build**

Add to `paper-plugin.yml` (append):

```yaml
commands:
  lt:
    description: LightTickets main command
    usage: /lt [subcommand]
    permission: lighttickets.use
```

Run: `cd plugin && ./gradlew classes 2>&1 | tail -5`
Expected: BUILD SUCCESSFUL

- [ ] **Step 8: Commit**

```bash
git add plugin/src/main/java/ink/neokoni/LightTickets/command/ plugin/src/main/resources/paper-plugin.yml
git commit -m "feat(plugin): add Brigadier-style command system with all subcommands"
```

---

### Task 12: GUI System — SlotAction, MenuManager, BaseMenu

**Files:**
- Create: `plugin/src/main/java/ink/neokoni/LightTickets/gui/SlotAction.java`
- Create: `plugin/src/main/java/ink/neokoni/LightTickets/gui/MenuManager.java`
- Create: `plugin/src/main/java/ink/neokoni/LightTickets/gui/BaseMenu.java`

- [ ] **Step 1: Create SlotAction.java**

```java
// plugin/src/main/java/ink/neokoni/LightTickets/gui/SlotAction.java
package ink.neokoni.LightTickets.gui;

import org.bukkit.inventory.ItemStack;

public class SlotAction {
    private final ItemStack item;
    private final Runnable onClick;

    public SlotAction(ItemStack item, Runnable onClick) {
        this.item = item;
        this.onClick = onClick;
    }

    public SlotAction(ItemStack item) {
        this(item, null);
    }

    public ItemStack getItem() { return item; }
    public Runnable getOnClick() { return onClick; }
    public boolean hasAction() { return onClick != null; }
}
```

- [ ] **Step 2: Create MenuManager.java**

```java
// plugin/src/main/java/ink/neokoni/LightTickets/gui/MenuManager.java
package ink.neokoni.LightTickets.gui;

import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.inventory.InventoryClickEvent;
import org.bukkit.event.inventory.InventoryCloseEvent;
import org.bukkit.inventory.Inventory;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

public class MenuManager implements Listener {
    private final Map<UUID, BaseMenu> openMenus = new ConcurrentHashMap<>();

    public void register(BaseMenu menu, Player player) {
        openMenus.put(player.getUniqueId(), menu);
    }

    public void unregister(Player player) {
        openMenus.remove(player.getUniqueId());
    }

    @EventHandler
    public void onInventoryClick(InventoryClickEvent event) {
        if (!(event.getWhoClicked() instanceof Player player)) return;
        BaseMenu menu = openMenus.get(player.getUniqueId());
        if (menu == null) return;
        if (!event.getView().getTitle().equals(menu.getTitle())) {
            openMenus.remove(player.getUniqueId());
            return;
        }

        event.setCancelled(true);
        int slot = event.getRawSlot();
        if (slot < 0 || slot >= menu.getInventory().getSize()) return;

        SlotAction action = menu.getAction(slot);
        if (action != null && action.hasAction()) {
            action.getOnClick().run();
        }
    }

    @EventHandler
    public void onInventoryClose(InventoryCloseEvent event) {
        if (!(event.getPlayer() instanceof Player player)) return;
        BaseMenu menu = openMenus.get(player.getUniqueId());
        if (menu != null && event.getView().getTitle().equals(menu.getTitle())) {
            openMenus.remove(player.getUniqueId());
        }
    }
}
```

- [ ] **Step 3: Create BaseMenu.java**

```java
// plugin/src/main/java/ink/neokoni/LightTickets/gui/BaseMenu.java
package ink.neokoni.LightTickets.gui;

import ink.neokoni.LightTickets.LightTickets;
import ink.neokoni.LightTickets.config.PluginConfig;
import ink.neokoni.LightTickets.lang.LangManager;
import org.bukkit.Bukkit;
import org.bukkit.Material;
import org.bukkit.entity.Player;
import org.bukkit.inventory.Inventory;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.ItemMeta;

import java.util.HashMap;
import java.util.Map;

public abstract class BaseMenu {
    protected final LightTickets plugin;
    protected final PluginConfig config;
    protected final LangManager lang;
    protected final String title;
    protected final int rows;
    protected int page = 0;
    protected final Map<Integer, SlotAction> slotActions = new HashMap<>();

    public BaseMenu(LightTickets plugin, PluginConfig config, LangManager lang, String title, int rows) {
        this.plugin = plugin;
        this.config = config;
        this.lang = lang;
        this.title = title;
        this.rows = Math.max(1, Math.min(6, rows));
    }

    protected abstract Map<Integer, SlotAction> render(Player player);

    public void open(Player player) {
        Inventory inv = Bukkit.createInventory(null, rows * 9, title);
        slotActions.clear();
        Map<Integer, SlotAction> actions = render(player);
        slotActions.putAll(actions);

        for (Map.Entry<Integer, SlotAction> entry : actions.entrySet()) {
            if (entry.getKey() < inv.getSize()) {
                inv.setItem(entry.getKey(), entry.getValue().getItem());
            }
        }

        plugin.getMenuManager().register(this, player);
        player.openInventory(inv);
    }

    public void refresh(Player player) {
        Inventory inv = player.getOpenInventory().getTopInventory();
        if (inv == null || !inv.getView().getTitle().equals(title)) return;

        slotActions.clear();
        Map<Integer, SlotAction> actions = render(player);
        slotActions.putAll(actions);

        // Clear and re-fill
        for (int i = 0; i < inv.getSize(); i++) {
            inv.setItem(i, null);
        }
        for (Map.Entry<Integer, SlotAction> entry : actions.entrySet()) {
            if (entry.getKey() < inv.getSize()) {
                inv.setItem(entry.getKey(), entry.getValue().getItem());
            }
        }
    }

    public void close(Player player) {
        player.closeInventory();
        plugin.getMenuManager().unregister(player);
    }

    public SlotAction getAction(int slot) {
        return slotActions.get(slot);
    }

    public String getTitle() { return title; }
    public Inventory getInventory() {
        return Bukkit.createInventory(null, rows * 9, title);
    }

    protected ItemStack placeholder() {
        ItemStack item = new ItemStack(Material.getMaterial("STAINED_GLASS_PANE") != null
            ? Material.STAINED_GLASS_PANE : Material.GRAY_STAINED_GLASS_PANE);
        ItemMeta meta = item.getItemMeta();
        meta.setDisplayName(" ");
        item.setItemMeta(meta);
        return item;
    }

    protected ItemStack createItem(Material material, String name, String... lore) {
        ItemStack item = new ItemStack(material);
        ItemMeta meta = item.getItemMeta();
        if (meta != null) {
            meta.setDisplayName(name);
            if (lore.length > 0) {
                meta.setLore(java.util.List.of(lore));
            }
            item.setItemMeta(meta);
        }
        return item;
    }

    protected int getPageStart() { return page * getPageSize(); }
    protected int getPageSize() { return (rows - 2) * 9; } // Reserve bottom row for nav
    public int getPage() { return page; }
    public void setPage(int page) { this.page = page; }
}
```

- [ ] **Step 4: Verify build compiles**

Run: `cd plugin && ./gradlew classes 2>&1 | tail -5`
Expected: BUILD SUCCESSFUL

- [ ] **Step 5: Commit**

```bash
git add plugin/src/main/java/ink/neokoni/LightTickets/gui/SlotAction.java plugin/src/main/java/ink/neokoni/LightTickets/gui/MenuManager.java plugin/src/main/java/ink/neokoni/LightTickets/gui/BaseMenu.java
git commit -m "feat(plugin): add GUI framework — SlotAction, MenuManager, BaseMenu"
```

---

### Task 13: Concrete Menus — MainMenu, TicketDetailMenu, CreateTicketMenu

**Files:**
- Create: `plugin/src/main/java/ink/neokoni/LightTickets/gui/MainMenu.java`
- Create: `plugin/src/main/java/ink/neokoni/LightTickets/gui/TicketDetailMenu.java`
- Create: `plugin/src/main/java/ink/neokoni/LightTickets/gui/CreateTicketMenu.java`

- [ ] **Step 1: Create MainMenu.java**

```java
// plugin/src/main/java/ink/neokoni/LightTickets/gui/MainMenu.java
package ink.neokoni.LightTickets.gui;

import ink.neokoni.LightTickets.LightTickets;
import ink.neokoni.LightTickets.config.PluginConfig;
import ink.neokoni.LightTickets.lang.LangManager;
import ink.neokoni.LightTickets.model.Ticket;
import ink.neokoni.LightTickets.network.ApiClient;
import org.bukkit.Material;
import org.bukkit.entity.Player;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class MainMenu extends BaseMenu {
    private final ApiClient api;
    private List<Ticket> tickets = List.of();

    public MainMenu(LightTickets plugin, PluginConfig config, LangManager lang, ApiClient api) {
        super(plugin, config, lang, "§6Light Tickets", 6);
        this.api = api;
    }

    @Override
    protected Map<Integer, SlotAction> render(Player player) {
        Map<Integer, SlotAction> actions = new HashMap<>();
        String uuid = player.getUniqueId().toString();

        // Fill placeholders
        for (int i = 0; i < rows * 9; i++) {
            actions.put(i, new SlotAction(placeholder()));
        }

        // Fetch tickets async, then refresh on main thread
        api.getMyTickets(uuid).thenAccept(ticketList -> {
            this.tickets = ticketList;
            org.bukkit.Bukkit.getScheduler().runTask(plugin, () -> refresh(player));
        }).exceptionally(ex -> {
            this.tickets = List.of();
            return null;
        });

        // Render current page
        int pageSize = getPageSize();
        int start = getPageStart();
        int end = Math.min(start + pageSize, tickets.size());

        for (int i = start; i < end; i++) {
            Ticket t = tickets.get(i);
            int slot = (i - start);
            if (slot >= pageSize) break;

            Material mat = switch (t.getStatus()) {
                case "open" -> Material.PAPER;
                case "in_progress" -> Material.BOOK;
                case "resolved" -> Material.ENCHANTED_BOOK;
                default -> Material.BARRIER;
            };

            SlotAction action = new SlotAction(
                createItem(mat, "§e#" + t.getId() + " " + t.getTitle(), "§7状态: " + t.getStatusName()),
                () -> new TicketDetailMenu(plugin, config, lang, api, t).open(player)
            );
            actions.put(slot, action);
        }

        // Create button (last row, center)
        int createSlot = (rows - 1) * 9 + 4;
        actions.put(createSlot, new SlotAction(
            createItem(Material.EMERALD, "§a创建新议题"),
            () -> new CreateTicketMenu(plugin, config, lang, api, player).open(player)
        ));

        // Pagination
        if (page > 0) {
            int prevSlot = (rows - 1) * 9;
            actions.put(prevSlot, new SlotAction(
                createItem(Material.ARROW, "§7上一页"),
                () -> { setPage(page - 1); refresh(player); }
            ));
        }
        if (end < tickets.size()) {
            int nextSlot = (rows - 1) * 9 + 8;
            actions.put(nextSlot, new SlotAction(
                createItem(Material.ARROW, "§7下一页"),
                () -> { setPage(page + 1); refresh(player); }
            ));
        }

        return actions;
    }
}
```

- [ ] **Step 2: Create TicketDetailMenu.java**

```java
// plugin/src/main/java/ink/neokoni/LightTickets/gui/TicketDetailMenu.java
package ink.neokoni.LightTickets.gui;

import ink.neokoni.LightTickets.LightTickets;
import ink.neokoni.LightTickets.config.PluginConfig;
import ink.neokoni.LightTickets.lang.LangManager;
import ink.neokoni.LightTickets.model.Ticket;
import ink.neokoni.LightTickets.network.ApiClient;
import org.bukkit.Material;
import org.bukkit.entity.Player;

import java.util.HashMap;
import java.util.Map;

public class TicketDetailMenu extends BaseMenu {
    private final ApiClient api;
    private final Ticket ticket;

    public TicketDetailMenu(LightTickets plugin, PluginConfig config, LangManager lang, ApiClient api, Ticket ticket) {
        super(plugin, config, lang, "§6#" + ticket.getId() + " " + ticket.getTitle(), 4);
        this.api = api;
        this.ticket = ticket;
    }

    @Override
    protected Map<Integer, SlotAction> render(Player player) {
        Map<Integer, SlotAction> actions = new HashMap<>();

        // Fill placeholders
        for (int i = 0; i < rows * 9; i++) {
            actions.put(i, new SlotAction(placeholder()));
        }

        // Info items (row 0-1)
        actions.put(10, new SlotAction(createItem(Material.NAME_TAG, "§f" + ticket.getTitle())));
        actions.put(11, new SlotAction(createItem(Material.BOOK, "§7状态: §f" + ticket.getStatusName())));
        actions.put(12, new SlotAction(createItem(Material.PAPER, "§7类型: §f" + ticket.getTypeName())));
        actions.put(13, new SlotAction(createItem(Material.REDSTONE, "§7优先级: §f" + ticket.getPriority())));

        // Body display (row 1-2, simplified)
        String[] bodyLines = ticket.getBody().split("\n");
        int bodySlot = 19;
        for (String line : bodyLines) {
            if (bodySlot >= 27) break;
            actions.put(bodySlot, new SlotAction(
                createItem(Material.PAPER, "§7" + line.substring(0, Math.min(line.length(), 50)))
            ));
            bodySlot++;
        }

        // Comment button (row 3)
        actions.put(31, new SlotAction(
            createItem(Material.FEATHER, "§a添加评论"),
            () -> {
                player.closeInventory();
                player.sendMessage(lang.prefix("§e请在聊天框输入评论内容："));
                // Register a chat listener for this player
                registerChatInput(player, ticket.getId());
            }
        ));

        // Back button
        actions.put(35, new SlotAction(
            createItem(Material.ARROW, "§7返回主菜单"),
            () -> new MainMenu(plugin, config, lang, api).open(player)
        ));

        return actions;
    }

    private void registerChatInput(Player player, String ticketId) {
        org.bukkit.event.Listener listener = new org.bukkit.event.Listener() {};
        org.bukkit.plugin.PluginManager pm = org.bukkit.Bukkit.getPluginManager();

        pm.registerEvents(new org.bukkit.event.Listener() {
            @org.bukkit.event.EventHandler
            public void onChat(org.bukkit.event.player.AsyncPlayerChatEvent event) {
                if (!event.getPlayer().getUniqueId().equals(player.getUniqueId())) return;
                event.setCancelled(true);
                String body = event.getMessage();
                org.bukkit.Bukkit.getScheduler().runTask(plugin, () -> player.closeInventory());

                api.addComment(player.getUniqueId().toString(), ticketId, body)
                    .thenRun(() -> org.bukkit.Bukkit.getScheduler().runTask(plugin, () -> {
                        player.sendMessage(lang.prefix(lang.get("cmd-comment-success")));
                    }))
                    .exceptionally(ex -> {
                        org.bukkit.Bukkit.getScheduler().runTask(plugin, () -> {
                            player.sendMessage(lang.prefix(lang.get("error-api-failed")));
                        });
                        return null;
                    });

                org.bukkit.Bukkit.getPluginManager().unregisterEvents(this, plugin);
            }
        }, plugin);
    }
}
```

- [ ] **Step 3: Create CreateTicketMenu.java**

```java
// plugin/src/main/java/ink/neokoni/LightTickets/gui/CreateTicketMenu.java
package ink.neokoni.LightTickets.gui;

import ink.neokoni.LightTickets.LightTickets;
import ink.neokoni.LightTickets.config.PluginConfig;
import ink.neokoni.LightTickets.lang.LangManager;
import ink.neokoni.LightTickets.network.ApiClient;
import org.bukkit.Material;
import org.bukkit.entity.Player;

import java.util.HashMap;
import java.util.Map;

public class CreateTicketMenu extends BaseMenu {
    private final ApiClient api;
    private final Player owner;
    private String selectedType = "bug_report";
    private String title = "";
    private final StringBuilder bodyBuilder = new StringBuilder();

    public CreateTicketMenu(LightTickets plugin, PluginConfig config, LangManager lang, ApiClient api, Player owner) {
        super(plugin, config, lang, "§6创建新议题", 4);
        this.api = api;
        this.owner = owner;
    }

    @Override
    protected Map<Integer, SlotAction> render(Player player) {
        Map<Integer, SlotAction> actions = new HashMap<>();

        for (int i = 0; i < rows * 9; i++) {
            actions.put(i, new SlotAction(placeholder()));
        }

        // Type selection (row 1)
        actions.put(11, typeButton(Material.BEACON, "§cBug报告", "bug_report"));
        actions.put(12, typeButton(Material.EMERALD, "§a权限申请", "permission_request"));
        actions.put(13, typeButton(Material.BOOK, "§b建议", "suggestion"));
        actions.put(14, typeButton(Material.BLAZE_POWDER, "§e举报", "report"));

        // Title display
        String displayTitle = title.isEmpty() ? "§7点击输入标题" : "§f" + title;
        actions.put(22, new SlotAction(
            createItem(Material.NAME_TAG, displayTitle),
            () -> {
                player.closeInventory();
                player.sendMessage(lang.prefix(lang.get("cmd-create-enter-title")));
                registerTitleInput(player);
            }
        ));

        // Confirm button
        actions.put(31, new SlotAction(
            createItem(Material.LIME_WOOL, "§a确认创建"),
            () -> {
                if (title.isEmpty()) {
                    player.sendMessage(lang.prefix("§c请先输入标题"));
                    return;
                }
                player.closeInventory();
                api.createTicket(player.getUniqueId().toString(), title,
                        bodyBuilder.isEmpty() ? "Created via GUI" : bodyBuilder.toString(), selectedType)
                    .thenAccept(ticket -> org.bukkit.Bukkit.getScheduler().runTask(plugin, () -> {
                        player.sendMessage(lang.prefix(lang.format("cmd-create-success",
                            "{ticketId}", ticket.getId(),
                            "{title}", ticket.getTitle()
                        )));
                    }))
                    .exceptionally(ex -> {
                        org.bukkit.Bukkit.getScheduler().runTask(plugin, () -> {
                            player.sendMessage(lang.prefix(lang.get("error-api-failed")));
                        });
                        return null;
                    });
            }
        ));

        // Cancel button
        actions.put(35, new SlotAction(
            createItem(Material.RED_WOOL, "§c取消"),
            () -> {
                player.closeInventory();
                player.sendMessage(lang.prefix(lang.get("cmd-create-cancelled")));
            }
        ));

        return actions;
    }

    private SlotAction typeButton(Material material, String name, String type) {
        boolean isSelected = selectedType.equals(type);
        String displayName = isSelected ? name + " ✓" : name;
        return new SlotAction(
            createItem(material, displayName),
            () -> {
                selectedType = type;
                refresh(owner);
            }
        );
    }

    private void registerTitleInput(Player player) {
        org.bukkit.Bukkit.getPluginManager().registerEvents(new org.bukkit.event.Listener() {
            @org.bukkit.event.EventHandler
            public void onChat(org.bukkit.event.player.AsyncPlayerChatEvent event) {
                if (!event.getPlayer().getUniqueId().equals(player.getUniqueId())) return;
                event.setCancelled(true);
                title = event.getMessage();
                org.bukkit.Bukkit.getScheduler().runTask(plugin, () -> open(player));
                org.bukkit.Bukkit.getPluginManager().unregisterEvents(this, plugin);
            }
        }, plugin);
    }
}
```

- [ ] **Step 4: Verify build compiles**

Run: `cd plugin && ./gradlew classes 2>&1 | tail -5`
Expected: BUILD SUCCESSFUL

- [ ] **Step 5: Commit**

```bash
git add plugin/src/main/java/ink/neokoni/LightTickets/gui/MainMenu.java plugin/src/main/java/ink/neokoni/LightTickets/gui/TicketDetailMenu.java plugin/src/main/java/ink/neokoni/LightTickets/gui/CreateTicketMenu.java
git commit -m "feat(plugin): add MainMenu, TicketDetailMenu, CreateTicketMenu"
```

---

### Task 14: Plugin Entry Point — LightTickets.java

**Files:**
- Create: `plugin/src/main/java/ink/neokoni/LightTickets/LightTickets.java`

- [ ] **Step 1: Create LightTickets.java**

```java
// plugin/src/main/java/ink/neokoni/LightTickets/LightTickets.java
package ink.neokoni.LightTickets;

import ink.neokoni.LightTickets.command.CommandRegistry;
import ink.neokoni.LightTickets.config.PluginConfig;
import ink.neokoni.LightTickets.gui.MainMenu;
import ink.neokoni.LightTickets.gui.MenuManager;
import ink.neokoni.LightTickets.handler.LinkHandler;
import ink.neokoni.LightTickets.handler.NotificationHandler;
import ink.neokoni.LightTickets.lang.LangManager;
import ink.neokoni.LightTickets.network.ApiClient;
import ink.neokoni.LightTickets.network.WebSocketClient;
import ink.neokoni.LightTickets.storage.NotificationStore;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerJoinEvent;
import org.bukkit.plugin.java.JavaPlugin;

import java.io.File;

public class LightTickets extends JavaPlugin implements Listener {
    private static LightTickets instance;

    private PluginConfig pluginConfig;
    private LangManager langManager;
    private ApiClient apiClient;
    private WebSocketClient webSocketClient;
    private NotificationStore notificationStore;
    private NotificationHandler notificationHandler;
    private LinkHandler linkHandler;
    private MenuManager menuManager;
    private CommandRegistry commandRegistry;

    @Override
    public void onEnable() {
        instance = this;

        // Save default config/lang if not present
        saveDefaultConfig();
        saveResource("lang.yml", false);

        // Initialize config
        pluginConfig = new PluginConfig(getConfig());

        // Initialize lang
        langManager = new LangManager(getDataFolder());

        // Initialize network
        apiClient = new ApiClient(pluginConfig.getServerUrl(), pluginConfig.getServerKey());

        // Initialize storage
        File dbFile = new File(getDataFolder(), "notifications.db");
        notificationStore = new NotificationStore(dbFile.getAbsolutePath());

        // Initialize handlers
        notificationHandler = new NotificationHandler(notificationStore, langManager);
        linkHandler = new LinkHandler(apiClient, langManager);

        // Initialize GUI
        menuManager = new MenuManager();
        getServer().getPluginManager().registerEvents(menuManager, this);

        // Initialize commands
        commandRegistry = new CommandRegistry(this, apiClient, pluginConfig, langManager, linkHandler);
        commandRegistry.register();

        // Register player join listener
        getServer().getPluginManager().registerEvents(this, this);

        // Connect WebSocket
        webSocketClient = new WebSocketClient(pluginConfig, notificationHandler);
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

    @EventHandler
    public void onPlayerJoin(PlayerJoinEvent event) {
        if (!pluginConfig.isShowOnJoin()) return;
        Player player = event.getPlayer();

        // Deliver offline notifications asynchronously
        getServer().getScheduler().runTaskAsynchronously(this, () -> {
            getServer().getScheduler().runTask(this, () -> {
                notificationHandler.deliverOfflineNotifications(player);
            });
        });
    }

    // GUI access for CommandRegistry (opens main menu)
    public void openMainMenu(Player player) {
        MainMenu menu = new MainMenu(this, pluginConfig, langManager, apiClient);
        menu.open(player);
    }

    public static LightTickets getInstance() { return instance; }
    public MenuManager getMenuManager() { return menuManager; }
    public PluginConfig getPluginConfig() { return pluginConfig; }
    public LangManager getLangManager() { return langManager; }
    public ApiClient getApiClient() { return apiClient; }
}
```

- [ ] **Step 2: Update CommandRegistry to use plugin.openMainMenu**

In `CommandRegistry.java`, update the `openMainMenu` method:

```java
private void openMainMenu(Player player) {
    plugin.openMainMenu(player);
}
```

- [ ] **Step 3: Verify build compiles**

Run: `cd plugin && ./gradlew classes 2>&1 | tail -5`
Expected: BUILD SUCCESSFUL

- [ ] **Step 4: Commit**

```bash
git add plugin/src/main/java/ink/neokoni/LightTickets/LightTickets.java plugin/src/main/java/ink/neokoni/LightTickets/command/CommandRegistry.java
git commit -m "feat(plugin): add plugin entry point with full lifecycle management"
```

---

### Task 15: Final Build + Fix Compilation Issues

- [ ] **Step 1: Full clean build**

Run: `cd plugin && ./gradlew clean build 2>&1`
Expected: BUILD SUCCESSFUL, JAR at `plugin/build/LightTickets-1.0.0.jar`

- [ ] **Step 2: Fix any compilation errors**

If there are errors, fix them. Common issues:
- Missing imports (especially `java.util.concurrent.CompletableFuture` in ApiClient)
- `Material.STAINED_GLASS_PANE` doesn't exist in newer Paper — use `Material.GRAY_STAINED_GLASS_PANE`
- Socket.io client API differences — adjust `IO.Options.builder()` usage

- [ ] **Step 3: Rebuild until clean**

Run: `cd plugin && ./gradlew clean build 2>&1 | tail -10`
Expected: BUILD SUCCESSFUL

- [ ] **Step 4: Final commit with all fixes**

```bash
git add plugin/
git commit -m "fix(plugin): resolve compilation issues in final build pass"
```

---

### Task 16: Full Project Commit (No Commits Before Finish)

Since the user requested no commits until all work is done, all the individual commit steps above should be SKIPPED during execution. Instead, after Task 15 builds cleanly:

- [ ] **Step 1: Stage all plugin files**

```bash
git add plugin/
git add backend/src/services/ticket.service.ts  # if modified for status_changed event
```

- [ ] **Step 2: Create single commit**

```bash
git commit -m "feat(plugin): add Paper/Folia Minecraft plugin with full ticket management

- REST API client (OkHttp) for ticket CRUD, comments, account linking
- Socket.io WebSocket client with auto-reconnect for real-time notifications
- Brigadier command system: /lt create/tickets/ticket/comment/link/help
- GUI menu system: MainMenu, TicketDetailMenu, CreateTicketMenu
- Offline notification queue (SQLite)
- Configurable via config.yml and lang.yml
- Folia-compatible scheduler usage"
```

- [ ] **Step 3: Verify git status clean**

Run: `git status`
Expected: clean working tree (except any pre-existing untracked files)
