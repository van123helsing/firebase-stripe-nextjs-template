module.exports = {
  '*.{js,jsx,ts,tsx}': [
    'prettier -w',
    'npm run lint:strict',
    // disabled, until type errors are resolved
    // () => 'npm run typecheck',
  ],
  '**/*.{json,css,scss,md,webmanifest}': ['prettier -w'],
}
