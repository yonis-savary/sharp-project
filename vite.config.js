import { defineConfig } from 'vite';
import sharp from './App/Assets/js/sharp-vite-plugin';

export default defineConfig({
    plugins: [
        sharp(),
    ]
});
