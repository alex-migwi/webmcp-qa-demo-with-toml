import { inject, Injector } from '@angular/core';
import { WebmcpService } from 'ng-webmcp';
//import * as toml from '@iarna/toml';
import { PaymentService } from './services/payment.service';
import { UserService } from './services/user.service';
import { parse } from 'smol-toml';

// Map TOML class names to actual classes
const CLASS_REGISTRY: Record<string, any> = {
  PaymentService: PaymentService,
  UserService: UserService,
  // Add new services here
};

export function provideWebMcpTomlLoader() {
  return async () => {
    const webmcp = inject(WebmcpService);
    const injector = inject(Injector);

    // Fetch and parse TOML (served from /assets)
    const res = await fetch('/assets/webmcp-tools.toml');
    if (!res.ok) {
      throw new Error(`Failed to load /assets/webmcp-tools.toml: ${res.status} ${res.statusText}`);
    }
    const configText = await res.text();
    const config = parse(configText) as any;

    for (const toolConfig of config.tools) {
      const TargetClass = CLASS_REGISTRY[toolConfig.class];
      if (!TargetClass) continue;

      const instance: any = injector.get(TargetClass);
      const proto = Object.getPrototypeOf(instance);

      // Get all method names
      const allMethods = Reflect.ownKeys(proto).filter(
        (key) => key !== 'constructor' && typeof proto[key] === 'function',
      ) as string[];

      // Strategy A vs B
      const methodsToRegister =
        toolConfig.mode === 'auto'
          ? allMethods
          : allMethods.filter((m) => toolConfig.methods?.includes(m));

      methodsToRegister.forEach((methodName) => {
        const toolName = `${toolConfig.class.toLowerCase()}_${methodName.toLowerCase()}`;
        const description =
          toolConfig.description_overrides?.[methodName] || `${methodName} on ${toolConfig.class}`;

        webmcp.registerTool(
          {
            name: toolName,
            description,
            inputSchema: { type: 'object', properties: {} }, // Simplified; refine as needed
          },
          async (args: any) => {
            console.log(`Executing tool ${toolName} with args:`, args);
            try {
              const result = await instance[methodName](args);
              return { content: [{ type: 'text', text: JSON.stringify(result) }] };
            } catch (e: any) {
                console.error(`Error registering tool ${toolName}:`, e);
              return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true };
            }
          },
        );
        console.log(`Registered tool: ${toolName} with description: ${description}`);
      });
    }
  };
}
