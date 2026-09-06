"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = void 0;
exports.load = load;
exports.unload = unload;
const package_json_1 = __importDefault(require("../package.json"));
const utcp_server_1 = require("./utcp/utcp-server");
const config_manager_1 = require("./utcp/config-manager");
let utcpServer = null;
exports.methods = {
    openPanel() {
        Editor.Panel.open(package_json_1.default.name + '.configuration');
    },
    openPreviewPanel() {
        Editor.Panel.open(package_json_1.default.name + '.preview');
    },
    async restartServer(newPort) {
        if (utcpServer) {
            console.log(`[${package_json_1.default.name}] Restarting UTCP Server on port ${newPort}...`);
            utcpServer.stop();
            try {
                const actualPort = await utcpServer.start(newPort);
                console.log(`[${package_json_1.default.name}] UTCP Server restarted on port ${actualPort}`);
                // Используем менеджер конфигурации для обновления порта
                const configManager = (0, config_manager_1.getConfigManager)();
                await configManager.updatePort(actualPort);
            }
            catch (err) {
                console.error(`[${package_json_1.default.name}] Failed to restart UTCP Server:`, err);
            }
        }
    }
};
async function load() {
    // Initialize config manager
    const configManager = (0, config_manager_1.getConfigManager)();
    await configManager.initialize();
    utcpServer = new utcp_server_1.UtcpServerManager();
    let wasConfiguredPort = true;
    // Load port from profile, default to 0 (random free port) if not set
    let port = await Editor.Profile.getConfig(package_json_1.default.name, 'serverPort');
    if (typeof port !== 'number') {
        port = 0;
        wasConfiguredPort = false;
    }
    try {
        const actualPort = await utcpServer.start(port);
        console.log(`[${package_json_1.default.name}] UTCP Server started on port ${actualPort}`);
        // Automatically update the port in the configuration on startup
        await configManager.updatePort(actualPort);
        console.log(`[${package_json_1.default.name}] UTCP config automatically updated with port ${actualPort}`);
    }
    catch (err) {
        console.error(`[${package_json_1.default.name}] Failed to start UTCP Server:`, err);
    }
    if (!wasConfiguredPort) {
        Editor.Panel.open(package_json_1.default.name);
    }
}
function unload() {
    if (utcpServer) {
        console.log(`[${package_json_1.default.name}] Stopping UTCP Server...`);
        utcpServer.stop();
        utcpServer = null;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NvdXJjZS9tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQW9DQSxvQkE2QkM7QUFFRCx3QkFNQztBQXpFRCxtRUFBMEM7QUFDMUMsb0RBQXVEO0FBQ3ZELDBEQUF5RDtBQUV6RCxJQUFJLFVBQVUsR0FBNkIsSUFBSSxDQUFDO0FBR25DLFFBQUEsT0FBTyxHQUE0QztJQUU1RCxTQUFTO1FBQ0wsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsc0JBQVcsQ0FBQyxJQUFJLEdBQUcsZ0JBQWdCLENBQUMsQ0FBQztJQUMzRCxDQUFDO0lBRUQsZ0JBQWdCO1FBQ1osTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsc0JBQVcsQ0FBQyxJQUFJLEdBQUcsVUFBVSxDQUFDLENBQUM7SUFDckQsQ0FBQztJQUdELEtBQUssQ0FBQyxhQUFhLENBQUMsT0FBZTtRQUMvQixJQUFJLFVBQVUsRUFBRSxDQUFDO1lBQ2IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLHNCQUFXLENBQUMsSUFBSSxvQ0FBb0MsT0FBTyxLQUFLLENBQUMsQ0FBQztZQUNsRixVQUFVLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDbEIsSUFBSSxDQUFDO2dCQUNELE1BQU0sVUFBVSxHQUFHLE1BQU0sVUFBVSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDbkQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLHNCQUFXLENBQUMsSUFBSSxtQ0FBbUMsVUFBVSxFQUFFLENBQUMsQ0FBQztnQkFFakYsd0RBQXdEO2dCQUN4RCxNQUFNLGFBQWEsR0FBRyxJQUFBLGlDQUFnQixHQUFFLENBQUM7Z0JBQ3pDLE1BQU0sYUFBYSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUMvQyxDQUFDO1lBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztnQkFDWCxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksc0JBQVcsQ0FBQyxJQUFJLGtDQUFrQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQy9FLENBQUM7UUFDTCxDQUFDO0lBQ0wsQ0FBQztDQUNKLENBQUM7QUFFSyxLQUFLLFVBQVUsSUFBSTtJQUN0Qiw0QkFBNEI7SUFDNUIsTUFBTSxhQUFhLEdBQUcsSUFBQSxpQ0FBZ0IsR0FBRSxDQUFDO0lBQ3pDLE1BQU0sYUFBYSxDQUFDLFVBQVUsRUFBRSxDQUFDO0lBRWpDLFVBQVUsR0FBRyxJQUFJLCtCQUFpQixFQUFFLENBQUM7SUFFckMsSUFBSSxpQkFBaUIsR0FBRyxJQUFJLENBQUM7SUFDN0IscUVBQXFFO0lBQ3JFLElBQUksSUFBSSxHQUFHLE1BQU0sTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsc0JBQVcsQ0FBQyxJQUFJLEVBQUUsWUFBWSxDQUFDLENBQUM7SUFDMUUsSUFBSSxPQUFPLElBQUksS0FBSyxRQUFRLEVBQUUsQ0FBQztRQUMzQixJQUFJLEdBQUcsQ0FBQyxDQUFDO1FBQ1QsaUJBQWlCLEdBQUcsS0FBSyxDQUFDO0lBQzlCLENBQUM7SUFFRCxJQUFJLENBQUM7UUFDRCxNQUFNLFVBQVUsR0FBRyxNQUFNLFVBQVUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDaEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLHNCQUFXLENBQUMsSUFBSSxpQ0FBaUMsVUFBVSxFQUFFLENBQUMsQ0FBQztRQUUvRSxnRUFBZ0U7UUFDaEUsTUFBTSxhQUFhLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQzNDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxzQkFBVyxDQUFDLElBQUksaURBQWlELFVBQVUsRUFBRSxDQUFDLENBQUM7SUFDbkcsQ0FBQztJQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7UUFDWCxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksc0JBQVcsQ0FBQyxJQUFJLGdDQUFnQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQzdFLENBQUM7SUFFRCxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUNyQixNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxzQkFBVyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3hDLENBQUM7QUFDTCxDQUFDO0FBRUQsU0FBZ0IsTUFBTTtJQUNsQixJQUFJLFVBQVUsRUFBRSxDQUFDO1FBQ2IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLHNCQUFXLENBQUMsSUFBSSwyQkFBMkIsQ0FBQyxDQUFDO1FBQzdELFVBQVUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNsQixVQUFVLEdBQUcsSUFBSSxDQUFDO0lBQ3RCLENBQUM7QUFDTCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHBhY2thZ2VKU09OIGZyb20gJy4uL3BhY2thZ2UuanNvbic7XHJcbmltcG9ydCB7IFV0Y3BTZXJ2ZXJNYW5hZ2VyIH0gZnJvbSAnLi91dGNwL3V0Y3Atc2VydmVyJztcclxuaW1wb3J0IHsgZ2V0Q29uZmlnTWFuYWdlciB9IGZyb20gJy4vdXRjcC9jb25maWctbWFuYWdlcic7XHJcblxyXG5sZXQgdXRjcFNlcnZlcjogVXRjcFNlcnZlck1hbmFnZXIgfCBudWxsID0gbnVsbDtcclxuXHJcblxyXG5leHBvcnQgY29uc3QgbWV0aG9kczogeyBba2V5OiBzdHJpbmddOiAoLi4uYW55OiBhbnkpID0+IGFueSB9ID0ge1xyXG5cclxuICAgIG9wZW5QYW5lbCgpIHtcclxuICAgICAgICBFZGl0b3IuUGFuZWwub3BlbihwYWNrYWdlSlNPTi5uYW1lICsgJy5jb25maWd1cmF0aW9uJyk7XHJcbiAgICB9LFxyXG5cclxuICAgIG9wZW5QcmV2aWV3UGFuZWwoKSB7XHJcbiAgICAgICAgRWRpdG9yLlBhbmVsLm9wZW4ocGFja2FnZUpTT04ubmFtZSArICcucHJldmlldycpO1xyXG4gICAgfSxcclxuXHJcblxyXG4gICAgYXN5bmMgcmVzdGFydFNlcnZlcihuZXdQb3J0OiBudW1iZXIpIHtcclxuICAgICAgICBpZiAodXRjcFNlcnZlcikge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgWyR7cGFja2FnZUpTT04ubmFtZX1dIFJlc3RhcnRpbmcgVVRDUCBTZXJ2ZXIgb24gcG9ydCAke25ld1BvcnR9Li4uYCk7XHJcbiAgICAgICAgICAgIHV0Y3BTZXJ2ZXIuc3RvcCgpO1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYWN0dWFsUG9ydCA9IGF3YWl0IHV0Y3BTZXJ2ZXIuc3RhcnQobmV3UG9ydCk7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgWyR7cGFja2FnZUpTT04ubmFtZX1dIFVUQ1AgU2VydmVyIHJlc3RhcnRlZCBvbiBwb3J0ICR7YWN0dWFsUG9ydH1gKTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgLy8g0JjRgdC/0L7Qu9GM0LfRg9C10Lwg0LzQtdC90LXQtNC20LXRgCDQutC+0L3RhNC40LPRg9GA0LDRhtC40Lgg0LTQu9GPINC+0LHQvdC+0LLQu9C10L3QuNGPINC/0L7RgNGC0LBcclxuICAgICAgICAgICAgICAgIGNvbnN0IGNvbmZpZ01hbmFnZXIgPSBnZXRDb25maWdNYW5hZ2VyKCk7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCBjb25maWdNYW5hZ2VyLnVwZGF0ZVBvcnQoYWN0dWFsUG9ydCk7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgWyR7cGFja2FnZUpTT04ubmFtZX1dIEZhaWxlZCB0byByZXN0YXJ0IFVUQ1AgU2VydmVyOmAsIGVycik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbG9hZCgpIHtcclxuICAgIC8vIEluaXRpYWxpemUgY29uZmlnIG1hbmFnZXJcclxuICAgIGNvbnN0IGNvbmZpZ01hbmFnZXIgPSBnZXRDb25maWdNYW5hZ2VyKCk7XHJcbiAgICBhd2FpdCBjb25maWdNYW5hZ2VyLmluaXRpYWxpemUoKTtcclxuICAgIFxyXG4gICAgdXRjcFNlcnZlciA9IG5ldyBVdGNwU2VydmVyTWFuYWdlcigpO1xyXG5cclxuICAgIGxldCB3YXNDb25maWd1cmVkUG9ydCA9IHRydWU7XHJcbiAgICAvLyBMb2FkIHBvcnQgZnJvbSBwcm9maWxlLCBkZWZhdWx0IHRvIDAgKHJhbmRvbSBmcmVlIHBvcnQpIGlmIG5vdCBzZXRcclxuICAgIGxldCBwb3J0ID0gYXdhaXQgRWRpdG9yLlByb2ZpbGUuZ2V0Q29uZmlnKHBhY2thZ2VKU09OLm5hbWUsICdzZXJ2ZXJQb3J0Jyk7XHJcbiAgICBpZiAodHlwZW9mIHBvcnQgIT09ICdudW1iZXInKSB7XHJcbiAgICAgICAgcG9ydCA9IDA7XHJcbiAgICAgICAgd2FzQ29uZmlndXJlZFBvcnQgPSBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICB0cnkge1xyXG4gICAgICAgIGNvbnN0IGFjdHVhbFBvcnQgPSBhd2FpdCB1dGNwU2VydmVyLnN0YXJ0KHBvcnQpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGBbJHtwYWNrYWdlSlNPTi5uYW1lfV0gVVRDUCBTZXJ2ZXIgc3RhcnRlZCBvbiBwb3J0ICR7YWN0dWFsUG9ydH1gKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBBdXRvbWF0aWNhbGx5IHVwZGF0ZSB0aGUgcG9ydCBpbiB0aGUgY29uZmlndXJhdGlvbiBvbiBzdGFydHVwXHJcbiAgICAgICAgYXdhaXQgY29uZmlnTWFuYWdlci51cGRhdGVQb3J0KGFjdHVhbFBvcnQpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGBbJHtwYWNrYWdlSlNPTi5uYW1lfV0gVVRDUCBjb25maWcgYXV0b21hdGljYWxseSB1cGRhdGVkIHdpdGggcG9ydCAke2FjdHVhbFBvcnR9YCk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKGBbJHtwYWNrYWdlSlNPTi5uYW1lfV0gRmFpbGVkIHRvIHN0YXJ0IFVUQ1AgU2VydmVyOmAsIGVycik7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCF3YXNDb25maWd1cmVkUG9ydCkge1xyXG4gICAgICAgIEVkaXRvci5QYW5lbC5vcGVuKHBhY2thZ2VKU09OLm5hbWUpO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdW5sb2FkKCkge1xyXG4gICAgaWYgKHV0Y3BTZXJ2ZXIpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhgWyR7cGFja2FnZUpTT04ubmFtZX1dIFN0b3BwaW5nIFVUQ1AgU2VydmVyLi4uYCk7XHJcbiAgICAgICAgdXRjcFNlcnZlci5zdG9wKCk7XHJcbiAgICAgICAgdXRjcFNlcnZlciA9IG51bGw7XHJcbiAgICB9XHJcbn1cclxuIl19