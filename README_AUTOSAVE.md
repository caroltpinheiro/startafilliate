# Backup automatico no GitHub

Este projeto foi preparado para salvar snapshots no GitHub de duas formas:

- Manualmente, apos grandes mudancas.
- Automaticamente, todos os dias as 23:00.

## 1) Configurar identidade Git (uma vez)

```bash
git config user.name "Seu Nome"
git config user.email "seu-email@exemplo.com"
```

## 2) Configurar o repositorio remoto (uma vez)

Se ainda nao existir um repositorio no GitHub:

```bash
git remote add origin <URL_DO_REPOSITORIO>
git branch -M main
git push -u origin main
```

## 3) Dar permissao de execucao aos scripts

```bash
chmod +x scripts/autosave-github.sh scripts/save-now.sh scripts/install-autosave-cron.sh
```

## 4) Instalar o agendamento diario (23:00)

```bash
./scripts/install-autosave-cron.sh
```

Verificar:

```bash
crontab -l
```

## 5) Salvar apos grandes mudancas

Com mensagem personalizada:

```bash
./scripts/save-now.sh "feat: checkout completo com validacoes"
```

Sem mensagem (gera timestamp automatico):

```bash
./scripts/save-now.sh
```

## Observacoes

- O script so commita se houver alteracoes.
- O push vai para a branch atual.
- Logs do agendamento ficam em `.autosave.log`.
