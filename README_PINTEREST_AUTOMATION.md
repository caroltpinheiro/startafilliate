# Automacao Pinterest com Playwright

Automacao de postagem no Pinterest usando browser real (Playwright), sem API.

## 1) Instalar dependencias

```bash
npm install
npx playwright install chromium
```

## 2) Configurar variaveis

```bash
cp .env.example .env
```

Edite o arquivo `.env` com email/senha e dados do pin.

## 3) Teste seguro (nao publica)

```bash
npm run pin:post:dry
```

Esse comando sobe o navegador, preenche tudo e para antes de publicar.
Uma evidencia visual e salva em `artifacts/`.

## 4) Publicar de verdade

No `.env`, troque:

```bash
DRY_RUN=false
```

Depois execute:

```bash
npm run pin:post
```

## Comandos uteis

```bash
npm test
npm run pin:post:debug
```

- `npm test`: valida sintaxe do script.
- `pin:post:debug`: roda com browser visivel (`HEADLESS=false`).

## Observacoes praticas

- Se aparecer captcha/2FA, rode com `pin:post:debug` para concluir manualmente.
- Se a UI do Pinterest mudar, os seletores podem precisar de ajuste.
