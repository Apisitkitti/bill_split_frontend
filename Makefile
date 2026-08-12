.PHONY: dev build lint tunnel proxy check

dev:    ## run the LIFF frontend on :5173
	bun run dev

build:  ## typecheck and build
	bun run build

lint:
	bun run lint

proxy:  ## put the app and the API on one origin (:8443) — kills CORS, needs one tunnel not two
	caddy run --config Caddyfile

tunnel: ## public HTTPS for the LIFF endpoint (LINE will not load http://)
	cloudflared tunnel --url http://localhost:8443

check:  ## what a review must pass
	bun run lint && bun run build
