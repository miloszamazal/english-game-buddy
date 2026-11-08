# English Game Buddy

Vytvoř interaktivní kvíz z angličtiny pro děti 10 - 14 let. Chci moderní, barevný a hravý design s motivujícími animacemi. Kvíz bude mít 200 otázek na slovíčka, gramatiku, predlozky apodobne pomoci doplnovani, prirazovani slov k obrazkum pretahovanim a doplnovani slov do vet. U každé otázky na doplneni budou 4 možnosti na výběr a tlačítko pro přehrání zvuku výslovnosti. Na konci zobraz celkové skóre, konfety a tlačítko Zkusit znovu. Napoj webpage rovnou na databazi Supabase.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://english-game-buddy.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6365f1a6-ee27-573f-b4c7-96449f995df1).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Deploy to Cloudflare Workers

Besides Lovable hosting, the app is deployed to Cloudflare Workers (free plan) by
`.github/workflows/deploy-cloudflare.yml` on every push to `main`. GitHub Pages
cannot host it, because player login and the admin section run as server functions.

One-time setup, in GitHub → Settings → Secrets and variables → Actions:

- `CLOUDFLARE_API_TOKEN` – API token created from the "Edit Cloudflare Workers" template
- `CLOUDFLARE_ACCOUNT_ID` – your Cloudflare account ID
- `ADMIN_PASSWORD` – password for the admin section
- `SUPABASE_SERVICE_ROLE_KEY` – optional, needed only to save questions in the admin section

The app is then available at `https://miloszamazal-english-game-buddy.<your-subdomain>.workers.dev`.
