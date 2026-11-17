# biruta-site

Site estático da **Biruta Records**: [Astro](https://astro.build), alojado no GitHub Pages e editável no [Pages CMS](https://pagescms.org).

## Estrutura

| O quê | Onde |
|---|---|
| Lançamentos (1 ficheiro por edição) | `src/content/releases/*.md` |
| Artistas | `src/content/artists/*.md` (`roster: true` → aparece em "Roster") |
| Concertos (agenda + cartazes) | `src/content/events/AAAA-MM-DD-nome.md` |
| Capas / cartazes / fotos | `src/assets/covers`, `src/assets/posters`, `src/assets/artists` |
| Definições (contactos, redes, Mailchimp) | `src/data/site.json` |
| Identidade (logo, fundo) | `src/assets/brand`, `src/styles/global.css` |

Os concertos com data a partir de hoje aparecem em **Próximos**. Os restantes passam para o **Histórico** e para a página **Cartazes**. O workflow faz um rebuild diário para isto acontecer sozinho.

## Desenvolvimento

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # gera dist/
```

## Importar do Bandcamp

```bash
npm run import:bandcamp
```

Lê https://birutarecords.bandcamp.com e cria os lançamentos e artistas **que ainda não existem**, com capa, alinhamento, créditos e n.º de catálogo. Nunca altera ficheiros existentes (com `--force` reescreve-os).

## Publicar (GitHub Pages)

1. Organização `birutarecords` com repositório **público** `birutarecords.github.io`.
2. `git init && git add . && git commit -m "Site Biruta" && git branch -M main && git remote add origin https://github.com/birutarecords/birutarecords.github.io.git && git push -u origin main`
3. No repositório: **Settings → Pages → Source: GitHub Actions**.
4. Domínio: `public/CNAME` já tem `birutamusic.com`. No DNS do domínio, cria registos `A` para `185.199.108.153`, `185.199.109.153`, `185.199.110.153` e `185.199.111.153` (e `www` CNAME → `birutarecords.github.io`). Depois ativa **Enforce HTTPS**.
   - Os emails @birutamusic.com não são afetados (registos MX).
   - Fase atual: o site está em https://birutarecords.github.io (repositório `birutarecords.github.io`, sem `base`). Ao mudar para o domínio, atualiza `site` em `astro.config.mjs` e define o domínio em Settings → Pages → Custom domain. Com deploy via Actions o ficheiro `public/CNAME` é ignorado pelo GitHub e serve só de referência.

## Pages CMS (edição pela equipa)

1. Entra em https://app.pagescms.org com GitHub e escolhe o repositório.
2. A configuração está em `.pages.yml`: Agenda/Cartazes, Lançamentos, Artistas e Definições.
3. Cada gravação é um commit. O GitHub Actions publica em ~1–2 min.

Nos campos "Artistas", usa o identificador do artista, que é o nome do ficheiro sem `.md` (ex.: `rica`, `ze-menos`).

## Newsletter (Mailchimp)

1. Mailchimp → Audience → **Signup forms → Embedded forms**. Copia o `action` do `<form>` e o nome do campo escondido `b_…`.
2. Cola-os em `src/data/site.json` → `mailchimp.action` / `mailchimp.honeypot` (ou no CMS, em Definições).
3. Na Audience, ativa o **double opt-in** (Settings → Audience name and defaults).

## Por fazer

- [ ] Logótipo em alta resolução / SVG. O atual foi recortado do cabeçalho do Bandcamp (304×162 px).
- [ ] Biografias e fotos dos artistas, e confirmar quem está em `roster: true`.
- [ ] Histórico de concertos e cartazes. Há só 2 datas confirmadas: 10 anos no Socorro e Thin Ice no RCA.
- [ ] Rever formatos (EP/Álbum) atribuídos automaticamente.
- [ ] Política de privacidade: completar entidade/NIF/morada e fazer revisão jurídica antes de publicar.
