import fs from "fs";
import path from "path";
import colors from "picocolors";
import fullReload from "vite-plugin-full-reload";

let exitHandlersBound = false;

const defaultConfiguration = {
    "target-application": "App",
    "public-directory": "Public",
    "input": ["App/Assets/js/main.js"],
    "refresh": true,
    "defaultAliases": {
        "@": "/App/Assets/js"
    }
};

const refreshPaths = getSharpApplicationPathList().map(app => [
    `${app}/Assets/**`,
    `${app}/Views/**`,
    `${app}/Vue/**`,
])
.flat()
.filter( path => fs.existsSync(path.replace(/\*\*$/, "")) );

function sharp(pluginConfig={})
{
    pluginConfig = resolvePluginConfig(pluginConfig);
    return [
        resolveSharpPlugin(pluginConfig),
        ...resolveFullReloadConfig(pluginConfig)
    ];
}

function resolveSharpPlugin(pluginConfig)
{
    let viteDevServerUrl;
    let userConfig;
    let resolvedConfig;

    return {
        name: "sharp",
        enforce: "post",

        config(config, { command })
        {
            userConfig = config;

            const assetUrl = "/";

            ensureCommandShouldRunInEnvironment(command);

            return {
                base     : userConfig.base ?? (command === "build" ? resolveBase(pluginConfig, assetUrl) : ""),
                publicDir: userConfig.publicDir ?? false,
                build: {
                    manifest   : "manifest.json",
                    ssrManifest: false,
                    outDir     : pluginConfig.buildDirectory,
                    rollupOptions: { input: pluginConfig.input },
                    assetsInlineLimit: 0
                },
                server: {
                    origin: userConfig.server?.origin ?? "__sharp_vite_placeholder__",
                },
                resolve: {
                    alias: Array.isArray(userConfig.resolve?.alias) ? [
                        ...userConfig.resolve?.alias ?? [],
                        ...Object.keys(userConfig.defaultAliases).map((alias) => ({
                            find: alias,
                            replacement: userConfig.defaultAliases[alias]
                        }))
                    ] : {
                        ...userConfig.defaultAliases,
                        ...userConfig.resolve?.alias
                    }
                },
                ssr: {
                    noExternal: true
                }
            };
        },

        configResolved(config)
        {
            resolvedConfig = config;
        },

        transform(code)
        {
            if (resolvedConfig.command === "serve")
            {
                code = code.replace(/__sharp_vite_placeholder__/g, viteDevServerUrl);
                return pluginConfig.transformOnServe(code, viteDevServerUrl);
            }
        },

        configureServer(server)
        {
            server.httpServer?.once("listening", () =>
            {
                const address = server.httpServer?.address();
                const isAddressInfo = (x) => typeof x === "object";
                if (isAddressInfo(address))
                {
                    viteDevServerUrl = userConfig.server?.origin ?
                        userConfig.server.origin :
                        resolveDevServerUrl(address, server.config, userConfig);

                    fs.writeFileSync(pluginConfig.hotFile, `${viteDevServerUrl}${server.config.base.replace(/\/$/, "")}`);
                    setTimeout(() =>
                    {
                        server.config.logger.info(`\n  ${colors.blueBright(`${colors.bold("Sharp")} (${sharpVersion()})`)} - Sharp vite plugin (${colors.bold(`v0.2`)})`);
                        server.config.logger.info("");
                    }, 100);
                }
            });

            if (!exitHandlersBound)
            {
                exitHandlersBound = true;

                const clean = () => {
                    if (fs.existsSync(pluginConfig.hotFile))
                        fs.rmSync(pluginConfig.hotFile);

                };

                process.on("exit", clean);
                process.on("SIGINT",  () => process.exit());
                process.on("SIGTERM", () => process.exit());
                process.on("SIGHUP",  () => process.exit());
            }

            return () => server;
        }
    };
}


function ensureCommandShouldRunInEnvironment(command)
{
    let config = getSharpConfiguration();
    let env = (config.environment ?? "debug").toLowerCase();
    if ((command !== "build") && env.startsWith("prod"))
        throw Error("You should not run the Vite server on production environment ! Please use `npm run build` to build your js files");
}


function sharpVersion()
{
    try
    {
        const composer = JSON.parse(fs.readFileSync("composer.lock").toString());
        return composer.packages?.find((composerPackage) => composerPackage.name === "yonis-savary/sharp")?.version ?? "";
    }
    catch
    {
        return "";
    }
}


function resolvePluginConfig(config={})
{
    if (typeof config === "undefined")
        config = {};

    if (typeof config === "string" || Array.isArray(config))
        config = { input: config, ssr: config };

    if (typeof config.input === "undefined")
        throw new Error('sharp-vite-plugin: missing configuration for "input".');

    if (typeof config.buildDirectory === "string")
    {
        config.buildDirectory = config.buildDirectory.trim().replace(/^\/+/, "").replace(/\/+$/, "");
        if (config.buildDirectory === "")
            throw new Error("sharp-vite-plugin: 'buildDirectory' must be a subdirectory. E.g. 'build'.");
    }

    if (config.refresh === true)
        config.refresh = [{ paths: refreshPaths }];

    return {
        input             : config.input,
        buildDirectory    : path.join(config["target-application"], "Assets", "build"),
        refresh           : config.refresh,
        hotFile           : config.hotFile ?? path.join(config["public-directory"] ?? "Public", "vitehost"),
        transformOnServe  : config.transformOnServe ?? (code => code)
    };
}


function resolveBase(config, assetUrl)
{
    return assetUrl + (!assetUrl.endsWith("/") ? "/" : "") + config.buildDirectory + "/";
}




function resolveFullReloadConfig({ refresh: config })
{
    if (typeof config === "boolean")
        return [];

    if (typeof config === "string")
        config = [{ paths: [config] }];

    if (!Array.isArray(config))
        config = [config];

    if (config.some((c) => typeof c === "string"))
        config = [{ paths: config }];

    return config.flatMap((c) => {
        const plugin = fullReload(c.paths, c.config);
        plugin.__sharp_plugin_config = c;
        return plugin;
    });
}


function resolveDevServerUrl(address, config)
{
    const configHmrProtocol   = (typeof config.server.hmr === "object") ? config.server.hmr.protocol : null;
    const configHmrHost       = (typeof config.server.hmr === "object") ? config.server.hmr.host : null;
    const configHmrClientPort = (typeof config.server.hmr === "object") ? config.server.hmr.clientPort : null;

    const configHost          = (typeof config.server.host === "string") ? config.server.host : null;

    const clientProtocol      = configHmrProtocol ? (configHmrProtocol === "wss" ? "https" : "http") : null;
    const serverProtocol      = config.server.https ? "https" : "http";
    const serverAddress       = isIpv6(address) ? `[${address.address}]` : address.address;

    const protocol            = clientProtocol ?? serverProtocol;
    const host                = configHmrHost ?? configHost ?? serverAddress;
    const port                = configHmrClientPort ?? address.port;

    return `${protocol}://${host}:${port}`;
}

function resolveSharpBuildConfiguration()
{
    const configuration = getSharpConfiguration();

    if (!('vite-build' in configuration))
        throw new Error("Please configure the 'vite-build' key in your sharp configuration");

    return {
        ...defaultConfiguration,
        ...configuration["vite-build"]
    }
}


function isIpv6(address)
{
    return address.family === "IPv6" || address.family === 6;
}

function getSharpConfiguration()
{
    if (!fs.existsSync("sharp.json"))
        return {};

    return JSON.parse(fs.readFileSync("sharp.json"));
}

function getSharpApplicationPathList()
{
    let apps = getSharpConfiguration()["application"] ?? [];
    if (!Array.isArray(apps))
        apps = [apps];

    return apps;
}

export {
    sharp as default,
    refreshPaths
};
