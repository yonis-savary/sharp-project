<?php

use YonisSavary\Sharp\Core\Configuration\ApplicationsToLoad;
use YonisSavary\Sharp\Classes\Extras\Configuration\AssetServerConfiguration;
use YonisSavary\Sharp\Classes\Http\Configuration\RequestConfiguration;

return [
	new ApplicationsToLoad(
		applications: ["App"],
	),

	new AssetServerConfiguration(
		enabled: true,
		cached: true,
		url: "/assets/{any:filename}",
		middlewares: [],
		maxAge: false,
		nodePackages: [],
	),

	new RequestConfiguration(
		typedParameters: true,
	),
];