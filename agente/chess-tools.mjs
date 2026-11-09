#!/usr/bin/env node
/**
 * chess-tools.mjs 1.1.0
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Bundles chessops (GPL-3.0-or-later): https://github.com/niklasf/chessops
 * Talks to Stockfish (GPL-3.0). Native binary, or the lite WASM files from this
 * site (Stockfish 19 / stockfish.js 19.0.1, SHA-256 js=ccb130d7ff29408531c47d859a49f91d59d4f482d05a53eb1a3231a4f624c91a wasm=ee4f115bdb2d32cadf96cada104a05b5ec257d7ad6f57582190b49bc71f096de):
 *   https://github.com/official-stockfish/Stockfish
 *   https://github.com/nmrugg/stockfish.js/releases/tag/v19.0.1
 *
 * Source: https://github.com/ishmanashna/chess-tutor/tree/main/agent-kit
 */


// agent-kit/chess-tools.src.mjs
import path4 from "node:path";
import { fileURLToPath } from "node:url";

// agent-kit/cli.mjs
var VALUE_FLAGS = /* @__PURE__ */ new Set([
  "api",
  "page",
  "stockfish",
  "ply",
  "fen",
  "moves",
  "depth",
  "model",
  "effort",
  "tool"
]);
var BOOLEAN_FLAGS = /* @__PURE__ */ new Set(["start"]);
var COMMANDS = /* @__PURE__ */ new Set(["start", "game", "position", "eval", "check", "submit"]);
function parseArgs(argv) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--") {
      positional.push(...argv.slice(i + 1));
      break;
    }
    if (!token.startsWith("--")) {
      positional.push(token);
      continue;
    }
    const trimmed = token.slice(2);
    const eq = trimmed.indexOf("=");
    let key;
    let value;
    if (eq >= 0) {
      key = trimmed.slice(0, eq);
      value = trimmed.slice(eq + 1);
    } else {
      key = trimmed;
      if (BOOLEAN_FLAGS.has(key)) {
        flags[key] = true;
        continue;
      }
      if (VALUE_FLAGS.has(key)) {
        value = argv[i + 1];
        i += 1;
      } else {
        flags[key] = true;
        continue;
      }
    }
    flags[key] = value;
  }
  let command = "";
  const rest = [];
  for (const token of positional) {
    if (!command && COMMANDS.has(token)) {
      command = token;
      continue;
    }
    rest.push(token);
  }
  return { command, positional: rest, flags };
}

// agent-kit/commands.mjs
import { readFile as readFile3 } from "node:fs/promises";
import path3 from "node:path";

// frontend/src/rating-categories.js
var STANDARD_RATING_KEYS = [
  "opening",
  "strategy",
  "calculation",
  "tactics",
  "defence",
  "endgame"
];
var STANDARD_RATING_LABELS_BY_KEY = {
  opening: { es: "Apertura", en: "Opening" },
  strategy: { es: "Estrategia", en: "Strategy" },
  calculation: { es: "C\xE1lculo", en: "Calculation" },
  tactics: { es: "T\xE1ctica", en: "Tactics" },
  defence: { es: "Defensa", en: "Defence" },
  endgame: { es: "Final", en: "Endgame" }
};
var STANDARD_RATING_LABELS = STANDARD_RATING_KEYS.map(
  (key) => STANDARD_RATING_LABELS_BY_KEY[key].es
);
var STANDARD_RATING_LABELS_EN = STANDARD_RATING_KEYS.map(
  (key) => STANDARD_RATING_LABELS_BY_KEY[key].en
);
var STANDARD_RATING_KEY_BY_LABEL = Object.fromEntries(
  STANDARD_RATING_KEYS.flatMap((key) => {
    const labels = STANDARD_RATING_LABELS_BY_KEY[key];
    return [
      [labels.es, key],
      [labels.en, key]
    ];
  })
);
var STANDARD_RATING_MEANINGS = {
  Apertura: "Opening play: development, early plans, and how the opening was handled.",
  Estrategia: "Long-term plans and positional understanding in this game.",
  C\u00E1lculo: "Accuracy of concrete sequences and move order. Distinct from spotting tactical motifs.",
  T\u00E1ctica: "Tactical motifs, combinations, and opportunities.",
  Defensa: "Resourcefulness and accuracy when under pressure.",
  Final: "Endgame play. Use null when the game never meaningfully tested an endgame."
};
var STANDARD_RATING_MEANINGS_ES = {
  Apertura: "el juego de apertura: desarrollo, planes tempranos y c\xF3mo se plante\xF3.",
  Estrategia: "planes a largo plazo y comprensi\xF3n posicional en esta partida.",
  C\u00E1lculo: "la precisi\xF3n de secuencias concretas y el orden de jugadas, distinto de los motivos t\xE1cticos.",
  T\u00E1ctica: "motivos, combinaciones y oportunidades t\xE1cticas.",
  Defensa: "recursos y precisi\xF3n cuando se est\xE1 bajo presi\xF3n.",
  Final: "el juego de final; null si la partida no puso a prueba un final de forma significativa."
};
var STANDARD_RATING_MEANINGS_BY_KEY = {
  opening: {
    es: STANDARD_RATING_MEANINGS_ES.Apertura,
    en: STANDARD_RATING_MEANINGS.Apertura
  },
  strategy: {
    es: STANDARD_RATING_MEANINGS_ES.Estrategia,
    en: STANDARD_RATING_MEANINGS.Estrategia
  },
  calculation: {
    es: STANDARD_RATING_MEANINGS_ES.C\u00E1lculo,
    en: STANDARD_RATING_MEANINGS.C\u00E1lculo
  },
  tactics: {
    es: STANDARD_RATING_MEANINGS_ES.T\u00E1ctica,
    en: STANDARD_RATING_MEANINGS.T\u00E1ctica
  },
  defence: {
    es: STANDARD_RATING_MEANINGS_ES.Defensa,
    en: STANDARD_RATING_MEANINGS.Defensa
  },
  endgame: {
    es: STANDARD_RATING_MEANINGS_ES.Final,
    en: STANDARD_RATING_MEANINGS.Final
  }
};
function ratingLabel(key, lang = "es") {
  const labels = STANDARD_RATING_LABELS_BY_KEY[key];
  if (!labels) return key;
  return lang === "en" ? labels.en : labels.es;
}
function hasClavesHeadingMarkup(text) {
  return /(?:^|\n)\s*(?:#{1,3}\s+\S|\*\*[^*\n]+\*\*)/.test(String(text ?? ""));
}
function ratingCategorySchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["name", "score"],
    properties: {
      name: {
        type: "string",
        enum: [...STANDARD_RATING_LABELS],
        description: STANDARD_RATING_LABELS.map((label) => `${label}: ${STANDARD_RATING_MEANINGS[label]}`).join(" ")
      },
      score: {
        anyOf: [
          { type: "integer", minimum: 0, maximum: 10 },
          { type: "null" }
        ],
        description: "Integer 0\u201310, or null when this facet was not meaningfully tested."
      },
      explanation: { type: "string" }
    }
  };
}
function v1RatingCategorySchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["key", "score"],
    properties: {
      key: {
        type: "string",
        enum: [...STANDARD_RATING_KEYS],
        description: STANDARD_RATING_KEYS.map((key) => {
          const labels = STANDARD_RATING_LABELS_BY_KEY[key];
          const meaning = STANDARD_RATING_MEANINGS_BY_KEY[key];
          return `${key} (${labels.es}/${labels.en}): ${meaning.en}`;
        }).join(" ")
      },
      score: {
        anyOf: [
          { type: "integer", minimum: 0, maximum: 10 },
          { type: "null" }
        ],
        description: "Integer 0\u201310, or null when this facet was not meaningfully tested."
      },
      explanation: { type: "string" }
    }
  };
}

// backend/v1-messages.mjs
function normalizeAnalysisLang(lang) {
  return lang === "en" ? "en" : "es";
}
var KEY_LIST = STANDARD_RATING_KEYS.join(", ");
var TEMPLATES = {
  not_json: {
    es: () => "La salida no es JSON.",
    en: () => "Output is not JSON."
  },
  invalid_json: {
    es: () => "La salida no es JSON v\xE1lido.",
    en: () => "Output is not valid JSON."
  },
  fenced_json: {
    es: () => "El env\xEDo v1 no admite JSON envuelto en una valla de c\xF3digo. Env\xEDa el objeto JSON tal cual.",
    en: () => "v1 submissions must not wrap JSON in a code fence. Send the JSON object as-is."
  },
  not_object: {
    es: () => "La salida debe ser un objeto JSON.",
    en: () => "Output must be a JSON object."
  },
  wrong_format: {
    es: ({ value }) => `format debe ser "chess-tutor-analysis/1" (recibido: ${value ?? "ausente"}).`,
    en: ({ value }) => `format must be "chess-tutor-analysis/1" (got: ${value ?? "missing"}).`
  },
  missing_session: {
    es: () => "session debe ser una cadena no vac\xEDa.",
    en: () => "session must be a non-empty string."
  },
  missing_lang: {
    es: () => 'lang es obligatorio y debe ser "es" o "en".',
    en: () => 'lang is required and must be "es" or "en".'
  },
  missing_agent: {
    es: () => "agent debe ser un objeto con al menos model.",
    en: () => "agent must be an object with at least model."
  },
  missing_agent_model: {
    es: () => "agent.model debe ser una cadena no vac\xEDa.",
    en: () => "agent.model must be a non-empty string."
  },
  missing_positions: {
    es: () => "positions debe ser un objeto (el manifiesto de posiciones).",
    en: () => "positions must be an object (the position manifest)."
  },
  missing_analysis: {
    es: () => "analysis debe ser un objeto.",
    en: () => "analysis must be an object."
  },
  empty_game_tree: {
    es: () => "gameTreePgn debe ser una cadena no vac\xEDa.",
    en: () => "gameTreePgn must be a non-empty string."
  },
  commentaries_object: {
    es: () => "commentaries debe ser un objeto con corto, medio, largo, blancas y negras.",
    en: () => "commentaries must be an object with corto, medio, largo, blancas and negras."
  },
  commentary_string: {
    es: ({ path: path5 }) => `${path5} debe ser una cadena.`,
    en: ({ path: path5 }) => `${path5} must be a string.`
  },
  game_title: {
    es: () => "gameTitle debe ser un t\xEDtulo de sabor no vac\xEDo.",
    en: () => "gameTitle must be a non-empty flavour title."
  },
  game_title_string: {
    es: () => "gameTitle debe ser una cadena.",
    en: () => "gameTitle must be a string."
  },
  ratings_required: {
    es: () => "ratings es obligatorio y debe ser un objeto con white y black.",
    en: () => "ratings is required and must be an object with white and black."
  },
  ratings_object: {
    es: () => "ratings debe ser un objeto con white y black.",
    en: () => "ratings must be an object with white and black."
  },
  player_ratings_object: {
    es: ({ path: path5 }) => `${path5} debe ser un objeto.`,
    en: ({ path: path5 }) => `${path5} must be an object.`
  },
  vibe_elo_integer: {
    es: ({ path: path5 }) => `${path5} debe ser un entero (no una cadena).`,
    en: ({ path: path5 }) => `${path5} must be an integer (not a string).`
  },
  categories_array: {
    es: ({ path: path5 }) => `${path5} debe ser un array.`,
    en: ({ path: path5 }) => `${path5} must be an array.`
  },
  categories_length: {
    es: ({ path: path5 }) => `${path5} debe tener las seis categor\xEDas, en orden: ${KEY_LIST}.`,
    en: ({ path: path5 }) => `${path5} must contain the six categories, in order: ${KEY_LIST}.`
  },
  category_object: {
    es: ({ path: path5 }) => `${path5} debe ser un objeto.`,
    en: ({ path: path5 }) => `${path5} must be an object.`
  },
  category_key: {
    es: ({ path: path5, expected }) => `${path5}.key debe ser "${expected}".`,
    en: ({ path: path5, expected }) => `${path5}.key must be "${expected}".`
  },
  score_integer: {
    es: ({ path: path5 }) => `${path5} debe ser un entero de 0 a 10, o null (no una cadena ni 7/10).`,
    en: ({ path: path5 }) => `${path5} must be an integer from 0 to 10, or null (not a string or 7/10).`
  },
  explanation_string: {
    es: ({ path: path5 }) => `${path5} debe ser una cadena.`,
    en: ({ path: path5 }) => `${path5} must be a string.`
  },
  side_positions_array: {
    es: () => "sidePositions debe ser un array.",
    en: () => "sidePositions must be an array."
  },
  side_position_object: {
    es: ({ path: path5 }) => `${path5} debe ser un objeto.`,
    en: ({ path: path5 }) => `${path5} must be an object.`
  },
  side_position_id: {
    es: ({ path: path5 }) => `${path5}.positionId debe ser una cadena no vac\xEDa.`,
    en: ({ path: path5 }) => `${path5}.positionId must be a non-empty string.`
  },
  side_position_label: {
    es: ({ path: path5 }) => `${path5}.label debe ser una cadena.`,
    en: ({ path: path5 }) => `${path5}.label must be a string.`
  },
  bad_pgn: {
    es: () => "No se pudo leer el PGN de la partida enviada.",
    en: () => "Could not parse the submitted game PGN."
  },
  bad_game_tree: {
    es: () => "No se pudo leer gameTreePgn.",
    en: () => "Could not parse gameTreePgn."
  },
  bad_start_fen: {
    es: ({ detail }) => `Posici\xF3n inicial inv\xE1lida en el PGN: ${detail}`,
    en: ({ detail }) => `Invalid starting position in the PGN: ${detail}`
  },
  mainline_mismatch: {
    es: () => "La l\xEDnea principal de gameTreePgn no coincide con la partida enviada.",
    en: () => "gameTreePgn mainline does not match the submitted game."
  },
  unknown_position_id: {
    es: ({ id, path: path5 }) => `Identificador de posici\xF3n desconocido ${id} en ${path5}.`,
    en: ({ id, path: path5 }) => `Unknown position id ${id} in ${path5}.`
  },
  side_from_game: {
    es: ({ id }) => `${id} es de la partida y no debe listarse como posici\xF3n externa.`,
    en: ({ id }) => `${id} is from the game and must not be listed as a side position.`
  },
  side_position_in_tree: {
    es: ({ id }) => `La posici\xF3n externa ${id} no debe aparecer en el \xE1rbol de la partida.`,
    en: ({ id }) => `Side position ${id} must not appear in the game tree.`
  },
  side_variation: {
    es: ({ san }) => `Una posici\xF3n externa no debe entrar en el \xE1rbol (variante que empieza ${san}). D\xE9jala en sidePositions.`,
    en: ({ san }) => `Side position must not enter the game tree (variation starting ${san}). Keep it in sidePositions.`
  },
  illegal_move: {
    es: ({ san }) => `Jugada ilegal o ambigua en el \xE1rbol: ${san}`,
    en: ({ san }) => `Illegal or ambiguous move in the game tree: ${san}`
  },
  illegal_manifest_move: {
    es: ({ san, id }) => `Jugada ilegal en positions.${id}: ${san}`,
    en: ({ san, id }) => `Illegal move in positions.${id}: ${san}`
  },
  ambiguous_manifest_move: {
    es: ({ san, id }) => `Jugada ambigua en positions.${id}: ${san}`,
    en: ({ san, id }) => `Ambiguous move in positions.${id}: ${san}`
  },
  bad_fen: {
    es: ({ fen, id }) => `FEN inv\xE1lido en positions.${id}: ${fen}`,
    en: ({ fen, id }) => `Invalid FEN in positions.${id}: ${fen}`
  },
  unknown_ply: {
    es: ({ ply, id }) => `Ply desconocido o fuera de la partida en positions.${id}: ${ply}`,
    en: ({ ply, id }) => `Unknown or out-of-range ply in positions.${id}: ${ply}`
  },
  bad_position_id: {
    es: ({ id }) => `Clave de manifiesto inv\xE1lida ${id}: debe ser pos_N.`,
    en: ({ id }) => `Invalid manifest id ${id}: must be pos_N.`
  },
  bad_manifest_entry: {
    es: ({ id }) => `positions.${id} debe ser un objeto con from y moves.`,
    en: ({ id }) => `positions.${id} must be an object with from and moves.`
  },
  bad_manifest_from: {
    es: ({ id }) => `positions.${id}.from debe ser exactamente {ply:n}, {fen:"..."} o {start:true}.`,
    en: ({ id }) => `positions.${id}.from must be exactly {ply:n}, {fen:"..."} or {start:true}.`
  },
  bad_manifest_moves: {
    es: ({ id }) => `positions.${id}.moves debe ser un array de SAN en ingl\xE9s.`,
    en: ({ id }) => `positions.${id}.moves must be an array of English SAN strings.`
  },
  bad_manifest_eval: {
    es: ({ id }) => `positions.${id}.eval debe ser {score:"cp N"|"mate N", depth, bestmove}.`,
    en: ({ id }) => `positions.${id}.eval must be {score:"cp N"|"mate N", depth, bestmove}.`
  },
  claves_headings: {
    es: () => "commentaries.medio debe marcar los t\xEDtulos de secci\xF3n con **t\xEDtulo** o # t\xEDtulo.",
    en: () => "commentaries.medio must mark genuine section headings with **title** or # title."
  },
  missing_category: {
    es: ({ side, key }) => `ratings.${side} debe incluir ${key} (puntuaci\xF3n 0\u201310 o null).`,
    en: ({ side, key }) => `ratings.${side} must include ${key} (score 0\u201310 or null).`
  },
  engine_kind: {
    es: () => 'agent.engine.kind debe ser "native" o "lite".',
    en: () => 'agent.engine.kind must be "native" or "lite".'
  },
  bad_engine_analysis: {
    es: ({ detail }) => `engineAnalysis no es un documento chess-tutor-engine/1 v\xE1lido${detail ? `: ${detail}` : "."}`,
    en: ({ detail }) => `engineAnalysis is not a valid chess-tutor-engine/1 document${detail ? `: ${detail}` : "."}`
  }
};
function v1Error(code, lang, params = {}) {
  const locale = normalizeAnalysisLang(lang);
  const table = TEMPLATES[code];
  const path5 = params.path ?? "";
  if (!table) {
    return {
      code,
      message: params.message ?? code,
      path: path5
    };
  }
  const render = table[locale] ?? table.en;
  return {
    code,
    message: render(params),
    path: path5
  };
}

// backend/output-schema.mjs
var RATINGS_PURPOSE = [
  "A playful, openly subjective rating of each player's style and skills in this game.",
  `Use these six categories, in this order, for both players: ${STANDARD_RATING_LABELS.join(", ")}.`,
  Object.entries(STANDARD_RATING_MEANINGS).map(([name, meaning]) => `${name}: ${meaning}`).join(" "),
  "Fill every category. Score 0\u201310, or null when that facet was not meaningfully tested (no invented endgame score if there was no endgame).",
  "Do not invent extra category names."
].join(" ");
var RATINGS_ELO_SENTENCE = "Da tambi\xE9n un Elo estimado a ojo para cada bando, juzgado por c\xF3mo jug\xF3, sin dejarte llevar por las cifras de rendimiento.";
var GAME_TITLE_PURPOSE = "Short evocative flavour title for this game, not the players, event, or date.";
function playerRatingsSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["vibeElo", "categories"],
    properties: {
      vibeElo: { type: "integer" },
      categories: {
        type: "array",
        minItems: STANDARD_RATING_LABELS.length,
        maxItems: STANDARD_RATING_LABELS.length,
        items: ratingCategorySchema()
      }
    }
  };
}
var ANALYSIS_OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["gameTitle", "gameTreePgn", "commentaries", "sidePositions", "ratings"],
  properties: {
    gameTitle: {
      type: "string",
      description: GAME_TITLE_PURPOSE
    },
    gameTreePgn: {
      type: "string",
      description: "PGN of the submitted game: the same mainline, plus variations and NAG glyphs for the move tree. No prose comments. Do not put other openings or famous games here."
    },
    commentaries: {
      type: "object",
      additionalProperties: false,
      required: ["corto", "medio", "largo", "blancas", "negras"],
      properties: {
        corto: commentarySchema(
          "Relato (corto): The reader wants to understand what this game was about: the ideas and the chess concepts that shaped it and decided it. They're not trying to follow the moves. Concise straightforward thematic narrative; name the defining strategic idea up front and use very few move references. A defining idea may be positional \u2014 activity, tempi, structure \u2014 not merely a forced combination; say which it was in this game, without reciting one famous story as a template. Natural Spanish. Plain text, no bold. English SAN with move numbers when useful. Objective; no advice to either side. Game moves do not need {@pos_N}; tool-issued references are for outside positions or shapes."
        ),
        medio: commentarySchema(
          "Claves (medio): The reader wants to go deep into whatever the coach found most important in this game, and understand it fully. One section covers the opening and early plans; the others are distinct pivotal ideas. Mark genuine section titles in bold; body prose is plain. Natural Spanish. English SAN with move numbers when useful. Objective. Game moves do not need {@pos_N}; use tool-issued ids for outside positions and shapes."
        ),
        largo: commentarySchema(
          "Gu\xEDa (largo): The reader is going through the game move by move with the board in front of them, and wants commentary wherever the game gives a reason for it. Name the opening when it is identifiable; if it is not clear, say so. Early on, explain intentions, plans, consequences, and meaningful alternatives, not just more variations. Natural Spanish. Plain text, no bold. English SAN with move numbers when useful. Objective. Game moves do not need {@pos_N}; use tool-issued ids for outside positions and shapes."
        ),
        blancas: commentarySchema(
          "Blancas: The reader is the player who played that side. He knows his moves and why he chose them. He wants whatever from this game helps him play better: what he didn't see and what this game shows about his play. Prioritize actual missed opportunities and practical earlier improvements. Distinguish an equivalent alternative from an improvement. Do not manufacture criticism of moves he handled well. Address White in natural Spanish as t\xFA, not condescending. Do not explain his own good moves back to him as if teaching him his own game. Plain text, no bold. English SAN with move numbers when useful. Game moves do not need {@pos_N}; use tool-issued ids for outside positions and shapes."
        ),
        negras: commentarySchema(
          "Negras: The reader is the player who played that side. He knows his moves and why he chose them. He wants whatever from this game helps him play better: what he didn't see and what this game shows about his play. Prioritize actual missed opportunities and practical earlier improvements. Distinguish an equivalent alternative from an improvement. Do not manufacture criticism of moves he handled well. Address Black in natural Spanish as t\xFA, not condescending. Do not explain his own good moves back to him as if teaching him his own game. Plain text, no bold. English SAN with move numbers when useful. Game moves do not need {@pos_N}; use tool-issued ids for outside positions and shapes."
        )
      }
    },
    sidePositions: {
      type: "array",
      description: "Positions reached from the start position or a known FEN (another opening, a famous game), not from a ply of this game. They must not appear in gameTreePgn.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["positionId", "label"],
        properties: {
          positionId: {
            type: "string",
            description: "Tool-issued id from the position tool, e.g. pos_1."
          },
          label: {
            type: "string",
            description: "Short label for the side board, e.g. an opening name."
          }
        }
      }
    },
    ratings: {
      type: "object",
      additionalProperties: false,
      description: `${RATINGS_PURPOSE} ${RATINGS_ELO_SENTENCE}`,
      required: ["white", "black"],
      properties: {
        white: playerRatingsSchema(),
        black: playerRatingsSchema()
      }
    }
  }
};
function commentarySchema(description) {
  return { type: "string", description };
}
var COMMENTARY_KEYS = ["corto", "medio", "largo", "blancas", "negras"];
var FORMAT_V1 = "chess-tutor-analysis/1";
var ENGINE_FORMAT_V1 = "chess-tutor-engine/1";
function v1PlayerRatingsSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["vibeElo", "categories"],
    properties: {
      vibeElo: { type: "integer" },
      categories: {
        type: "array",
        minItems: STANDARD_RATING_KEYS.length,
        maxItems: STANDARD_RATING_KEYS.length,
        items: v1RatingCategorySchema()
      }
    }
  };
}
function v1ManifestFromSchema() {
  return {
    oneOf: [
      {
        type: "object",
        additionalProperties: false,
        required: ["ply"],
        properties: { ply: { type: "integer", minimum: 0 } }
      },
      {
        type: "object",
        additionalProperties: false,
        required: ["fen"],
        properties: { fen: { type: "string", minLength: 1 } }
      },
      {
        type: "object",
        additionalProperties: false,
        required: ["start"],
        properties: { start: { const: true } }
      }
    ]
  };
}
function v1ManifestEvalSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["score", "depth", "bestmove"],
    properties: {
      score: {
        type: "string",
        pattern: "^(cp -?\\d+|mate -?\\d+)$",
        description: 'Engine score from the side to move: "cp 34" or "mate -3".'
      },
      depth: { type: "integer", minimum: 1 },
      bestmove: { type: "string", minLength: 1 }
    }
  };
}
function v1ManifestEntrySchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["from", "moves"],
    properties: {
      from: v1ManifestFromSchema(),
      moves: {
        type: "array",
        items: { type: "string" },
        description: "English SAN played from the starting point."
      },
      eval: v1ManifestEvalSchema()
    }
  };
}
function v1AgentSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["model"],
    properties: {
      model: { type: "string", minLength: 1 },
      effort: { type: "string" },
      tool: { type: "string" },
      helper: { type: "string" },
      engine: {
        type: "object",
        additionalProperties: false,
        required: ["name", "kind"],
        properties: {
          name: { type: "string", minLength: 1 },
          kind: { type: "string", enum: ["native", "lite"] },
          maxDepth: { type: "integer", minimum: 1 }
        }
      }
    }
  };
}
function v1AnalysisSchema() {
  const analysis = structuredClone(ANALYSIS_OUTPUT_SCHEMA);
  analysis.description = "The five texts, tree, side positions and ratings. Prose and rating explanations match top-level lang; category labels are stored by key.";
  analysis.properties.ratings.properties = {
    white: v1PlayerRatingsSchema(),
    black: v1PlayerRatingsSchema()
  };
  return analysis;
}
var V1_ANALYSIS_SCHEMA = v1AnalysisSchema();
function v1EngineAnalysisSchema() {
  return {
    type: "object",
    description: "Optional full-game engine pass (chess-tutor-engine/1). chess-tools.mjs fills this on submit with the same document the browser stores in the engine cache. Older submissions may omit it.",
    required: ["format", "gameHash", "engine", "plies", "summary"],
    properties: {
      format: { const: ENGINE_FORMAT_V1 },
      gameHash: { type: "string", pattern: "^[0-9a-f]{64}$" },
      engine: {
        type: "object",
        required: ["name", "depth", "multipv"],
        properties: {
          name: { type: "string", minLength: 1 },
          depth: { type: "integer", minimum: 1, maximum: 64 },
          multipv: { type: "integer", minimum: 1, maximum: 5 }
        }
      },
      plies: { type: "array", minItems: 1, maxItems: 512 },
      summary: { type: "object" },
      settings: { type: "object" },
      createdAt: { type: "string" },
      keyMoments: { type: "array" }
    }
  };
}
var V1_SUBMISSION_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "chess-tutor-analysis/1",
  title: "chess-tutor analysis submission v1",
  type: "object",
  additionalProperties: false,
  required: ["format", "session", "lang", "agent", "positions", "analysis"],
  properties: {
    format: { const: FORMAT_V1 },
    session: { type: "string", minLength: 1 },
    lang: { type: "string", enum: ["es", "en"] },
    agent: v1AgentSchema(),
    positions: {
      type: "object",
      description: "Position manifest. Keys are pos_N ids referenced by the analysis.",
      additionalProperties: v1ManifestEntrySchema()
    },
    analysis: V1_ANALYSIS_SCHEMA,
    engineAnalysis: v1EngineAnalysisSchema()
  }
};
function looksFencedJson(raw) {
  return typeof raw === "string" && /^```/.test(raw.trim());
}
function parseV1JsonText(raw, lang = "es") {
  if (raw !== null && typeof raw === "object" && !Array.isArray(raw)) {
    return { ok: true, value: raw, errors: [] };
  }
  if (typeof raw !== "string") {
    return { ok: false, value: null, errors: [v1Error("not_json", lang, { path: "" })] };
  }
  if (looksFencedJson(raw)) {
    return { ok: false, value: null, errors: [v1Error("fenced_json", lang, { path: "" })] };
  }
  try {
    const value = JSON.parse(raw.trim());
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      return { ok: false, value: null, errors: [v1Error("not_object", lang, { path: "" })] };
    }
    return { ok: true, value, errors: [] };
  } catch {
    return { ok: false, value: null, errors: [v1Error("invalid_json", lang, { path: "" })] };
  }
}
function parseV1Analysis(value, lang = "es") {
  const errors = [];
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, output: null, errors: [v1Error("not_object", lang, { path: "analysis" })] };
  }
  if (typeof value.gameTreePgn !== "string" || value.gameTreePgn.trim() === "") {
    errors.push(v1Error("empty_game_tree", lang, { path: "analysis.gameTreePgn" }));
  }
  const commentaries = value.commentaries;
  if (commentaries === null || typeof commentaries !== "object" || Array.isArray(commentaries)) {
    errors.push(v1Error("commentaries_object", lang, { path: "analysis.commentaries" }));
  } else {
    for (const key of COMMENTARY_KEYS) {
      if (typeof commentaries[key] !== "string") {
        errors.push(v1Error("commentary_string", lang, { path: `analysis.commentaries.${key}` }));
      }
    }
  }
  if (typeof value.gameTitle !== "string") {
    errors.push(v1Error("game_title_string", lang, { path: "analysis.gameTitle" }));
  } else if (value.gameTitle.trim() === "") {
    errors.push(v1Error("game_title", lang, { path: "analysis.gameTitle" }));
  }
  const parsedRatings = parseV1Ratings(value.ratings, lang);
  if (!parsedRatings.ok) errors.push(...parsedRatings.errors);
  if (!Array.isArray(value.sidePositions)) {
    errors.push(v1Error("side_positions_array", lang, { path: "analysis.sidePositions" }));
  } else {
    value.sidePositions.forEach((entry, index) => {
      const path5 = `analysis.sidePositions[${index}]`;
      if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
        errors.push(v1Error("side_position_object", lang, { path: path5 }));
        return;
      }
      if (typeof entry.positionId !== "string" || entry.positionId.trim() === "") {
        errors.push(v1Error("side_position_id", lang, { path: path5 }));
      }
      if (entry.label !== void 0 && typeof entry.label !== "string") {
        errors.push(v1Error("side_position_label", lang, { path: path5 }));
      }
    });
  }
  if (errors.length) return { ok: false, output: null, errors };
  return {
    ok: true,
    output: {
      gameTitle: value.gameTitle.trim(),
      gameTreePgn: value.gameTreePgn,
      commentaries: {
        corto: value.commentaries.corto,
        medio: value.commentaries.medio,
        largo: value.commentaries.largo,
        blancas: value.commentaries.blancas,
        negras: value.commentaries.negras
      },
      sidePositions: value.sidePositions.map((entry) => ({
        positionId: entry.positionId.trim(),
        label: typeof entry.label === "string" ? entry.label : ""
      })),
      ratings: parsedRatings.ratings
    },
    errors: []
  };
}
function parseV1Ratings(value, lang = "es") {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    return {
      ok: false,
      ratings: null,
      errors: [v1Error("ratings_required", lang, { path: "analysis.ratings" })]
    };
  }
  const errors = [];
  const white = parseV1PlayerRatings(value.white, "analysis.ratings.white", errors, lang);
  const black = parseV1PlayerRatings(value.black, "analysis.ratings.black", errors, lang);
  if (errors.length) return { ok: false, ratings: null, errors };
  return { ok: true, ratings: { white, black }, errors: [] };
}
function parseV1PlayerRatings(value, path5, errors, lang) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    errors.push(v1Error("player_ratings_object", lang, { path: path5 }));
    return null;
  }
  if (!Number.isInteger(value.vibeElo)) {
    errors.push(v1Error("vibe_elo_integer", lang, { path: `${path5}.vibeElo` }));
  }
  if (!Array.isArray(value.categories)) {
    errors.push(v1Error("categories_array", lang, { path: `${path5}.categories` }));
    return { vibeElo: Number.isInteger(value.vibeElo) ? value.vibeElo : null, categories: [] };
  }
  if (value.categories.length !== STANDARD_RATING_KEYS.length) {
    errors.push(v1Error("categories_length", lang, { path: `${path5}.categories` }));
  }
  const categories = [];
  STANDARD_RATING_KEYS.forEach((expected, index) => {
    const entry = value.categories[index];
    const entryPath = `${path5}.categories[${index}]`;
    const parsed = parseV1RatingCategory(entry, entryPath, expected, errors, lang);
    if (parsed) categories.push(parsed);
  });
  return {
    vibeElo: Number.isInteger(value.vibeElo) ? value.vibeElo : null,
    categories
  };
}
function parseV1RatingCategory(entry, path5, expectedKey, errors, lang) {
  if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
    errors.push(v1Error("category_object", lang, { path: path5 }));
    return null;
  }
  if (entry.key !== expectedKey) {
    errors.push(v1Error("category_key", lang, { path: path5, expected: expectedKey }));
  }
  const score = parseV1RatingScore(entry.score, `${path5}.score`, errors, lang);
  if (entry.explanation !== void 0 && entry.explanation !== null && typeof entry.explanation !== "string") {
    errors.push(v1Error("explanation_string", lang, { path: `${path5}.explanation` }));
  }
  const explanation = typeof entry.explanation === "string" ? entry.explanation.trim() : "";
  if (entry.key !== expectedKey || score == null && entry.score !== null) return null;
  return { key: expectedKey, score, explanation };
}
function parseV1RatingScore(value, path5, errors, lang) {
  if (value === null) return null;
  if (Number.isInteger(value) && value >= 0 && value <= 10) return value;
  errors.push(v1Error("score_integer", lang, { path: path5 }));
  return void 0;
}
var REF_OPEN = "{@";
function parseCommentaryReferences(text, path5) {
  const errors = [];
  const tokens = [];
  if (typeof text !== "string") {
    return { tokens, errors };
  }
  let from = 0;
  while (from < text.length) {
    const start = text.indexOf(REF_OPEN, from);
    if (start === -1) break;
    const end = text.indexOf("}", start + 2);
    if (end === -1) {
      errors.push({
        code: "malformed_reference",
        message: `Malformed reference (unclosed {@) in ${path5}.`,
        path: path5
      });
      break;
    }
    const raw = text.slice(start, end + 1);
    const parsed = parseReferenceToken(raw, path5);
    if (parsed.error) errors.push(parsed.error);
    tokens.push({
      start,
      end: end + 1,
      raw,
      id: parsed.id,
      label: parsed.label,
      shapesMarkup: parsed.shapesMarkup,
      ok: !parsed.error
    });
    from = end + 1;
  }
  return { tokens, errors };
}
function parseReferenceToken(raw, path5) {
  const inner = raw.slice(2, -1);
  if (inner === "") {
    return {
      error: {
        code: "malformed_reference",
        message: `Malformed reference ${raw} in ${path5}: empty id.`,
        path: path5
      }
    };
  }
  const pipe = inner.indexOf("|");
  const left = pipe === -1 ? inner : inner.slice(0, pipe);
  const shapesMarkup = pipe === -1 ? "" : inner.slice(pipe + 1);
  const colon = left.indexOf(":");
  const id = (colon === -1 ? left : left.slice(0, colon)).trim();
  const label = (colon === -1 ? "" : left.slice(colon + 1)).trim();
  if (!/^pos_\d+$/.test(id)) {
    return {
      error: {
        code: "malformed_reference",
        message: `Malformed reference ${raw} in ${path5}: id must be a tool-issued pos_N.`,
        path: path5
      }
    };
  }
  return { id, label, shapesMarkup };
}

// node_modules/@badrap/result/dist/node-mjs/index.mjs
var _Result = class {
  unwrap(ok, err) {
    const r = this._chain((value) => Result.ok(ok ? ok(value) : value), (error) => err ? Result.ok(err(error)) : Result.err(error));
    if (r.isErr) {
      throw r.error;
    }
    return r.value;
  }
  map(ok, err) {
    return this._chain((value) => Result.ok(ok(value)), (error) => Result.err(err ? err(error) : error));
  }
  chain(ok, err) {
    return this._chain(ok, err ?? ((error) => Result.err(error)));
  }
};
var _Ok = class extends _Result {
  value;
  isOk = true;
  isErr = false;
  constructor(value) {
    super();
    this.value = value;
  }
  _chain(ok, _err) {
    return ok(this.value);
  }
};
var _Err = class extends _Result {
  error;
  isOk = false;
  isErr = true;
  constructor(error) {
    super();
    this.error = error;
  }
  _chain(_ok, err) {
    return err(this.error);
  }
};
var Result;
(function(Result2) {
  function ok(value) {
    return new _Ok(value);
  }
  Result2.ok = ok;
  function err(error) {
    return new _Err(error || new Error());
  }
  Result2.err = err;
  function all(obj) {
    if (Array.isArray(obj)) {
      const res2 = [];
      for (let i = 0; i < obj.length; i++) {
        const item = obj[i];
        if (item.isErr) {
          return item;
        }
        res2.push(item.value);
      }
      return Result2.ok(res2);
    }
    const res = {};
    const keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) {
      const item = obj[keys[i]];
      if (item.isErr) {
        return item;
      }
      res[keys[i]] = item.value;
    }
    return Result2.ok(res);
  }
  Result2.all = all;
})(Result || (Result = {}));

// node_modules/chessops/dist/esm/squareSet.js
var popcnt32 = (n) => {
  n = n - (n >>> 1 & 1431655765);
  n = (n & 858993459) + (n >>> 2 & 858993459);
  return Math.imul(n + (n >>> 4) & 252645135, 16843009) >> 24;
};
var bswap32 = (n) => {
  n = n >>> 8 & 16711935 | (n & 16711935) << 8;
  return n >>> 16 & 65535 | (n & 65535) << 16;
};
var rbit32 = (n) => {
  n = n >>> 1 & 1431655765 | (n & 1431655765) << 1;
  n = n >>> 2 & 858993459 | (n & 858993459) << 2;
  n = n >>> 4 & 252645135 | (n & 252645135) << 4;
  return bswap32(n);
};
var SquareSet = class _SquareSet {
  constructor(lo, hi) {
    this.lo = lo | 0;
    this.hi = hi | 0;
  }
  static fromSquare(square) {
    return square >= 32 ? new _SquareSet(0, 1 << square - 32) : new _SquareSet(1 << square, 0);
  }
  static fromRank(rank) {
    return new _SquareSet(255, 0).shl64(8 * rank);
  }
  static fromFile(file) {
    return new _SquareSet(16843009 << file, 16843009 << file);
  }
  static empty() {
    return new _SquareSet(0, 0);
  }
  static full() {
    return new _SquareSet(4294967295, 4294967295);
  }
  static corners() {
    return new _SquareSet(129, 2164260864);
  }
  static center() {
    return new _SquareSet(402653184, 24);
  }
  static backranks() {
    return new _SquareSet(255, 4278190080);
  }
  static backrank(color) {
    return color === "white" ? new _SquareSet(255, 0) : new _SquareSet(0, 4278190080);
  }
  static lightSquares() {
    return new _SquareSet(1437226410, 1437226410);
  }
  static darkSquares() {
    return new _SquareSet(2857740885, 2857740885);
  }
  complement() {
    return new _SquareSet(~this.lo, ~this.hi);
  }
  xor(other) {
    return new _SquareSet(this.lo ^ other.lo, this.hi ^ other.hi);
  }
  union(other) {
    return new _SquareSet(this.lo | other.lo, this.hi | other.hi);
  }
  intersect(other) {
    return new _SquareSet(this.lo & other.lo, this.hi & other.hi);
  }
  diff(other) {
    return new _SquareSet(this.lo & ~other.lo, this.hi & ~other.hi);
  }
  intersects(other) {
    return this.intersect(other).nonEmpty();
  }
  isDisjoint(other) {
    return this.intersect(other).isEmpty();
  }
  supersetOf(other) {
    return other.diff(this).isEmpty();
  }
  subsetOf(other) {
    return this.diff(other).isEmpty();
  }
  shr64(shift) {
    if (shift >= 64)
      return _SquareSet.empty();
    if (shift >= 32)
      return new _SquareSet(this.hi >>> shift - 32, 0);
    if (shift > 0)
      return new _SquareSet(this.lo >>> shift ^ this.hi << 32 - shift, this.hi >>> shift);
    return this;
  }
  shl64(shift) {
    if (shift >= 64)
      return _SquareSet.empty();
    if (shift >= 32)
      return new _SquareSet(0, this.lo << shift - 32);
    if (shift > 0)
      return new _SquareSet(this.lo << shift, this.hi << shift ^ this.lo >>> 32 - shift);
    return this;
  }
  bswap64() {
    return new _SquareSet(bswap32(this.hi), bswap32(this.lo));
  }
  rbit64() {
    return new _SquareSet(rbit32(this.hi), rbit32(this.lo));
  }
  minus64(other) {
    const lo = this.lo - other.lo;
    const c = (lo & other.lo & 1) + (other.lo >>> 1) + (lo >>> 1) >>> 31;
    return new _SquareSet(lo, this.hi - (other.hi + c));
  }
  equals(other) {
    return this.lo === other.lo && this.hi === other.hi;
  }
  size() {
    return popcnt32(this.lo) + popcnt32(this.hi);
  }
  isEmpty() {
    return this.lo === 0 && this.hi === 0;
  }
  nonEmpty() {
    return this.lo !== 0 || this.hi !== 0;
  }
  has(square) {
    return (square >= 32 ? this.hi & 1 << square - 32 : this.lo & 1 << square) !== 0;
  }
  set(square, on) {
    return on ? this.with(square) : this.without(square);
  }
  with(square) {
    return square >= 32 ? new _SquareSet(this.lo, this.hi | 1 << square - 32) : new _SquareSet(this.lo | 1 << square, this.hi);
  }
  without(square) {
    return square >= 32 ? new _SquareSet(this.lo, this.hi & ~(1 << square - 32)) : new _SquareSet(this.lo & ~(1 << square), this.hi);
  }
  toggle(square) {
    return square >= 32 ? new _SquareSet(this.lo, this.hi ^ 1 << square - 32) : new _SquareSet(this.lo ^ 1 << square, this.hi);
  }
  last() {
    if (this.hi !== 0)
      return 63 - Math.clz32(this.hi);
    if (this.lo !== 0)
      return 31 - Math.clz32(this.lo);
    return;
  }
  first() {
    if (this.lo !== 0)
      return 31 - Math.clz32(this.lo & -this.lo);
    if (this.hi !== 0)
      return 63 - Math.clz32(this.hi & -this.hi);
    return;
  }
  withoutFirst() {
    if (this.lo !== 0)
      return new _SquareSet(this.lo & this.lo - 1, this.hi);
    return new _SquareSet(0, this.hi & this.hi - 1);
  }
  moreThanOne() {
    return this.hi !== 0 && this.lo !== 0 || (this.lo & this.lo - 1) !== 0 || (this.hi & this.hi - 1) !== 0;
  }
  singleSquare() {
    return this.moreThanOne() ? void 0 : this.last();
  }
  *[Symbol.iterator]() {
    let lo = this.lo;
    let hi = this.hi;
    while (lo !== 0) {
      const idx = 31 - Math.clz32(lo & -lo);
      lo ^= 1 << idx;
      yield idx;
    }
    while (hi !== 0) {
      const idx = 31 - Math.clz32(hi & -hi);
      hi ^= 1 << idx;
      yield 32 + idx;
    }
  }
  *reversed() {
    let lo = this.lo;
    let hi = this.hi;
    while (hi !== 0) {
      const idx = 31 - Math.clz32(hi);
      hi ^= 1 << idx;
      yield 32 + idx;
    }
    while (lo !== 0) {
      const idx = 31 - Math.clz32(lo);
      lo ^= 1 << idx;
      yield idx;
    }
  }
};

// node_modules/chessops/dist/esm/types.js
var FILE_NAMES = ["a", "b", "c", "d", "e", "f", "g", "h"];
var RANK_NAMES = ["1", "2", "3", "4", "5", "6", "7", "8"];
var COLORS = ["white", "black"];
var ROLES = ["pawn", "knight", "bishop", "rook", "queen", "king"];
var CASTLING_SIDES = ["a", "h"];
var isDrop = (v) => "role" in v;
var isNormal = (v) => "from" in v;

// node_modules/chessops/dist/esm/util.js
var defined = (v) => v !== void 0;
var opposite = (color) => color === "white" ? "black" : "white";
var squareRank = (square) => square >> 3;
var squareFile = (square) => square & 7;
var squareFromCoords = (file, rank) => 0 <= file && file < 8 && 0 <= rank && rank < 8 ? file + 8 * rank : void 0;
var roleToChar = (role) => {
  switch (role) {
    case "pawn":
      return "p";
    case "knight":
      return "n";
    case "bishop":
      return "b";
    case "rook":
      return "r";
    case "queen":
      return "q";
    case "king":
      return "k";
  }
};
function charToRole(ch) {
  switch (ch.toLowerCase()) {
    case "p":
      return "pawn";
    case "n":
      return "knight";
    case "b":
      return "bishop";
    case "r":
      return "rook";
    case "q":
      return "queen";
    case "k":
      return "king";
    default:
      return;
  }
}
function parseSquare(str) {
  if (str.length !== 2)
    return;
  return squareFromCoords(str.charCodeAt(0) - "a".charCodeAt(0), str.charCodeAt(1) - "1".charCodeAt(0));
}
var makeSquare = (square) => FILE_NAMES[squareFile(square)] + RANK_NAMES[squareRank(square)];
var parseUci = (str) => {
  if (str[1] === "@" && str.length === 4) {
    const role = charToRole(str[0]);
    const to = parseSquare(str.slice(2));
    if (role && defined(to))
      return { role, to };
  } else if (str.length === 4 || str.length === 5) {
    const from = parseSquare(str.slice(0, 2));
    const to = parseSquare(str.slice(2, 4));
    let promotion;
    if (str.length === 5) {
      promotion = charToRole(str[4]);
      if (!promotion)
        return;
    }
    if (defined(from) && defined(to))
      return { from, to, promotion };
  }
  return;
};
var makeUci = (move) => isDrop(move) ? `${roleToChar(move.role).toUpperCase()}@${makeSquare(move.to)}` : makeSquare(move.from) + makeSquare(move.to) + (move.promotion ? roleToChar(move.promotion) : "");
var kingCastlesTo = (color, side) => color === "white" ? side === "a" ? 2 : 6 : side === "a" ? 58 : 62;
var rookCastlesTo = (color, side) => color === "white" ? side === "a" ? 3 : 5 : side === "a" ? 59 : 61;

// node_modules/chessops/dist/esm/attacks.js
var computeRange = (square, deltas) => {
  let range = SquareSet.empty();
  for (const delta of deltas) {
    const sq = square + delta;
    if (0 <= sq && sq < 64 && Math.abs(squareFile(square) - squareFile(sq)) <= 2) {
      range = range.with(sq);
    }
  }
  return range;
};
var tabulate = (f) => {
  const table = [];
  for (let square = 0; square < 64; square++)
    table[square] = f(square);
  return table;
};
var KING_ATTACKS = tabulate((sq) => computeRange(sq, [-9, -8, -7, -1, 1, 7, 8, 9]));
var KNIGHT_ATTACKS = tabulate((sq) => computeRange(sq, [-17, -15, -10, -6, 6, 10, 15, 17]));
var PAWN_ATTACKS = {
  white: tabulate((sq) => computeRange(sq, [7, 9])),
  black: tabulate((sq) => computeRange(sq, [-7, -9]))
};
var kingAttacks = (square) => KING_ATTACKS[square];
var knightAttacks = (square) => KNIGHT_ATTACKS[square];
var pawnAttacks = (color, square) => PAWN_ATTACKS[color][square];
var FILE_RANGE = tabulate((sq) => SquareSet.fromFile(squareFile(sq)).without(sq));
var RANK_RANGE = tabulate((sq) => SquareSet.fromRank(squareRank(sq)).without(sq));
var DIAG_RANGE = tabulate((sq) => {
  const diag = new SquareSet(134480385, 2151686160);
  const shift = 8 * (squareRank(sq) - squareFile(sq));
  return (shift >= 0 ? diag.shl64(shift) : diag.shr64(-shift)).without(sq);
});
var ANTI_DIAG_RANGE = tabulate((sq) => {
  const diag = new SquareSet(270549120, 16909320);
  const shift = 8 * (squareRank(sq) + squareFile(sq) - 7);
  return (shift >= 0 ? diag.shl64(shift) : diag.shr64(-shift)).without(sq);
});
var hyperbola = (sq, range, occupied) => {
  const o = range.intersect(occupied);
  const fwd = o.minus64(SquareSet.fromSquare(sq));
  const rev = o.bswap64().minus64(SquareSet.fromSquare(56 ^ sq));
  return fwd.xor(rev.bswap64()).intersect(range);
};
var rankAttacks = (sq, occupied) => {
  const range = RANK_RANGE[sq];
  const o = range.intersect(occupied);
  const fwd = o.minus64(SquareSet.fromSquare(sq));
  const rev = o.rbit64().minus64(SquareSet.fromSquare(63 - sq));
  return fwd.xor(rev.rbit64()).intersect(range);
};
var bishopAttacks = (square, occupied) => {
  return hyperbola(square, DIAG_RANGE[square], occupied).xor(hyperbola(square, ANTI_DIAG_RANGE[square], occupied));
};
var rookAttacks = (square, occupied) => hyperbola(square, FILE_RANGE[square], occupied).xor(rankAttacks(square, occupied));
var queenAttacks = (square, occupied) => bishopAttacks(square, occupied).xor(rookAttacks(square, occupied));
var attacks = (piece, square, occupied) => {
  switch (piece.role) {
    case "pawn":
      return pawnAttacks(piece.color, square);
    case "knight":
      return knightAttacks(square);
    case "bishop":
      return bishopAttacks(square, occupied);
    case "rook":
      return rookAttacks(square, occupied);
    case "queen":
      return queenAttacks(square, occupied);
    case "king":
      return kingAttacks(square);
  }
};
var ray = (a, b) => {
  const other = SquareSet.fromSquare(b);
  if (RANK_RANGE[a].intersects(other))
    return RANK_RANGE[a].with(a);
  if (ANTI_DIAG_RANGE[a].intersects(other))
    return ANTI_DIAG_RANGE[a].with(a);
  if (DIAG_RANGE[a].intersects(other))
    return DIAG_RANGE[a].with(a);
  if (FILE_RANGE[a].intersects(other))
    return FILE_RANGE[a].with(a);
  return SquareSet.empty();
};
var between = (a, b) => ray(a, b).intersect(SquareSet.full().shl64(a).xor(SquareSet.full().shl64(b))).withoutFirst();

// node_modules/chessops/dist/esm/board.js
var Board = class _Board {
  constructor() {
  }
  static default() {
    const board = new _Board();
    board.reset();
    return board;
  }
  /**
   * Resets all pieces to the default starting position for standard chess.
   */
  reset() {
    this.occupied = new SquareSet(65535, 4294901760);
    this.promoted = SquareSet.empty();
    this.white = new SquareSet(65535, 0);
    this.black = new SquareSet(0, 4294901760);
    this.pawn = new SquareSet(65280, 16711680);
    this.knight = new SquareSet(66, 1107296256);
    this.bishop = new SquareSet(36, 603979776);
    this.rook = new SquareSet(129, 2164260864);
    this.queen = new SquareSet(8, 134217728);
    this.king = new SquareSet(16, 268435456);
  }
  static empty() {
    const board = new _Board();
    board.clear();
    return board;
  }
  clear() {
    this.occupied = SquareSet.empty();
    this.promoted = SquareSet.empty();
    for (const color of COLORS)
      this[color] = SquareSet.empty();
    for (const role of ROLES)
      this[role] = SquareSet.empty();
  }
  clone() {
    const board = new _Board();
    board.occupied = this.occupied;
    board.promoted = this.promoted;
    for (const color of COLORS)
      board[color] = this[color];
    for (const role of ROLES)
      board[role] = this[role];
    return board;
  }
  getColor(square) {
    if (this.white.has(square))
      return "white";
    if (this.black.has(square))
      return "black";
    return;
  }
  getRole(square) {
    for (const role of ROLES) {
      if (this[role].has(square))
        return role;
    }
    return;
  }
  get(square) {
    const color = this.getColor(square);
    if (!color)
      return;
    const role = this.getRole(square);
    const promoted = this.promoted.has(square);
    return { color, role, promoted };
  }
  /**
   * Removes and returns the piece from the given `square`, if any.
   */
  take(square) {
    const piece = this.get(square);
    if (piece) {
      this.occupied = this.occupied.without(square);
      this[piece.color] = this[piece.color].without(square);
      this[piece.role] = this[piece.role].without(square);
      if (piece.promoted)
        this.promoted = this.promoted.without(square);
    }
    return piece;
  }
  /**
   * Put `piece` onto `square`, potentially replacing an existing piece.
   * Returns the existing piece, if any.
   */
  set(square, piece) {
    const old = this.take(square);
    this.occupied = this.occupied.with(square);
    this[piece.color] = this[piece.color].with(square);
    this[piece.role] = this[piece.role].with(square);
    if (piece.promoted)
      this.promoted = this.promoted.with(square);
    return old;
  }
  has(square) {
    return this.occupied.has(square);
  }
  *[Symbol.iterator]() {
    for (const square of this.occupied) {
      yield [square, this.get(square)];
    }
  }
  pieces(color, role) {
    return this[color].intersect(this[role]);
  }
  rooksAndQueens() {
    return this.rook.union(this.queen);
  }
  bishopsAndQueens() {
    return this.bishop.union(this.queen);
  }
  steppers() {
    return this.knight.union(this.pawn).union(this.king);
  }
  sliders() {
    return this.bishop.union(this.rook).union(this.queen);
  }
  /**
   * Finds the unique king of the given `color`, if any.
   */
  kingOf(color) {
    return this.pieces(color, "king").singleSquare();
  }
};

// node_modules/chessops/dist/esm/chess.js
var IllegalSetup;
(function(IllegalSetup2) {
  IllegalSetup2["Empty"] = "ERR_EMPTY";
  IllegalSetup2["OppositeCheck"] = "ERR_OPPOSITE_CHECK";
  IllegalSetup2["PawnsOnBackrank"] = "ERR_PAWNS_ON_BACKRANK";
  IllegalSetup2["Kings"] = "ERR_KINGS";
  IllegalSetup2["Variant"] = "ERR_VARIANT";
})(IllegalSetup || (IllegalSetup = {}));
var PositionError = class extends Error {
};
var attacksTo = (square, attacker, board, occupied) => board[attacker].intersect(rookAttacks(square, occupied).intersect(board.rooksAndQueens()).union(bishopAttacks(square, occupied).intersect(board.bishopsAndQueens())).union(knightAttacks(square).intersect(board.knight)).union(kingAttacks(square).intersect(board.king)).union(pawnAttacks(opposite(attacker), square).intersect(board.pawn)));
var Castles = class _Castles {
  constructor() {
  }
  static default() {
    const castles = new _Castles();
    castles.castlingRights = SquareSet.corners();
    castles.rook = {
      white: { a: 0, h: 7 },
      black: { a: 56, h: 63 }
    };
    castles.path = {
      white: { a: new SquareSet(14, 0), h: new SquareSet(96, 0) },
      black: { a: new SquareSet(0, 234881024), h: new SquareSet(0, 1610612736) }
    };
    return castles;
  }
  static empty() {
    const castles = new _Castles();
    castles.castlingRights = SquareSet.empty();
    castles.rook = {
      white: { a: void 0, h: void 0 },
      black: { a: void 0, h: void 0 }
    };
    castles.path = {
      white: { a: SquareSet.empty(), h: SquareSet.empty() },
      black: { a: SquareSet.empty(), h: SquareSet.empty() }
    };
    return castles;
  }
  clone() {
    const castles = new _Castles();
    castles.castlingRights = this.castlingRights;
    castles.rook = {
      white: { a: this.rook.white.a, h: this.rook.white.h },
      black: { a: this.rook.black.a, h: this.rook.black.h }
    };
    castles.path = {
      white: { a: this.path.white.a, h: this.path.white.h },
      black: { a: this.path.black.a, h: this.path.black.h }
    };
    return castles;
  }
  add(color, side, king, rook) {
    const kingTo = kingCastlesTo(color, side);
    const rookTo = rookCastlesTo(color, side);
    this.castlingRights = this.castlingRights.with(rook);
    this.rook[color][side] = rook;
    this.path[color][side] = between(rook, rookTo).with(rookTo).union(between(king, kingTo).with(kingTo)).without(king).without(rook);
  }
  static fromSetup(setup) {
    const castles = _Castles.empty();
    const rooks = setup.castlingRights.intersect(setup.board.rook);
    for (const color of COLORS) {
      const backrank = SquareSet.backrank(color);
      const king = setup.board.kingOf(color);
      if (!defined(king) || !backrank.has(king))
        continue;
      const side = rooks.intersect(setup.board[color]).intersect(backrank);
      const aSide = side.first();
      if (defined(aSide) && aSide < king)
        castles.add(color, "a", king, aSide);
      const hSide = side.last();
      if (defined(hSide) && king < hSide)
        castles.add(color, "h", king, hSide);
    }
    return castles;
  }
  discardRook(square) {
    if (this.castlingRights.has(square)) {
      this.castlingRights = this.castlingRights.without(square);
      for (const color of COLORS) {
        for (const side of CASTLING_SIDES) {
          if (this.rook[color][side] === square)
            this.rook[color][side] = void 0;
        }
      }
    }
  }
  discardColor(color) {
    this.castlingRights = this.castlingRights.diff(SquareSet.backrank(color));
    this.rook[color].a = void 0;
    this.rook[color].h = void 0;
  }
};
var Position = class {
  constructor(rules) {
    this.rules = rules;
  }
  reset() {
    this.board = Board.default();
    this.pockets = void 0;
    this.turn = "white";
    this.castles = Castles.default();
    this.epSquare = void 0;
    this.remainingChecks = void 0;
    this.halfmoves = 0;
    this.fullmoves = 1;
  }
  setupUnchecked(setup) {
    this.board = setup.board.clone();
    this.board.promoted = SquareSet.empty();
    this.pockets = void 0;
    this.turn = setup.turn;
    this.castles = Castles.fromSetup(setup);
    this.epSquare = validEpSquare(this, setup.epSquare);
    this.remainingChecks = void 0;
    this.halfmoves = setup.halfmoves;
    this.fullmoves = setup.fullmoves;
  }
  // When subclassing overwrite at least:
  //
  // - static default()
  // - static fromSetup()
  // - static clone()
  //
  // - dests()
  // - isVariantEnd()
  // - variantOutcome()
  // - hasInsufficientMaterial()
  // - isStandardMaterial()
  kingAttackers(square, attacker, occupied) {
    return attacksTo(square, attacker, this.board, occupied);
  }
  playCaptureAt(square, captured) {
    this.halfmoves = 0;
    if (captured.role === "rook")
      this.castles.discardRook(square);
    if (this.pockets)
      this.pockets[opposite(captured.color)][captured.promoted ? "pawn" : captured.role]++;
  }
  ctx() {
    const variantEnd = this.isVariantEnd();
    const king = this.board.kingOf(this.turn);
    if (!defined(king)) {
      return { king, blockers: SquareSet.empty(), checkers: SquareSet.empty(), variantEnd, mustCapture: false };
    }
    const snipers = rookAttacks(king, SquareSet.empty()).intersect(this.board.rooksAndQueens()).union(bishopAttacks(king, SquareSet.empty()).intersect(this.board.bishopsAndQueens())).intersect(this.board[opposite(this.turn)]);
    let blockers = SquareSet.empty();
    for (const sniper of snipers) {
      const b = between(king, sniper).intersect(this.board.occupied);
      if (!b.moreThanOne())
        blockers = blockers.union(b);
    }
    const checkers = this.kingAttackers(king, opposite(this.turn), this.board.occupied);
    return {
      king,
      blockers,
      checkers,
      variantEnd,
      mustCapture: false
    };
  }
  clone() {
    var _a, _b;
    const pos = new this.constructor();
    pos.board = this.board.clone();
    pos.pockets = (_a = this.pockets) === null || _a === void 0 ? void 0 : _a.clone();
    pos.turn = this.turn;
    pos.castles = this.castles.clone();
    pos.epSquare = this.epSquare;
    pos.remainingChecks = (_b = this.remainingChecks) === null || _b === void 0 ? void 0 : _b.clone();
    pos.halfmoves = this.halfmoves;
    pos.fullmoves = this.fullmoves;
    return pos;
  }
  validate() {
    if (this.board.occupied.isEmpty())
      return Result.err(new PositionError(IllegalSetup.Empty));
    if (this.board.king.size() !== 2)
      return Result.err(new PositionError(IllegalSetup.Kings));
    if (!defined(this.board.kingOf(this.turn)))
      return Result.err(new PositionError(IllegalSetup.Kings));
    const otherKing = this.board.kingOf(opposite(this.turn));
    if (!defined(otherKing))
      return Result.err(new PositionError(IllegalSetup.Kings));
    if (this.kingAttackers(otherKing, this.turn, this.board.occupied).nonEmpty()) {
      return Result.err(new PositionError(IllegalSetup.OppositeCheck));
    }
    if (SquareSet.backranks().intersects(this.board.pawn)) {
      return Result.err(new PositionError(IllegalSetup.PawnsOnBackrank));
    }
    return Result.ok(void 0);
  }
  dropDests(_ctx) {
    return SquareSet.empty();
  }
  dests(square, ctx) {
    ctx = ctx || this.ctx();
    if (ctx.variantEnd)
      return SquareSet.empty();
    const piece = this.board.get(square);
    if (!piece || piece.color !== this.turn)
      return SquareSet.empty();
    let pseudo, legal;
    if (piece.role === "pawn") {
      pseudo = pawnAttacks(this.turn, square).intersect(this.board[opposite(this.turn)]);
      const delta = this.turn === "white" ? 8 : -8;
      const step = square + delta;
      if (0 <= step && step < 64 && !this.board.occupied.has(step)) {
        pseudo = pseudo.with(step);
        const canDoubleStep = this.turn === "white" ? square < 16 : square >= 64 - 16;
        const doubleStep = step + delta;
        if (canDoubleStep && !this.board.occupied.has(doubleStep)) {
          pseudo = pseudo.with(doubleStep);
        }
      }
      if (defined(this.epSquare) && canCaptureEp(this, square, ctx)) {
        legal = SquareSet.fromSquare(this.epSquare);
      }
    } else if (piece.role === "bishop")
      pseudo = bishopAttacks(square, this.board.occupied);
    else if (piece.role === "knight")
      pseudo = knightAttacks(square);
    else if (piece.role === "rook")
      pseudo = rookAttacks(square, this.board.occupied);
    else if (piece.role === "queen")
      pseudo = queenAttacks(square, this.board.occupied);
    else
      pseudo = kingAttacks(square);
    pseudo = pseudo.diff(this.board[this.turn]);
    if (defined(ctx.king)) {
      if (piece.role === "king") {
        const occ = this.board.occupied.without(square);
        for (const to of pseudo) {
          if (this.kingAttackers(to, opposite(this.turn), occ).nonEmpty())
            pseudo = pseudo.without(to);
        }
        return pseudo.union(castlingDest(this, "a", ctx)).union(castlingDest(this, "h", ctx));
      }
      if (ctx.checkers.nonEmpty()) {
        const checker = ctx.checkers.singleSquare();
        if (!defined(checker))
          return SquareSet.empty();
        pseudo = pseudo.intersect(between(checker, ctx.king).with(checker));
      }
      if (ctx.blockers.has(square))
        pseudo = pseudo.intersect(ray(square, ctx.king));
    }
    if (legal)
      pseudo = pseudo.union(legal);
    return pseudo;
  }
  isVariantEnd() {
    return false;
  }
  variantOutcome(_ctx) {
    return;
  }
  hasInsufficientMaterial(color) {
    if (this.board[color].intersect(this.board.pawn.union(this.board.rooksAndQueens())).nonEmpty())
      return false;
    if (this.board[color].intersects(this.board.knight)) {
      return this.board[color].size() <= 2 && this.board[opposite(color)].diff(this.board.king).diff(this.board.queen).isEmpty();
    }
    if (this.board[color].intersects(this.board.bishop)) {
      const sameColor = !this.board.bishop.intersects(SquareSet.darkSquares()) || !this.board.bishop.intersects(SquareSet.lightSquares());
      return sameColor && this.board.pawn.isEmpty() && this.board.knight.isEmpty();
    }
    return true;
  }
  // The following should be identical in all subclasses
  toSetup() {
    var _a, _b;
    return {
      board: this.board.clone(),
      pockets: (_a = this.pockets) === null || _a === void 0 ? void 0 : _a.clone(),
      turn: this.turn,
      castlingRights: this.castles.castlingRights,
      epSquare: legalEpSquare(this),
      remainingChecks: (_b = this.remainingChecks) === null || _b === void 0 ? void 0 : _b.clone(),
      halfmoves: Math.min(this.halfmoves, 150),
      fullmoves: Math.min(Math.max(this.fullmoves, 1), 9999)
    };
  }
  isInsufficientMaterial() {
    return COLORS.every((color) => this.hasInsufficientMaterial(color));
  }
  hasDests(ctx) {
    ctx = ctx || this.ctx();
    for (const square of this.board[this.turn]) {
      if (this.dests(square, ctx).nonEmpty())
        return true;
    }
    return this.dropDests(ctx).nonEmpty();
  }
  isLegal(move, ctx) {
    if (isDrop(move)) {
      if (!this.pockets || this.pockets[this.turn][move.role] <= 0)
        return false;
      if (move.role === "pawn" && SquareSet.backranks().has(move.to))
        return false;
      return this.dropDests(ctx).has(move.to);
    } else {
      if (move.promotion === "pawn")
        return false;
      if (move.promotion === "king" && this.rules !== "antichess")
        return false;
      if (!!move.promotion !== (this.board.pawn.has(move.from) && SquareSet.backranks().has(move.to)))
        return false;
      const dests = this.dests(move.from, ctx);
      return dests.has(move.to) || dests.has(normalizeMove(this, move).to);
    }
  }
  isCheck() {
    const king = this.board.kingOf(this.turn);
    return defined(king) && this.kingAttackers(king, opposite(this.turn), this.board.occupied).nonEmpty();
  }
  isEnd(ctx) {
    if (ctx ? ctx.variantEnd : this.isVariantEnd())
      return true;
    return this.isInsufficientMaterial() || !this.hasDests(ctx);
  }
  isCheckmate(ctx) {
    ctx = ctx || this.ctx();
    return !ctx.variantEnd && ctx.checkers.nonEmpty() && !this.hasDests(ctx);
  }
  isStalemate(ctx) {
    ctx = ctx || this.ctx();
    return !ctx.variantEnd && ctx.checkers.isEmpty() && !this.hasDests(ctx);
  }
  outcome(ctx) {
    const variantOutcome = this.variantOutcome(ctx);
    if (variantOutcome)
      return variantOutcome;
    ctx = ctx || this.ctx();
    if (this.isCheckmate(ctx))
      return { winner: opposite(this.turn) };
    else if (this.isInsufficientMaterial() || this.isStalemate(ctx))
      return { winner: void 0 };
    else
      return;
  }
  allDests(ctx) {
    ctx = ctx || this.ctx();
    const d = /* @__PURE__ */ new Map();
    if (ctx.variantEnd)
      return d;
    for (const square of this.board[this.turn]) {
      d.set(square, this.dests(square, ctx));
    }
    return d;
  }
  play(move) {
    const turn = this.turn;
    const epSquare = this.epSquare;
    const castling = castlingSide(this, move);
    this.epSquare = void 0;
    this.halfmoves += 1;
    if (turn === "black")
      this.fullmoves += 1;
    this.turn = opposite(turn);
    if (isDrop(move)) {
      this.board.set(move.to, { role: move.role, color: turn });
      if (this.pockets)
        this.pockets[turn][move.role]--;
      if (move.role === "pawn")
        this.halfmoves = 0;
    } else {
      const piece = this.board.take(move.from);
      if (!piece)
        return;
      let epCapture;
      if (piece.role === "pawn") {
        this.halfmoves = 0;
        if (move.to === epSquare) {
          epCapture = this.board.take(move.to + (turn === "white" ? -8 : 8));
        }
        const delta = move.from - move.to;
        if (Math.abs(delta) === 16 && 8 <= move.from && move.from <= 55) {
          this.epSquare = move.from + move.to >> 1;
        }
        if (move.promotion) {
          piece.role = move.promotion;
          piece.promoted = !!this.pockets;
        }
      } else if (piece.role === "rook") {
        this.castles.discardRook(move.from);
      } else if (piece.role === "king") {
        if (castling) {
          const rookFrom = this.castles.rook[turn][castling];
          if (defined(rookFrom)) {
            const rook = this.board.take(rookFrom);
            this.board.set(kingCastlesTo(turn, castling), piece);
            if (rook)
              this.board.set(rookCastlesTo(turn, castling), rook);
          }
        }
        this.castles.discardColor(turn);
      }
      if (!castling) {
        const capture = this.board.set(move.to, piece) || epCapture;
        if (capture)
          this.playCaptureAt(move.to, capture);
      }
    }
    if (this.remainingChecks) {
      if (this.isCheck())
        this.remainingChecks[turn] = Math.max(this.remainingChecks[turn] - 1, 0);
    }
  }
};
var Chess = class extends Position {
  constructor() {
    super("chess");
  }
  static default() {
    const pos = new this();
    pos.reset();
    return pos;
  }
  static fromSetup(setup) {
    const pos = new this();
    pos.setupUnchecked(setup);
    return pos.validate().map((_) => pos);
  }
  clone() {
    return super.clone();
  }
};
var validEpSquare = (pos, square) => {
  if (!defined(square))
    return;
  const epRank = pos.turn === "white" ? 5 : 2;
  const forward = pos.turn === "white" ? 8 : -8;
  if (squareRank(square) !== epRank)
    return;
  if (pos.board.occupied.has(square + forward))
    return;
  const pawn = square - forward;
  if (!pos.board.pawn.has(pawn) || !pos.board[opposite(pos.turn)].has(pawn))
    return;
  return square;
};
var legalEpSquare = (pos) => {
  if (!defined(pos.epSquare))
    return;
  const ctx = pos.ctx();
  const ourPawns = pos.board.pieces(pos.turn, "pawn");
  const candidates = ourPawns.intersect(pawnAttacks(opposite(pos.turn), pos.epSquare));
  for (const candidate of candidates) {
    if (pos.dests(candidate, ctx).has(pos.epSquare))
      return pos.epSquare;
  }
  return;
};
var canCaptureEp = (pos, pawnFrom, ctx) => {
  if (!defined(pos.epSquare))
    return false;
  if (!pawnAttacks(pos.turn, pawnFrom).has(pos.epSquare))
    return false;
  if (!defined(ctx.king))
    return true;
  const delta = pos.turn === "white" ? 8 : -8;
  const captured = pos.epSquare - delta;
  return pos.kingAttackers(ctx.king, opposite(pos.turn), pos.board.occupied.toggle(pawnFrom).toggle(captured).with(pos.epSquare)).without(captured).isEmpty();
};
var castlingDest = (pos, side, ctx) => {
  if (!defined(ctx.king) || ctx.checkers.nonEmpty())
    return SquareSet.empty();
  const rook = pos.castles.rook[pos.turn][side];
  if (!defined(rook))
    return SquareSet.empty();
  if (pos.castles.path[pos.turn][side].intersects(pos.board.occupied))
    return SquareSet.empty();
  const kingTo = kingCastlesTo(pos.turn, side);
  const kingPath = between(ctx.king, kingTo);
  const occ = pos.board.occupied.without(ctx.king);
  for (const sq of kingPath) {
    if (pos.kingAttackers(sq, opposite(pos.turn), occ).nonEmpty())
      return SquareSet.empty();
  }
  const rookTo = rookCastlesTo(pos.turn, side);
  const after = pos.board.occupied.toggle(ctx.king).toggle(rook).toggle(rookTo);
  if (pos.kingAttackers(kingTo, opposite(pos.turn), after).nonEmpty())
    return SquareSet.empty();
  return SquareSet.fromSquare(rook);
};
var pseudoDests = (pos, square, ctx) => {
  if (ctx.variantEnd)
    return SquareSet.empty();
  const piece = pos.board.get(square);
  if (!piece || piece.color !== pos.turn)
    return SquareSet.empty();
  let pseudo = attacks(piece, square, pos.board.occupied);
  if (piece.role === "pawn") {
    let captureTargets = pos.board[opposite(pos.turn)];
    if (defined(pos.epSquare))
      captureTargets = captureTargets.with(pos.epSquare);
    pseudo = pseudo.intersect(captureTargets);
    const delta = pos.turn === "white" ? 8 : -8;
    const step = square + delta;
    if (0 <= step && step < 64 && !pos.board.occupied.has(step)) {
      pseudo = pseudo.with(step);
      const canDoubleStep = pos.turn === "white" ? square < 16 : square >= 64 - 16;
      const doubleStep = step + delta;
      if (canDoubleStep && !pos.board.occupied.has(doubleStep)) {
        pseudo = pseudo.with(doubleStep);
      }
    }
    return pseudo;
  } else {
    pseudo = pseudo.diff(pos.board[pos.turn]);
  }
  if (square === ctx.king)
    return pseudo.union(castlingDest(pos, "a", ctx)).union(castlingDest(pos, "h", ctx));
  else
    return pseudo;
};
var castlingSide = (pos, move) => {
  if (isDrop(move))
    return;
  const delta = move.to - move.from;
  if (Math.abs(delta) !== 2 && !pos.board[pos.turn].has(move.to))
    return;
  if (!pos.board.king.has(move.from))
    return;
  return delta > 0 ? "h" : "a";
};
var normalizeMove = (pos, move) => {
  const side = castlingSide(pos, move);
  if (!side)
    return move;
  const rookFrom = pos.castles.rook[pos.turn][side];
  return {
    from: move.from,
    to: defined(rookFrom) ? rookFrom : move.to
  };
};

// node_modules/chessops/dist/esm/setup.js
var MaterialSide = class _MaterialSide {
  constructor() {
  }
  static empty() {
    const m = new _MaterialSide();
    for (const role of ROLES)
      m[role] = 0;
    return m;
  }
  static fromBoard(board, color) {
    const m = new _MaterialSide();
    for (const role of ROLES)
      m[role] = board.pieces(color, role).size();
    return m;
  }
  clone() {
    const m = new _MaterialSide();
    for (const role of ROLES)
      m[role] = this[role];
    return m;
  }
  equals(other) {
    return ROLES.every((role) => this[role] === other[role]);
  }
  add(other) {
    const m = new _MaterialSide();
    for (const role of ROLES)
      m[role] = this[role] + other[role];
    return m;
  }
  subtract(other) {
    const m = new _MaterialSide();
    for (const role of ROLES)
      m[role] = this[role] - other[role];
    return m;
  }
  nonEmpty() {
    return ROLES.some((role) => this[role] > 0);
  }
  isEmpty() {
    return !this.nonEmpty();
  }
  hasPawns() {
    return this.pawn > 0;
  }
  hasNonPawns() {
    return this.knight > 0 || this.bishop > 0 || this.rook > 0 || this.queen > 0 || this.king > 0;
  }
  size() {
    return this.pawn + this.knight + this.bishop + this.rook + this.queen + this.king;
  }
};
var Material = class _Material {
  constructor(white, black) {
    this.white = white;
    this.black = black;
  }
  static empty() {
    return new _Material(MaterialSide.empty(), MaterialSide.empty());
  }
  static fromBoard(board) {
    return new _Material(MaterialSide.fromBoard(board, "white"), MaterialSide.fromBoard(board, "black"));
  }
  clone() {
    return new _Material(this.white.clone(), this.black.clone());
  }
  equals(other) {
    return this.white.equals(other.white) && this.black.equals(other.black);
  }
  add(other) {
    return new _Material(this.white.add(other.white), this.black.add(other.black));
  }
  subtract(other) {
    return new _Material(this.white.subtract(other.white), this.black.subtract(other.black));
  }
  count(role) {
    return this.white[role] + this.black[role];
  }
  size() {
    return this.white.size() + this.black.size();
  }
  isEmpty() {
    return this.white.isEmpty() && this.black.isEmpty();
  }
  nonEmpty() {
    return !this.isEmpty();
  }
  hasPawns() {
    return this.white.hasPawns() || this.black.hasPawns();
  }
  hasNonPawns() {
    return this.white.hasNonPawns() || this.black.hasNonPawns();
  }
};
var RemainingChecks = class _RemainingChecks {
  constructor(white, black) {
    this.white = white;
    this.black = black;
  }
  static default() {
    return new _RemainingChecks(3, 3);
  }
  clone() {
    return new _RemainingChecks(this.white, this.black);
  }
  equals(other) {
    return this.white === other.white && this.black === other.black;
  }
};

// node_modules/chessops/dist/esm/fen.js
var INITIAL_BOARD_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";
var INITIAL_EPD = INITIAL_BOARD_FEN + " w KQkq -";
var INITIAL_FEN = INITIAL_EPD + " 0 1";
var EMPTY_BOARD_FEN = "8/8/8/8/8/8/8/8";
var EMPTY_EPD = EMPTY_BOARD_FEN + " w - -";
var EMPTY_FEN = EMPTY_EPD + " 0 1";
var InvalidFen;
(function(InvalidFen2) {
  InvalidFen2["Fen"] = "ERR_FEN";
  InvalidFen2["Board"] = "ERR_BOARD";
  InvalidFen2["Pockets"] = "ERR_POCKETS";
  InvalidFen2["Turn"] = "ERR_TURN";
  InvalidFen2["Castling"] = "ERR_CASTLING";
  InvalidFen2["EpSquare"] = "ERR_EP_SQUARE";
  InvalidFen2["RemainingChecks"] = "ERR_REMAINING_CHECKS";
  InvalidFen2["Halfmoves"] = "ERR_HALFMOVES";
  InvalidFen2["Fullmoves"] = "ERR_FULLMOVES";
})(InvalidFen || (InvalidFen = {}));
var FenError = class extends Error {
};
var nthIndexOf = (haystack, needle, n) => {
  let index = haystack.indexOf(needle);
  while (n-- > 0) {
    if (index === -1)
      break;
    index = haystack.indexOf(needle, index + needle.length);
  }
  return index;
};
var parseSmallUint = (str) => /^\d{1,4}$/.test(str) ? parseInt(str, 10) : void 0;
var charToPiece = (ch) => {
  const role = charToRole(ch);
  return role && { role, color: ch.toLowerCase() === ch ? "black" : "white" };
};
var parseBoardFen = (boardPart) => {
  const board = Board.empty();
  let rank = 7;
  let file = 0;
  for (let i = 0; i < boardPart.length; i++) {
    const c = boardPart[i];
    if (c === "/" && file === 8) {
      file = 0;
      rank--;
    } else {
      const step = parseInt(c, 10);
      if (step > 0)
        file += step;
      else {
        if (file >= 8 || rank < 0)
          return Result.err(new FenError(InvalidFen.Board));
        const square = file + rank * 8;
        const piece = charToPiece(c);
        if (!piece)
          return Result.err(new FenError(InvalidFen.Board));
        if (boardPart[i + 1] === "~") {
          piece.promoted = true;
          i++;
        }
        board.set(square, piece);
        file++;
      }
    }
  }
  if (rank !== 0 || file !== 8)
    return Result.err(new FenError(InvalidFen.Board));
  return Result.ok(board);
};
var parsePockets = (pocketPart) => {
  if (pocketPart.length > 64)
    return Result.err(new FenError(InvalidFen.Pockets));
  const pockets = Material.empty();
  for (const c of pocketPart) {
    const piece = charToPiece(c);
    if (!piece)
      return Result.err(new FenError(InvalidFen.Pockets));
    pockets[piece.color][piece.role]++;
  }
  return Result.ok(pockets);
};
var parseCastlingFen = (board, castlingPart) => {
  let castlingRights = SquareSet.empty();
  if (castlingPart === "-")
    return Result.ok(castlingRights);
  for (const c of castlingPart) {
    const lower = c.toLowerCase();
    const color = c === lower ? "black" : "white";
    const rank = color === "white" ? 0 : 7;
    if ("a" <= lower && lower <= "h") {
      castlingRights = castlingRights.with(squareFromCoords(lower.charCodeAt(0) - "a".charCodeAt(0), rank));
    } else if (lower === "k" || lower === "q") {
      const rooksAndKings = board[color].intersect(SquareSet.backrank(color)).intersect(board.rook.union(board.king));
      const candidate = lower === "k" ? rooksAndKings.last() : rooksAndKings.first();
      castlingRights = castlingRights.with(defined(candidate) && board.rook.has(candidate) ? candidate : squareFromCoords(lower === "k" ? 7 : 0, rank));
    } else
      return Result.err(new FenError(InvalidFen.Castling));
  }
  if (COLORS.some((color) => SquareSet.backrank(color).intersect(castlingRights).size() > 2)) {
    return Result.err(new FenError(InvalidFen.Castling));
  }
  return Result.ok(castlingRights);
};
var parseRemainingChecks = (part) => {
  const parts = part.split("+");
  if (parts.length === 3 && parts[0] === "") {
    const white = parseSmallUint(parts[1]);
    const black = parseSmallUint(parts[2]);
    if (!defined(white) || white > 3 || !defined(black) || black > 3) {
      return Result.err(new FenError(InvalidFen.RemainingChecks));
    }
    return Result.ok(new RemainingChecks(3 - white, 3 - black));
  } else if (parts.length === 2) {
    const white = parseSmallUint(parts[0]);
    const black = parseSmallUint(parts[1]);
    if (!defined(white) || white > 3 || !defined(black) || black > 3) {
      return Result.err(new FenError(InvalidFen.RemainingChecks));
    }
    return Result.ok(new RemainingChecks(white, black));
  } else
    return Result.err(new FenError(InvalidFen.RemainingChecks));
};
var parseFen = (fen) => {
  const parts = fen.split(/[\s_]+/);
  const boardPart = parts.shift();
  let board;
  let pockets = Result.ok(void 0);
  if (boardPart.endsWith("]")) {
    const pocketStart = boardPart.indexOf("[");
    if (pocketStart === -1)
      return Result.err(new FenError(InvalidFen.Fen));
    board = parseBoardFen(boardPart.slice(0, pocketStart));
    pockets = parsePockets(boardPart.slice(pocketStart + 1, -1));
  } else {
    const pocketStart = nthIndexOf(boardPart, "/", 7);
    if (pocketStart === -1)
      board = parseBoardFen(boardPart);
    else {
      board = parseBoardFen(boardPart.slice(0, pocketStart));
      pockets = parsePockets(boardPart.slice(pocketStart + 1));
    }
  }
  let turn;
  const turnPart = parts.shift();
  if (!defined(turnPart) || turnPart === "w")
    turn = "white";
  else if (turnPart === "b")
    turn = "black";
  else
    return Result.err(new FenError(InvalidFen.Turn));
  return board.chain((board2) => {
    const castlingPart = parts.shift();
    const castlingRights = defined(castlingPart) ? parseCastlingFen(board2, castlingPart) : Result.ok(SquareSet.empty());
    const epPart = parts.shift();
    let epSquare;
    if (defined(epPart) && epPart !== "-") {
      epSquare = parseSquare(epPart);
      if (!defined(epSquare))
        return Result.err(new FenError(InvalidFen.EpSquare));
    }
    let halfmovePart = parts.shift();
    let earlyRemainingChecks;
    if (defined(halfmovePart) && halfmovePart.includes("+")) {
      earlyRemainingChecks = parseRemainingChecks(halfmovePart);
      halfmovePart = parts.shift();
    }
    const halfmoves = defined(halfmovePart) ? parseSmallUint(halfmovePart) : 0;
    if (!defined(halfmoves))
      return Result.err(new FenError(InvalidFen.Halfmoves));
    const fullmovesPart = parts.shift();
    const fullmoves = defined(fullmovesPart) ? parseSmallUint(fullmovesPart) : 1;
    if (!defined(fullmoves))
      return Result.err(new FenError(InvalidFen.Fullmoves));
    const remainingChecksPart = parts.shift();
    let remainingChecks = Result.ok(void 0);
    if (defined(remainingChecksPart)) {
      if (defined(earlyRemainingChecks))
        return Result.err(new FenError(InvalidFen.RemainingChecks));
      remainingChecks = parseRemainingChecks(remainingChecksPart);
    } else if (defined(earlyRemainingChecks)) {
      remainingChecks = earlyRemainingChecks;
    }
    if (parts.length > 0)
      return Result.err(new FenError(InvalidFen.Fen));
    return pockets.chain((pockets2) => castlingRights.chain((castlingRights2) => remainingChecks.map((remainingChecks2) => {
      return {
        board: board2,
        pockets: pockets2,
        turn,
        castlingRights: castlingRights2,
        remainingChecks: remainingChecks2,
        epSquare,
        halfmoves,
        fullmoves: Math.max(1, fullmoves)
      };
    })));
  });
};
var makePiece = (piece) => {
  let r = roleToChar(piece.role);
  if (piece.color === "white")
    r = r.toUpperCase();
  if (piece.promoted)
    r += "~";
  return r;
};
var makeBoardFen = (board) => {
  let fen = "";
  let empty = 0;
  for (let rank = 7; rank >= 0; rank--) {
    for (let file = 0; file < 8; file++) {
      const square = file + rank * 8;
      const piece = board.get(square);
      if (!piece)
        empty++;
      else {
        if (empty > 0) {
          fen += empty;
          empty = 0;
        }
        fen += makePiece(piece);
      }
      if (file === 7) {
        if (empty > 0) {
          fen += empty;
          empty = 0;
        }
        if (rank !== 0)
          fen += "/";
      }
    }
  }
  return fen;
};
var makePocket = (material) => ROLES.map((role) => roleToChar(role).repeat(material[role])).join("");
var makePockets = (pocket) => makePocket(pocket.white).toUpperCase() + makePocket(pocket.black);
var makeCastlingFen = (board, castlingRights) => {
  let fen = "";
  for (const color of COLORS) {
    const backrank = SquareSet.backrank(color);
    let king = board.kingOf(color);
    if (defined(king) && !backrank.has(king))
      king = void 0;
    const candidates = board.pieces(color, "rook").intersect(backrank);
    for (const rook of castlingRights.intersect(backrank).reversed()) {
      if (rook === candidates.first() && defined(king) && rook < king) {
        fen += color === "white" ? "Q" : "q";
      } else if (rook === candidates.last() && defined(king) && king < rook) {
        fen += color === "white" ? "K" : "k";
      } else {
        const file = FILE_NAMES[squareFile(rook)];
        fen += color === "white" ? file.toUpperCase() : file;
      }
    }
  }
  return fen || "-";
};
var makeRemainingChecks = (checks) => `${checks.white}+${checks.black}`;
var makeFen = (setup, opts) => [
  makeBoardFen(setup.board) + (setup.pockets ? `[${makePockets(setup.pockets)}]` : ""),
  setup.turn[0],
  makeCastlingFen(setup.board, setup.castlingRights),
  defined(setup.epSquare) ? makeSquare(setup.epSquare) : "-",
  ...setup.remainingChecks ? [makeRemainingChecks(setup.remainingChecks)] : [],
  ...(opts === null || opts === void 0 ? void 0 : opts.epd) ? [] : [Math.max(0, Math.min(setup.halfmoves, 9999)), Math.max(1, Math.min(setup.fullmoves, 9999))]
].join(" ");

// node_modules/chessops/dist/esm/variant.js
var Crazyhouse = class extends Position {
  constructor() {
    super("crazyhouse");
  }
  reset() {
    super.reset();
    this.pockets = Material.empty();
  }
  setupUnchecked(setup) {
    super.setupUnchecked(setup);
    this.board.promoted = setup.board.promoted.intersect(setup.board.occupied).diff(setup.board.king).diff(setup.board.pawn);
    this.pockets = setup.pockets ? setup.pockets.clone() : Material.empty();
  }
  static default() {
    const pos = new this();
    pos.reset();
    return pos;
  }
  static fromSetup(setup) {
    const pos = new this();
    pos.setupUnchecked(setup);
    return pos.validate().map((_) => pos);
  }
  clone() {
    return super.clone();
  }
  validate() {
    return super.validate().chain((_) => {
      var _a, _b;
      if ((_a = this.pockets) === null || _a === void 0 ? void 0 : _a.count("king")) {
        return Result.err(new PositionError(IllegalSetup.Kings));
      }
      if ((((_b = this.pockets) === null || _b === void 0 ? void 0 : _b.size()) || 0) + this.board.occupied.size() > 64) {
        return Result.err(new PositionError(IllegalSetup.Variant));
      }
      return Result.ok(void 0);
    });
  }
  hasInsufficientMaterial(color) {
    if (!this.pockets)
      return super.hasInsufficientMaterial(color);
    return this.board.occupied.size() + this.pockets.size() <= 3 && this.board.pawn.isEmpty() && this.board.promoted.isEmpty() && this.board.rooksAndQueens().isEmpty() && this.pockets.count("pawn") <= 0 && this.pockets.count("rook") <= 0 && this.pockets.count("queen") <= 0;
  }
  dropDests(ctx) {
    var _a, _b;
    const mask = this.board.occupied.complement().intersect(((_a = this.pockets) === null || _a === void 0 ? void 0 : _a[this.turn].hasNonPawns()) ? SquareSet.full() : ((_b = this.pockets) === null || _b === void 0 ? void 0 : _b[this.turn].hasPawns()) ? SquareSet.backranks().complement() : SquareSet.empty());
    ctx = ctx || this.ctx();
    if (defined(ctx.king) && ctx.checkers.nonEmpty()) {
      const checker = ctx.checkers.singleSquare();
      if (!defined(checker))
        return SquareSet.empty();
      return mask.intersect(between(checker, ctx.king));
    } else
      return mask;
  }
};
var Atomic = class extends Position {
  constructor() {
    super("atomic");
  }
  static default() {
    const pos = new this();
    pos.reset();
    return pos;
  }
  static fromSetup(setup) {
    const pos = new this();
    pos.setupUnchecked(setup);
    return pos.validate().map((_) => pos);
  }
  clone() {
    return super.clone();
  }
  validate() {
    if (this.board.occupied.isEmpty())
      return Result.err(new PositionError(IllegalSetup.Empty));
    if (this.board.king.size() > 2)
      return Result.err(new PositionError(IllegalSetup.Kings));
    const otherKing = this.board.kingOf(opposite(this.turn));
    if (!defined(otherKing))
      return Result.err(new PositionError(IllegalSetup.Kings));
    if (this.kingAttackers(otherKing, this.turn, this.board.occupied).nonEmpty()) {
      return Result.err(new PositionError(IllegalSetup.OppositeCheck));
    }
    if (SquareSet.backranks().intersects(this.board.pawn)) {
      return Result.err(new PositionError(IllegalSetup.PawnsOnBackrank));
    }
    return Result.ok(void 0);
  }
  kingAttackers(square, attacker, occupied) {
    const attackerKings = this.board.pieces(attacker, "king");
    if (attackerKings.isEmpty() || kingAttacks(square).intersects(attackerKings)) {
      return SquareSet.empty();
    }
    return super.kingAttackers(square, attacker, occupied);
  }
  playCaptureAt(square, captured) {
    super.playCaptureAt(square, captured);
    this.board.take(square);
    for (const explode of kingAttacks(square).intersect(this.board.occupied).diff(this.board.pawn)) {
      const piece = this.board.take(explode);
      if ((piece === null || piece === void 0 ? void 0 : piece.role) === "rook")
        this.castles.discardRook(explode);
      if ((piece === null || piece === void 0 ? void 0 : piece.role) === "king")
        this.castles.discardColor(piece.color);
    }
  }
  hasInsufficientMaterial(color) {
    if (this.board.pieces(opposite(color), "king").isEmpty())
      return false;
    if (this.board[color].diff(this.board.king).isEmpty())
      return true;
    if (this.board[opposite(color)].diff(this.board.king).nonEmpty()) {
      if (this.board.occupied.equals(this.board.bishop.union(this.board.king))) {
        if (!this.board.bishop.intersect(this.board.white).intersects(SquareSet.darkSquares())) {
          return !this.board.bishop.intersect(this.board.black).intersects(SquareSet.lightSquares());
        }
        if (!this.board.bishop.intersect(this.board.white).intersects(SquareSet.lightSquares())) {
          return !this.board.bishop.intersect(this.board.black).intersects(SquareSet.darkSquares());
        }
      }
      return false;
    }
    if (this.board.queen.nonEmpty() || this.board.pawn.nonEmpty())
      return false;
    if (this.board.knight.union(this.board.bishop).union(this.board.rook).size() === 1)
      return true;
    if (this.board.occupied.equals(this.board.knight.union(this.board.king))) {
      return this.board.knight.size() <= 2;
    }
    return false;
  }
  dests(square, ctx) {
    ctx = ctx || this.ctx();
    let dests = SquareSet.empty();
    for (const to of pseudoDests(this, square, ctx)) {
      const after = this.clone();
      after.play({ from: square, to });
      const ourKing = after.board.kingOf(this.turn);
      if (defined(ourKing) && (!defined(after.board.kingOf(after.turn)) || after.kingAttackers(ourKing, after.turn, after.board.occupied).isEmpty())) {
        dests = dests.with(to);
      }
    }
    return dests;
  }
  isVariantEnd() {
    return !!this.variantOutcome();
  }
  variantOutcome(_ctx) {
    for (const color of COLORS) {
      if (this.board.pieces(color, "king").isEmpty())
        return { winner: opposite(color) };
    }
    return;
  }
};
var Antichess = class extends Position {
  constructor() {
    super("antichess");
  }
  reset() {
    super.reset();
    this.castles = Castles.empty();
  }
  setupUnchecked(setup) {
    super.setupUnchecked(setup);
    this.castles = Castles.empty();
  }
  static default() {
    const pos = new this();
    pos.reset();
    return pos;
  }
  static fromSetup(setup) {
    const pos = new this();
    pos.setupUnchecked(setup);
    return pos.validate().map((_) => pos);
  }
  clone() {
    return super.clone();
  }
  validate() {
    if (this.board.occupied.isEmpty())
      return Result.err(new PositionError(IllegalSetup.Empty));
    if (SquareSet.backranks().intersects(this.board.pawn)) {
      return Result.err(new PositionError(IllegalSetup.PawnsOnBackrank));
    }
    return Result.ok(void 0);
  }
  kingAttackers(_square, _attacker, _occupied) {
    return SquareSet.empty();
  }
  ctx() {
    const ctx = super.ctx();
    if (defined(this.epSquare) && pawnAttacks(opposite(this.turn), this.epSquare).intersects(this.board.pieces(this.turn, "pawn"))) {
      ctx.mustCapture = true;
      return ctx;
    }
    const enemy = this.board[opposite(this.turn)];
    for (const from of this.board[this.turn]) {
      if (pseudoDests(this, from, ctx).intersects(enemy)) {
        ctx.mustCapture = true;
        return ctx;
      }
    }
    return ctx;
  }
  dests(square, ctx) {
    ctx = ctx || this.ctx();
    const dests = pseudoDests(this, square, ctx);
    const enemy = this.board[opposite(this.turn)];
    return dests.intersect(ctx.mustCapture ? defined(this.epSquare) && this.board.getRole(square) === "pawn" ? enemy.with(this.epSquare) : enemy : SquareSet.full());
  }
  hasInsufficientMaterial(color) {
    if (this.board[color].isEmpty())
      return false;
    if (this.board[opposite(color)].isEmpty())
      return true;
    if (this.board.occupied.equals(this.board.bishop)) {
      const weSomeOnLight = this.board[color].intersects(SquareSet.lightSquares());
      const weSomeOnDark = this.board[color].intersects(SquareSet.darkSquares());
      const theyAllOnDark = this.board[opposite(color)].isDisjoint(SquareSet.lightSquares());
      const theyAllOnLight = this.board[opposite(color)].isDisjoint(SquareSet.darkSquares());
      return weSomeOnLight && theyAllOnDark || weSomeOnDark && theyAllOnLight;
    }
    if (this.board.occupied.equals(this.board.knight) && this.board.occupied.size() === 2) {
      return this.board.white.intersects(SquareSet.lightSquares()) !== this.board.black.intersects(SquareSet.darkSquares()) !== (this.turn === color);
    }
    return false;
  }
  isVariantEnd() {
    return this.board[this.turn].isEmpty();
  }
  variantOutcome(ctx) {
    ctx = ctx || this.ctx();
    if (ctx.variantEnd || this.isStalemate(ctx)) {
      return { winner: this.turn };
    }
    return;
  }
};
var KingOfTheHill = class extends Position {
  constructor() {
    super("kingofthehill");
  }
  static default() {
    const pos = new this();
    pos.reset();
    return pos;
  }
  static fromSetup(setup) {
    const pos = new this();
    pos.setupUnchecked(setup);
    return pos.validate().map((_) => pos);
  }
  clone() {
    return super.clone();
  }
  hasInsufficientMaterial(_color) {
    return false;
  }
  isVariantEnd() {
    return this.board.king.intersects(SquareSet.center());
  }
  variantOutcome(_ctx) {
    for (const color of COLORS) {
      if (this.board.pieces(color, "king").intersects(SquareSet.center()))
        return { winner: color };
    }
    return;
  }
};
var ThreeCheck = class extends Position {
  constructor() {
    super("3check");
  }
  reset() {
    super.reset();
    this.remainingChecks = RemainingChecks.default();
  }
  setupUnchecked(setup) {
    var _a;
    super.setupUnchecked(setup);
    this.remainingChecks = ((_a = setup.remainingChecks) === null || _a === void 0 ? void 0 : _a.clone()) || RemainingChecks.default();
  }
  static default() {
    const pos = new this();
    pos.reset();
    return pos;
  }
  static fromSetup(setup) {
    const pos = new this();
    pos.setupUnchecked(setup);
    return pos.validate().map((_) => pos);
  }
  clone() {
    return super.clone();
  }
  hasInsufficientMaterial(color) {
    return this.board.pieces(color, "king").equals(this.board[color]);
  }
  isVariantEnd() {
    return !!this.remainingChecks && (this.remainingChecks.white <= 0 || this.remainingChecks.black <= 0);
  }
  variantOutcome(_ctx) {
    if (this.remainingChecks) {
      for (const color of COLORS) {
        if (this.remainingChecks[color] <= 0)
          return { winner: color };
      }
    }
    return;
  }
};
var racingKingsBoard = () => {
  const board = Board.empty();
  board.occupied = new SquareSet(65535, 0);
  board.promoted = SquareSet.empty();
  board.white = new SquareSet(61680, 0);
  board.black = new SquareSet(3855, 0);
  board.pawn = SquareSet.empty();
  board.knight = new SquareSet(6168, 0);
  board.bishop = new SquareSet(9252, 0);
  board.rook = new SquareSet(16962, 0);
  board.queen = new SquareSet(129, 0);
  board.king = new SquareSet(33024, 0);
  return board;
};
var RacingKings = class extends Position {
  constructor() {
    super("racingkings");
  }
  reset() {
    this.board = racingKingsBoard();
    this.pockets = void 0;
    this.turn = "white";
    this.castles = Castles.empty();
    this.epSquare = void 0;
    this.remainingChecks = void 0;
    this.halfmoves = 0;
    this.fullmoves = 1;
  }
  setupUnchecked(setup) {
    super.setupUnchecked(setup);
    this.castles = Castles.empty();
  }
  static default() {
    const pos = new this();
    pos.reset();
    return pos;
  }
  static fromSetup(setup) {
    const pos = new this();
    pos.setupUnchecked(setup);
    return pos.validate().map((_) => pos);
  }
  clone() {
    return super.clone();
  }
  validate() {
    if (this.isCheck() || this.board.pawn.nonEmpty())
      return Result.err(new PositionError(IllegalSetup.Variant));
    return super.validate();
  }
  dests(square, ctx) {
    ctx = ctx || this.ctx();
    let dests = SquareSet.empty();
    for (const to of super.dests(square, ctx)) {
      const move = { from: square, to };
      const after = this.clone();
      after.play(move);
      if (!after.isCheck())
        dests = dests.with(to);
    }
    return dests;
  }
  hasInsufficientMaterial(_color) {
    return false;
  }
  isVariantEnd() {
    const goal = SquareSet.fromRank(7);
    const inGoal = this.board.king.intersect(goal);
    if (inGoal.isEmpty())
      return false;
    if (this.turn === "white" || inGoal.intersects(this.board.black))
      return true;
    const blackKing = this.board.kingOf("black");
    if (defined(blackKing)) {
      const occ = this.board.occupied.without(blackKing);
      for (const target of kingAttacks(blackKing).intersect(goal).diff(this.board.black)) {
        if (this.kingAttackers(target, "white", occ).isEmpty())
          return false;
      }
    }
    return true;
  }
  variantOutcome(ctx) {
    if (ctx ? !ctx.variantEnd : !this.isVariantEnd())
      return;
    const goal = SquareSet.fromRank(7);
    const blackInGoal = this.board.pieces("black", "king").intersects(goal);
    const whiteInGoal = this.board.pieces("white", "king").intersects(goal);
    if (blackInGoal && !whiteInGoal)
      return { winner: "black" };
    if (whiteInGoal && !blackInGoal)
      return { winner: "white" };
    return { winner: void 0 };
  }
};
var hordeBoard = () => {
  const board = Board.empty();
  board.occupied = new SquareSet(4294967295, 4294901862);
  board.promoted = SquareSet.empty();
  board.white = new SquareSet(4294967295, 102);
  board.black = new SquareSet(0, 4294901760);
  board.pawn = new SquareSet(4294967295, 16711782);
  board.knight = new SquareSet(0, 1107296256);
  board.bishop = new SquareSet(0, 603979776);
  board.rook = new SquareSet(0, 2164260864);
  board.queen = new SquareSet(0, 134217728);
  board.king = new SquareSet(0, 268435456);
  return board;
};
var Horde = class extends Position {
  constructor() {
    super("horde");
  }
  reset() {
    this.board = hordeBoard();
    this.pockets = void 0;
    this.turn = "white";
    this.castles = Castles.default();
    this.castles.discardColor("white");
    this.epSquare = void 0;
    this.remainingChecks = void 0;
    this.halfmoves = 0;
    this.fullmoves = 1;
  }
  static default() {
    const pos = new this();
    pos.reset();
    return pos;
  }
  static fromSetup(setup) {
    const pos = new this();
    pos.setupUnchecked(setup);
    return pos.validate().map((_) => pos);
  }
  clone() {
    return super.clone();
  }
  validate() {
    if (this.board.occupied.isEmpty())
      return Result.err(new PositionError(IllegalSetup.Empty));
    if (this.board.king.size() !== 1)
      return Result.err(new PositionError(IllegalSetup.Kings));
    const otherKing = this.board.kingOf(opposite(this.turn));
    if (defined(otherKing) && this.kingAttackers(otherKing, this.turn, this.board.occupied).nonEmpty()) {
      return Result.err(new PositionError(IllegalSetup.OppositeCheck));
    }
    for (const color of COLORS) {
      const backranks = this.board.pieces(color, "king").isEmpty() ? SquareSet.backrank(opposite(color)) : SquareSet.backranks();
      if (this.board.pieces(color, "pawn").intersects(backranks)) {
        return Result.err(new PositionError(IllegalSetup.PawnsOnBackrank));
      }
    }
    return Result.ok(void 0);
  }
  hasInsufficientMaterial(color) {
    if (this.board.pieces(color, "king").nonEmpty())
      return false;
    const oppositeSquareColor = (squareColor) => squareColor === "light" ? "dark" : "light";
    const coloredSquares = (squareColor) => squareColor === "light" ? SquareSet.lightSquares() : SquareSet.darkSquares();
    const hasBishopPair = (side) => {
      const bishops = this.board.pieces(side, "bishop");
      return bishops.intersects(SquareSet.darkSquares()) && bishops.intersects(SquareSet.lightSquares());
    };
    const horde = MaterialSide.fromBoard(this.board, color);
    const hordeBishops = (squareColor) => coloredSquares(squareColor).intersect(this.board.pieces(color, "bishop")).size();
    const hordeBishopColor = hordeBishops("light") >= 1 ? "light" : "dark";
    const hordeNum = horde.pawn + horde.knight + horde.rook + horde.queen + Math.min(hordeBishops("dark"), 2) + Math.min(hordeBishops("light"), 2);
    const pieces = MaterialSide.fromBoard(this.board, opposite(color));
    const piecesBishops = (squareColor) => coloredSquares(squareColor).intersect(this.board.pieces(opposite(color), "bishop")).size();
    const piecesNum = pieces.size();
    const piecesOfRoleNot = (piece) => piecesNum - piece;
    if (hordeNum === 0)
      return true;
    if (hordeNum >= 4) {
      return false;
    }
    if ((horde.pawn >= 1 || horde.queen >= 1) && hordeNum >= 2) {
      return false;
    }
    if (horde.rook >= 1 && hordeNum >= 2) {
      if (!(hordeNum === 2 && horde.rook === 1 && horde.bishop === 1 && piecesOfRoleNot(piecesBishops(hordeBishopColor)) === 1)) {
        return false;
      }
    }
    if (hordeNum === 1) {
      if (piecesNum === 1) {
        return true;
      } else if (horde.queen === 1) {
        return !(pieces.pawn >= 1 || pieces.rook >= 1 || piecesBishops("light") >= 2 || piecesBishops("dark") >= 2);
      } else if (horde.pawn === 1) {
        const pawnSquare = this.board.pieces(color, "pawn").last();
        const promoteToQueen = this.clone();
        promoteToQueen.board.set(pawnSquare, { color, role: "queen" });
        const promoteToKnight = this.clone();
        promoteToKnight.board.set(pawnSquare, { color, role: "knight" });
        return promoteToQueen.hasInsufficientMaterial(color) && promoteToKnight.hasInsufficientMaterial(color);
      } else if (horde.rook === 1) {
        return !(pieces.pawn >= 2 || pieces.rook >= 1 && pieces.pawn >= 1 || pieces.rook >= 1 && pieces.knight >= 1 || pieces.pawn >= 1 && pieces.knight >= 1);
      } else if (horde.bishop === 1) {
        return !// The king can be mated on A1 if there is a pawn/opposite-color-bishop
        // on A2 and an opposite-color-bishop on B1.
        // If black has two or more pawns, white gets the benefit of the doubt;
        // there is an outside chance that white promotes its pawns to
        // opposite-color-bishops and selfmates theirself.
        // Every other case that the king is mated by the bishop requires that
        // black has two pawns or two opposite-color-bishop or a pawn and an
        // opposite-color-bishop.
        // For example a king on A3 can be mated if there is
        // a pawn/opposite-color-bishop on A4, a pawn/opposite-color-bishop on
        // B3, a pawn/bishop/rook/queen on A2 and any other piece on B2.
        (piecesBishops(oppositeSquareColor(hordeBishopColor)) >= 2 || piecesBishops(oppositeSquareColor(hordeBishopColor)) >= 1 && pieces.pawn >= 1 || pieces.pawn >= 2);
      } else if (horde.knight === 1) {
        return !// The king on A1 can be smother mated by a knight on C2 if there is
        // a pawn/knight/bishop on B2, a knight/rook on B1 and any other piece
        // on A2.
        // Moreover, when black has four or more pieces and two of them are
        // pawns, black can promote their pawns and selfmate theirself.
        (piecesNum >= 4 && (pieces.knight >= 2 || pieces.pawn >= 2 || pieces.rook >= 1 && pieces.knight >= 1 || pieces.rook >= 1 && pieces.bishop >= 1 || pieces.knight >= 1 && pieces.bishop >= 1 || pieces.rook >= 1 && pieces.pawn >= 1 || pieces.knight >= 1 && pieces.pawn >= 1 || pieces.bishop >= 1 && pieces.pawn >= 1 || hasBishopPair(opposite(color)) && pieces.pawn >= 1) && (piecesBishops("dark") < 2 || piecesOfRoleNot(piecesBishops("dark")) >= 3) && (piecesBishops("light") < 2 || piecesOfRoleNot(piecesBishops("light")) >= 3));
      }
    } else if (hordeNum === 2) {
      if (piecesNum === 1) {
        return true;
      } else if (horde.knight === 2) {
        return pieces.pawn + pieces.bishop + pieces.knight < 1;
      } else if (hasBishopPair(color)) {
        return !// A king on A1 obstructed by a pawn/bishop on A2 is mated
        // by the bishop pair.
        (pieces.pawn >= 1 || pieces.bishop >= 1 || pieces.knight >= 1 && pieces.rook + pieces.queen >= 1);
      } else if (horde.bishop >= 1 && horde.knight >= 1) {
        return !// A king on A1 obstructed by a pawn/opposite-color-bishop on
        // A2 is mated by a knight on D2 and a bishop on C3.
        (pieces.pawn >= 1 || piecesBishops(oppositeSquareColor(hordeBishopColor)) >= 1 || piecesOfRoleNot(piecesBishops(hordeBishopColor)) >= 3);
      } else {
        return !// A king on A1 obstructed by a pawn/opposite-bishop/knight
        // on A2 and a opposite-bishop/knight on B1 is mated by two
        // bishops on B2 and C3. This position is theoretically
        // achievable even when black has two pawns or when they
        // have a pawn and an opposite color bishop.
        (pieces.pawn >= 1 && piecesBishops(oppositeSquareColor(hordeBishopColor)) >= 1 || pieces.pawn >= 1 && pieces.knight >= 1 || piecesBishops(oppositeSquareColor(hordeBishopColor)) >= 1 && pieces.knight >= 1 || piecesBishops(oppositeSquareColor(hordeBishopColor)) >= 2 || pieces.knight >= 2 || pieces.pawn >= 2);
      }
    } else if (hordeNum === 3) {
      if (horde.knight === 2 && horde.bishop === 1 || horde.knight === 3 || hasBishopPair(color)) {
        return false;
      } else {
        return piecesNum === 1;
      }
    }
    return true;
  }
  isVariantEnd() {
    return this.board.white.isEmpty() || this.board.black.isEmpty();
  }
  variantOutcome(_ctx) {
    if (this.board.white.isEmpty())
      return { winner: "black" };
    if (this.board.black.isEmpty())
      return { winner: "white" };
    return;
  }
};
var defaultPosition = (rules) => {
  switch (rules) {
    case "chess":
      return Chess.default();
    case "antichess":
      return Antichess.default();
    case "atomic":
      return Atomic.default();
    case "horde":
      return Horde.default();
    case "racingkings":
      return RacingKings.default();
    case "kingofthehill":
      return KingOfTheHill.default();
    case "3check":
      return ThreeCheck.default();
    case "crazyhouse":
      return Crazyhouse.default();
  }
};
var setupPosition = (rules, setup) => {
  switch (rules) {
    case "chess":
      return Chess.fromSetup(setup);
    case "antichess":
      return Antichess.fromSetup(setup);
    case "atomic":
      return Atomic.fromSetup(setup);
    case "horde":
      return Horde.fromSetup(setup);
    case "racingkings":
      return RacingKings.fromSetup(setup);
    case "kingofthehill":
      return KingOfTheHill.fromSetup(setup);
    case "3check":
      return ThreeCheck.fromSetup(setup);
    case "crazyhouse":
      return Crazyhouse.fromSetup(setup);
  }
};

// node_modules/chessops/dist/esm/pgn.js
var defaultGame = (initHeaders = defaultHeaders) => ({
  headers: initHeaders(),
  moves: new Node()
});
var Node = class {
  constructor() {
    this.children = [];
  }
  *mainlineNodes() {
    let node = this;
    while (node.children.length) {
      const child = node.children[0];
      yield child;
      node = child;
    }
  }
  *mainline() {
    for (const child of this.mainlineNodes())
      yield child.data;
  }
  end() {
    let node = this;
    while (node.children.length)
      node = node.children[0];
    return node;
  }
};
var ChildNode = class extends Node {
  constructor(data) {
    super();
    this.data = data;
  }
};
var makeOutcome = (outcome) => {
  if (!outcome)
    return "*";
  else if (outcome.winner === "white")
    return "1-0";
  else if (outcome.winner === "black")
    return "0-1";
  else
    return "1/2-1/2";
};
var parseOutcome = (s) => {
  if (s === "1-0" || s === "1\u20130" || s === "1\u20140")
    return { winner: "white" };
  else if (s === "0-1" || s === "0\u20131" || s === "0\u20141")
    return { winner: "black" };
  else if (s === "1/2-1/2" || s === "1/2\u20131/2" || s === "1/2\u20141/2")
    return { winner: void 0 };
  else
    return;
};
var escapeHeader = (value) => value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
var safeComment = (comment) => comment.replace(/\}/g, "");
var makePgn = (game) => {
  const builder = [], tokens = [];
  if (game.headers.size) {
    for (const [key, value] of game.headers.entries()) {
      builder.push("[", key, ' "', escapeHeader(value), '"]\n');
    }
    builder.push("\n");
  }
  for (const comment of game.comments || [])
    tokens.push("{", safeComment(comment), "}");
  const fen = game.headers.get("FEN");
  const initialPly = fen ? parseFen(fen).unwrap((setup) => (setup.fullmoves - 1) * 2 + (setup.turn === "white" ? 0 : 1), (_) => 0) : 0;
  const stack = [];
  const variations = game.moves.children[Symbol.iterator]();
  const firstVariation = variations.next();
  if (!firstVariation.done) {
    stack.push({
      state: 0,
      ply: initialPly,
      node: firstVariation.value,
      sidelines: variations,
      startsVariation: false,
      inVariation: false
    });
  }
  let forceMoveNumber = true;
  while (stack.length) {
    const frame = stack[stack.length - 1];
    if (frame.inVariation) {
      tokens.push(")");
      frame.inVariation = false;
      forceMoveNumber = true;
    }
    switch (frame.state) {
      case 0:
        for (const comment of frame.node.data.startingComments || []) {
          tokens.push("{", safeComment(comment), "}");
          forceMoveNumber = true;
        }
        if (forceMoveNumber || frame.ply % 2 === 0) {
          tokens.push(Math.floor(frame.ply / 2) + 1 + (frame.ply % 2 ? "..." : "."));
          forceMoveNumber = false;
        }
        tokens.push(frame.node.data.san);
        for (const nag of frame.node.data.nags || []) {
          tokens.push("$" + nag);
          forceMoveNumber = true;
        }
        for (const comment of frame.node.data.comments || []) {
          tokens.push("{", safeComment(comment), "}");
        }
        frame.state = 1;
      // fall through
      case 1: {
        const child = frame.sidelines.next();
        if (child.done) {
          const variations2 = frame.node.children[Symbol.iterator]();
          const firstVariation2 = variations2.next();
          if (!firstVariation2.done) {
            stack.push({
              state: 0,
              ply: frame.ply + 1,
              node: firstVariation2.value,
              sidelines: variations2,
              startsVariation: false,
              inVariation: false
            });
          }
          frame.state = 2;
        } else {
          tokens.push("(");
          forceMoveNumber = true;
          stack.push({
            state: 0,
            ply: frame.ply,
            node: child.value,
            sidelines: [][Symbol.iterator](),
            startsVariation: true,
            inVariation: false
          });
          frame.inVariation = true;
        }
        break;
      }
      case 2:
        stack.pop();
    }
  }
  tokens.push(makeOutcome(parseOutcome(game.headers.get("Result"))));
  builder.push(tokens.join(" "), "\n");
  return builder.join("");
};
var defaultHeaders = () => /* @__PURE__ */ new Map([
  ["Event", "?"],
  ["Site", "?"],
  ["Date", "????.??.??"],
  ["Round", "?"],
  ["White", "?"],
  ["Black", "?"],
  ["Result", "*"]
]);
var BOM = "\uFEFF";
var isWhitespace = (line) => /^\s*$/.test(line);
var isCommentLine = (line) => line.startsWith("%");
var PgnError = class extends Error {
};
var PgnParser = class {
  constructor(emitGame, initHeaders = defaultHeaders, maxBudget = 1e6) {
    this.emitGame = emitGame;
    this.initHeaders = initHeaders;
    this.maxBudget = maxBudget;
    this.lineBuf = [];
    this.resetGame();
    this.state = 0;
  }
  resetGame() {
    this.budget = this.maxBudget;
    this.found = false;
    this.state = 1;
    this.game = defaultGame(this.initHeaders);
    this.stack = [{ parent: this.game.moves, root: true }];
    this.commentBuf = [];
  }
  consumeBudget(cost) {
    this.budget -= cost;
    if (this.budget < 0)
      throw new PgnError("ERR_PGN_BUDGET");
  }
  parse(data, options) {
    if (this.budget < 0)
      return;
    try {
      let idx = 0;
      for (; ; ) {
        const nlIdx = data.indexOf("\n", idx);
        if (nlIdx === -1) {
          break;
        }
        const crIdx = nlIdx > idx && data[nlIdx - 1] === "\r" ? nlIdx - 1 : nlIdx;
        this.consumeBudget(nlIdx - idx);
        this.lineBuf.push(data.slice(idx, crIdx));
        idx = nlIdx + 1;
        this.handleLine();
      }
      this.consumeBudget(data.length - idx);
      this.lineBuf.push(data.slice(idx));
      if (!(options === null || options === void 0 ? void 0 : options.stream)) {
        this.handleLine();
        this.emit(void 0);
      }
    } catch (err) {
      this.emit(err);
    }
  }
  handleLine() {
    let freshLine = true;
    let line = this.lineBuf.join("");
    this.lineBuf = [];
    continuedLine: for (; ; ) {
      switch (this.state) {
        case 0:
          if (line.startsWith(BOM))
            line = line.slice(BOM.length);
          this.state = 1;
        // fall through
        case 1:
          if (isWhitespace(line) || isCommentLine(line))
            return;
          this.found = true;
          this.state = 2;
        // fall through
        case 2: {
          if (isCommentLine(line))
            return;
          let moreHeaders = true;
          while (moreHeaders) {
            moreHeaders = false;
            line = line.replace(/^\s*\[([A-Za-z0-9][A-Za-z0-9_+#=:-]*)\s+"((?:[^"\\]|\\"|\\\\)*)"\]/, (_match, headerName, headerValue) => {
              this.consumeBudget(200);
              this.handleHeader(headerName, headerValue.replace(/\\"/g, '"').replace(/\\\\/g, "\\"));
              moreHeaders = true;
              freshLine = false;
              return "";
            });
          }
          if (isWhitespace(line))
            return;
          this.state = 3;
        }
        case 3: {
          if (freshLine) {
            if (isCommentLine(line))
              return;
            if (isWhitespace(line))
              return this.emit(void 0);
          }
          const tokenRegex = /(?:[NBKRQ]?[a-h]?[1-8]?[-x]?[a-h][1-8](?:=?[nbrqkNBRQK])?|[pnbrqkPNBRQK]?@[a-h][1-8]|[O0o][-–—][O0o](?:[-–—][O0o])?)[+#]?|--|Z0|0000|@@@@|{|;|\$\d{1,4}|[?!]{1,2}|\(|\)|\*|1[-–—]0|0[-–—]1|1\/2[-–—]1\/2/g;
          let match;
          while (match = tokenRegex.exec(line)) {
            const frame = this.stack[this.stack.length - 1];
            let token = match[0];
            if (token === ";")
              return;
            else if (token.startsWith("$"))
              this.handleNag(parseInt(token.slice(1), 10));
            else if (token === "!")
              this.handleNag(1);
            else if (token === "?")
              this.handleNag(2);
            else if (token === "!!")
              this.handleNag(3);
            else if (token === "??")
              this.handleNag(4);
            else if (token === "!?")
              this.handleNag(5);
            else if (token === "?!")
              this.handleNag(6);
            else if (token === "1-0" || token === "1\u20130" || token === "1\u20140" || token === "0-1" || token === "0\u20131" || token === "0\u20141" || token === "1/2-1/2" || token === "1/2\u20131/2" || token === "1/2\u20141/2" || token === "*") {
              if (this.stack.length === 1 && token !== "*")
                this.handleHeader("Result", token);
            } else if (token === "(") {
              this.consumeBudget(100);
              this.stack.push({ parent: frame.parent, root: false });
            } else if (token === ")") {
              if (this.stack.length > 1)
                this.stack.pop();
            } else if (token === "{") {
              const openIndex = tokenRegex.lastIndex;
              const beginIndex = line[openIndex] === " " ? openIndex + 1 : openIndex;
              line = line.slice(beginIndex);
              this.state = 4;
              continue continuedLine;
            } else {
              this.consumeBudget(100);
              if (token.startsWith("O") || token.startsWith("0") || token.startsWith("o")) {
                token = token.replace(/[0o]/g, "O").replace(/[–—]/g, "-");
              } else if (token === "Z0" || token === "0000" || token === "@@@@")
                token = "--";
              if (frame.node)
                frame.parent = frame.node;
              frame.node = new ChildNode({
                san: token,
                startingComments: frame.startingComments
              });
              frame.startingComments = void 0;
              frame.root = false;
              frame.parent.children.push(frame.node);
            }
          }
          return;
        }
        case 4: {
          const closeIndex = line.indexOf("}");
          if (closeIndex === -1) {
            this.commentBuf.push(line);
            return;
          } else {
            const endIndex = closeIndex > 0 && line[closeIndex - 1] === " " ? closeIndex - 1 : closeIndex;
            this.commentBuf.push(line.slice(0, endIndex));
            this.handleComment();
            line = line.slice(closeIndex);
            this.state = 3;
            freshLine = false;
          }
        }
      }
    }
  }
  handleHeader(name, value) {
    this.game.headers.set(name, name === "Result" ? makeOutcome(parseOutcome(value)) : value);
  }
  handleNag(nag) {
    var _a;
    this.consumeBudget(50);
    const frame = this.stack[this.stack.length - 1];
    if (frame.node) {
      (_a = frame.node.data).nags || (_a.nags = []);
      frame.node.data.nags.push(nag);
    }
  }
  handleComment() {
    var _a, _b;
    this.consumeBudget(100);
    const frame = this.stack[this.stack.length - 1];
    const comment = this.commentBuf.join("\n");
    this.commentBuf = [];
    if (frame.node) {
      (_a = frame.node.data).comments || (_a.comments = []);
      frame.node.data.comments.push(comment);
    } else if (frame.root) {
      (_b = this.game).comments || (_b.comments = []);
      this.game.comments.push(comment);
    } else {
      frame.startingComments || (frame.startingComments = []);
      frame.startingComments.push(comment);
    }
  }
  emit(err) {
    if (this.state === 4)
      this.handleComment();
    if (err)
      return this.emitGame(this.game, err);
    if (this.found)
      this.emitGame(this.game, void 0);
    this.resetGame();
  }
};
var parsePgn = (pgn, initHeaders = defaultHeaders) => {
  const games = [];
  new PgnParser((game) => games.push(game), initHeaders, NaN).parse(pgn);
  return games;
};
var parseVariant = (variant) => {
  switch ((variant || "chess").toLowerCase()) {
    case "chess":
    case "chess960":
    case "chess 960":
    case "standard":
    case "from position":
    case "classical":
    case "normal":
    case "fischerandom":
    // Cute Chess
    case "fischerrandom":
    case "fischer random":
    case "wild/0":
    case "wild/1":
    case "wild/2":
    case "wild/3":
    case "wild/4":
    case "wild/5":
    case "wild/6":
    case "wild/7":
    case "wild/8":
    case "wild/8a":
      return "chess";
    case "crazyhouse":
    case "crazy house":
    case "house":
    case "zh":
      return "crazyhouse";
    case "king of the hill":
    case "koth":
    case "kingofthehill":
      return "kingofthehill";
    case "three-check":
    case "three check":
    case "threecheck":
    case "three check chess":
    case "3-check":
    case "3 check":
    case "3check":
      return "3check";
    case "antichess":
    case "anti chess":
    case "anti":
      return "antichess";
    case "atomic":
    case "atom":
    case "atomic chess":
      return "atomic";
    case "horde":
    case "horde chess":
      return "horde";
    case "racing kings":
    case "racingkings":
    case "racing":
    case "race":
      return "racingkings";
    default:
      return;
  }
};
var startingPosition = (headers) => {
  const rules = parseVariant(headers.get("Variant"));
  if (!rules)
    return Result.err(new PositionError(IllegalSetup.Variant));
  const fen = headers.get("FEN");
  if (fen)
    return parseFen(fen).chain((setup) => setupPosition(rules, setup));
  else
    return Result.ok(defaultPosition(rules));
};
function parseCommentShapeColor(str) {
  switch (str) {
    case "G":
      return "green";
    case "R":
      return "red";
    case "Y":
      return "yellow";
    case "B":
      return "blue";
    default:
      return;
  }
}
var parseCommentShape = (str) => {
  const color = parseCommentShapeColor(str.slice(0, 1));
  const from = parseSquare(str.slice(1, 3));
  const to = parseSquare(str.slice(3, 5));
  if (!color || !defined(from))
    return;
  if (str.length === 3)
    return { color, from, to: from };
  if (str.length === 5 && defined(to))
    return { color, from, to };
  return;
};
var parseComment = (comment) => {
  let emt, clock, evaluation;
  const shapes = [];
  const text = comment.replace(/\s?\[%(emt|clk)\s(\d{1,5}):(\d{1,2}):(\d{1,2}(?:\.\d{0,3})?)\]\s?/g, (_, annotation, hours, minutes, seconds) => {
    const value = parseInt(hours, 10) * 3600 + parseInt(minutes, 10) * 60 + parseFloat(seconds);
    if (annotation === "emt")
      emt = value;
    else if (annotation === "clk")
      clock = value;
    return "  ";
  }).replace(/\s?\[%(?:csl|cal)\s([RGYB][a-h][1-8](?:[a-h][1-8])?(?:,[RGYB][a-h][1-8](?:[a-h][1-8])?)*)\]\s?/g, (_, arrows) => {
    for (const arrow of arrows.split(",")) {
      shapes.push(parseCommentShape(arrow));
    }
    return "  ";
  }).replace(/\s?\[%eval\s(?:#([+-]?\d{1,5})|([+-]?(?:\d{1,5}|\d{0,5}\.\d{1,2})))(?:,(\d{1,5}))?\]\s?/g, (_, mate, pawns, d) => {
    const depth = d && parseInt(d, 10);
    evaluation = mate ? { mate: parseInt(mate, 10), depth } : { pawns: parseFloat(pawns), depth };
    return "  ";
  }).trim();
  return {
    text,
    shapes,
    emt,
    clock,
    evaluation
  };
};

// node_modules/chessops/dist/esm/san.js
var makeSanWithoutSuffix = (pos, move) => {
  let san = "";
  if (isDrop(move)) {
    if (move.role !== "pawn")
      san = roleToChar(move.role).toUpperCase();
    san += "@" + makeSquare(move.to);
  } else {
    const role = pos.board.getRole(move.from);
    if (!role)
      return "--";
    if (role === "king" && (pos.board[pos.turn].has(move.to) || Math.abs(move.to - move.from) === 2)) {
      san = move.to > move.from ? "O-O" : "O-O-O";
    } else {
      const capture = pos.board.occupied.has(move.to) || role === "pawn" && squareFile(move.from) !== squareFile(move.to);
      if (role !== "pawn") {
        san = roleToChar(role).toUpperCase();
        let others;
        if (role === "king")
          others = kingAttacks(move.to).intersect(pos.board.king);
        else if (role === "queen")
          others = queenAttacks(move.to, pos.board.occupied).intersect(pos.board.queen);
        else if (role === "rook")
          others = rookAttacks(move.to, pos.board.occupied).intersect(pos.board.rook);
        else if (role === "bishop")
          others = bishopAttacks(move.to, pos.board.occupied).intersect(pos.board.bishop);
        else
          others = knightAttacks(move.to).intersect(pos.board.knight);
        others = others.intersect(pos.board[pos.turn]).without(move.from);
        if (others.nonEmpty()) {
          const ctx = pos.ctx();
          for (const from of others) {
            if (!pos.dests(from, ctx).has(move.to))
              others = others.without(from);
          }
          if (others.nonEmpty()) {
            let row = false;
            let column = others.intersects(SquareSet.fromRank(squareRank(move.from)));
            if (others.intersects(SquareSet.fromFile(squareFile(move.from))))
              row = true;
            else
              column = true;
            if (column)
              san += FILE_NAMES[squareFile(move.from)];
            if (row)
              san += RANK_NAMES[squareRank(move.from)];
          }
        }
      } else if (capture)
        san = FILE_NAMES[squareFile(move.from)];
      if (capture)
        san += "x";
      san += makeSquare(move.to);
      if (move.promotion)
        san += "=" + roleToChar(move.promotion).toUpperCase();
    }
  }
  return san;
};
var makeSanAndPlay = (pos, move) => {
  var _a;
  const san = makeSanWithoutSuffix(pos, move);
  pos.play(move);
  if ((_a = pos.outcome()) === null || _a === void 0 ? void 0 : _a.winner)
    return san + "#";
  if (pos.isCheck())
    return san + "+";
  return san;
};
var makeSan = (pos, move) => makeSanAndPlay(pos.clone(), move);
var parseSan = (pos, san) => {
  const ctx = pos.ctx();
  const match = san.match(/^([NBRQK])?([a-h])?([1-8])?[-x]?([a-h][1-8])(?:=?([nbrqkNBRQK]))?[+#]?$/);
  if (!match) {
    let castlingSide2;
    if (san === "O-O" || san === "O-O+" || san === "O-O#")
      castlingSide2 = "h";
    else if (san === "O-O-O" || san === "O-O-O+" || san === "O-O-O#")
      castlingSide2 = "a";
    if (castlingSide2) {
      const rook = pos.castles.rook[pos.turn][castlingSide2];
      if (!defined(ctx.king) || !defined(rook) || !pos.dests(ctx.king, ctx).has(rook))
        return;
      return {
        from: ctx.king,
        to: rook
      };
    }
    const match2 = san.match(/^([pnbrqkPNBRQK])?@([a-h][1-8])[+#]?$/);
    if (!match2)
      return;
    const move = {
      role: match2[1] ? charToRole(match2[1]) : "pawn",
      to: parseSquare(match2[2])
    };
    return pos.isLegal(move, ctx) ? move : void 0;
  }
  const role = match[1] ? charToRole(match[1]) : "pawn";
  const to = parseSquare(match[4]);
  const promotion = match[5] ? charToRole(match[5]) : void 0;
  if (!!promotion !== (role === "pawn" && SquareSet.backranks().has(to)))
    return;
  if (promotion === "king" && pos.rules !== "antichess")
    return;
  let candidates = pos.board.pieces(pos.turn, role);
  if (role === "pawn" && !match[2])
    candidates = candidates.intersect(SquareSet.fromFile(squareFile(to)));
  else if (match[2])
    candidates = candidates.intersect(SquareSet.fromFile(match[2].charCodeAt(0) - "a".charCodeAt(0)));
  if (match[3])
    candidates = candidates.intersect(SquareSet.fromRank(match[3].charCodeAt(0) - "1".charCodeAt(0)));
  const pawnAdvance = role === "pawn" ? SquareSet.fromFile(squareFile(to)) : SquareSet.empty();
  candidates = candidates.intersect(pawnAdvance.union(attacks({ color: opposite(pos.turn), role }, to, pos.board.occupied)));
  let from;
  for (const candidate of candidates) {
    if (pos.dests(candidate, ctx).has(to)) {
      if (defined(from))
        return;
      from = candidate;
    }
  }
  if (!defined(from))
    return;
  return {
    from,
    to,
    promotion
  };
};

// backend/board-text.mjs
function formatBoardText(pos, { bottomColor = "white" } = {}) {
  const flip = bottomColor.toLowerCase() === "black";
  const fileHeader = flip ? "h g f e d c b a" : "a b c d e f g h";
  const rankOrder = flip ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];
  const fileIndices = flip ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
  const rows = [`  ${fileHeader}`];
  for (const rank of rankOrder) {
    const pieces = [];
    for (const file of fileIndices) {
      const square = squareFromCoords(file, rank);
      const piece = pos.board.get(square);
      pieces.push(piece ? pieceSymbol(piece) : ".");
    }
    rows.push(`${rank + 1} ${pieces.join(" ")}`);
  }
  rows.push("side_to_move: " + (pos.turn === "white" ? "white" : "black"));
  rows.push("in_check: " + (pos.isCheck() ? "yes" : "no"));
  rows.push(
    "legend: White=uppercase, Black=lowercase, .=empty; K king, Q queen, R rook, B bishop, N knight, P pawn"
  );
  return rows.join("\n") + "\n";
}
function pieceSymbol(piece) {
  const char = roleToChar(piece.role);
  return piece.color === "white" ? char.toUpperCase() : char;
}

// backend/position.mjs
var PositionToolError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "PositionToolError";
  }
};
function createPositionStore() {
  return {
    nextId: 1,
    byId: /* @__PURE__ */ new Map(),
    byFen: /* @__PURE__ */ new Map()
  };
}
function issuePosition(store, resolved) {
  const id = `pos_${store.nextId++}`;
  const record = { id, fen: resolved.fen, board: resolved.board };
  store.byId.set(id, record);
  store.byFen.set(resolved.fen, id);
  return record;
}
function lookupPosition(store, { positionId, fen } = {}) {
  const id = typeof positionId === "string" ? positionId.trim() : "";
  const givenFen = typeof fen === "string" ? fen.trim() : "";
  if (id) {
    const record = store.byId.get(id);
    if (!record) {
      throw new PositionToolError(`Unknown position id: ${id}`);
    }
    if (givenFen && givenFen !== record.fen) {
      throw new PositionToolError(`FEN does not match position id ${id}.`);
    }
    return record;
  }
  if (givenFen) {
    const issuedId = store.byFen.get(givenFen);
    if (!issuedId) {
      throw new PositionToolError(
        "FEN is not from the position tool. Call position first and pass its id."
      );
    }
    return store.byId.get(issuedId);
  }
  throw new PositionToolError("stockfish_eval requires a position id from the position tool.");
}
function parseMoveList(moves) {
  if (moves == null || moves === "") return [];
  const tokens = Array.isArray(moves) ? moves : String(moves).trim().split(/\s+/);
  const sans = [];
  for (const token of tokens) {
    if (token === "" || token === "..." || token === "..") continue;
    if (/^\d+\.+$/.test(token)) continue;
    const numbered = token.match(/^\d+\.+(.+)$/);
    sans.push(numbered ? numbered[1] : token);
  }
  return sans;
}
function resolvePosition(input = {}) {
  const point = startingPoint(input);
  const pos = positionFromStartingPoint(point, input.pgn);
  for (const san of parseMoveList(input.moves)) {
    playSan(pos, san);
  }
  return {
    fen: makeFen(pos.toSetup()),
    board: formatBoardText(pos),
    turn: pos.turn
  };
}
function createChessTools({ pgn = "", evaluate } = {}) {
  const store = createPositionStore();
  return {
    store,
    async position(args = {}) {
      const resolved = resolvePosition({ ...args, pgn });
      const issued = issuePosition(store, resolved);
      const depth = args.depth ?? 14;
      let evaluation = null;
      if (typeof evaluate === "function") {
        try {
          evaluation = await evaluate(issued.fen, depth);
        } catch (err) {
          evaluation = { error: err && err.message ? err.message : String(err) };
        }
      }
      return {
        position_id: issued.id,
        fen: issued.fen,
        board: issued.board,
        eval: evaluation
      };
    },
    async stockfishEval(args = {}) {
      const record = lookupPosition(store, {
        positionId: args.position_id,
        fen: args.fen
      });
      if (typeof evaluate !== "function") {
        throw new PositionToolError("Stockfish is not configured.");
      }
      const depth = args.depth ?? 16;
      const evaluation = await evaluate(record.fen, depth);
      return {
        position_id: record.id,
        fen: record.fen,
        ...evaluation
      };
    }
  };
}
function startingPoint(input) {
  let ply = input.ply;
  if (typeof ply === "string" && /^\d+$/.test(ply.trim())) ply = Number(ply.trim());
  const hasPly = ply !== void 0 && ply !== null && ply !== "";
  const fen = typeof input.fen === "string" ? input.fen.trim() : "";
  const hasFen = fen !== "" && !isStartToken(fen);
  if (hasPly && hasFen) {
    throw new PositionToolError("Provide a game ply, or a FEN/start position, not both.");
  }
  if (hasPly) {
    if (!Number.isInteger(ply) || ply < 0) {
      throw new PositionToolError("ply must be a non-negative integer (half-moves played).");
    }
    return { kind: "game", ply };
  }
  if (hasFen) return { kind: "fen", fen };
  return { kind: "start" };
}
function positionFromStartingPoint(point, pgn) {
  switch (point.kind) {
    case "game":
      return positionAtPly(pgn, point.ply);
    case "fen":
      return positionFromFen(point.fen);
    case "start":
      return Chess.default();
    default: {
      const _exhaustive = point.kind;
      throw new PositionToolError(`Unknown starting point: ${_exhaustive}`);
    }
  }
}
function isStartToken(fen) {
  const normalized = fen.trim().toLowerCase();
  return normalized === "start" || normalized === "startpos";
}
function positionAtPly(pgn, ply) {
  if (pgn == null || String(pgn).trim() === "") {
    throw new PositionToolError("No game loaded. Use ply only for the current game.");
  }
  const games = parsePgn(String(pgn));
  if (games.length === 0) {
    throw new PositionToolError("Could not parse the game PGN.");
  }
  const game = games[0];
  const start = startingPosition(game.headers);
  if (start.isErr) {
    throw new PositionToolError(`Invalid starting position in the PGN: ${start.error.message}`);
  }
  const pos = start.value;
  if (ply === 0) return pos;
  let played = 0;
  for (const node of game.moves.mainline()) {
    if (played >= ply) break;
    const move = parseSan(pos, node.san);
    if (!move) {
      throw new PositionToolError(`Illegal move in the game PGN at ply ${played + 1}: ${node.san}`);
    }
    pos.play(move);
    played += 1;
  }
  if (played < ply) {
    throw new PositionToolError(`ply ${ply} is past the end of the game (${played} plies).`);
  }
  return pos;
}
function positionFromFen(fen) {
  const setup = parseFen(fen);
  if (setup.isErr) {
    throw new PositionToolError(`Invalid FEN: ${fen}`);
  }
  const pos = Chess.fromSetup(setup.value);
  if (pos.isErr) {
    throw new PositionToolError(`Illegal position in FEN: ${fen}`);
  }
  return pos.value;
}
function normalizeSan(san) {
  let token = String(san).trim();
  token = token.replace(/^[!?]+/, "").replace(/[!?]+$/, "");
  if (token === "0-0" || token === "0-0+" || token === "0-0#") token = token.replace("0-0", "O-O");
  if (token === "0-0-0" || token === "0-0-0+" || token === "0-0-0#") {
    token = token.replace("0-0-0", "O-O-O");
  }
  return token;
}
function playSan(pos, sanRaw) {
  const san = normalizeSan(sanRaw);
  if (san === "") {
    throw new PositionToolError("Empty move in the SAN list.");
  }
  const move = parseSan(pos, san);
  if (move) {
    pos.play(move);
    return;
  }
  const reason = classifySanFailure(pos, san);
  switch (reason) {
    case "ambiguous":
      throw new PositionToolError(`Ambiguous move: ${sanRaw.trim()}`);
    case "illegal":
      throw new PositionToolError(`Illegal move: ${sanRaw.trim()}`);
    default: {
      const _exhaustive = reason;
      throw new PositionToolError(`Could not play move: ${sanRaw.trim()} (${_exhaustive})`);
    }
  }
}
function classifySanFailure(pos, san) {
  if (/^O-O(-O)?[+#]?$/.test(san)) return "illegal";
  const match = san.match(
    /^([NBRQK])?([a-h])?([1-8])?[-x]?([a-h][1-8])(?:=?([nbrqkNBRQK]))?[+#]?$/
  );
  if (!match) return "illegal";
  const role = match[1] ? charToRole(match[1]) : "pawn";
  const to = parseSquare(match[4]);
  if (to === void 0) return "illegal";
  const ctx = pos.ctx();
  let candidates = pos.board.pieces(pos.turn, role);
  if (role === "pawn" && !match[2]) {
    candidates = candidates.intersect(SquareSet.fromFile(squareFile(to)));
  } else if (match[2]) {
    candidates = candidates.intersect(SquareSet.fromFile(match[2].charCodeAt(0) - 97));
  }
  if (match[3]) {
    candidates = candidates.intersect(SquareSet.fromRank(match[3].charCodeAt(0) - 49));
  }
  let legalCount = 0;
  for (const from of candidates) {
    if (pos.dests(from, ctx).has(to)) legalCount += 1;
    if (legalCount > 1) return "ambiguous";
  }
  return "illegal";
}

// frontend/src/tree.js
var EMPTY_FEN2 = "8/8/8/8/8/8/8/8 w - - 0 1";
var NAG_GLYPHS = {
  1: { symbol: "!", className: "is-great" },
  2: { symbol: "?", className: "is-mistake" },
  3: { symbol: "!!", className: "is-brilliant" },
  4: { symbol: "??", className: "is-blunder" },
  5: { symbol: "!?", className: "is-good" },
  6: { symbol: "?!", className: "is-inaccuracy" }
};
function pathKey(path5) {
  return path5.join("/");
}
function parsePath(key) {
  const text = String(key ?? "");
  if (text === "") return [];
  const path5 = [];
  for (const part of text.split("/")) {
    if (!/^\d+$/.test(part)) return null;
    path5.push(Number(part));
  }
  return path5;
}
function glyphsFromNags(nags) {
  const glyphs = [];
  for (const nag of nags ?? []) {
    const glyph = NAG_GLYPHS[nag];
    if (glyph) glyphs.push(glyph);
  }
  return glyphs;
}
function loadGameTree(pgn) {
  const empty = emptyTree("No hay una partida en el PGN.");
  try {
    const games = parsePgn(String(pgn ?? ""));
    if (!games.length) return empty;
    const game = games[0];
    const start = startingPosition(game.headers);
    if (start.isErr) {
      return emptyTree("La posici\xF3n inicial del PGN no es v\xE1lida.");
    }
    const pos = start.value;
    const headers = {};
    for (const [key, value] of game.headers) headers[key] = value;
    const nodes = /* @__PURE__ */ new Map();
    nodes.set("", {
      path: [],
      san: "",
      nags: [],
      glyphs: [],
      fen: makeFen(pos.toSetup()),
      lastMove: void 0,
      ply: 0,
      childCount: 0
    });
    walk(game.moves, pos, [], nodes);
    return {
      ok: true,
      error: null,
      headers,
      nodes
    };
  } catch {
    return emptyTree("No se pudo leer el PGN.");
  }
}
function nodeAt(tree, path5) {
  if (!tree?.ok) return null;
  return tree.nodes.get(pathKey(path5)) ?? null;
}
function emptyTree(error) {
  const nodes = /* @__PURE__ */ new Map();
  nodes.set("", {
    path: [],
    san: "",
    nags: [],
    glyphs: [],
    fen: EMPTY_FEN2,
    lastMove: void 0,
    ply: 0,
    childCount: 0
  });
  return { ok: false, error, headers: {}, nodes };
}
function walk(node, pos, path5, nodes) {
  const kept = [];
  for (const child of node.children) {
    const next = pos.clone();
    const move = parseSan(next, child.data.san);
    if (!move) continue;
    next.play(move);
    kept.push({ child, next, move });
  }
  const parent = nodes.get(pathKey(path5));
  if (parent) parent.childCount = kept.length;
  kept.forEach((entry, index) => {
    const childPath = [...path5, index];
    const setup = entry.next.toSetup();
    nodes.set(pathKey(childPath), {
      path: childPath,
      san: entry.child.data.san,
      nags: entry.child.data.nags ? [...entry.child.data.nags] : [],
      glyphs: glyphsFromNags(entry.child.data.nags),
      fen: makeFen(setup),
      lastMove: lastMoveKeys(entry.move),
      ply: plyAfter(setup),
      childCount: 0
    });
    walk(entry.child, entry.next, childPath, nodes);
  });
}
function plyAfter(setup) {
  return (setup.fullmoves - 1) * 2 + (setup.turn === "white" ? 0 : 1);
}
function lastMoveKeys(move) {
  if (!isNormal(move)) return void 0;
  return [makeSquare(move.from), makeSquare(move.to)];
}

// frontend/src/move-links.js
var MOVE_REF_PREFIX = "move:";
var PIECE = "[NBRQKDTAC]";
var SQ = "[a-h][1-8]";
var SAN_CORE = String.raw`(?:O-O-O|O-O|${PIECE}[a-h]?[1-8]?x?${SQ}(?:=[NBRQ])?|[a-h]x${SQ}(?:=[NBRQ])?|${SQ}(?:=[NBRQ])?)`;
var SAN_TOKEN = String.raw`${SAN_CORE}[+#]?(?:!!|!\?|\?\?|\?!|[!?])?`;
var NUMBER = String.raw`(\d+)\s*(\.{3}|…|\.)\s*`;
var ELLIPSIS = String.raw`(?:\.\.\.|…)`;
var MENTION = new RegExp(String.raw`(?:${NUMBER})?(?:${ELLIPSIS}\s*)?(${SAN_TOKEN})`, "g");
var CONTINUATION = new RegExp(String.raw`^\s+(${SAN_TOKEN})`);
var BARE_SQUARE = /^[a-h][1-8][+#]?$/;
var MOVE_INTRO = /(?:^|[^\p{L}\p{N}])(?:con|tras|jugar|jugada|juega|sigue|seguir|responde|respuesta|despu[eé]s\s+de|luego\s+de)\s+$/iu;
var SPANISH_PIECE = { R: "K", D: "Q", T: "R", A: "B", C: "N" };
function movePositionId(path5) {
  return `${MOVE_REF_PREFIX}${pathKey(path5 ?? [])}`;
}
function pathFromMoveId(positionId) {
  if (typeof positionId !== "string" || !positionId.startsWith(MOVE_REF_PREFIX)) return null;
  return parsePath(positionId.slice(MOVE_REF_PREFIX.length));
}
function isMovePositionId(positionId) {
  return typeof positionId === "string" && positionId.startsWith(MOVE_REF_PREFIX);
}
function spanishSanToEnglish(san) {
  const raw = String(san ?? "");
  const match = raw.match(/^([RDTAC])([a-h1-8x].*)$/);
  if (!match) return raw;
  return `${SPANISH_PIECE[match[1]]}${match[2]}`;
}
function stripSanMarks(san) {
  return String(san ?? "").replace(/[+#?!]+$/g, "").trim();
}
function sanCandidates(san) {
  const stripped = stripSanMarks(san);
  const english = spanishSanToEnglish(stripped);
  const out = [stripped];
  if (english !== stripped) out.push(english);
  return out;
}
function sansMatch(left, right) {
  const a = stripSanMarks(left);
  const b = stripSanMarks(right);
  if (a === b) return true;
  return spanishSanToEnglish(a) === b || a === spanishSanToEnglish(b);
}
function findMoveMentions(text) {
  const value = String(text ?? "");
  const mentions = [];
  MENTION.lastIndex = 0;
  let cursor = 0;
  while (cursor < value.length) {
    MENTION.lastIndex = cursor;
    const match = MENTION.exec(value);
    if (!match) break;
    const full = match[0];
    const start = match.index;
    const numbered = Boolean(match[1]);
    const moveNumber = numbered ? Number(match[1]) : null;
    const dots = match[2] ?? "";
    const ellipsis = !numbered && /^\s*(?:\.\.\.|…)/.test(full);
    const san = match[3];
    const prev = start > 0 ? value[start - 1] : "";
    if (/\w/u.test(prev) && !numbered) {
      cursor = start + 1;
      continue;
    }
    const color = numbered ? dots.startsWith("...") || dots === "\u2026" ? "black" : "white" : ellipsis ? "black" : null;
    const mentionEnd = start + full.length;
    if (/\w/u.test(value[mentionEnd] ?? "")) {
      cursor = mentionEnd;
      continue;
    }
    const pieceMove = /^[NBRQKDTAC]/.test(san) || san.startsWith("O-O");
    const squareMention = isBareSquareSan(san) && isSquareMention(value, start, mentionEnd);
    const bareMove = !squareMention && MOVE_INTRO.test(value.slice(0, start));
    if (squareMention || !numbered && !ellipsis && !pieceMove && !bareMove) {
      cursor = mentionEnd;
      continue;
    }
    const sans = [{ san, start: start + full.length - san.length, end: start + full.length }];
    let end = start + full.length;
    let expectColor = color === "white" ? "black" : color === "black" ? "white" : null;
    let expectNumber = numbered && color === "black" ? moveNumber + 1 : moveNumber;
    while (true) {
      const rest = value.slice(end);
      const cont = rest.match(CONTINUATION);
      if (!cont) break;
      const nextSan = cont[1];
      const nextStart = end + cont[0].length - nextSan.length;
      const nextEnd = end + cont[0].length;
      const nextPrev = value[nextStart - 1] ?? "";
      if (/\w/u.test(nextPrev) && nextPrev !== ".") break;
      sans.push({ san: nextSan, start: nextStart, end: nextEnd });
      end = nextEnd;
      if (expectColor === "black") {
        expectNumber = (expectNumber ?? 0) + 1;
        expectColor = "white";
      } else if (expectColor === "white") {
        expectColor = "black";
      }
    }
    mentions.push({
      start,
      end,
      moveNumber,
      color,
      numbered,
      ellipsis,
      sans
    });
    cursor = end;
  }
  return mentions;
}
function linkCommentaryMoves(tree, segments, positions = {}) {
  if (!tree?.ok || !Array.isArray(segments) || segments.length === 0) {
    return { segments: Array.isArray(segments) ? segments : [], positions: {} };
  }
  const extra = {};
  const shapesByFen = shapesByPositionFen(segments, positions);
  const out = [];
  let cursorPath = null;
  for (const segment of segments) {
    switch (segment.type) {
      case "ref":
        out.push(segment);
        cursorPath = pathForLinkedRef(tree, positions, extra, segment) ?? cursorPath;
        break;
      case "text": {
        for (const paragraph of segment.text.split(/(\n\s*\n)/)) {
          if (/^\n\s*\n$/.test(paragraph)) {
            cursorPath = null;
            out.push({ type: "text", text: paragraph });
            continue;
          }
          const pieces = linkTextMoves(tree, paragraph, extra, positions, shapesByFen, cursorPath);
          out.push(...pieces.segments);
          cursorPath = pieces.cursorPath;
        }
        break;
      }
      default: {
        const _exhaustive = segment.type;
        void _exhaustive;
        out.push(segment);
        break;
      }
    }
  }
  return { segments: out, positions: extra };
}
function isBareSquareSan(san) {
  return BARE_SQUARE.test(String(san ?? ""));
}
function isSquareMention(value, start, end) {
  const before = value.slice(Math.max(0, start - 80), start);
  const after = value.slice(end, end + 24);
  if (/^\s*[,:]?\s*(?:squares?|casillas?)\b/iu.test(after)) return true;
  if (/(?:squares?|casillas?)\b[^.\n]{0,40}$/iu.test(before)) return true;
  if (/(?:alfiles?|caballos?|damas?|torres?|reyes?|peones?|pe[oó]ns?|pawns?|bishops?|knights?|queens?|rooks?|kings?)\s+(?:de|en|del|on)\s+$/iu.test(before)) return true;
  if (/(?:^|[^\p{L}\p{N}])(?:desde|from)\s+$/iu.test(before)) return true;
  if (/(?:columnas?|diagonales?|filas?)\s+(?:de\s+|en\s+|del\s+)?$/iu.test(before)) return true;
  return false;
}
function linkTextMoves(tree, text, extra, positions, shapesByFen, startPath) {
  const mentions = findMoveMentions(text);
  if (!mentions.length) {
    return { segments: text ? [{ type: "text", text }] : [], cursorPath: startPath };
  }
  const segments = [];
  let cursor = 0;
  let cursorPath = startPath;
  for (const mention of mentions) {
    if (mention.start > cursor) {
      segments.push({ type: "text", text: text.slice(cursor, mention.start) });
    }
    let color = mention.color;
    let moveNumber = mention.moveNumber;
    if (/\n\s*\n/.test(text.slice(cursor, mention.start))) cursorPath = null;
    let fromPath = cursorPath;
    if (!fromPath && !mention.numbered) {
      const next = mentions.find((item) => item.start > mention.end && item.numbered && !/\n\s*\n/.test(text.slice(mention.end, item.start)));
      if (next) fromPath = resolveMention(tree, { san: next.sans[0].san, moveNumber: next.moveNumber, color: next.color })?.path;
    }
    let consumed = mention.start;
    mention.sans.forEach((token, index) => {
      const labelStart = index === 0 ? mention.start : token.start;
      if (labelStart > consumed) {
        segments.push({ type: "text", text: text.slice(consumed, labelStart) });
      }
      const node = resolveMention(tree, {
        san: token.san,
        moveNumber,
        color,
        fromPath
      });
      const label = text.slice(labelStart, token.end);
      if (!node) {
        segments.push({ type: "text", text: label });
      } else {
        const positionId = movePositionId(node.path);
        extra[positionId] = {
          id: positionId,
          fen: node.fen,
          kind: "tree",
          path: node.path,
          origin: { kind: "game", ply: node.ply }
        };
        segments.push({
          type: "ref",
          positionId,
          kind: "tree",
          label: label.replace(token.san, node.san + (token.san.match(/[!?]+$/)?.[0] ?? "")),
          source: "san",
          path: node.path,
          shapes: shapesByFen.get(node.fen) ?? []
        });
        fromPath = node.path;
        cursorPath = node.path;
      }
      consumed = token.end;
      if (color === "white") color = "black";
      else if (color === "black") {
        color = "white";
        if (Number.isInteger(moveNumber)) moveNumber += 1;
      } else if (mention.numbered && Number.isInteger(moveNumber)) {
        color = "black";
      }
    });
    if (mention.end > consumed) {
      segments.push({ type: "text", text: text.slice(consumed, mention.end) });
    }
    cursor = mention.end;
  }
  if (cursor < text.length) segments.push({ type: "text", text: text.slice(cursor) });
  return { segments, cursorPath };
}
function resolveMention(tree, { san, moveNumber, color, fromPath }) {
  const variants = sanCandidates(san);
  const fromChild = childMatchingSan(tree, fromPath, variants);
  if (fromChild && colorFits(fromChild, color) && numberFits(fromChild, moveNumber)) {
    return fromChild;
  }
  const matches = [];
  for (const node of tree.nodes.values()) {
    if (!node?.san || node.ply <= 0) continue;
    if (!variants.some((candidate) => stripSanMarks(node.san) === candidate)) continue;
    if (!colorFits(node, color)) continue;
    if (!numberFits(node, moveNumber)) continue;
    matches.push(node);
  }
  if (!matches.length) return null;
  if (matches.length === 1) return matches[0];
  const nearby = matches.filter((node) => fromPath && (pathKey(node.path) === pathKey(fromPath) || Math.abs(node.ply - (nodeAt(tree, fromPath)?.ply ?? -1e3)) <= 1 && (isPrefix(node.path, fromPath) || isPrefix(fromPath, node.path))));
  return nearby.length === 1 ? nearby[0] : null;
}
function childMatchingSan(tree, parentPath, variants) {
  if (!parentPath) return null;
  const parent = nodeAt(tree, parentPath);
  if (!parent) return null;
  const matches = [];
  for (let i = 0; i < parent.childCount; i += 1) {
    const child = nodeAt(tree, [...parentPath, i]);
    if (child && variants.some((candidate) => stripSanMarks(child.san) === candidate)) matches.push(child);
  }
  return matches.length === 1 ? matches[0] : null;
}
function colorFits(node, color) {
  if (!color) return true;
  const nodeColor = node.ply % 2 === 1 ? "white" : "black";
  return nodeColor === color;
}
function numberFits(node, moveNumber) {
  if (!Number.isInteger(moveNumber)) return true;
  return Math.ceil(node.ply / 2) === moveNumber;
}
function isPrefix(prefix, path5) {
  if (!Array.isArray(prefix) || !Array.isArray(path5) || path5.length < prefix.length) return false;
  return prefix.every((value, index) => path5[index] === value);
}
function shapesByPositionFen(segments, positions) {
  const map = /* @__PURE__ */ new Map();
  for (const segment of segments) {
    if (segment.type !== "ref" || !Array.isArray(segment.shapes) || !segment.shapes.length) continue;
    const fen = positions?.[segment.positionId]?.fen;
    if (!fen) continue;
    const existing = map.get(fen) ?? [];
    existing.push(...segment.shapes);
    map.set(fen, existing);
  }
  return map;
}
function pathForLinkedRef(tree, positions, extra, segment) {
  if (Array.isArray(segment.path) && nodeAt(tree, segment.path)) return segment.path;
  if (isMovePositionId(segment.positionId)) return pathFromMoveId(segment.positionId);
  const record = extra[segment.positionId] ?? positions?.[segment.positionId];
  if (Array.isArray(record?.path)) return record.path;
  const matches = [...tree.nodes.values()].filter((node) => node.fen === record?.fen);
  return matches.length === 1 ? matches[0].path : null;
}

// frontend/src/uci.js
var UCI_MOVE = /^[a-h][1-8][a-h][1-8][qrbn]?$/;
var MATE_CP = 1e4;
function parseInfoLine(line) {
  const text = String(line ?? "").trim();
  if (!text.startsWith("info ")) return null;
  const scoreMatch = text.match(/\bscore (cp|mate) (-?\d+)/);
  if (!scoreMatch) return null;
  const depth = intField(text, "depth");
  if (depth == null) return null;
  const pv = parsePv(text);
  if (!pv.length) return null;
  return {
    depth,
    multipv: intField(text, "multipv") ?? 1,
    score: { kind: scoreMatch[1], value: Number(scoreMatch[2]) },
    pv
  };
}
function whiteScoreFromInfo(score, fen) {
  const turn = String(fen ?? "").split(" ")[1] === "b" ? "black" : "white";
  switch (score.kind) {
    case "cp": {
      const whiteCp = turn === "white" ? score.value : -score.value;
      return { kind: "cp", whiteCp, whiteMate: null };
    }
    case "mate": {
      const stmMate = score.value;
      const whiteMate = turn === "white" ? stmMate : -stmMate;
      const whiteCp = whiteMate === 0 ? 0 : whiteMate > 0 ? MATE_CP : -MATE_CP;
      return { kind: "mate", whiteCp, whiteMate };
    }
    default: {
      const _exhaustive = score.kind;
      throw new Error(`Unknown score kind: ${_exhaustive}`);
    }
  }
}
function formatEval(score) {
  if (!score) return "\u2014";
  switch (score.kind) {
    case "mate": {
      if (!score.whiteMate) return "0";
      return score.whiteMate > 0 ? `#${score.whiteMate}` : `-#${-score.whiteMate}`;
    }
    case "cp": {
      const pawns = score.whiteCp / 100;
      if (pawns === 0) return "0.0";
      const abs = Math.abs(pawns).toFixed(1);
      return pawns > 0 ? `+${abs}` : `-${abs}`;
    }
    default: {
      const _exhaustive = score.kind;
      throw new Error(`Unknown score kind: ${_exhaustive}`);
    }
  }
}
function uciMovesToSan(fen, uciMoves) {
  const setup = parseFen(String(fen ?? ""));
  if (setup.isErr) return [];
  const chess = Chess.fromSetup(setup.value);
  if (chess.isErr) return [];
  const pos = chess.value;
  const sans = [];
  for (const uci of uciMoves ?? []) {
    const move = parseUci(String(uci));
    if (!move || !pos.isLegal(move)) break;
    sans.push(makeSan(pos, move));
    pos.play(move);
  }
  return sans;
}
function sanLineMoves(fen, sans) {
  const parts = String(fen ?? "").split(" ");
  let side = parts[1] === "b" ? "b" : "w";
  let moveNumber = Number(parts[5] || 1);
  if (!Number.isFinite(moveNumber) || moveNumber < 1) moveNumber = 1;
  const moves = [];
  for (const san of sans ?? []) {
    let label;
    if (side === "w") {
      label = `${moveNumber}. ${san}`;
      side = "b";
    } else if (moves.length === 0) {
      label = `${moveNumber}... ${san}`;
      side = "w";
      moveNumber += 1;
    } else {
      label = san;
      side = "w";
      moveNumber += 1;
    }
    moves.push({ label, ply: moves.length });
  }
  return moves;
}
function formatSanLine(fen, sans) {
  return sanLineMoves(fen, sans).map((move) => move.label).join(" ");
}
var MAX_LINE_PLIES = 8;
function lineFromInfo(info, fen) {
  const score = whiteScoreFromInfo(info.score, fen);
  const pv = (info.pv ?? []).slice(0, MAX_LINE_PLIES);
  const sans = uciMovesToSan(fen, pv);
  return {
    pv: pv.slice(0, sans.length),
    multipv: info.multipv,
    depth: info.depth,
    score,
    eval: formatEval(score),
    san: formatSanLine(fen, sans)
  };
}
function intField(text, name) {
  const match = text.match(new RegExp(`\\b${name} (\\d+)`));
  return match ? Number(match[1]) : null;
}
function parsePv(text) {
  const idx = text.search(/\bpv /);
  if (idx < 0) return [];
  const moves = [];
  for (const token of text.slice(idx + 3).trim().split(/\s+/)) {
    if (!UCI_MOVE.test(token)) break;
    moves.push(token);
  }
  return moves;
}

// frontend/src/engine-metrics.js
var WIN_STEEPNESS = 368208e-8;
var CP_CAP = 1e3;
var ACCURACY_A = 103.1668;
var ACCURACY_B = -0.04354;
var ACCURACY_C = -3.1669;
var VOL_WINDOW_MIN = 2;
var VOL_WINDOW_MAX = 8;
var VOL_WEIGHT_MIN = 0.5;
var VOL_WEIGHT_MAX = 12;
var DEFAULT_INACCURACY = 10;
var DEFAULT_MISTAKE = 20;
var DEFAULT_BLUNDER = 30;
var ROUGH_PERF_BASE = 3100;
var ROUGH_PERF_PER_ACPL = 5.5;
var ROUGH_PERF_MIN = 400;
var ROUGH_PERF_MAX = 3200;
var KEY_SWING_COUNT = 3;
var PV_SAN_PLIES = 6;
var ACCURACY_ELO_KNOTS = [
  [43.162, -225.4],
  [49.8825, -133.5],
  [53.14, 118],
  [54.76, 276],
  [55.79, 359],
  [56.25, 409],
  [59.95, 552],
  [62.47, 588.5],
  [65.47, 610],
  [65.67, 616],
  [67.93, 643],
  [69.47, 694],
  [70.89, 752],
  [71.8, 760],
  [72.84, 827],
  [73.22, 905],
  [73.87, 922],
  [76.17, 944],
  [76.22, 1018.67],
  [77.34, 1063],
  [78.97, 1144.5],
  [79.565, 1181.5],
  [80.05, 1217],
  [81.66, 1226],
  [85.03, 1320],
  [86.18, 1422.5],
  [89.14, 1600.33],
  [90.43, 1788],
  [90.59, 1927.5],
  [91.53, 2115],
  [92, 2255],
  [92.01, 2348],
  [92.47, 2442],
  [93.06, 2536],
  [94.56, 2629],
  [94.955, 2769],
  [95.22, 2910],
  [95.36, 3003],
  [95.64, 3096],
  [96.07, 3190]
];
var ENGINE_GLYPHS = {
  inaccuracy: { symbol: "?!", className: "is-inaccuracy" },
  mistake: { symbol: "?", className: "is-mistake" },
  blunder: { symbol: "??", className: "is-blunder" }
};
function metricsFromSettings(settings = {}) {
  const thresholds = settings.thresholds ?? {};
  return {
    winSteepness: numOr(thresholds.winSteepness, WIN_STEEPNESS),
    cpCap: numOr(thresholds.mateCp, CP_CAP),
    inaccuracy: numOr(thresholds.inaccuracy, DEFAULT_INACCURACY),
    mistake: numOr(thresholds.mistake, DEFAULT_MISTAKE),
    blunder: numOr(thresholds.blunder, DEFAULT_BLUNDER),
    accuracyA: ACCURACY_A,
    accuracyB: ACCURACY_B,
    accuracyC: ACCURACY_C,
    volWindowMin: VOL_WINDOW_MIN,
    volWindowMax: VOL_WINDOW_MAX,
    volWeightMin: VOL_WEIGHT_MIN,
    volWeightMax: VOL_WEIGHT_MAX
  };
}
function cappedCp(whiteCp, cap = CP_CAP) {
  const n = Number(whiteCp);
  if (!Number.isFinite(n)) return 0;
  return Math.max(-cap, Math.min(cap, n));
}
function scoreToCappedCp(score, cap = CP_CAP) {
  if (!score) return 0;
  if (score.kind === "mate") {
    if (!score.whiteMate) return 0;
    return score.whiteMate > 0 ? cap : -cap;
  }
  return cappedCp(score.whiteCp, cap);
}
function winPercent(cp, { winSteepness = WIN_STEEPNESS, cpCap = CP_CAP } = {}) {
  const c = cappedCp(cp, cpCap);
  return 50 + 50 * (2 / (1 + Math.exp(-winSteepness * c)) - 1);
}
function winPercentFromScore(score, opts = {}) {
  return winPercent(scoreToCappedCp(score, opts.cpCap), opts);
}
function moverWinPercent(score, side, opts = {}) {
  const whiteWp = winPercentFromScore(score, opts);
  return side === "black" ? 100 - whiteWp : whiteWp;
}
function moveAccuracy(winPercentLoss, {
  accuracyA = ACCURACY_A,
  accuracyB = ACCURACY_B,
  accuracyC = ACCURACY_C
} = {}) {
  const loss = Math.max(0, Number(winPercentLoss) || 0);
  if (loss === 0) return 100;
  const raw = accuracyA * Math.exp(accuracyB * loss) + accuracyC;
  return clamp(raw, 0, 100);
}
function judgementFromLoss(winPercentLoss, {
  inaccuracy = DEFAULT_INACCURACY,
  mistake = DEFAULT_MISTAKE,
  blunder = DEFAULT_BLUNDER
} = {}) {
  const loss = Math.max(0, Number(winPercentLoss) || 0);
  if (loss >= blunder) return "blunder";
  if (loss >= mistake) return "mistake";
  if (loss >= inaccuracy) return "inaccuracy";
  return "good";
}
function glyphForJudgement(judgement) {
  switch (judgement) {
    case "inaccuracy":
    case "mistake":
    case "blunder":
      return ENGINE_GLYPHS[judgement];
    case "good":
      return null;
    default: {
      const _exhaustive = judgement;
      void _exhaustive;
      return null;
    }
  }
}
function harmonicMean(values) {
  if (!values.length) return null;
  let inv = 0;
  for (const value of values) inv += 1 / (value > 0 ? value : 0.01);
  return values.length / inv;
}
function weightedMean(values, weights) {
  if (!values.length) return null;
  let sum = 0;
  let total = 0;
  for (let i = 0; i < values.length; i += 1) {
    const w = i < weights.length ? weights[i] : 1;
    sum += values[i] * w;
    total += w;
  }
  return total > 0 ? sum / total : values.reduce((a, b) => a + b, 0) / values.length;
}
function volatilityWeights(winPercents, nMoves, {
  volWindowMin = VOL_WINDOW_MIN,
  volWindowMax = VOL_WINDOW_MAX,
  volWeightMin = VOL_WEIGHT_MIN,
  volWeightMax = VOL_WEIGHT_MAX
} = {}) {
  if (nMoves <= 0) return [];
  const wsize = Math.max(volWindowMin, Math.min(volWindowMax, Math.floor(nMoves / 10)));
  const first = winPercents.slice(0, wsize);
  const pad = Math.max(0, wsize - 2);
  const weights = [];
  for (let i = 0; i < nMoves; i += 1) {
    const start = i < pad ? 0 : i - pad;
    const window2 = i < pad ? first : winPercents.slice(start, start + wsize);
    let sd = 0;
    if (window2.length >= 2) {
      const mean = window2.reduce((a, b) => a + b, 0) / window2.length;
      sd = Math.sqrt(window2.reduce((sum, v) => sum + (v - mean) ** 2, 0) / window2.length);
    }
    weights.push(clamp(sd, volWeightMin, volWeightMax));
  }
  return weights;
}
function sideAccuracy(accuracies, weights) {
  if (!accuracies.length) return null;
  if (accuracies.length === 1) return accuracies[0];
  const wm = weightedMean(accuracies, weights);
  const hm = harmonicMean(accuracies);
  if (wm == null || hm == null) return accuracies[0];
  return (wm + hm) / 2;
}
function playRatingFromAccuracy(accuracy, knots = ACCURACY_ELO_KNOTS) {
  if (!knots.length || accuracy == null || Number.isNaN(Number(accuracy))) return null;
  const rating = interpolateKnots(knots, Number(accuracy));
  return rating == null ? null : Math.round(rating);
}
function roughPerformanceFromAcpl(acpl, {
  base = ROUGH_PERF_BASE,
  perAcpl = ROUGH_PERF_PER_ACPL,
  min = ROUGH_PERF_MIN,
  max = ROUGH_PERF_MAX
} = {}) {
  const n = Number(acpl);
  if (!Number.isFinite(n)) return null;
  return Math.round(clamp(base - perAcpl * n, min, max));
}
function performanceForSide(accuracy, acpl) {
  const mapped = playRatingFromAccuracy(accuracy);
  if (mapped != null) {
    return { performance: mapped, performanceSource: "accuracy-elo-map" };
  }
  const rough = roughPerformanceFromAcpl(acpl);
  return {
    performance: rough,
    performanceSource: "acpl-rough"
  };
}
function annotatePlies(rawPlies, settings = {}) {
  const metrics = metricsFromSettings(settings);
  const whiteWps = [];
  if (rawPlies[0]?.evalBefore) {
    whiteWps.push(winPercentFromScore(rawPlies[0].evalBefore, metrics));
  }
  const annotated = rawPlies.map((ply) => {
    const side = ply.side === "black" ? "black" : "white";
    const wpBefore = moverWinPercent(ply.evalBefore, side, metrics);
    const wpAfter = moverWinPercent(ply.eval, side, metrics);
    const winPercentLoss = Math.max(0, wpBefore - wpAfter);
    const cpBefore = moverCp(ply.evalBefore, side, metrics.cpCap);
    const cpAfter = moverCp(ply.eval, side, metrics.cpCap);
    const cpLoss = Math.max(0, cpBefore - cpAfter);
    const judgement = judgementFromLoss(winPercentLoss, metrics);
    const glyph = glyphForJudgement(judgement);
    const accuracy = moveAccuracy(winPercentLoss, metrics);
    const best = ply.best ?? null;
    const playedBest = Boolean(best?.uci && ply.uci && best.uci === ply.uci);
    const onlyMove = Boolean(ply.onlyMove) || isOnlyMove(ply.lines, side, playedBest, metrics);
    const missedMate = Boolean(ply.missedMate) || isMissedMate(ply.evalBefore, ply.eval, side);
    whiteWps.push(winPercentFromScore(ply.eval, metrics));
    return {
      ...ply,
      side,
      winPercentLoss,
      cpLoss,
      judgement,
      glyph: glyph?.symbol ?? "",
      glyphClass: glyph?.className ?? "",
      accuracy,
      onlyMove,
      missedMate
    };
  });
  const vol = volatilityWeights(whiteWps, annotated.length, metrics);
  return annotated.map((ply, index) => ({ ...ply, volWeight: vol[index] ?? 1 }));
}
function summariseSides(plies, settings = {}) {
  const metrics = metricsFromSettings(settings);
  return {
    white: summariseSide(plies.filter((ply) => ply.side === "white"), metrics),
    black: summariseSide(plies.filter((ply) => ply.side === "black"), metrics)
  };
}
function selectKeyMoments(plies, { maxSwings = KEY_SWING_COUNT } = {}) {
  const byPly = /* @__PURE__ */ new Map();
  for (const ply of plies) {
    if (ply.judgement === "mistake" || ply.judgement === "blunder") {
      byPly.set(ply.ply, ply);
    }
  }
  const ranked = [...plies].sort((a, b) => b.winPercentLoss - a.winPercentLoss);
  let swings = 0;
  for (const ply of ranked) {
    if (swings >= maxSwings) break;
    if (!(ply.winPercentLoss > 0)) continue;
    if (!byPly.has(ply.ply)) byPly.set(ply.ply, ply);
    swings += 1;
  }
  return [...byPly.values()].sort((a, b) => a.ply - b.ply).map(keyMomentFromPly);
}
function summariseSide(plies, metrics) {
  const counts = { inaccuracy: 0, mistake: 0, blunder: 0 };
  const accuracies = [];
  const weights = [];
  const losses = [];
  for (const ply of plies) {
    switch (ply.judgement) {
      case "inaccuracy":
        counts.inaccuracy += 1;
        break;
      case "mistake":
        counts.mistake += 1;
        break;
      case "blunder":
        counts.blunder += 1;
        break;
      case "good":
        break;
      default: {
        const _exhaustive = ply.judgement;
        void _exhaustive;
        break;
      }
    }
    accuracies.push(ply.accuracy);
    weights.push(ply.volWeight ?? 1);
    losses.push(Math.min(ply.cpLoss ?? 0, metrics.cpCap));
  }
  const accuracy = sideAccuracy(accuracies, weights);
  const acpl = losses.length ? losses.reduce((a, b) => a + b, 0) / losses.length : null;
  const perf = performanceForSide(accuracy, acpl);
  return {
    accuracy: accuracy == null ? null : round2(accuracy),
    acpl: acpl == null ? null : round1(acpl),
    performance: perf.performance,
    performanceSource: perf.performanceSource,
    counts
  };
}
function keyMomentFromPly(ply) {
  const bestLine = ply.lines?.[0];
  const betterLine = String(bestLine?.san ?? "").trim() || ply.best?.san || "";
  return {
    ply: ply.ply,
    san: ply.san,
    played: ply.san,
    judgement: ply.judgement,
    betterLine,
    betterEval: bestLine?.eval || (ply.evalBefore ? formatEval(ply.evalBefore) : ""),
    evalChange: round1(ply.winPercentLoss)
  };
}
function isOnlyMove(lines, side, playedBest, metrics) {
  if (!playedBest) return false;
  if (!Array.isArray(lines) || lines.length < 2) return lines?.length === 1 && playedBest;
  const first = moverWinPercent(lines[0].score ?? evalFromLine(lines[0]), side, metrics);
  const second = moverWinPercent(lines[1].score ?? evalFromLine(lines[1]), side, metrics);
  return first - second >= metrics.blunder;
}
function isMissedMate(before, after, side) {
  const beforeMate = mateFor(before, side);
  if (!beforeMate) return false;
  return !mateFor(after, side);
}
function mateFor(score, side) {
  if (!score || score.kind !== "mate" || !score.whiteMate) return false;
  return side === "black" ? score.whiteMate < 0 : score.whiteMate > 0;
}
function evalFromLine(line) {
  if (line?.score) return line.score;
  return { kind: "cp", whiteCp: 0, whiteMate: null };
}
function moverCp(score, side, cap) {
  const white = scoreToCappedCp(score, cap);
  return side === "black" ? -white : white;
}
function interpolateKnots(knots, q) {
  if (!knots.length) return null;
  if (knots.length < 2) return knots[0][1];
  const qLo = knots[0][0];
  const rLo = knots[0][1];
  const qHi = knots[1][0];
  const rHi = knots[1][1];
  if (q < qLo) {
    if (qHi === qLo) return rLo;
    const t = (q - qLo) / (qHi - qLo);
    return rLo + t * (rHi - rLo);
  }
  const qTop = knots[knots.length - 1][0];
  const rTop = knots[knots.length - 1][1];
  const qPrev = knots[knots.length - 2][0];
  const rPrev = knots[knots.length - 2][1];
  if (q > qTop) {
    if (qTop === qPrev) return rTop;
    const t = (q - qPrev) / (qTop - qPrev);
    return rPrev + t * (rTop - rPrev);
  }
  for (let i = 0; i < knots.length - 1; i += 1) {
    const q0 = knots[i][0];
    const r0 = knots[i][1];
    const q1 = knots[i + 1][0];
    const r1 = knots[i + 1][1];
    if (q0 <= q && q <= q1) {
      if (q1 === q0) return r0;
      const t = (q - q0) / (q1 - q0);
      return r0 + t * (r1 - r0);
    }
  }
  return rTop;
}
function numOr(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
function clamp(value, lo, hi) {
  return Math.min(hi, Math.max(lo, value));
}
function round2(value) {
  return Math.round(value * 100) / 100;
}
function round1(value) {
  return Math.round(value * 10) / 10;
}

// frontend/src/engine-hash.js
var ENGINE_FORMAT = "chess-tutor-engine/1";
var ENGINE_NAME = "Stockfish 19 Lite";
var HASH_RE = /^[0-9a-f]{64}$/;
var MAX_ENGINE_PLIES = 512;
async function sha256Hex(text) {
  const data = new TextEncoder().encode(String(text ?? ""));
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function gameHashFromFenAndUci(startFen, uciMoves) {
  const moves = Array.isArray(uciMoves) ? uciMoves.join(" ") : "";
  return sha256Hex(`${startFen}
${moves}`);
}
function mainlinePlies(tree) {
  if (!tree?.ok) return [];
  const root = nodeAt(tree, []);
  if (!root) return [];
  const startFen = root.fen;
  const setup = parseFen(startFen);
  if (setup.isErr) return [];
  const chess = Chess.fromSetup(setup.value);
  if (chess.isErr) return [];
  const pos = chess.value;
  const plies = [];
  let path5 = [];
  while (true) {
    const parent = nodeAt(tree, path5);
    if (!parent || parent.childCount === 0) break;
    const child = nodeAt(tree, [...path5, 0]);
    if (!child) break;
    const move = parseSan(pos, child.san);
    if (!move) break;
    const uci = makeUci(move);
    const fenBefore = parent.fen;
    pos.play(move);
    plies.push({
      ply: plies.length + 1,
      path: child.path,
      san: child.san,
      uci,
      side: fenBefore.split(" ")[1] === "b" ? "black" : "white",
      fenBefore,
      fenAfter: child.fen
    });
    path5 = child.path;
  }
  return { startFen, plies };
}
function buildEngineAnalysis({
  gameHash,
  engine,
  settings,
  createdAt,
  plies,
  positionResults
}) {
  const raw = plies.map((ply, index) => {
    const before = positionResults[index];
    const after = positionResults[index + 1];
    const lines = (before?.lines ?? []).slice(0, 3).map((line) => normalizeLine(line, ply.fenBefore));
    const best = before?.best ?? (lines[0] ? { uci: lines[0].pv?.[0] ?? "", san: lines[0].sans?.[0] ?? "" } : null);
    return {
      ply: ply.ply,
      san: ply.san,
      uci: ply.uci,
      side: ply.side,
      path: ply.path,
      eval: after?.score ?? { kind: "cp", whiteCp: 0, whiteMate: null },
      evalBefore: before?.score ?? { kind: "cp", whiteCp: 0, whiteMate: null },
      best,
      lines,
      depth: after?.depth ?? before?.depth ?? engine.depth
    };
  });
  const annotated = annotatePlies(raw, settings);
  const summary = summariseSides(annotated, settings);
  return {
    format: ENGINE_FORMAT,
    gameHash,
    engine: {
      name: engine.name ?? ENGINE_NAME,
      depth: engine.depth,
      multipv: engine.multipv
    },
    settings: {
      engine: {
        depth: settings?.engine?.depth ?? engine.depth,
        movetime: settings?.engine?.movetime ?? 0,
        multipv: settings?.engine?.multipv ?? engine.multipv
      },
      thresholds: settings?.thresholds ?? {}
    },
    createdAt: createdAt ?? (/* @__PURE__ */ new Date()).toISOString(),
    plies: annotated.map(serializePly),
    summary,
    keyMoments: selectKeyMoments(annotated)
  };
}
function normalizeLine(line, fen) {
  const pv = Array.isArray(line.pv) ? line.pv.slice(0, PV_SAN_PLIES) : [];
  const sans = Array.isArray(line.sans) && line.sans.length ? line.sans.slice(0, PV_SAN_PLIES) : uciMovesToSan(fen, pv);
  const score = line.score ?? { kind: "cp", whiteCp: 0, whiteMate: null };
  return {
    san: sans.join(" "),
    sans,
    pv: pv.slice(0, sans.length),
    eval: line.eval ?? formatEval(score),
    score
  };
}
function serializePly(ply) {
  return {
    ply: ply.ply,
    san: ply.san,
    uci: ply.uci,
    side: ply.side,
    eval: ply.eval,
    evalBefore: ply.evalBefore,
    best: ply.best,
    lines: (ply.lines ?? []).map((line) => ({
      san: line.san,
      eval: line.eval,
      pv: line.pv
    })),
    depth: ply.depth,
    judgement: ply.judgement,
    glyph: ply.glyph,
    accuracy: ply.accuracy,
    winPercentLoss: ply.winPercentLoss,
    cpLoss: ply.cpLoss,
    onlyMove: ply.onlyMove,
    missedMate: ply.missedMate
  };
}

// frontend/src/engine-document.js
function engineAnalysisShapeErrors(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return ["engineAnalysis must be an object."];
  }
  const errors = [];
  if (value.format !== ENGINE_FORMAT) {
    errors.push(`format must be "${ENGINE_FORMAT}".`);
  }
  if (typeof value.gameHash !== "string" || !HASH_RE.test(value.gameHash)) {
    errors.push("gameHash must be 64 lowercase hex characters.");
  }
  const engine = value.engine;
  if (!engine || typeof engine !== "object" || Array.isArray(engine)) {
    errors.push("engine is required.");
  } else {
    const depth = Number(engine.depth);
    const multipv = Number(engine.multipv);
    if (typeof engine.name !== "string" || engine.name.trim() === "") {
      errors.push("engine.name is required.");
    }
    if (!Number.isInteger(depth) || depth < 1 || depth > 64) {
      errors.push("engine.depth out of range.");
    }
    if (!Number.isInteger(multipv) || multipv < 1 || multipv > 5) {
      errors.push("engine.multipv out of range.");
    }
  }
  if (!Array.isArray(value.plies) || value.plies.length < 1 || value.plies.length > MAX_ENGINE_PLIES) {
    errors.push("plies.length is not sane.");
  }
  if (!value.summary || typeof value.summary !== "object" || Array.isArray(value.summary)) {
    errors.push("summary is required.");
  } else {
    for (const side of ["white", "black"]) {
      const row = value.summary[side];
      if (!row || typeof row !== "object" || Array.isArray(row)) {
        errors.push(`summary.${side} is required.`);
        continue;
      }
      if (!inRangeOrNull(row.accuracy, 0, 100) || !inRangeOrNull(row.acpl, 0, 1e4)) {
        errors.push(`summary.${side} numbers out of range.`);
      }
    }
  }
  return errors;
}
function inRangeOrNull(value, min, max) {
  if (value == null) return true;
  const n = Number(value);
  return Number.isFinite(n) && n >= min && n <= max;
}

// backend/validate.mjs
function positionKind(origin) {
  const kind = origin && origin.kind;
  if (kind !== "game" && kind !== "side") return "side";
  switch (kind) {
    case "game":
      return "tree";
    case "side":
      return "side";
    default: {
      const _exhaustive = kind;
      throw new Error(`Unknown origin kind: ${_exhaustive}`);
    }
  }
}
function validateAnalysis({
  pgn,
  perspective = "ninguno",
  output,
  issuedPositions = [],
  strict = false,
  lang
} = {}) {
  const errors = [];
  const downgrades = [];
  const catalog = catalogIssued(issuedPositions);
  const original = parseGame(pgn);
  if (!original) {
    errors.push(issueError(lang, {
      code: "schema",
      v1Code: "bad_pgn",
      path: "pgn",
      message: "Could not parse the submitted game PGN."
    }));
  }
  const sideIds = /* @__PURE__ */ new Set();
  for (const listed of output.sidePositions) {
    const record = catalog.get(listed.positionId);
    if (!record) {
      errors.push(issueError(lang, {
        code: "unknown_position_id",
        path: "sidePositions",
        message: `Unknown position id ${listed.positionId} in sidePositions.`,
        params: { id: listed.positionId, path: "sidePositions" }
      }));
      continue;
    }
    if (positionKind(record.origin) !== "side") {
      errors.push(issueError(lang, {
        code: "side_position_in_tree",
        v1Code: "side_from_game",
        path: "sidePositions",
        message: `${listed.positionId} is from the game and must not be listed as a side position.`,
        params: { id: listed.positionId }
      }));
      continue;
    }
    sideIds.add(listed.positionId);
  }
  const sideFens = /* @__PURE__ */ new Set();
  for (const record of catalog.values()) {
    if (positionKind(record.origin) === "side" && record.fen) sideFens.add(record.fen);
  }
  let gameTreePgn = original ? makePgn(original.game) : "";
  if (original && typeof output.gameTreePgn === "string") {
    const modelGame = parseGame(output.gameTreePgn);
    if (!modelGame) {
      errors.push(issueError(lang, {
        code: "schema",
        v1Code: "bad_game_tree",
        path: "gameTreePgn",
        message: "Could not parse gameTreePgn."
      }));
    } else {
      const originalSans = mainlineSans(original.game);
      const modelSans = mainlineSans(modelGame.game);
      if (!sameSans(originalSans, modelSans)) {
        errors.push(issueError(lang, {
          code: "mainline_mismatch",
          path: "gameTreePgn",
          message: "gameTreePgn mainline does not match the submitted game."
        }));
      } else {
        const start = startingPosition(original.game.headers);
        if (start.isErr) {
          errors.push(issueError(lang, {
            code: "schema",
            v1Code: "bad_start_fen",
            path: "pgn",
            message: `Invalid starting position in the PGN: ${start.error.message}`,
            params: { detail: start.error.message }
          }));
        } else {
          const ctx = { errors, downgrades, sideFens, strict, lang };
          const cleaned = {
            headers: original.game.headers,
            comments: void 0,
            moves: sanitizeMoves(modelGame.game.moves, start.value, true, ctx)
          };
          gameTreePgn = makePgn(cleaned);
        }
      }
    }
  }
  const commentaryTree = loadGameTree(gameTreePgn);
  const commentaries = {};
  for (const length of COMMENTARY_KEYS) {
    const normalized = normalizeCommentarySan(commentaryTree, output.commentaries[length], catalog);
    const built = buildCommentary(normalized, `commentaries.${length}`, catalog, lang);
    errors.push(...built.errors);
    downgrades.push(...built.downgrades);
    commentaries[length] = { text: normalized, segments: built.segments };
    for (const id of built.referencedSideIds) sideIds.add(id);
  }
  const treeFens = original ? collectFens(gameTreePgn) : /* @__PURE__ */ new Set();
  const sidePositions = [];
  const seenSide = /* @__PURE__ */ new Set();
  for (const id of sideIds) {
    const record = catalog.get(id);
    if (!record || seenSide.has(id)) continue;
    seenSide.add(id);
    if (record.fen && treeFens.has(record.fen)) {
      errors.push(issueError(lang, {
        code: "side_position_in_tree",
        path: "gameTreePgn",
        message: `Side position ${id} must not appear in the game tree.`,
        params: { id }
      }));
    }
    const listed = output.sidePositions.find((entry) => entry.positionId === id);
    sidePositions.push({
      positionId: id,
      label: listed?.label ?? "",
      fen: record.fen,
      origin: record.origin
    });
  }
  const positions = {};
  for (const record of catalog.values()) {
    positions[record.id] = {
      id: record.id,
      fen: record.fen,
      kind: positionKind(record.origin),
      origin: record.origin
    };
  }
  const analysis = {
    pgn: original ? pgn : "",
    perspective,
    gameTitle: output.gameTitle ?? null,
    gameTreePgn,
    commentaries,
    sidePositions,
    positions,
    issues: downgrades,
    ratings: output.ratings ?? null
  };
  return {
    ok: errors.length === 0,
    errors,
    downgrades,
    analysis
  };
}
function collectFens(pgn) {
  const parsed = parseGame(pgn);
  if (!parsed) return /* @__PURE__ */ new Set();
  const start = startingPosition(parsed.game.headers);
  if (start.isErr) return /* @__PURE__ */ new Set();
  const fens = /* @__PURE__ */ new Set([makeFen(start.value.toSetup())]);
  walkFens(parsed.game.moves, start.value, fens);
  return fens;
}
function catalogIssued(issuedPositions) {
  const catalog = /* @__PURE__ */ new Map();
  for (const record of issuedPositions) {
    if (!record || typeof record.id !== "string") continue;
    catalog.set(record.id, {
      id: record.id,
      fen: typeof record.fen === "string" ? record.fen : "",
      origin: record.origin ?? { kind: "side" }
    });
  }
  return catalog;
}
function parseGame(pgn) {
  if (pgn == null || String(pgn).trim() === "") return null;
  const games = parsePgn(String(pgn));
  if (!games.length) return null;
  return { game: games[0] };
}
function mainlineSans(game) {
  return [...game.moves.mainline()].map((node) => node.san);
}
function sameSans(a, b) {
  if (a.length !== b.length) return false;
  return a.every((san, i) => san === b[i]);
}
function sanitizeMoves(node, pos, onMainline, ctx) {
  const out = new Node();
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    const childOnMainline = onMainline && i === 0;
    if (!childOnMainline && branchHasSideFen(child, pos, ctx.sideFens)) {
      ctx.errors.push(issueError(ctx.lang, {
        code: "side_position_in_tree",
        v1Code: "side_variation",
        path: "gameTreePgn",
        message: `Side position must not enter the game tree (variation starting ${child.data.san}). Keep it in sidePositions.`,
        params: { san: child.data.san }
      }));
      continue;
    }
    const next = pos.clone();
    const move = parseSan(next, child.data.san);
    if (!move) {
      const illegal = issueError(ctx.lang, {
        code: "illegal_move",
        path: "gameTreePgn",
        message: ctx.strict ? `Illegal or ambiguous move in the game tree: ${child.data.san}` : `Illegal or ambiguous move in the game tree dropped: ${child.data.san}`,
        params: { san: child.data.san }
      });
      if (ctx.strict) ctx.errors.push(illegal);
      else ctx.downgrades.push(illegal);
      continue;
    }
    next.play(move);
    const kept = new ChildNode({
      san: child.data.san,
      nags: child.data.nags && child.data.nags.length ? [...child.data.nags] : void 0
    });
    const inner = sanitizeMoves(child, next, childOnMainline, ctx);
    kept.children = inner.children;
    out.children.push(kept);
  }
  return out;
}
function branchHasSideFen(child, posBefore, sideFens) {
  const next = posBefore.clone();
  const move = parseSan(next, child.data.san);
  if (!move) return false;
  next.play(move);
  if (sideFens.has(makeFen(next.toSetup()))) return true;
  return subtreeHasSideFen(child, next, sideFens);
}
function subtreeHasSideFen(node, pos, sideFens) {
  for (const child of node.children) {
    if (branchHasSideFen(child, pos, sideFens)) return true;
  }
  return false;
}
function walkFens(node, pos, fens) {
  for (const child of node.children) {
    const next = pos.clone();
    const move = parseSan(next, child.data.san);
    if (!move) continue;
    next.play(move);
    fens.add(makeFen(next.toSetup()));
    walkFens(child, next, fens);
  }
}
function buildCommentary(text, path5, catalog, lang) {
  const { tokens, errors } = parseCommentaryReferences(text, path5);
  const downgrades = [];
  const referencedSideIds = [];
  const segments = [];
  let cursor = 0;
  for (const token of tokens) {
    if (token.start > cursor) {
      segments.push({ type: "text", text: text.slice(cursor, token.start) });
    }
    if (!token.ok || !token.id) {
      segments.push({ type: "text", text: token.label || token.raw });
      cursor = token.end;
      continue;
    }
    const record = catalog.get(token.id);
    if (!record) {
      errors.push(issueError(lang, {
        code: "unknown_position_id",
        path: path5,
        message: `Unknown position id ${token.id} in ${path5}.`,
        params: { id: token.id, path: path5 }
      }));
      segments.push({ type: "text", text: token.label || token.id });
      cursor = token.end;
      continue;
    }
    const kind = positionKind(record.origin);
    const shapeResult = parseShapeMarkup(token.shapesMarkup, path5);
    downgrades.push(...shapeResult.downgrades);
    if (kind === "side") referencedSideIds.push(token.id);
    segments.push({
      type: "ref",
      positionId: token.id,
      kind,
      label: token.label || token.id,
      shapes: shapeResult.shapes
    });
    cursor = token.end;
  }
  if (cursor < text.length) {
    segments.push({ type: "text", text: text.slice(cursor) });
  }
  if (segments.length === 0) {
    segments.push({ type: "text", text });
  }
  return { segments, errors, downgrades, referencedSideIds };
}
function parseShapeMarkup(markup, path5) {
  const shapes = [];
  const downgrades = [];
  if (!markup || !String(markup).trim()) return { shapes, downgrades };
  const blockRe = /\[%(cal|csl)\s([^\]]*)\]/gi;
  let match;
  let sawBlock = false;
  while (match = blockRe.exec(markup)) {
    sawBlock = true;
    const kind = match[1].toLowerCase();
    const tokens = match[2].split(",").map((token) => token.trim()).filter(Boolean);
    for (const token of tokens) {
      const parsed = parseComment(`[%${kind} ${token}]`);
      if (!parsed.shapes.length) {
        downgrades.push({
          code: "invalid_shape",
          message: `Invalid ${kind} shape dropped in ${path5}: ${token}`,
          path: path5
        });
        continue;
      }
      for (const shape of parsed.shapes) {
        shapes.push({
          color: shape.color,
          from: makeSquare(shape.from),
          to: makeSquare(shape.to),
          kind: shape.from === shape.to ? "square" : "arrow"
        });
      }
    }
  }
  if (!sawBlock) {
    downgrades.push({
      code: "invalid_shape",
      message: `Malformed shape markup dropped in ${path5}: ${String(markup).trim()}`,
      path: path5
    });
  }
  return { shapes, downgrades };
}
function normalizeCommentarySan(tree, text, catalog = /* @__PURE__ */ new Map()) {
  const segments = [];
  let cursor = 0;
  for (const token of parseCommentaryReferences(text, "commentary").tokens) {
    if (!token.ok || !catalog.has(token.id)) continue;
    segments.push({ type: "text", text: text.slice(cursor, token.start) });
    const record = catalog.get(token.id);
    const targets = [...tree.nodes.values()].filter((node) => node.fen === record.fen);
    let label = token.label;
    if (targets.length === 1) {
      const mentions = findMoveMentions(label);
      if (mentions.length === 1 && mentions[0].sans.length === 1) {
        const san = mentions[0].sans[0].san;
        if (sansMatch(san, targets[0].san)) label = label.replace(san, targets[0].san + (san.match(/[!?]+$/)?.[0] ?? ""));
      }
    }
    segments.push({
      type: "ref",
      positionId: token.id,
      label,
      raw: token.label ? token.raw.replace(token.label, label) : token.raw,
      path: targets.length === 1 ? targets[0].path : void 0
    });
    cursor = token.end;
  }
  segments.push({ type: "text", text: text.slice(cursor) });
  const linked = linkCommentaryMoves(tree, segments);
  return linked.segments.map((segment) => segment.raw ?? (segment.type === "ref" ? segment.label : segment.text)).join("").replace(
    /\b([DTAC])(?=[a-h]?[1-8]?x?[a-h][1-8](?:[+#!?]*)(?!\w))/g,
    (letter) => ({ D: "Q", T: "R", A: "B", C: "N" })[letter]
  );
}
var EVAL_SCORE_RE = /^(cp -?\d+|mate -?\d+)$/;
function isAnalysisLang(lang) {
  return lang === "es" || lang === "en";
}
function issueError(lang, { code, v1Code, path: path5, message, params = {} }) {
  if (lang) return v1Error(v1Code ?? code, lang, { path: path5, ...params });
  return { code, message, path: path5 };
}
function pgnFromGamePlies(gamePlies2) {
  if (typeof gamePlies2 === "string") return gamePlies2;
  if (gamePlies2 && typeof gamePlies2.pgn === "string") return gamePlies2.pgn;
  return "";
}
function positionsFromManifest(manifest, gamePlies2, { lang = "es" } = {}) {
  const errors = [];
  const issued = [];
  const pgn = pgnFromGamePlies(gamePlies2);
  if (manifest == null || typeof manifest !== "object" || Array.isArray(manifest)) {
    errors.push(v1Error("missing_positions", lang, { path: "positions" }));
    return { issued, errors };
  }
  for (const [id, entry] of Object.entries(manifest)) {
    if (!/^pos_\d+$/.test(id)) {
      errors.push(v1Error("bad_position_id", lang, { id, path: `positions.${id}` }));
      continue;
    }
    const parsed = parseManifestEntry(id, entry, pgn, lang);
    errors.push(...parsed.errors);
    if (parsed.record) issued.push(parsed.record);
  }
  return { issued, errors };
}
function parseManifestEntry(id, entry, pgn, lang = "es") {
  const errors = [];
  const path5 = `positions.${id}`;
  if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
    errors.push(v1Error("bad_manifest_entry", lang, { id, path: path5 }));
    return { record: null, errors };
  }
  if (!Array.isArray(entry.moves) || entry.moves.some((move) => typeof move !== "string")) {
    errors.push(v1Error("bad_manifest_moves", lang, { id, path: `${path5}.moves` }));
  }
  const from = parseManifestFrom(id, entry.from, lang);
  if (from.errors.length) errors.push(...from.errors);
  const evaluation = parseManifestEval(id, entry.eval, lang);
  if (evaluation.errors.length) errors.push(...evaluation.errors);
  if (errors.length || !from.input) return { record: null, errors };
  const moves = Array.isArray(entry.moves) ? entry.moves : [];
  try {
    const resolved = resolvePosition({ ...from.input, moves, pgn });
    const origin = {
      ...from.origin,
      moves: moves.length ? [...moves] : void 0
    };
    return {
      record: {
        id,
        fen: resolved.fen,
        origin,
        eval: evaluation.value
      },
      errors
    };
  } catch (err) {
    errors.push(classifyManifestReplayError(err, id, from.input, lang));
    return { record: null, errors };
  }
}
function parseManifestFrom(id, from, lang) {
  const path5 = `positions.${id}.from`;
  if (from === null || typeof from !== "object" || Array.isArray(from)) {
    return { input: null, origin: null, errors: [v1Error("bad_manifest_from", lang, { id, path: path5 })] };
  }
  const keys = ["ply", "fen", "start"].filter((key) => from[key] !== void 0);
  if (keys.length !== 1) {
    return { input: null, origin: null, errors: [v1Error("bad_manifest_from", lang, { id, path: path5 })] };
  }
  switch (keys[0]) {
    case "ply": {
      if (!Number.isInteger(from.ply) || from.ply < 0) {
        return {
          input: null,
          origin: null,
          errors: [v1Error("unknown_ply", lang, { id, ply: from.ply, path: path5 })]
        };
      }
      return {
        input: { ply: from.ply },
        origin: { kind: "game", ply: from.ply },
        errors: []
      };
    }
    case "fen": {
      if (typeof from.fen !== "string" || from.fen.trim() === "") {
        return {
          input: null,
          origin: null,
          errors: [v1Error("bad_fen", lang, { id, fen: from.fen, path: path5 })]
        };
      }
      return {
        input: { fen: from.fen.trim() },
        origin: { kind: "side", fen: from.fen.trim() },
        errors: []
      };
    }
    case "start": {
      if (from.start !== true) {
        return { input: null, origin: null, errors: [v1Error("bad_manifest_from", lang, { id, path: path5 })] };
      }
      return {
        input: {},
        origin: { kind: "side" },
        errors: []
      };
    }
    default: {
      const _exhaustive = keys[0];
      return {
        input: null,
        origin: null,
        errors: [v1Error("bad_manifest_from", lang, { id, path: `${path5} (${_exhaustive})` })]
      };
    }
  }
}
function parseManifestEval(id, value, lang) {
  if (value === void 0 || value === null) return { value: void 0, errors: [] };
  const path5 = `positions.${id}.eval`;
  if (typeof value !== "object" || Array.isArray(value)) {
    return { value: void 0, errors: [v1Error("bad_manifest_eval", lang, { id, path: path5 })] };
  }
  const scoreOk = typeof value.score === "string" && EVAL_SCORE_RE.test(value.score.trim());
  const depthOk = Number.isInteger(value.depth) && value.depth >= 1;
  const moveOk = typeof value.bestmove === "string" && value.bestmove.trim() !== "";
  if (!scoreOk || !depthOk || !moveOk) {
    return { value: void 0, errors: [v1Error("bad_manifest_eval", lang, { id, path: path5 })] };
  }
  return {
    value: {
      score: value.score.trim(),
      depth: value.depth,
      bestmove: value.bestmove.trim()
    },
    errors: []
  };
}
function classifyManifestReplayError(err, id, input, lang) {
  const detail = err instanceof PositionToolError || err instanceof Error ? err.message : String(err);
  const path5 = `positions.${id}`;
  if (/^Invalid FEN:|^Illegal position in FEN:/.test(detail)) {
    return v1Error("bad_fen", lang, { id, fen: input?.fen ?? "", path: path5 });
  }
  if (/^Ambiguous move:/.test(detail)) {
    const san = detail.replace(/^Ambiguous move:\s*/, "");
    return v1Error("ambiguous_manifest_move", lang, { id, san, path: path5 });
  }
  if (/^Illegal move:|^Could not play move:|^Empty move/.test(detail)) {
    const san = detail.replace(/^(?:Illegal move:|Could not play move:|Empty move in the SAN list\.)\s*/, "");
    return v1Error("illegal_manifest_move", lang, { id, san: san || detail, path: path5 });
  }
  if (/ply |No game loaded|past the end/.test(detail)) {
    return v1Error("unknown_ply", lang, { id, ply: input?.ply, path: path5 });
  }
  return v1Error("bad_manifest_entry", lang, { id, path: path5, message: detail });
}
function peekSubmissionLang(json) {
  if (json && typeof json === "object" && !Array.isArray(json) && isAnalysisLang(json.lang)) {
    return json.lang;
  }
  if (typeof json === "string") {
    try {
      const value = JSON.parse(json.trim());
      if (value && typeof value === "object" && isAnalysisLang(value.lang)) return value.lang;
    } catch {
      return "es";
    }
  }
  return "es";
}
function parseV1Agent(agent, lang) {
  const errors = [];
  if (agent === null || typeof agent !== "object" || Array.isArray(agent)) {
    errors.push(v1Error("missing_agent", lang, { path: "agent" }));
    return { agent: null, errors };
  }
  if (typeof agent.model !== "string" || agent.model.trim() === "") {
    errors.push(v1Error("missing_agent_model", lang, { path: "agent.model" }));
  }
  let engine;
  if (agent.engine !== void 0 && agent.engine !== null) {
    if (typeof agent.engine !== "object" || Array.isArray(agent.engine)) {
      errors.push(v1Error("engine_kind", lang, { path: "agent.engine" }));
    } else if (agent.engine.kind !== "native" && agent.engine.kind !== "lite") {
      errors.push(v1Error("engine_kind", lang, { path: "agent.engine.kind" }));
    } else {
      engine = {
        name: typeof agent.engine.name === "string" ? agent.engine.name : "",
        kind: agent.engine.kind,
        maxDepth: Number.isInteger(agent.engine.maxDepth) ? agent.engine.maxDepth : void 0
      };
    }
  }
  if (errors.length) return { agent: null, errors };
  return {
    agent: {
      model: agent.model.trim(),
      effort: typeof agent.effort === "string" ? agent.effort : void 0,
      tool: typeof agent.tool === "string" ? agent.tool : void 0,
      helper: typeof agent.helper === "string" ? agent.helper : void 0,
      engine
    },
    errors
  };
}
function namedV1Ratings(ratings, lang) {
  if (!ratings) return null;
  const nameSide = (side) => ({
    vibeElo: side.vibeElo,
    categories: side.categories.map((category) => ({
      key: category.key,
      name: ratingLabel(category.key, lang),
      score: category.score,
      explanation: category.explanation
    }))
  });
  return { white: nameSide(ratings.white), black: nameSide(ratings.black) };
}
function v1ContractErrors(output, lang) {
  const errors = [];
  if (!hasClavesHeadingMarkup(output?.commentaries?.medio)) {
    errors.push(v1Error("claves_headings", lang, { path: "analysis.commentaries.medio" }));
  }
  for (const side of ["white", "black"]) {
    const keys = new Set((output?.ratings?.[side]?.categories ?? []).map((entry) => entry.key));
    for (const key of STANDARD_RATING_KEYS) {
      if (!keys.has(key)) {
        errors.push(v1Error("missing_category", lang, {
          side,
          key,
          path: `analysis.ratings.${side}.categories`
        }));
      }
    }
  }
  return errors;
}
function referencedPositionIds(output) {
  const ids = /* @__PURE__ */ new Set();
  for (const listed of output.sidePositions ?? []) {
    if (listed?.positionId) ids.add(listed.positionId);
  }
  for (const key of COMMENTARY_KEYS) {
    const text = output.commentaries?.[key];
    if (typeof text !== "string") continue;
    for (const token of parseCommentaryReferences(text, `commentaries.${key}`).tokens) {
      if (token.id) ids.add(token.id);
    }
  }
  return ids;
}
function validateSubmissionV1(json, gamePgn) {
  const peekLang = peekSubmissionLang(json);
  const parsedJson = parseV1JsonText(json, peekLang);
  if (!parsedJson.ok) {
    return { ok: false, errors: parsedJson.errors, warnings: [], analysis: null };
  }
  const body = parsedJson.value;
  const errors = [];
  const lang = isAnalysisLang(body.lang) ? body.lang : null;
  if (!lang) errors.push(v1Error("missing_lang", peekLang, { path: "lang" }));
  const locale = lang ?? peekLang;
  if (body.format !== FORMAT_V1) {
    errors.push(v1Error("wrong_format", locale, { path: "format", value: body.format }));
  }
  if (typeof body.session !== "string" || body.session.trim() === "") {
    errors.push(v1Error("missing_session", locale, { path: "session" }));
  }
  const agentParsed = parseV1Agent(body.agent, locale);
  errors.push(...agentParsed.errors);
  if (body.positions == null || typeof body.positions !== "object" || Array.isArray(body.positions)) {
    errors.push(v1Error("missing_positions", locale, { path: "positions" }));
  }
  const engineParsed = parseEngineAnalysis(body.engineAnalysis, locale);
  errors.push(...engineParsed.errors);
  if (body.analysis == null || typeof body.analysis !== "object" || Array.isArray(body.analysis)) {
    errors.push(v1Error("missing_analysis", locale, { path: "analysis" }));
    return { ok: false, errors, warnings: [], analysis: null, engineAnalysis: engineParsed.document };
  }
  const analysisParsed = parseV1Analysis(body.analysis, locale);
  if (!analysisParsed.ok) errors.push(...analysisParsed.errors);
  else errors.push(...v1ContractErrors(analysisParsed.output, locale));
  const manifest = positionsFromManifest(body.positions ?? {}, gamePgn, { lang: locale });
  errors.push(...manifest.errors);
  if (!analysisParsed.ok) {
    return { ok: false, errors, warnings: [], analysis: null, engineAnalysis: engineParsed.document };
  }
  const output = {
    ...analysisParsed.output,
    ratings: namedV1Ratings(analysisParsed.output.ratings, locale)
  };
  const result = validateAnalysis({
    pgn: gamePgn,
    perspective: "ninguno",
    output,
    issuedPositions: manifest.issued,
    strict: true,
    lang: locale
  });
  errors.push(...result.errors);
  const warnings = result.downgrades.map((issue) => ({
    code: issue.code,
    message: issue.message,
    path: issue.path
  }));
  const usedIds = referencedPositionIds(output);
  for (const record of manifest.issued) {
    if (!usedIds.has(record.id)) {
      warnings.push({
        code: "unused_position",
        message: locale === "en" ? `Manifest id ${record.id} is never referenced.` : `El identificador ${record.id} del manifiesto no se menciona.`,
        path: `positions.${record.id}`
      });
    }
    if (usedIds.has(record.id) && !record.eval) {
      warnings.push({
        code: "missing_eval",
        message: locale === "en" ? `Referenced position ${record.id} has no manifest eval.` : `La posici\xF3n ${record.id} no trae eval en el manifiesto.`,
        path: `positions.${record.id}.eval`
      });
    }
  }
  const analysis = result.analysis ? (() => {
    const { perspective: _perspective, ...rest } = result.analysis;
    void _perspective;
    return {
      ...rest,
      formatVersion: 1,
      source: "agente",
      lang: locale,
      agent: agentParsed.agent,
      session: typeof body.session === "string" ? body.session.trim() : "",
      checks: {
        format: body.format === FORMAT_V1,
        manifestReplay: manifest.errors.length === 0,
        mainline: !errors.some((error) => error.code === "mainline_mismatch"),
        variationsLegal: !errors.some((error) => error.code === "illegal_move"),
        engine: null
      }
    };
  })() : null;
  const unique = dedupeErrors([...errors]);
  return {
    ok: unique.length === 0,
    errors: unique,
    warnings,
    analysis,
    engineAnalysis: engineParsed.document
  };
}
function parseEngineAnalysis(value, lang = "es") {
  if (value === void 0 || value === null) {
    return { ok: true, missing: true, document: null, errors: [] };
  }
  const shape = engineAnalysisShapeErrors(value);
  if (shape.length) {
    return {
      ok: false,
      missing: false,
      document: null,
      errors: [v1Error("bad_engine_analysis", lang, { path: "engineAnalysis", detail: shape[0] })]
    };
  }
  return { ok: true, missing: false, document: value, errors: [] };
}
function dedupeErrors(errors) {
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  for (const error of errors) {
    const key = `${error.code}|${error.path}|${error.message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(error);
  }
  return out;
}

// agent-kit/engine.mjs
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

// agent-kit/messages.mjs
function normalizeLang(lang) {
  return lang === "en" ? "en" : "es";
}
var TEMPLATES2 = {
  usage: {
    es: () => "Uso: node chess-tools.mjs <start|game|position|eval|check|submit> \u2026",
    en: () => "Usage: node chess-tools.mjs <start|game|position|eval|check|submit> \u2026"
  },
  unknown_command: {
    es: ({ command }) => `Comando desconocido: ${command}`,
    en: ({ command }) => `Unknown command: ${command}`
  },
  missing_code: {
    es: () => "start necesita un c\xF3digo de sesi\xF3n o una URL /s/<c\xF3digo>.",
    en: () => "start needs a session code or a /s/<code> URL."
  },
  missing_api: {
    es: () => "Indica la URL del API con --api o pasa la URL completa de la sesi\xF3n.",
    en: () => "Pass the API URL with --api, or the full session URL."
  },
  start_fetch_failed: {
    es: ({ status, detail }) => `No se pudo leer la sesi\xF3n (${status ?? "red"})${detail ? `: ${detail}` : "."}`,
    en: ({ status, detail }) => `Could not fetch the session (${status ?? "network"})${detail ? `: ${detail}` : "."}`
  },
  start_bad_json: {
    es: () => "La sesi\xF3n no devolvi\xF3 JSON v\xE1lido (?format=json).",
    en: () => "The session did not return valid JSON (?format=json)."
  },
  start_missing_pgn: {
    es: () => "La sesi\xF3n no incluye un PGN.",
    en: () => "The session does not include a PGN."
  },
  session_missing: {
    es: () => "No hay una sesi\xF3n en .chess-tutor/. Ejecuta primero: node chess-tools.mjs start <c\xF3digo>",
    en: () => "No session in .chess-tutor/. Run first: node chess-tools.mjs start <code>"
  },
  engine_missing_path: {
    es: ({ path: file }) => `No existe el binario de Stockfish: ${file}`,
    en: ({ path: file }) => `Stockfish binary not found: ${file}`
  },
  engine_lite_failed: {
    es: ({ detail }) => `No se pudo ejecutar el motor lite bajo Node${detail ? ` (${detail})` : ""}.`,
    en: ({ detail }) => `The lite engine could not run under Node${detail ? ` (${detail})` : ""}.`
  },
  engine_install_hint: {
    es: () => "Instala Stockfish (https://stockfishchess.org/download/ o el gestor de paquetes) y vuelve a ejecutar con --stockfish /ruta/al/binario, o define STOCKFISH_PATH.",
    en: () => "Install Stockfish (https://stockfishchess.org/download/ or your package manager) and rerun with --stockfish /path/to/binary, or set STOCKFISH_PATH."
  },
  engine_hash_mismatch: {
    es: ({ file }) => `El archivo del motor ${file} no coincide con el hash SHA-256 embebido. B\xF3rralo y vuelve a ejecutar start.`,
    en: ({ file }) => `Engine file ${file} does not match the embedded SHA-256. Delete it and run start again.`
  },
  network_blocked: {
    es: ({ url }) => `Red bloqueada: ${url}. Este script solo habla con la URL del API y la de la p\xE1gina.`,
    en: ({ url }) => `Network blocked: ${url}. This script only talks to the API URL and the page URL.`
  },
  write_blocked: {
    es: ({ path: file }) => `Escritura bloqueada fuera de .chess-tutor/: ${file}`,
    en: ({ path: file }) => `Write blocked outside .chess-tutor/: ${file}`
  },
  bad_depth: {
    es: () => "depth debe ser un entero de 1 a 30.",
    en: () => "depth must be an integer from 1 to 30."
  },
  missing_position_id: {
    es: () => "eval necesita un identificador pos_N.",
    en: () => "eval needs a pos_N id."
  },
  missing_file: {
    es: ({ path: file }) => `No se encontr\xF3 el archivo: ${file}`,
    en: ({ path: file }) => `File not found: ${file}`
  },
  missing_model: {
    es: () => "submit necesita --model (y --effort, --tool).",
    en: () => "submit needs --model (and --effort, --tool)."
  },
  check_failed: {
    es: ({ count }) => `Comprobaci\xF3n fallida: ${count} error${count === 1 ? "" : "es"}.`,
    en: ({ count }) => `Check failed: ${count} error${count === 1 ? "" : "s"}.`
  },
  check_ok: {
    es: ({ warnings }) => warnings ? `Comprobaci\xF3n correcta, con ${warnings} aviso${warnings === 1 ? "" : "s"}.` : "Comprobaci\xF3n correcta.",
    en: ({ warnings }) => warnings ? `Check passed, with ${warnings} warning${warnings === 1 ? "" : "s"}.` : "Check passed."
  },
  submit_http_failed: {
    es: ({ status, detail }) => `El API rechaz\xF3 el borrador (${status})${detail ? `: ${detail}` : "."}`,
    en: ({ status, detail }) => `The API rejected the draft (${status})${detail ? `: ${detail}` : "."}`
  },
  game_analysis_failed: {
    es: ({ detail }) => `No se pudo completar el an\xE1lisis de motor de la partida${detail ? `: ${detail}` : "."}`,
    en: ({ detail }) => `The full-game engine analysis could not be completed${detail ? `: ${detail}` : "."}`
  },
  timeout: {
    es: () => "El motor super\xF3 el l\xEDmite de 20 s.",
    en: () => "The engine exceeded the 20 s limit."
  }
};
function msg(lang, key, params = {}) {
  const locale = normalizeLang(lang);
  const table = TEMPLATES2[key];
  if (!table) return params.message ?? key;
  const render = table[locale] ?? table.en;
  return render(params);
}
function formatStartSummary(lang, info) {
  const locale = normalizeLang(lang);
  if (locale === "en") {
    return [
      `chess-tools.mjs ${info.version}`,
      `session: ${info.code}`,
      `lang: ${info.lang}`,
      `engine: ${info.engineName} (${info.engineKind})`,
      info.expiresAt ? `expires: ${info.expiresAt}` : null,
      `plies: ${info.plyCount}`,
      `dir: ${info.dir}`
    ].filter(Boolean).join("\n");
  }
  return [
    `chess-tools.mjs ${info.version}`,
    `sesi\xF3n: ${info.code}`,
    `idioma: ${info.lang}`,
    `motor: ${info.engineName} (${info.engineKind === "native" ? "nativo" : "lite"})`,
    info.expiresAt ? `caduca: ${info.expiresAt}` : null,
    `jugadas: ${info.plyCount}`,
    `dir: ${info.dir}`
  ].filter(Boolean).join("\n");
}

// agent-kit/engine.mjs
var HELPER_VERSION = "1.1.0";
var HELPER_NAME = `chess-tools.mjs ${HELPER_VERSION}`;
var MAX_DEPTH = 30;
var EVAL_TIMEOUT_MS = 2e4;
var DEFAULT_POSITION_DEPTH = 14;
var DEFAULT_EVAL_DEPTH = 16;
var ENGINE_JS_FILE = "stockfish-19-lite-single.js";
var ENGINE_WASM_FILE = "stockfish-19-lite-single.wasm";
function embeddedEngineHashes() {
  const js = true ? "ccb130d7ff29408531c47d859a49f91d59d4f482d05a53eb1a3231a4f624c91a" : "";
  const wasm = true ? "ee4f115bdb2d32cadf96cada104a05b5ec257d7ad6f57582190b49bc71f096de" : "";
  return { js, wasm };
}
function clampDepth(value, fallback) {
  const n = typeof value === "string" && /^-?\d+$/.test(value.trim()) ? Number(value.trim()) : value;
  if (n == null || n === "") return fallback;
  if (!Number.isInteger(n) || n < 1 || n > MAX_DEPTH) return null;
  return n;
}
function sha256Hex2(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}
function findOnPath(name, env = process.env) {
  const paths = String(env.PATH ?? "").split(path.delimiter).filter(Boolean);
  const exts = process.platform === "win32" ? [".exe", ""] : [""];
  for (const dir of paths) {
    for (const ext of exts) {
      const file = path.join(dir, name + ext);
      if (existsSync(file)) return file;
    }
  }
  return null;
}
function isNodeEngineFile(file) {
  return /\.[cm]?js$/.test(String(file ?? ""));
}
function spawnArgsFor(engine) {
  switch (engine.kind) {
    case "native": {
      if (isNodeEngineFile(engine.path)) {
        return { command: process.execPath, args: [engine.path] };
      }
      return { command: engine.path, args: [] };
    }
    case "lite":
      return { command: process.execPath, args: [engine.jsPath] };
    default: {
      const _exhaustive = engine.kind;
      throw new Error(`Unknown engine kind: ${_exhaustive}`);
    }
  }
}
function parseUciEval(bestmoveLine, lastInfo, depth) {
  const bestmove = String(bestmoveLine ?? "").split(/\s+/)[1] ?? "";
  const sc = String(lastInfo ?? "").match(/score (cp|mate) (-?\d+)/);
  const pv = String(lastInfo ?? "").split(" pv ")[1] || "";
  return {
    bestmove,
    score: sc ? `${sc[1]} ${sc[2]}` : null,
    pv: pv.split(" ").filter(Boolean).slice(0, 8).join(" "),
    depth
  };
}
function evaluateFenWithProcess({ command, args = [], fen, depth, timeoutMs = EVAL_TIMEOUT_MS }) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const p = spawn(command, args, {
      windowsHide: true,
      shell: false,
      stdio: ["pipe", "pipe", "ignore"]
    });
    let buf = "";
    let last = "";
    const timer = setTimeout(() => {
      fail(new Error("timeout"));
    }, timeoutMs);
    function done(fn, value) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        p.stdin.write("quit\n");
      } catch {
      }
      try {
        p.stdin.end();
      } catch {
      }
      try {
        p.kill();
      } catch {
      }
      p.unref();
      fn(value);
    }
    function succeed(value) {
      done(resolve, value);
    }
    function fail(err) {
      done(reject, err);
    }
    p.on("error", fail);
    p.stdout.on("data", (chunk) => {
      buf += chunk;
      const lines = buf.split(/\r?\n/);
      buf = lines.pop();
      for (const line of lines) {
        if (line.startsWith("info") && line.includes(" score ")) last = line;
        if (line.startsWith("bestmove")) {
          succeed(parseUciEval(line, last, depth));
        }
      }
    });
    p.on("exit", (code) => {
      if (!settled) fail(new Error(`engine exited ${code ?? "null"}`));
    });
    try {
      p.stdin.write(`uci
isready
position fen ${fen}
go depth ${depth}
`);
    } catch (err) {
      fail(err);
    }
  });
}
async function readEngineName({ command, args = [], timeoutMs = 8e3 }) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const p = spawn(command, args, {
      windowsHide: true,
      shell: false,
      stdio: ["pipe", "pipe", "ignore"]
    });
    let buf = "";
    let name = "";
    const timer = setTimeout(() => finish({ name, ready: false }), timeoutMs);
    function finish(value) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        p.stdin.write("quit\n");
      } catch {
      }
      try {
        p.stdin.end();
      } catch {
      }
      try {
        p.kill();
      } catch {
      }
      p.unref();
      resolve(value);
    }
    p.on("error", (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(err);
    });
    p.stdout.on("data", (chunk) => {
      buf += chunk;
      const lines = buf.split(/\r?\n/);
      buf = lines.pop();
      for (const line of lines) {
        const match = line.match(/^id name (.+)$/);
        if (match) name = match[1].trim();
        if (line === "uciok") finish({ name, ready: true });
      }
    });
    p.on("exit", () => finish({ name, ready: false }));
    try {
      p.stdin.write("uci\n");
    } catch (err) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(err);
    }
  });
}
function engineRoot(chessTutorDir2) {
  return path.join(chessTutorDir2, "engine");
}
function joinPageUrl(pageUrl, rel) {
  const base = String(pageUrl ?? "").replace(/\/+$/, "");
  const suffix = String(rel ?? "").replace(/^\/+/, "");
  return `${base}/${suffix}`;
}
async function ensureLiteEngine({
  chessTutorDir: chessTutorDir2,
  pageUrl,
  fetchFn,
  hashes = embeddedEngineHashes(),
  lang = "es"
}) {
  const dir = engineRoot(chessTutorDir2);
  await mkdir(dir, { recursive: true });
  const files = [
    { name: ENGINE_JS_FILE, hash: hashes.js },
    { name: ENGINE_WASM_FILE, hash: hashes.wasm }
  ];
  for (const file of files) {
    const dest = path.join(dir, file.name);
    if (!existsSync(dest)) {
      const url = joinPageUrl(pageUrl, `engine/${file.name}`);
      const res = await fetchFn(url);
      if (!res.ok) {
        throw new Error(msg(lang, "start_fetch_failed", { status: res.status, detail: file.name }));
      }
      const bytes = Buffer.from(await res.arrayBuffer());
      await writeFile(dest, bytes);
    }
    if (file.hash) {
      const bytes = await readFile(dest);
      const actual = sha256Hex2(bytes);
      if (actual !== file.hash) {
        throw new Error(msg(lang, "engine_hash_mismatch", { file: file.name }));
      }
    }
  }
  return {
    kind: "lite",
    jsPath: path.join(dir, ENGINE_JS_FILE),
    wasmPath: path.join(dir, ENGINE_WASM_FILE),
    path: path.join(dir, ENGINE_JS_FILE)
  };
}
async function pickEngine({
  stockfishFlag,
  env = process.env,
  chessTutorDir: chessTutorDir2,
  pageUrl,
  fetchFn,
  hashes,
  lang = "es"
}) {
  const explicit = typeof stockfishFlag === "string" && stockfishFlag.trim() ? stockfishFlag.trim() : typeof env.STOCKFISH_PATH === "string" && env.STOCKFISH_PATH.trim() ? env.STOCKFISH_PATH.trim() : "";
  if (explicit) {
    if (!existsSync(explicit)) {
      throw new Error(msg(lang, "engine_missing_path", { path: explicit }));
    }
    return { kind: "native", path: explicit };
  }
  const onPath = findOnPath("stockfish", env);
  if (onPath) return { kind: "native", path: onPath };
  try {
    return await ensureLiteEngine({ chessTutorDir: chessTutorDir2, pageUrl, fetchFn, hashes, lang });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(
      `${msg(lang, "engine_lite_failed", { detail })}
${msg(lang, "engine_install_hint")}`
    );
  }
}
async function describeEngine(engine, lang = "es") {
  void normalizeLang(lang);
  const spawned = spawnArgsFor(engine);
  const probe = await readEngineName(spawned);
  if (!probe.ready) {
    throw new Error("engine did not answer uciok");
  }
  let name = probe.name;
  if (!name) {
    name = engine.kind === "lite" ? "Stockfish 19 Lite WASM" : "Stockfish";
  }
  return {
    name,
    kind: engine.kind,
    maxDepth: MAX_DEPTH
  };
}
function makeEvaluator(engine) {
  const spawned = spawnArgsFor(engine);
  return async function evaluate(fen, depth) {
    try {
      return await evaluateFenWithProcess({
        command: spawned.command,
        args: spawned.args,
        fen,
        depth
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message === "timeout") return { error: "timeout" };
      return { error: message };
    }
  };
}

// agent-kit/game-analysis.mjs
import { spawn as spawn2 } from "node:child_process";

// frontend/src/grain.js
var GRAIN_BLEND_MODES = [
  "normal",
  "multiply",
  "screen",
  "overlay",
  "soft-light",
  "hard-light",
  "difference"
];
var GRAIN_BLEND_SET = new Set(GRAIN_BLEND_MODES);
function defaultGrainSettings(mode = "light") {
  const dark = mode === "dark";
  return {
    enabled: false,
    opacity: dark ? 0.2 : 0.14,
    size: 3,
    fps: 12,
    contrast: 0.55,
    color: false,
    blend: dark ? "screen" : "multiply"
  };
}

// frontend/src/dev-settings.js
var LIGHT_THEME = {
  boardLight: "#f3d5a3",
  boardDark: "#c08648",
  lastMove: "#c48a28",
  pageBg: "#f4f3ef",
  panelBg: "#ffffff",
  text: "#222222",
  muted: "#666666",
  accent: "#3d6b4f",
  link: "#3d6ea8",
  border: "#e4e2da",
  radius: 8,
  fontStack: "default",
  fontFamily: "",
  fontSize: 16,
  grain: defaultGrainSettings("light")
};
var DARK_THEME = {
  boardLight: "#f3d5a3",
  boardDark: "#c08648",
  lastMove: "#c48a28",
  pageBg: "#0b0b0b",
  panelBg: "#161616",
  text: "#ededed",
  muted: "#9a9a9a",
  accent: "#4e8a66",
  link: "#8eb4e0",
  border: "#2a2a2a",
  radius: 8,
  fontStack: "default",
  fontFamily: "",
  fontSize: 16,
  grain: defaultGrainSettings("dark")
};
function defaultUiSettings() {
  return {
    boardSize: 0,
    showCoordinates: true,
    animationMs: 160,
    showBestMoveArrows: true,
    showEvalBar: true,
    moveListFontSize: 0,
    compact: false,
    defaultOrientation: "white",
    defaultLang: "es"
  };
}
function defaultThemeSettings() {
  return {
    light: { ...LIGHT_THEME, grain: { ...LIGHT_THEME.grain } },
    dark: { ...DARK_THEME, grain: { ...DARK_THEME.grain } }
  };
}
function defaultDevSettings() {
  return {
    version: 1,
    engine: {
      depth: 14,
      liveDepth: 0,
      movetime: 0,
      multipv: 2,
      threads: 1,
      hash: 16
    },
    thresholds: {
      inaccuracy: 10,
      mistake: 20,
      blunder: 30,
      mateCp: 1e3,
      winSteepness: 368208e-8
    },
    ui: defaultUiSettings(),
    theme: defaultThemeSettings()
  };
}

// frontend/src/engine-game.js
var TERMINAL_MATE_CP = 1e4;
function requestedEngine(settings = defaultDevSettings()) {
  return {
    name: settings.engine?.name || ENGINE_NAME,
    depth: settings.engine?.depth ?? 14,
    multipv: settings.engine?.multipv ?? 2,
    movetime: settings.engine?.movetime ?? 0
  };
}
function terminalScore(fen) {
  const pos = positionFromFen2(fen);
  if (!pos) return null;
  if (typeof pos.isCheckmate === "function" && pos.isCheckmate()) {
    const whiteMate = pos.turn === "white" ? -1 : 1;
    return {
      kind: "mate",
      whiteCp: whiteMate > 0 ? TERMINAL_MATE_CP : -TERMINAL_MATE_CP,
      whiteMate
    };
  }
  if (typeof pos.isEnd === "function" && pos.isEnd()) {
    return { kind: "cp", whiteCp: 0, whiteMate: null };
  }
  return null;
}
async function analyseWithSearchFn(tree, searchFn, {
  settings = defaultDevSettings(),
  createdAt,
  onProgress,
  signal
} = {}) {
  const walked = mainlinePlies(tree);
  if (!walked?.startFen) throw new Error("no-game");
  const fens = [walked.startFen, ...walked.plies.map((ply) => ply.fenAfter)];
  const positionResults = [];
  for (let i = 0; i < fens.length; i += 1) {
    if (signal?.aborted) throw abortError();
    onProgress?.({ current: i, total: fens.length });
    const terminal = terminalScore(fens[i]);
    if (terminal) {
      positionResults.push({
        depth: settings.engine?.depth ?? 14,
        score: terminal,
        best: null,
        lines: []
      });
      continue;
    }
    const searched = await searchFn(fens[i], i, fens.length);
    if (signal?.aborted) throw abortError();
    positionResults.push(searched);
  }
  onProgress?.({ current: fens.length, total: fens.length });
  const gameHash = await gameHashFromFenAndUci(
    walked.startFen,
    walked.plies.map((ply) => ply.uci)
  );
  const engine = requestedEngine(settings);
  return buildEngineAnalysis({
    gameHash,
    engine,
    settings,
    createdAt,
    plies: walked.plies,
    positionResults
  });
}
function positionFromFen2(fen) {
  const setup = parseFen(String(fen ?? ""));
  if (setup.isErr) return null;
  const chess = Chess.fromSetup(setup.value);
  if (chess.isErr) return null;
  return chess.value;
}
function abortError() {
  const err = new Error("cancelled");
  err.code = "cancelled";
  return err;
}

// agent-kit/game-analysis.mjs
var GAME_ANALYSIS_DEPTH = 14;
var GAME_ANALYSIS_MULTIPV = 2;
var GAME_SEARCH_TIMEOUT_MS = 6e4;
function gameAnalysisSettings(engineName) {
  const settings = defaultDevSettings();
  return {
    ...settings,
    engine: {
      ...settings.engine,
      name: engineName || "Stockfish",
      depth: GAME_ANALYSIS_DEPTH,
      multipv: GAME_ANALYSIS_MULTIPV,
      movetime: 0
    }
  };
}
function createUciSearcher(engine, {
  depth = GAME_ANALYSIS_DEPTH,
  multipv = GAME_ANALYSIS_MULTIPV,
  timeoutMs = GAME_SEARCH_TIMEOUT_MS
} = {}) {
  const spawned = spawnArgsFor(engine);
  const proc = spawn2(spawned.command, spawned.args, {
    windowsHide: true,
    shell: false,
    stdio: ["pipe", "pipe", "ignore"]
  });
  let buf = "";
  let closed = false;
  const listeners = /* @__PURE__ */ new Set();
  proc.stdout.on("data", (chunk) => {
    buf += chunk;
    const lines = buf.split(/\r?\n/);
    buf = lines.pop();
    for (const line of lines) {
      for (const fn of listeners) fn(line);
    }
  });
  proc.on("error", (err) => {
    for (const fn of listeners) fn({ error: err });
  });
  function onLine(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }
  function send(command) {
    if (closed) throw new Error("engine-closed");
    proc.stdin.write(`${command}
`);
  }
  function waitFor(match, ms) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        off();
        reject(new Error("timeout"));
      }, ms);
      const off = onLine((line) => {
        if (line && typeof line === "object" && line.error) {
          clearTimeout(timer);
          off();
          reject(line.error);
          return;
        }
        if (match(String(line ?? ""))) {
          clearTimeout(timer);
          off();
          resolve(line);
        }
      });
    });
  }
  const ready = (async () => {
    send("uci");
    await waitFor((line) => line === "uciok", 8e3);
    send(`setoption name MultiPV value ${multipv}`);
    send("isready");
    await waitFor((line) => line === "readyok", 8e3);
  })();
  async function searchFen(fen) {
    await ready;
    const pvs = /* @__PURE__ */ new Map();
    let depthSeen = 0;
    const done = waitFor((line) => {
      if (line.startsWith("bestmove")) return true;
      const info = parseInfoLine(line);
      if (!info) return false;
      if (info.depth < depthSeen && pvs.has(info.multipv)) return false;
      pvs.set(info.multipv, lineFromInfo(info, fen));
      depthSeen = Math.max(depthSeen, info.depth);
      return false;
    }, timeoutMs);
    send(`position fen ${fen}`);
    send(`go depth ${depth}`);
    await done;
    const lines = [...pvs.values()].sort((a, b) => a.multipv - b.multipv);
    const top = lines[0];
    const bestUci = top?.pv?.[0] ?? "";
    const bestSan = bestUci ? uciMovesToSan(fen, [bestUci])[0] ?? "" : "";
    return {
      depth: depthSeen || depth,
      score: top?.score ?? { kind: "cp", whiteCp: 0, whiteMate: null },
      best: bestUci ? { uci: bestUci, san: bestSan } : null,
      lines: lines.map((line) => ({
        pv: line.pv,
        sans: Array.isArray(line.sans) ? line.sans : uciMovesToSan(fen, line.pv),
        san: line.san,
        eval: line.eval ?? formatEval(line.score),
        score: line.score
      }))
    };
  }
  return {
    searchFen,
    close() {
      if (closed) return;
      try {
        proc.stdin.write("quit\n");
      } catch {
      }
      closed = true;
      try {
        proc.stdin.end();
      } catch {
      }
      try {
        proc.kill();
      } catch {
      }
    }
  };
}
async function analysePgnWithEngine(pgn, engine, { createdAt } = {}) {
  const tree = loadGameTree(pgn);
  if (!tree.ok) throw new Error("no-game");
  const settings = gameAnalysisSettings(engine?.name);
  const searcher = createUciSearcher(engine, {
    depth: settings.engine.depth,
    multipv: settings.engine.multipv
  });
  try {
    const result = await analyseWithSearchFn(tree, (fen) => searcher.searchFen(fen), {
      settings,
      createdAt
    });
    if (!result.plies?.length) return null;
    return result;
  } finally {
    searcher.close();
  }
}

// agent-kit/game.mjs
function gamePlies(pgn) {
  const games = parsePgn(String(pgn ?? ""));
  if (!games.length) return [];
  const game = games[0];
  const start = startingPosition(game.headers);
  const pos = start.isErr ? Chess.default() : start.value;
  const plies = [{ ply: 0, san: null, fen: makeFen(pos.toSetup()) }];
  let ply = 0;
  for (const node of game.moves.mainline()) {
    const move = parseSan(pos, node.san);
    if (!move) break;
    pos.play(move);
    ply += 1;
    plies.push({ ply, san: node.san, fen: makeFen(pos.toSetup()) });
  }
  return plies;
}

// agent-kit/session.mjs
import { existsSync as existsSync2 } from "node:fs";
import { mkdir as mkdir2, readdir, readFile as readFile2, stat, writeFile as writeFile2 } from "node:fs/promises";
import path2 from "node:path";
var DEFAULT_PAGE_URL = "https://ishmanashna.github.io/chess-tutor-share";
var DIR_NAME = ".chess-tutor";
var PROGRESS_EVERY = 20;
function chessTutorDir(cwd) {
  return path2.join(cwd, DIR_NAME);
}
function assertInsideChessTutor(cwd, target, lang = "es") {
  const root = path2.resolve(chessTutorDir(cwd));
  const resolved = path2.resolve(target);
  if (resolved === root || resolved.startsWith(root + path2.sep)) return resolved;
  throw new Error(msg(lang, "write_blocked", { path: target }));
}
async function safeWriteFile(cwd, target, contents, lang = "es") {
  const resolved = assertInsideChessTutor(cwd, target, lang);
  await mkdir2(path2.dirname(resolved), { recursive: true });
  await writeFile2(resolved, contents);
  return resolved;
}
function isAllowedUrl(url, bases) {
  let target;
  try {
    target = new URL(url);
  } catch {
    return false;
  }
  return bases.some((base) => {
    if (!base) return false;
    try {
      return target.origin === new URL(base).origin;
    } catch {
      return false;
    }
  });
}
async function allowedFetch(url, { apiUrl, pageUrl, lang = "es", fetchFn = fetch, ...opts } = {}) {
  if (!isAllowedUrl(url, [apiUrl, pageUrl])) {
    throw new Error(msg(lang, "network_blocked", { url }));
  }
  return fetchFn(url, { redirect: "manual", ...opts });
}
function parseStartTarget(input) {
  const raw = String(input ?? "").trim();
  if (!raw) return { code: "", apiUrl: "" };
  if (/^https?:\/\//i.test(raw)) {
    const url = new URL(raw);
    const match = url.pathname.match(/\/s\/([^/]+)\/?$/);
    const code = match ? decodeURIComponent(match[1]) : "";
    return { code, apiUrl: url.origin };
  }
  return { code: raw, apiUrl: "" };
}
function firstString(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value;
  }
  return "";
}
function extractSessionFields(json, fallbacks = {}) {
  const obj = json && typeof json === "object" && !Array.isArray(json) ? json : {};
  const nested = obj.session && typeof obj.session === "object" ? obj.session : {};
  const gameObj = obj.game && typeof obj.game === "object" ? obj.game : {};
  const pgn = firstString(
    obj.pgn,
    nested.pgn,
    gameObj.pgn,
    typeof obj.game === "string" ? obj.game : "",
    obj.gamePgn,
    fallbacks.pgn
  );
  const langRaw = obj.lang ?? nested.lang ?? gameObj.lang ?? fallbacks.lang;
  const lang = langRaw === "en" ? "en" : "es";
  const code = firstString(obj.code, nested.code, fallbacks.code);
  const expiresAt = firstString(
    obj.expiresAt,
    obj.expiry,
    obj.expires,
    nested.expiresAt,
    fallbacks.expiresAt
  );
  const pageUrl = firstString(obj.pageUrl, obj.page, nested.pageUrl, fallbacks.pageUrl);
  const apiUrl = firstString(obj.apiUrl, obj.api, nested.apiUrl, fallbacks.apiUrl);
  return { code, lang, pgn, expiresAt, pageUrl, apiUrl };
}
function emptyLog() {
  return {
    nextId: 1,
    issued: [],
    toolCalls: 0,
    positionCalls: 0,
    evalCalls: 0,
    lastProgressAt: 0
  };
}
async function readJsonFile(file, fallback) {
  try {
    return JSON.parse(await readFile2(file, "utf8"));
  } catch {
    return fallback;
  }
}
async function listSessionDirs(cwd) {
  const root = chessTutorDir(cwd);
  if (!existsSync2(root)) return [];
  const entries = await readdir(root, { withFileTypes: true });
  const sessions = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === "engine") continue;
    const dir = path2.join(root, entry.name);
    const sessionFile = path2.join(dir, "session.json");
    if (!existsSync2(sessionFile)) continue;
    const info = await stat(sessionFile);
    sessions.push({ code: entry.name, dir, mtime: info.mtimeMs });
  }
  sessions.sort((a, b) => b.mtime - a.mtime);
  return sessions;
}
async function findSession(cwd, code) {
  if (code) {
    const dir = path2.join(chessTutorDir(cwd), code);
    const sessionFile = path2.join(dir, "session.json");
    if (!existsSync2(sessionFile)) return null;
    return { code, dir };
  }
  const listed = await listSessionDirs(cwd);
  return listed[0] ?? null;
}
async function loadSessionState(cwd, code) {
  const found = await findSession(cwd, code);
  if (!found) return null;
  const session = await readJsonFile(path2.join(found.dir, "session.json"), null);
  const log = await readJsonFile(path2.join(found.dir, "log.json"), emptyLog());
  if (!session) return null;
  return { ...found, session, log };
}
async function saveSession(cwd, session) {
  const dir = path2.join(chessTutorDir(cwd), session.code);
  await safeWriteFile(
    cwd,
    path2.join(dir, "session.json"),
    `${JSON.stringify(session, null, 2)}
`,
    session.lang
  );
  return dir;
}
async function saveLog(cwd, code, log, lang = "es") {
  const dir = path2.join(chessTutorDir(cwd), code);
  await safeWriteFile(cwd, path2.join(dir, "log.json"), `${JSON.stringify(log, null, 2)}
`, lang);
}
function hydrateStore(store, log) {
  store.nextId = Number.isInteger(log.nextId) && log.nextId >= 1 ? log.nextId : 1;
  store.byId.clear();
  store.byFen.clear();
  for (const record of log.issued ?? []) {
    if (!record || typeof record.id !== "string" || typeof record.fen !== "string") continue;
    store.byId.set(record.id, { id: record.id, fen: record.fen, board: record.board ?? "" });
    store.byFen.set(record.fen, record.id);
  }
}
function manifestFromArgs(args = {}) {
  if (args.ply != null && args.ply !== "") {
    const ply = typeof args.ply === "string" && /^\d+$/.test(args.ply.trim()) ? Number(args.ply.trim()) : args.ply;
    if (Number.isInteger(ply)) return { ply };
  }
  const fen = typeof args.fen === "string" ? args.fen.trim() : "";
  if (fen && fen.toLowerCase() !== "start" && fen.toLowerCase() !== "startpos") {
    return { fen };
  }
  return { start: true };
}
function manifestEvalFromResult(evaluation) {
  if (!evaluation || evaluation.error) return void 0;
  if (typeof evaluation.score !== "string" || typeof evaluation.bestmove !== "string") {
    return void 0;
  }
  if (!evaluation.bestmove.trim()) return void 0;
  return {
    score: evaluation.score.trim(),
    depth: evaluation.depth,
    bestmove: evaluation.bestmove.trim()
  };
}
function recordIssued(log, { id, fen, board, args, evaluation }) {
  const moves = parseMoveList(args.moves);
  const entry = {
    id,
    fen,
    board,
    from: manifestFromArgs(args),
    moves,
    eval: manifestEvalFromResult(evaluation)
  };
  const index = log.issued.findIndex((item) => item.id === id);
  if (index >= 0) log.issued[index] = { ...log.issued[index], ...entry };
  else log.issued.push(entry);
  const match = /^pos_(\d+)$/.exec(id);
  if (match) {
    const n = Number(match[1]) + 1;
    if (n > log.nextId) log.nextId = n;
  }
}
function updateIssuedEval(log, id, evaluation) {
  const entry = log.issued.find((item) => item.id === id);
  if (!entry) return;
  const next = manifestEvalFromResult(evaluation);
  if (next) entry.eval = next;
}
function positionsManifest(log, referencedIds) {
  const wanted = referencedIds instanceof Set ? referencedIds : new Set(referencedIds ?? []);
  const positions = {};
  for (const entry of log.issued ?? []) {
    if (wanted.size && !wanted.has(entry.id)) continue;
    positions[entry.id] = {
      from: entry.from,
      moves: Array.isArray(entry.moves) ? entry.moves : []
    };
    if (entry.eval) positions[entry.id].eval = entry.eval;
  }
  return positions;
}
function referencedPositionIds2(analysis) {
  const ids = /* @__PURE__ */ new Set();
  if (!analysis || typeof analysis !== "object") return ids;
  for (const listed of analysis.sidePositions ?? []) {
    if (listed?.positionId) ids.add(listed.positionId);
  }
  const commentaries = analysis.commentaries ?? {};
  for (const key of COMMENTARY_KEYS) {
    const text = commentaries[key];
    if (typeof text !== "string") continue;
    for (const token of parseCommentaryReferences(text, `commentaries.${key}`).tokens) {
      if (token.id) ids.add(token.id);
    }
  }
  return ids;
}
function bumpToolCall(log, kind) {
  log.toolCalls = (log.toolCalls ?? 0) + 1;
  switch (kind) {
    case "position":
      log.positionCalls = (log.positionCalls ?? 0) + 1;
      break;
    case "eval":
      log.evalCalls = (log.evalCalls ?? 0) + 1;
      break;
    default: {
      const _exhaustive = kind;
      throw new Error(`Unknown tool call kind: ${_exhaustive}`);
    }
  }
  return log.toolCalls;
}
function shouldPostProgress(log) {
  const calls = log.toolCalls ?? 0;
  if (calls === 0 || calls % PROGRESS_EVERY !== 0) return false;
  return (log.lastProgressAt ?? 0) !== calls;
}

// agent-kit/commands.mjs
function jsonError(message) {
  return { ok: false, error: message };
}
async function postProgressBestEffort(state, fetchFn) {
  if (!shouldPostProgress(state.log)) return;
  const url = `${state.session.apiUrl.replace(/\/+$/, "")}/s/${state.session.code}/progress`;
  try {
    await allowedFetch(url, {
      apiUrl: state.session.apiUrl,
      pageUrl: state.session.pageUrl,
      lang: state.session.lang,
      fetchFn,
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        positions: state.log.positionCalls ?? 0,
        evals: state.log.evalCalls ?? 0
      })
    });
    state.log.lastProgressAt = state.log.toolCalls;
    await saveLog(state.cwd, state.session.code, state.log, state.session.lang);
  } catch {
  }
}
async function requireState(ctx) {
  const state = await loadSessionState(ctx.cwd, ctx.flags.code);
  if (!state) {
    const lang = normalizeLang(ctx.lang);
    throw Object.assign(new Error(msg(lang, "session_missing")), { json: true, lang });
  }
  state.cwd = ctx.cwd;
  return state;
}
function toolsFor(state, evaluate) {
  const tools = createChessTools({ pgn: state.session.pgn, evaluate });
  hydrateStore(tools.store, state.log);
  return tools;
}
function evaluatorFor(state) {
  return makeEvaluator(state.session.engine);
}
async function cmdStart(ctx) {
  const langGuess = normalizeLang(ctx.lang);
  const target = parseStartTarget(ctx.positional[0]);
  if (!target.code) {
    return { text: msg(langGuess, "missing_code"), exitCode: 1 };
  }
  const apiUrl = (ctx.flags.api || target.apiUrl || "").replace(/\/+$/, "");
  if (!apiUrl) {
    return { text: msg(langGuess, "missing_api"), exitCode: 1 };
  }
  const pageUrl = (ctx.flags.page || DEFAULT_PAGE_URL).replace(/\/+$/, "");
  const fetchFn = ctx.fetch;
  const sessionUrl = `${apiUrl}/s/${encodeURIComponent(target.code)}?format=json`;
  let res;
  try {
    res = await allowedFetch(sessionUrl, {
      apiUrl,
      pageUrl,
      lang: langGuess,
      fetchFn
    });
  } catch (err) {
    return {
      text: err instanceof Error ? err.message : msg(langGuess, "start_fetch_failed", {}),
      exitCode: 1
    };
  }
  if (!res.ok) {
    return {
      text: msg(langGuess, "start_fetch_failed", { status: res.status }),
      exitCode: 1
    };
  }
  let payload;
  try {
    payload = await res.json();
  } catch {
    return { text: msg(langGuess, "start_bad_json"), exitCode: 1 };
  }
  const fields = extractSessionFields(payload, {
    code: target.code,
    apiUrl,
    pageUrl,
    lang: langGuess
  });
  const lang = normalizeLang(fields.lang);
  if (!fields.pgn) {
    return { text: msg(lang, "start_missing_pgn"), exitCode: 1 };
  }
  let picked;
  try {
    picked = await pickEngine({
      stockfishFlag: ctx.flags.stockfish,
      env: ctx.env,
      chessTutorDir: chessTutorDir(ctx.cwd),
      pageUrl: fields.pageUrl || pageUrl,
      fetchFn: (url, opts) => allowedFetch(url, { apiUrl, pageUrl, lang, fetchFn, ...opts }),
      lang
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return { text: detail, exitCode: 1 };
  }
  let meta;
  try {
    meta = await describeEngine(picked, lang);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    if (picked.kind === "lite") {
      return {
        text: `${msg(lang, "engine_lite_failed", { detail })}
${msg(lang, "engine_install_hint")}`,
        exitCode: 1
      };
    }
    throw err;
  }
  const session = {
    code: fields.code || target.code,
    lang,
    pgn: fields.pgn,
    expiresAt: fields.expiresAt || "",
    apiUrl,
    pageUrl: fields.pageUrl || pageUrl,
    engine: {
      name: meta.name,
      kind: picked.kind,
      maxDepth: meta.maxDepth,
      path: picked.path,
      jsPath: picked.jsPath
    },
    helper: HELPER_NAME,
    startedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  const dir = await saveSession(ctx.cwd, session);
  await saveLog(ctx.cwd, session.code, emptyLog(), lang);
  const plies = gamePlies(session.pgn);
  return {
    text: formatStartSummary(lang, {
      version: HELPER_VERSION,
      code: session.code,
      lang: session.lang,
      engineName: session.engine.name,
      engineKind: session.engine.kind,
      expiresAt: session.expiresAt,
      plyCount: Math.max(0, plies.length - 1),
      dir
    }),
    exitCode: 0
  };
}
async function cmdGame(ctx) {
  const state = await requireState(ctx);
  return { json: gamePlies(state.session.pgn), exitCode: 0 };
}
async function cmdPosition(ctx) {
  const state = await requireState(ctx);
  const lang = state.session.lang;
  const depth = clampDepth(ctx.flags.depth, DEFAULT_POSITION_DEPTH);
  if (depth == null) return { json: jsonError(msg(lang, "bad_depth")), exitCode: 1 };
  const args = {};
  if (ctx.flags.ply != null) args.ply = ctx.flags.ply;
  if (ctx.flags.fen != null) args.fen = ctx.flags.fen;
  if (ctx.flags.start) args.fen = "startpos";
  if (ctx.flags.moves != null) args.moves = ctx.flags.moves;
  args.depth = depth;
  const evaluate = evaluatorFor(state);
  const tools = toolsFor(state, evaluate);
  try {
    const result = await tools.position(args);
    recordIssued(state.log, {
      id: result.position_id,
      fen: result.fen,
      board: result.board,
      args,
      evaluation: result.eval
    });
    bumpToolCall(state.log, "position");
    await saveLog(state.cwd, state.session.code, state.log, lang);
    await postProgressBestEffort(state, ctx.fetch);
    return { json: result, exitCode: 0 };
  } catch (err) {
    const message = err instanceof PositionToolError || err instanceof Error ? err.message : String(err);
    return { json: jsonError(message), exitCode: 1 };
  }
}
async function cmdEval(ctx) {
  const state = await requireState(ctx);
  const lang = state.session.lang;
  const positionId = ctx.positional[0];
  if (!positionId) {
    return { json: jsonError(msg(lang, "missing_position_id")), exitCode: 1 };
  }
  const depth = clampDepth(ctx.flags.depth, DEFAULT_EVAL_DEPTH);
  if (depth == null) return { json: jsonError(msg(lang, "bad_depth")), exitCode: 1 };
  const evaluate = evaluatorFor(state);
  const tools = toolsFor(state, evaluate);
  try {
    const result = await tools.stockfishEval({
      position_id: positionId,
      fen: ctx.flags.fen,
      depth
    });
    updateIssuedEval(state.log, result.position_id, result);
    bumpToolCall(state.log, "eval");
    await saveLog(state.cwd, state.session.code, state.log, lang);
    await postProgressBestEffort(state, ctx.fetch);
    return { json: result, exitCode: 0 };
  } catch (err) {
    const message = err instanceof PositionToolError || err instanceof Error ? err.message : String(err);
    return { json: jsonError(message), exitCode: 1 };
  }
}
function readSubmissionFile(file, lang) {
  return readFile3(file, "utf8").catch(() => {
    throw Object.assign(new Error(msg(lang, "missing_file", { path: file })), { json: true, lang });
  });
}
async function cmdCheck(ctx) {
  const state = await loadSessionState(ctx.cwd, ctx.flags.code);
  const lang = state?.session?.lang ?? ctx.lang;
  const file = ctx.positional[0];
  if (!file) {
    return {
      json: { ok: false, errors: [{ message: msg(lang, "missing_file", { path: "" }) }] },
      exitCode: 1
    };
  }
  const raw = await readSubmissionFile(path3.resolve(ctx.cwd, file), lang);
  const pgn = state?.session?.pgn ?? "";
  const result = validateSubmissionV1(raw, pgn);
  const payload = {
    ok: result.ok,
    errors: result.errors,
    warnings: result.warnings,
    message: result.ok ? msg(lang, "check_ok", { warnings: result.warnings.length || 0 }) : msg(lang, "check_failed", { count: result.errors.length })
  };
  return { json: payload, exitCode: result.ok ? 0 : 1 };
}
async function cmdSubmit(ctx) {
  const state = await requireState(ctx);
  const lang = state.session.lang;
  const file = ctx.positional[0];
  if (!file) {
    return { json: jsonError(msg(lang, "missing_file", { path: "" })), exitCode: 1 };
  }
  if (!ctx.flags.model || !String(ctx.flags.model).trim()) {
    return { json: jsonError(msg(lang, "missing_model")), exitCode: 1 };
  }
  const raw = await readSubmissionFile(path3.resolve(ctx.cwd, file), lang);
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    const result = validateSubmissionV1(raw, state.session.pgn);
    return {
      json: {
        ok: false,
        errors: result.errors,
        warnings: result.warnings,
        message: msg(lang, "check_failed", { count: result.errors.length })
      },
      exitCode: 1
    };
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    const result = validateSubmissionV1(raw, state.session.pgn);
    return {
      json: {
        ok: false,
        errors: result.errors,
        message: msg(lang, "check_failed", { count: result.errors.length })
      },
      exitCode: 1
    };
  }
  const analysis = body.analysis ?? {};
  const referenced = referencedPositionIds2(analysis);
  const positions = positionsManifest(state.log, referenced);
  const engine = state.session.engine ?? {};
  const submission = {
    ...body,
    format: body.format || FORMAT_V1,
    session: state.session.code,
    lang: body.lang === "en" || body.lang === "es" ? body.lang : state.session.lang,
    agent: {
      ...body.agent && typeof body.agent === "object" ? body.agent : {},
      model: String(ctx.flags.model).trim(),
      effort: ctx.flags.effort != null ? String(ctx.flags.effort) : body.agent?.effort,
      tool: ctx.flags.tool != null ? String(ctx.flags.tool) : body.agent?.tool,
      helper: HELPER_NAME,
      engine: {
        name: engine.name ?? "",
        kind: engine.kind === "lite" ? "lite" : "native",
        maxDepth: engine.maxDepth
      }
    },
    positions,
    analysis
  };
  try {
    const enginePass = await analysePgnWithEngine(state.session.pgn, state.session.engine);
    if (enginePass) submission.engineAnalysis = enginePass;
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return { json: jsonError(msg(lang, "game_analysis_failed", { detail })), exitCode: 1 };
  }
  const checked = validateSubmissionV1(submission, state.session.pgn);
  if (!checked.ok) {
    return {
      json: {
        ok: false,
        errors: checked.errors,
        warnings: checked.warnings,
        message: msg(lang, "check_failed", { count: checked.errors.length })
      },
      exitCode: 1
    };
  }
  const url = `${state.session.apiUrl.replace(/\/+$/, "")}/s/${state.session.code}/drafts`;
  let res;
  try {
    res = await allowedFetch(url, {
      apiUrl: state.session.apiUrl,
      pageUrl: state.session.pageUrl,
      lang,
      fetchFn: ctx.fetch,
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(submission)
    });
  } catch (err) {
    return {
      json: jsonError(err instanceof Error ? err.message : msg(lang, "submit_http_failed", {})),
      exitCode: 1
    };
  }
  let responseBody = null;
  const text = await res.text();
  try {
    responseBody = text ? JSON.parse(text) : null;
  } catch {
    responseBody = { raw: text };
  }
  if (!res.ok) {
    return {
      json: {
        ok: false,
        status: res.status,
        response: responseBody,
        message: msg(lang, "submit_http_failed", {
          status: res.status,
          detail: typeof responseBody?.error === "string" ? responseBody.error : text.slice(0, 200)
        })
      },
      exitCode: 1
    };
  }
  return {
    json: {
      ok: true,
      status: res.status,
      warnings: checked.warnings,
      response: responseBody
    },
    exitCode: 0
  };
}
async function dispatch(ctx) {
  switch (ctx.command) {
    case "start":
      return cmdStart(ctx);
    case "game":
      return cmdGame(ctx);
    case "position":
      return cmdPosition(ctx);
    case "eval":
      return cmdEval(ctx);
    case "check":
      return cmdCheck(ctx);
    case "submit":
      return cmdSubmit(ctx);
    default: {
      const lang = normalizeLang(ctx.lang);
      if (!ctx.command) {
        return { text: `${msg(lang, "usage")}`, exitCode: 1 };
      }
      return {
        json: jsonError(msg(lang, "unknown_command", { command: ctx.command })),
        exitCode: 1
      };
    }
  }
}

// agent-kit/chess-tools.src.mjs
function write(stream, text) {
  stream.write(text.endsWith("\n") ? text : `${text}
`);
}
async function main(argv = process.argv.slice(2), options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const env = options.env ?? process.env;
  const fetchFn = options.fetch ?? globalThis.fetch.bind(globalThis);
  const stdout = options.stdout ?? process.stdout;
  const parsed = parseArgs(argv);
  const lang = parsed.flags.lang === "en" ? "en" : "es";
  const ctx = {
    command: parsed.command,
    positional: parsed.positional,
    flags: parsed.flags,
    cwd,
    env,
    fetch: fetchFn,
    lang: normalizeLang(lang)
  };
  try {
    const result = await dispatch(ctx);
    if (result.text != null) write(stdout, result.text);
    else write(stdout, JSON.stringify(result.json, null, 2));
    return result.exitCode ?? 0;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (ctx.command === "start") write(stdout, message);
    else write(stdout, JSON.stringify({ error: message }, null, 2));
    return 1;
  }
}
var isMain = process.argv[1] && path4.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const code = await main(process.argv.slice(2));
  process.exit(code);
}
export {
  HELPER_NAME,
  HELPER_VERSION,
  cmdCheck,
  cmdEval,
  cmdGame,
  cmdPosition,
  cmdStart,
  cmdSubmit,
  dispatch,
  evaluateFenWithProcess,
  extractSessionFields,
  findOnPath,
  gamePlies,
  main,
  makeEvaluator,
  parseArgs,
  parseStartTarget,
  parseUciEval,
  pickEngine,
  referencedPositionIds2 as referencedPositionIds
};
