// Example API route showing runtime plugin usage
// File: app/api/admin/plugins/route.ts

import { NextRequest, NextResponse } from "next/server";
import { myCustomPlugin } from "../../../../lib/custom-plugin";
import { marketing } from "../../../../lib/marketing";

// GET /api/admin/plugins - List all loaded plugins
export async function GET() {
  try {
    const plugins = marketing.getPlugins();
    const pluginList = Array.from(plugins.entries()).map(([id, plugin]) => ({
      id,
      hasEndpoints: !!plugin.endpoints,
      hasMiddlewares: !!(plugin.middlewares && plugin.middlewares.length > 0),
    }));

    return NextResponse.json({
      isInitialized: marketing.isInitialized,
      plugins: pluginList,
      totalPlugins: pluginList.length,
    });
  } catch (error) {
    console.error("Failed to list plugins:", error);
    return NextResponse.json(
      { error: "Failed to list plugins" },
      { status: 500 }
    );
  }
}

// POST /api/admin/plugins - Add a plugin at runtime
export async function POST(request: NextRequest) {
  try {
    const { action, pluginId } = await request.json();

    if (action === "add-custom") {
      await marketing.addPlugin(myCustomPlugin());
      return NextResponse.json({
        success: true,
        message: "Custom plugin added successfully",
      });
    }

    if (action === "add-demo") {
      await marketing.addPlugin({
        id: "demo-runtime-plugin",
        init: () => {
          console.log("Demo runtime plugin loaded");
        },
        endpoints: {
          // Demo endpoints can be added here
        },
      });
      return NextResponse.json({
        success: true,
        message: "Demo plugin added successfully",
      });
    }

    if (action === "remove" && pluginId) {
      await marketing.removePlugin(pluginId);
      return NextResponse.json({
        success: true,
        message: `Plugin ${pluginId} removed successfully`,
      });
    }

    return NextResponse.json(
      { error: "Invalid action or missing parameters" },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to manage plugin",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
