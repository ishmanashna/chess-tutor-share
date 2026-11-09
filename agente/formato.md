# chess-tutor analysis format v1

Spec for what an outside coding agent submits. Sol's Codex path is unchanged: it still returns the inner analysis object, still in Spanish, still validated with the lenient parser.

**Language (Jordi's decision, Phase 1).** Visitors can pick Spanish or English for the page and the analysis. v1 submissions have a required top-level `lang`: `"es"` | `"en"`. The five texts and the rating explanations are written in that language. Category names have fixed translations (Apertura/Opening, Estrategia/Strategy, Cálculo/Calculation, Táctica/Tactics, Defensa/Defence, Final/Endgame) and are stored by a stable `key` so the page can render either language. Guidelines and validator error texts exist in both languages, selected by `lang`. Sol's Codex prompts stay Spanish and byte-identical. Licence, source visibility and abuse limits were not in scope for this phase: there is no licence file, and the plan's size and rate limits are unchanged. Benchmarks (which model to use) come from chess-vision-harness; this repository does not ship one.

Machine-readable copy: [`analysis-format-v1.schema.json`](analysis-format-v1.schema.json), generated from `ANALYSIS_OUTPUT_SCHEMA` plus the wrapper (`npm run format:schema`).

## Wrapper

```json
{
  "format": "chess-tutor-analysis/1",
  "session": "Xk3pQ9rT2vLm8aWc4nB7Hd",
  "lang": "es",
  "agent": {
    "model": "gpt-6.1-sol",
    "effort": "xhigh",
    "tool": "Codex CLI",
    "helper": "chess-tools.mjs 1.1.0",
    "engine": { "name": "Stockfish 18", "kind": "native", "maxDepth": 22 }
  },
  "engineAnalysis": {
    "format": "chess-tutor-engine/1",
    "gameHash": "64 lowercase hex chars"
  },
  "positions": {
    "pos_7": {
      "from": { "ply": 24 },
      "moves": ["Nf3", "e5"],
      "eval": { "score": "cp 34", "depth": 20, "bestmove": "d2d4" }
    },
    "pos_12": {
      "from": { "fen": "rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3" },
      "moves": []
    }
  },
  "analysis": {
    "gameTitle": "La cuña de e5",
    "gameTreePgn": "1. e4 e5 2. Nf3 *",
    "commentaries": {
      "corto": "...",
      "medio": "**El centro**\n\n...",
      "largo": "...",
      "blancas": "...",
      "negras": "..."
    },
    "sidePositions": [{ "positionId": "pos_12", "label": "Gambito de dama" }],
    "ratings": {
      "white": {
        "vibeElo": 2470,
        "categories": [
          { "key": "opening", "score": 8, "explanation": "..." },
          { "key": "strategy", "score": 9, "explanation": "..." },
          { "key": "calculation", "score": 7, "explanation": "..." },
          { "key": "tactics", "score": 7, "explanation": "..." },
          { "key": "defence", "score": null, "explanation": "" },
          { "key": "endgame", "score": null, "explanation": "" }
        ]
      },
      "black": {
        "vibeElo": 1980,
        "categories": [
          { "key": "opening", "score": 4, "explanation": "..." },
          { "key": "strategy", "score": 4, "explanation": "..." },
          { "key": "calculation", "score": 5, "explanation": "..." },
          { "key": "tactics", "score": 4, "explanation": "..." },
          { "key": "defence", "score": 5, "explanation": "..." },
          { "key": "endgame", "score": null, "explanation": "" }
        ]
      }
    }
  }
}
```

| Field | Who writes it | Notes |
| --- | --- | --- |
| `format` | agent or helper | Must be `chess-tutor-analysis/1`. |
| `session` | helper | Session code from the Worker. |
| `lang` | agent | `"es"` or `"en"`. Required. Selects the language of the five texts, rating explanations, guidelines and validator errors. |
| `agent.model` | agent | Self-reported. Required. |
| `agent.effort`, `agent.tool` | agent | Self-reported. Optional. |
| `agent.helper`, `agent.engine` | helper | Filled on submit. `engine.kind` is `native` or `lite`. |
| `engineAnalysis` | helper | Optional for older files. On submit, chess-tools.mjs runs the same full-game Stockfish pass as the browser (`chess-tutor-engine/1`, see [`engine-analysis-format.md`](engine-analysis-format.md)) and includes it. Agents do not write this field. |
| `positions` | helper | Manifest. Replay with chessops; do not trust a tool log. |
| `analysis` | agent | Inner object, same jobs as Sol, with category **keys** instead of Spanish names. |

## Manifest entry

`positions` is a map of `pos_N` ids.

```
{ from: {ply:n} | {fen:"..."} | {start:true}, moves:[SAN...], eval?: {score, depth, bestmove} }
```

- `from` is exactly one of `{ply:n}` (0-based half-moves of **this** game), `{fen:"..."}` (a known position, not a ply of the game), or `{start:true}` (the standard start).
- `moves` is English SAN from that point, possibly empty.
- `eval` is optional. `score` is `"cp 34"` or `"mate -3"` from the side to move. The browser re-checks evals later; Phase 1 only checks the shape.

`positionsFromManifest` replays every entry and returns the same `{id, fen, origin}` records that `collectIssuedPositions` returns. Illegal or ambiguous SAN, a bad FEN, or a ply past the end of the game is an error. A forged manifest can only describe legal positions.

## Inner `analysis`

Same jobs as Codex `ANALYSIS_OUTPUT_SCHEMA`:

- `gameTitle` — short flavour title, required, in `lang`. Not the players, event, or date.
- `gameTreePgn` — the submitted game's mainline, plus variations and NAG glyphs. No prose. English SAN. Outside examples do not belong here.
- `commentaries` — `corto` (Relato / Story), `medio` (Claves / Keys), `largo` (Guía / Guide), `blancas` (White), `negras` (Black). Field names stay Spanish. `medio` must mark section titles with `**title**` or `# title`.
- `sidePositions` — `{positionId, label}` for positions whose origin is not a ply of this game.
- `ratings` — required. For each of `white` and `black`: integer `vibeElo`, and **exactly six** categories in this order, identified by `key`:

  | key | es | en |
  | --- | --- | --- |
  | `opening` | Apertura | Opening |
  | `strategy` | Estrategia | Strategy |
  | `calculation` | Cálculo | Calculation |
  | `tactics` | Táctica | Tactics |
  | `defence` | Defensa | Defence |
  | `endgame` | Final | Endgame |

  `score` is an integer 0–10, or `null` when that facet was not meaningfully tested (use `null` for endgame when there was no endgame). No `"7/10"` strings, no extra names.

Moves of this game do not need `{@pos_N}`; the page links SAN mentions. Outside positions and drawings use `{@pos_N:label|[%cal ...][%csl ...]}`.

## Strict rules (outside agents)

The Codex parser stays lenient (code fences, `"7/10"`, optional ratings, illegal variation moves dropped as issues). v1 is strict:

- No code-fence unwrapping. The body is a JSON object.
- `ratings` required; scores and `vibeElo` are integers (or `null` for a category score).
- Every referenced `pos_N` exists in the manifest and replays to a legal position.
- `gameTreePgn` mainline equals the session game.
- An illegal or ambiguous move in any variation is an error, not a silent drop.
- Side positions must not leak into the game tree.
- Texts, ratings and the wrapper must match the schema.

`validateSubmissionV1(json, gamePgn)` returns `{ ok, errors[], warnings[], analysis }`. Error texts are in `lang`. Unused manifest ids and referenced positions with no `eval` are warnings.

The derived analysis for the page includes `formatVersion: 1`, `source: "agente"`, `lang`, `agent`, and a `checks` block. It does not write `perspective`.

## Worked example

Nimzowitsch–Håkansson, Kristiania 1922, `lang: "es"`. Full file: [`fixtures/v1-good.json`](../fixtures/v1-good.json).

```json
{
  "format": "chess-tutor-analysis/1",
  "session": "Xk3pQ9rT2vLm8aWc4nB7Hd",
  "lang": "es",
  "agent": {
    "model": "gpt-6.1-sol",
    "effort": "xhigh",
    "tool": "Codex CLI",
    "helper": "chess-tools.mjs 1.0.0",
    "engine": { "name": "Stockfish 18", "kind": "native", "maxDepth": 22 }
  },
  "positions": {
    "pos_1": {
      "from": { "ply": 7 },
      "moves": [],
      "eval": { "score": "cp 42", "depth": 16, "bestmove": "c5d4" }
    },
    "pos_2": {
      "from": { "ply": 19 },
      "moves": ["Bc5"],
      "eval": { "score": "cp 18", "depth": 16, "bestmove": "h2h4" }
    },
    "pos_3": {
      "from": { "start": true },
      "moves": ["d4", "d5", "c4", "e6"],
      "eval": { "score": "cp 34", "depth": 14, "bestmove": "b1c3" }
    }
  },
  "analysis": {
    "gameTitle": "La cuña de e5",
    "gameTreePgn": "1. e4 e6 2. d4 d5 3. e5 c5 4. Qg4!? cxd4 ...",
    "commentaries": {
      "corto": "Nimzowitsch no busca un ataque inmediato con {@pos_1:4.Qg4!?|[%cal Gd1g4,Ge4e5][%csl Ge5]}...",
      "medio": "**La cuña de e5**\n\nLa idea central es el sacrificio de peón de {@pos_1:4.Qg4!?|[%cal Gd1g4][%csl Ge5]}.\n\n**La alternativa 10...Bc5**\n\nTras 10.Re1, {@pos_2:10...Bc5} deja f8 libre al caballo.",
      "largo": "...",
      "blancas": "...",
      "negras": "..."
    },
    "sidePositions": [{ "positionId": "pos_3", "label": "Gambito de dama" }],
    "ratings": {
      "white": {
        "vibeElo": 2470,
        "categories": [
          { "key": "opening", "score": 8, "explanation": "El gambito 4.Qg4 fija el tema." },
          { "key": "strategy", "score": 9, "explanation": "Convierte e5 en una cuña." },
          { "key": "calculation", "score": 7, "explanation": "El orden h4-h5 y la columna c encajan." },
          { "key": "tactics", "score": 7, "explanation": "La red final es limpia." },
          { "key": "defence", "score": null, "explanation": "" },
          { "key": "endgame", "score": null, "explanation": "" }
        ]
      },
      "black": {
        "vibeElo": 1980,
        "categories": [
          { "key": "opening", "score": 4, "explanation": "Acepta el peón y se deja encerrar." },
          { "key": "strategy", "score": 4, "explanation": "Falta un plan de alivio." },
          { "key": "calculation", "score": 5, "explanation": "Reacciona tarde al avance del flanco." },
          { "key": "tactics", "score": 4, "explanation": "La dama acaba en a8." },
          { "key": "defence", "score": 5, "explanation": "El rey en d8 llega cuando el ahogo ya está hecho." },
          { "key": "endgame", "score": null, "explanation": "" }
        ]
      }
    }
  }
}
```

An English submission is the same shape with `"lang": "en"`, English prose, and the same six `key` values.

## What later phases should know

- Phase 2's session page should build study/compose/retry from `backend/prompt-text.mjs` in the session's `lang` (`buildStudyPrompt`, `buildAgentComposePrompt`, `buildRetryPrompt`). Sol still calls the Spanish defaults with no `lang`.
- Phase 3's `check` should print `validateSubmissionV1` errors in `lang`, and `submit` should add `positions`, `helper`, `engine` and `engineAnalysis` without asking the agent to write them.
- Phase 4 should run `validateSubmissionV1` in the browser and re-check manifest evals and glyphs with the lite engine. Display category labels from `key` plus the visitor's UI language, not from a stored name.
- Do not add a licence file, a benchmark, or new runtime dependencies for this format.
- Do not change Codex prompts or the lenient validator.
