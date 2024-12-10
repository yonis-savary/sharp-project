<?php

use YonisSavary\Sharp\Classes\Data\ObjectArray;
use YonisSavary\Sharp\Classes\Env\Configuration;
use YonisSavary\Sharp\Core\Utils;

/**
 * Load vite resources into your pages
 * (You don't need to change this function call when changing environment)
 */
function vite(string|array $resources)
{
    $resources = Utils::toArray($resources);

    if ($viteConfig = config("vite-config"))
    {
        $manifestPath = Utils::joinPath($viteConfig["target-application"], "Assets", "build");
        if (is_file($manifestPath))
        {
            $manifest = new Configuration($manifestPath);

            return ObjectArray::fromArray($resources)
            ->map(fn($resource) => $manifest->get($resource, false))
            ->filter()
            ->map(fn($resource) => $resource["file"])
            ->map(fn($resource) => str_starts_with($resource, "/") ? $resource : "/$resource" )
            ->map(fn($resource) => script($resource, false, "module"))
            ->join();
        }
    }

    $viteHostFile = Utils::relativePath("Public/vitehost");
    if (!is_file($viteHostFile))
        throw new Error("Could not determine vite server url");

    $viteHost = file_get_contents($viteHostFile);

    return ObjectArray::fromArray($resources)
    ->map(fn($resource) => "<script type=\"module\" src=\"$viteHost/$resource\"></script>")
    ->unshift("<script type=\"module\" src=\"$viteHost/@vite/client\"></script>")
    ->join();
}