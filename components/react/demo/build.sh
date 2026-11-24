set -e
npx tsc -p tsconfig.json
npx esbuild demo.tsx --bundle --outfile=out/demo.js --define:process.env.NODE_ENV='"development"' --log-level=warning
npx tailwindcss -c tailwind.config.js -i input.css -o out/tw.css 2>/dev/null
cp ../../package/tokens.css ../../package/tokens.live-map.css ../src/motion.css out/
