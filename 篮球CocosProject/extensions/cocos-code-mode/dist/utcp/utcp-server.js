"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UtcpServerManager = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const decorators_1 = require("./decorators");
require("./tools/typescript-defenition");
require("./tools/get-properties-tool");
require("./tools/set-properties-tool");
require("./tools/asset-tools");
require("./tools/component-tools");
require("./tools/scene-tools");
require("./tools/editor-tools");
const asset_importers_1 = require("./utils/asset-importers");
const qs_1 = require("qs");
class UtcpServerManager {
    constructor() {
        this.app = (0, express_1.default)();
        (0, asset_importers_1.registerAllImporters)();
    }
    async start(port = 3000) {
        this.app.use((0, cors_1.default)());
        this.app.use(express_1.default.json());
        this.app.set("query parser", (queryString) => (0, qs_1.parse)(queryString, {
            decoder(value, defaultDecoder, charset, type) {
                const decoded = defaultDecoder(value);
                if (decoded === "true")
                    return true;
                if (decoded === "false")
                    return false;
                if (typeof decoded === "string" &&
                    decoded !== "" &&
                    !Number.isNaN(Number(decoded))) {
                    return Number(decoded);
                }
                if (decoded === "__null__")
                    return null;
                return decoded;
            }
        }));
        const tools = decorators_1.ToolRegistry.getTools();
        const toolInstances = new Map();
        const utcpTools = [];
        let currentPort = port;
        // Let's listen first to get the port if it's 0
        return new Promise((resolve, reject) => {
            this.server = this.app.listen(port, "127.0.0.1", () => {
                const addr = this.server.address();
                if (addr && typeof addr === 'object') {
                    currentPort = addr.port;
                }
                // Now register tools with the correct port
                this.registerTools(currentPort, tools, toolInstances, utcpTools);
                resolve(currentPort);
            });
            this.server.on('error', (err) => {
                reject(err);
            });
        });
    }
    registerTools(port, tools, toolInstances, utcpTools) {
        const baseUrl = `http://localhost:${port}`;
        // Initialize tool instances and build UTCP definitions
        for (const toolMeta of tools) {
            const ToolClass = toolMeta.target.constructor;
            let instance = toolInstances.get(ToolClass);
            if (!instance) {
                instance = new ToolClass();
                toolInstances.set(ToolClass, instance);
            }
            const toolDef = JSON.parse(JSON.stringify(toolMeta.tool));
            const toolUrlPath = toolDef.tool_call_template.url;
            toolDef.tool_call_template.url = `${baseUrl}${toolUrlPath}`;
            utcpTools.push(toolDef);
            // Register specific endpoint
            const handler = async (req, res) => {
                try {
                    const args = req.query;
                    let result = await toolMeta.method.apply(instance, [args]);
                    if (result === undefined || result === null) {
                        res.json(null);
                        return;
                    }
                    res.json(result);
                }
                catch (err) {
                    console.error(`Error in tool ${toolDef.name}:`, err);
                    res.status(500).json({ error: err.message });
                }
            };
            switch (toolDef.tool_call_template.http_method) {
                case 'POST':
                    this.app.post(toolUrlPath, handler);
                    break;
                case 'GET':
                    this.app.get(toolUrlPath, handler);
                    break;
                case 'DELETE':
                    this.app.delete(toolUrlPath, handler);
                    break;
                case 'PUT':
                    this.app.put(toolUrlPath, handler);
                    break;
                default:
                // throw new Error(`Unsupported HTTP method: ${toolDef.tool_call_template.http_method}`);
            }
        }
        // Serve UTCP Manual
        this.app.get('/utcp', (req, res) => {
            const manual = {
                utcp_version: "1.0.1",
                manual_version: "1.0.0",
                tools: utcpTools
            };
            res.json(manual);
        });
    }
    stop() {
        if (this.server) {
            this.server.close();
            console.log("UTCP Server stopped");
        }
    }
}
exports.UtcpServerManager = UtcpServerManager;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRjcC1zZXJ2ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvdXRjcC91dGNwLXNlcnZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxzREFBcUQ7QUFDckQsZ0RBQXdCO0FBQ3hCLDZDQUE0QztBQUM1Qyx5Q0FBdUM7QUFDdkMsdUNBQXFDO0FBQ3JDLHVDQUFxQztBQUNyQywrQkFBNkI7QUFDN0IsbUNBQWlDO0FBQ2pDLCtCQUE2QjtBQUM3QixnQ0FBOEI7QUFDOUIsNkRBQStEO0FBRS9ELDJCQUEyQjtBQUUzQixNQUFhLGlCQUFpQjtJQUkxQjtRQUNJLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBQSxpQkFBTyxHQUFFLENBQUM7UUFDckIsSUFBQSxzQ0FBb0IsR0FBRSxDQUFDO0lBQzNCLENBQUM7SUFFRCxLQUFLLENBQUMsS0FBSyxDQUFDLE9BQWUsSUFBSTtRQUMzQixJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFBLGNBQUksR0FBRSxDQUFDLENBQUM7UUFDckIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsaUJBQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQzdCLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLGNBQWMsRUFBRSxDQUFDLFdBQW1CLEVBQUUsRUFBRSxDQUNqRCxJQUFBLFVBQUssRUFBQyxXQUFXLEVBQUU7WUFDZixPQUFPLENBQUMsS0FBSyxFQUFFLGNBQWMsRUFBRSxPQUFPLEVBQUUsSUFBSTtnQkFDeEMsTUFBTSxPQUFPLEdBQUcsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUV0QyxJQUFJLE9BQU8sS0FBSyxNQUFNO29CQUFFLE9BQU8sSUFBSSxDQUFDO2dCQUNwQyxJQUFJLE9BQU8sS0FBSyxPQUFPO29CQUFFLE9BQU8sS0FBSyxDQUFDO2dCQUV0QyxJQUNJLE9BQU8sT0FBTyxLQUFLLFFBQVE7b0JBQzNCLE9BQU8sS0FBSyxFQUFF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RyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUU7WUFDL0IsTUFBTSxNQUFNLEdBQWU7Z0JBQ3ZCLFlBQVksRUFBRSxPQUFPO2dCQUNyQixjQUFjLEVBQUUsT0FBTztnQkFDdkIsS0FBSyxFQUFFLFNBQVM7YUFDbkIsQ0FBQztZQUNGLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDckIsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRUQsSUFBSTtRQUNBLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ2QsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNwQixPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLENBQUM7UUFDdkMsQ0FBQztJQUNMLENBQUM7Q0FDSjtBQXRJRCw4Q0FzSUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZXhwcmVzcywgeyBSZXF1ZXN0LCBSZXNwb25zZSB9IGZyb20gJ2V4cHJlc3MnO1xyXG5pbXBvcnQgY29ycyBmcm9tICdjb3JzJztcclxuaW1wb3J0IHsgVG9vbFJlZ2lzdHJ5IH0gZnJvbSAnLi9kZWNvcmF0b3JzJztcclxuaW1wb3J0ICcuL3Rvb2xzL3R5cGVzY3JpcHQtZGVmZW5pdGlvbic7XHJcbmltcG9ydCAnLi90b29scy9nZXQtcHJvcGVydGllcy10b29sJztcbmltcG9ydCAnLi90b29scy9zZXQtcHJvcGVydGllcy10b29sJztcbmltcG9ydCAnLi90b29scy9hc3NldC10b29scyc7XHJcbmltcG9ydCAnLi90b29scy9jb21wb25lbnQtdG9vbHMnO1xyXG5pbXBvcnQgJy4vdG9vbHMvc2NlbmUtdG9vbHMnO1xyXG5pbXBvcnQgJy4vdG9vbHMvZWRpdG9yLXRvb2xzJztcclxuaW1wb3J0IHsgcmVnaXN0ZXJBbGxJbXBvcnRlcnMgfSBmcm9tICcuL3V0aWxzL2Fzc2V0LWltcG9ydGVycyc7XHJcbmltcG9ydCB7IFRvb2wsIFV0Y3BNYW51YWwgfSBmcm9tICdAdXRjcC9zZGsnO1xyXG5pbXBvcnQgeyBwYXJzZSB9IGZyb20gJ3FzJztcclxuXHJcbmV4cG9ydCBjbGFzcyBVdGNwU2VydmVyTWFuYWdlciB7XHJcbiAgICBwcml2YXRlIGFwcDogZXhwcmVzcy5BcHBsaWNhdGlvbjtcclxuICAgIHByaXZhdGUgc2VydmVyOiBhbnk7XHJcblxyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5hcHAgPSBleHByZXNzKCk7XHJcbiAgICAgICAgcmVnaXN0ZXJBbGxJbXBvcnRlcnMoKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBzdGFydChwb3J0OiBudW1iZXIgPSAzMDAwKTogUHJvbWlzZTxudW1iZXI+IHtcclxuICAgICAgICB0aGlzLmFwcC51c2UoY29ycygpKTtcclxuICAgICAgICB0aGlzLmFwcC51c2UoZXhwcmVzcy5qc29uKCkpO1xyXG4gICAgICAgIHRoaXMuYXBwLnNldChcInF1ZXJ5IHBhcnNlclwiLCAocXVlcnlTdHJpbmc6IHN0cmluZykgPT5cclxuICAgICAgICAgICAgcGFyc2UocXVlcnlTdHJpbmcsIHtcclxuICAgICAgICAgICAgICAgIGRlY29kZXIodmFsdWUsIGRlZmF1bHREZWNvZGVyLCBjaGFyc2V0LCB0eXBlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGVjb2RlZCA9IGRlZmF1bHREZWNvZGVyKHZhbHVlKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRlY29kZWQgPT09IFwidHJ1ZVwiKSByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZGVjb2RlZCA9PT0gXCJmYWxzZVwiKSByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZW9mIGRlY29kZWQgPT09IFwic3RyaW5nXCIgJiZcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGVjb2RlZCAhPT0gXCJcIiAmJlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAhTnVtYmVyLmlzTmFOKE51bWJlcihkZWNvZGVkKSlcclxuICAgICAgICAgICAgICAgICAgICApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE51bWJlcihkZWNvZGVkKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkZWNvZGVkID09PSBcIl9fbnVsbF9fXCIpIHJldHVybiBudWxsO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGVjb2RlZDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSlcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBjb25zdCB0b29scyA9IFRvb2xSZWdpc3RyeS5nZXRUb29scygpO1xyXG4gICAgICAgIGNvbnN0IHRvb2xJbnN0YW5jZXMgPSBuZXcgTWFwPEZ1bmN0aW9uLCBhbnk+KCk7XHJcbiAgICAgICAgY29uc3QgdXRjcFRvb2xzOiBUb29sW10gPSBbXTtcclxuXHJcbiAgICAgICAgbGV0IGN1cnJlbnRQb3J0ID0gcG9ydDtcclxuXHJcbiAgICAgICAgLy8gTGV0J3MgbGlzdGVuIGZpcnN0IHRvIGdldCB0aGUgcG9ydCBpZiBpdCdzIDBcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLnNlcnZlciA9IHRoaXMuYXBwLmxpc3Rlbihwb3J0LCBcIjEyNy4wLjAuMVwiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBhZGRyID0gdGhpcy5zZXJ2ZXIuYWRkcmVzcygpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGFkZHIgJiYgdHlwZW9mIGFkZHIgPT09ICdvYmplY3QnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudFBvcnQgPSBhZGRyLnBvcnQ7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gTm93IHJlZ2lzdGVyIHRvb2xzIHdpdGggdGhlIGNvcnJlY3QgcG9ydFxyXG4gICAgICAgICAgICAgICAgdGhpcy5yZWdpc3RlclRvb2xzKGN1cnJlbnRQb3J0LCB0b29scywgdG9vbEluc3RhbmNlcywgdXRjcFRvb2xzKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKGN1cnJlbnRQb3J0KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHRoaXMuc2VydmVyLm9uKCdlcnJvcicsIChlcnI6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgcmVnaXN0ZXJUb29scyhwb3J0OiBudW1iZXIsIHRvb2xzOiBhbnlbXSwgdG9vbEluc3RhbmNlczogTWFwPEZ1bmN0aW9uLCBhbnk+LCB1dGNwVG9vbHM6IFRvb2xbXSkge1xyXG4gICAgICAgIGNvbnN0IGJhc2VVcmwgPSBgaHR0cDovL2xvY2FsaG9zdDoke3BvcnR9YDtcclxuXHJcbiAgICAgICAgLy8gSW5pdGlhbGl6ZSB0b29sIGluc3RhbmNlcyBhbmQgYnVpbGQgVVRDUCBkZWZpbml0aW9uc1xyXG4gICAgICAgIGZvciAoY29uc3QgdG9vbE1ldGEgb2YgdG9vbHMpIHtcclxuICAgICAgICAgICAgY29uc3QgVG9vbENsYXNzID0gdG9vbE1ldGEudGFyZ2V0LmNvbnN0cnVjdG9yO1xyXG4gICAgICAgICAgICBsZXQgaW5zdGFuY2UgPSB0b29sSW5zdGFuY2VzLmdldChUb29sQ2xhc3MpO1xyXG4gICAgICAgICAgICBpZiAoIWluc3RhbmNlKSB7XHJcbiAgICAgICAgICAgICAgICBpbnN0YW5jZSA9IG5ldyBUb29sQ2xhc3MoKTtcclxuICAgICAgICAgICAgICAgIHRvb2xJbnN0YW5jZXMuc2V0KFRvb2xDbGFzcywgaW5zdGFuY2UpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBjb25zdCB0b29sRGVmID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeSh0b29sTWV0YS50b29sKSk7XHJcbiAgICAgICAgICAgIGNvbnN0IHRvb2xVcmxQYXRoID0gdG9vbERlZi50b29sX2NhbGxfdGVtcGxhdGUudXJsO1xyXG5cclxuICAgICAgICAgICAgdG9vbERlZi50b29sX2NhbGxfdGVtcGxhdGUudXJsID0gYCR7YmFzZVVybH0ke3Rvb2xVcmxQYXRofWA7XHJcblxyXG4gICAgICAgICAgICB1dGNwVG9vbHMucHVzaCh0b29sRGVmKTtcclxuXHJcbiAgICAgICAgICAgIC8vIFJlZ2lzdGVyIHNwZWNpZmljIGVuZHBvaW50XHJcbiAgICAgICAgICAgIGNvbnN0IGhhbmRsZXIgPSBhc3luYyAocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFyZ3MgPSByZXEucXVlcnk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGxldCByZXN1bHQgPSBhd2FpdCB0b29sTWV0YS5tZXRob2QuYXBwbHkoaW5zdGFuY2UsIFthcmdzXSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQgPT09IHVuZGVmaW5lZCB8fCByZXN1bHQgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzLmpzb24obnVsbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHJlcy5qc29uKHJlc3VsdCk7XHJcblxyXG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBFcnJvciBpbiB0b29sICR7dG9vbERlZi5uYW1lfTpgLCBlcnIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgc3dpdGNoICh0b29sRGVmLnRvb2xfY2FsbF90ZW1wbGF0ZS5odHRwX21ldGhvZCkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnUE9TVCc6XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hcHAucG9zdCh0b29sVXJsUGF0aCwgaGFuZGxlcik7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdHRVQnOlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYXBwLmdldCh0b29sVXJsUGF0aCwgaGFuZGxlcik7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdERUxFVEUnOlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYXBwLmRlbGV0ZSh0b29sVXJsUGF0aCwgaGFuZGxlcik7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdQVVQnOlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYXBwLnB1dCh0b29sVXJsUGF0aCwgaGFuZGxlcik7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgLy8gdGhyb3cgbmV3IEVycm9yKGBVbnN1cHBvcnRlZCBIVFRQIG1ldGhvZDogJHt0b29sRGVmLnRvb2xfY2FsbF90ZW1wbGF0ZS5odHRwX21ldGhvZH1gKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gU2VydmUgVVRDUCBNYW51YWxcclxuICAgICAgICB0aGlzLmFwcC5nZXQoJy91dGNwJywgKHJlcSwgcmVzKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IG1hbnVhbDogVXRjcE1hbnVhbCA9IHtcclxuICAgICAgICAgICAgICAgIHV0Y3BfdmVyc2lvbjogXCIxLjAuMVwiLFxyXG4gICAgICAgICAgICAgICAgbWFudWFsX3ZlcnNpb246IFwiMS4wLjBcIixcclxuICAgICAgICAgICAgICAgIHRvb2xzOiB1dGNwVG9vbHNcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgcmVzLmpzb24obWFudWFsKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBzdG9wKCkge1xyXG4gICAgICAgIGlmICh0aGlzLnNlcnZlcikge1xyXG4gICAgICAgICAgICB0aGlzLnNlcnZlci5jbG9zZSgpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIlVUQ1AgU2VydmVyIHN0b3BwZWRcIik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcbiJdfQ==