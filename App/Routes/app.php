<?php

use YonisSavary\Sharp\Classes\Web\Route;
use YonisSavary\Sharp\Classes\Web\Router;

Router::getInstance()->addRoutes(
    Route::view("/", "welcome")
);