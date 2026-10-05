# Proof of Study

App desktop para Windows e Linux: rotina semanal, meta de horas por matéria e um pomodoro que registra o título da janela ativa. O tempo focado só entra no banco de horas quando a sessão tem anotação (texto ou imagem) do que foi estudado.

Uso pessoal, grátis, dados só no PC de cada pessoa (`%APPDATA%\io.github.mizerski.proofofstudy` no Windows, `~/.local/share/io.github.mizerski.proofofstudy` no Linux).

## Rodar

```bash
npm install
npm run desktop
```

Instalador (Windows: `bundle/nsis/*.exe`; Linux: `bundle/deb`, `bundle/rpm` e `bundle/appimage`, em `src-tauri/target/release/`):

```bash
npm run desktop:build
```

Precisa de Node 20+ e Rust. No Windows, com o toolchain MSVC e o WebView2 (que já vem no Windows 11). No Linux (Debian/Ubuntu):

```bash
sudo apt install libwebkit2gtk-4.1-dev libayatana-appindicator3-dev librsvg2-dev patchelf build-essential
```

## Versões

- **Build de teste** ([build-teste.yml](.github/workflows/build-teste.yml)): a cada push numa branch `feature/**`, roda lint, testes do Rust e gera os instaladores do Windows e do Linux como artefato (14 dias), sem publicar.
- **Release** ([release.yml](.github/workflows/release.yml)): uma tag `vX.Y.Z` igual à versão do `package.json` gera os instaladores (`.exe`, `.deb`, `.rpm` e `.AppImage`) e publica numa Release.

```bash
git tag v0.3.0 && git push origin v0.3.0
```

## Telas

Layout 1a do protótipo `Banco de Horas.html` (canvas Bauhaus): barra de título própria, barra lateral com as telas e a meta da semana no rodapé.

| Tela | O que tem |
|---|---|
| Rotina | Grade da semana (8h à meia-noite), totais por categoria e "sem registro", dia vazio com "Adicionar" |
| Banco de horas | Meta da matéria na semana (a etapa), se cabe na rotina, horas focadas com o marco da metade, dias de estudo e sessões com evidências |
| Sessão | Relógio do pomodoro, menu "Capturando ▾" com o que está sendo lido, aviso de fora do estudo, linha do tempo; no fim, Resumo e depois Anotação |
| Histórico | % em foco contra a primeira semana, metas cumpridas e o resultado de cada semana |
| Apps e sites | Regras (Estudo / Fora do estudo / Ignorar), apps vistos sem regra, teste de uma janela e as opções da sessão |

Fora das telas: o aviso "Hora do estudo" no canto quando começa um bloco de estudo, e o modo **widget** (botão – da barra de título ou "Virar widget"), que encolhe a janela num cartão sempre por cima com o relógio.

## Como funciona

- **O Rust faz o relógio** (`src-tauri/src/rastreador.rs`). No Windows o WebView suspende timers com a janela escondida, então o pomodoro, o fim da sessão, o aviso de distração e os lembretes da rotina (`lembretes.rs`) rodam numa thread que lê a janela ativa uma vez por segundo. Fechar a janela só esconde o app na bandeja.
- **O que é lido** (`janela.rs`): título da janela ativa, nome do programa (no Windows, o executável; no Linux, a classe da janela, `WM_CLASS`) e há quanto tempo o teclado e o mouse estão parados. Só com o pomodoro rodando e a captura ligada ("Pausar captura" para a leitura sem parar o relógio). Passado o limite sem uso, o tempo vira "ausente".
- **Linux**: a leitura usa o X11 (`x11rb`). Numa sessão Wayland só aparecem os apps do XWayland (os nativos ficam sem janela, sem contar como fora) e o tempo sem uso não é medido; para o registro completo, use a sessão X11. A bandeja precisa de suporte a AppIndicator (no GNOME, a extensão "AppIndicator"); sem ela, abrir o app de novo traz a janela de volta.
- **Classificação** (`src/features/sessao/utils/classificacao.ts`, igual a `regra_que_casa` no Rust): regras de título valem antes das de app; a primeira que casa decide. **Janela sem regra conta como fora do estudo** (como no protótipo), por isso os apps de estudo comuns já vêm com regra. No Resumo, a etiqueta de cada janela troca como ela conta só naquela sessão.
- **Dados**: `dados.json` com o `plugin-store` (reducer + Context em `src/store/`, formato versão 2, que converte a versão 1), e as imagens em `imagens/`, mostradas pelo protocolo `asset`.

Stack e design system seguem `finance-sheet/docs/tecnologias.md` e `design-system.md`. Cores: azul = foco, vermelho = fora, amarelo = banco de horas.

## Fora do MVP

Insights de queda de foco, extensão de Chrome para a URL, recursos com amigos, projetos com etapas, alerta de domingo, iniciar com o Windows.
