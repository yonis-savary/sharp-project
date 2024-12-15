import { defineConfig } from 'vite';
import sharp from './App/Assets/js/sharp-vite-plugin';

export default defineConfig({
    plugins: [
        sharp({
            "target-application": "App",
            "public-directory": "Public",
            "input": ["App/Assets/js/main.js"],
            "refresh": true
        }),
    ]
});
