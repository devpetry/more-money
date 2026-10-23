import { test } from "node:test";
import assert from "node:assert/strict";
import {
  dataNoPeriodo,
  descreverVisualizacao,
  trocarModo,
  visualizacaoPadrao,
} from "../src/lib/lancamentos-periodo.ts";

test("padrão é o mês atual", () => {
  assert.deepEqual(visualizacaoPadrao(new Date(2026, 9, 23)), {
    modo: "mes",
    mes: "2026-10",
  });
});

test("filtra por mês, ano e tudo", () => {
  const mes = { modo: "mes", mes: "2026-10" };
  assert.ok(dataNoPeriodo("2026-10-31", mes));
  assert.ok(!dataNoPeriodo("2026-11-01", mes));
  const ano = { modo: "ano", ano: 2025 };
  assert.ok(dataNoPeriodo("2025-01-01", ano));
  assert.ok(!dataNoPeriodo("2026-01-01", ano));
  assert.ok(dataNoPeriodo("1999-01-01", { modo: "tudo" }));
});

test("período é inclusivo e aceita limites abertos", () => {
  const p = { modo: "periodo", inicio: "2026-01-10", fim: "2026-01-20" };
  assert.ok(dataNoPeriodo("2026-01-10", p));
  assert.ok(dataNoPeriodo("2026-01-20", p));
  assert.ok(!dataNoPeriodo("2026-01-21", p));
  assert.ok(dataNoPeriodo("2030-01-01", { ...p, fim: "" }));
  assert.ok(!dataNoPeriodo("2026-01-09", { ...p, fim: "" }));
  assert.ok(dataNoPeriodo("2000-01-01", { modo: "periodo", inicio: "", fim: "" }));
});

test("descrições", () => {
  assert.equal(descreverVisualizacao({ modo: "mes", mes: "2026-10" }), "de Outubro de 2026");
  assert.equal(descreverVisualizacao({ modo: "ano", ano: 2026 }), "de 2026");
  assert.equal(descreverVisualizacao({ modo: "tudo" }), "de todo o período");
  assert.equal(
    descreverVisualizacao({ modo: "periodo", inicio: "2026-01-01", fim: "2026-03-31" }),
    "de 01/01/2026 a 31/03/2026"
  );
});

test("trocar de modo parte do contexto", () => {
  const hoje = new Date(2026, 9, 23);
  assert.deepEqual(trocarModo({ modo: "mes", mes: "2024-03" }, "ano", hoje), {
    modo: "ano",
    ano: 2024,
  });
  assert.deepEqual(trocarModo({ modo: "ano", ano: 2024 }, "periodo", hoje), {
    modo: "periodo",
    inicio: "2024-01-01",
    fim: "2024-12-31",
  });
  assert.deepEqual(trocarModo({ modo: "tudo" }, "mes", hoje), {
    modo: "mes",
    mes: "2026-10",
  });
});

test("intervalo da visualização", async () => {
  const { intervaloDaVisualizacao } = await import("../src/lib/lancamentos-periodo.ts");
  assert.deepEqual(intervaloDaVisualizacao({ modo: "mes", mes: "2024-02" }), {
    inicio: "2024-02-01",
    fim: "2024-02-29",
  });
  assert.deepEqual(intervaloDaVisualizacao({ modo: "ano", ano: 2026 }), {
    inicio: "2026-01-01",
    fim: "2026-12-31",
  });
  assert.deepEqual(intervaloDaVisualizacao({ modo: "tudo" }), { inicio: null, fim: null });
  assert.deepEqual(
    intervaloDaVisualizacao({ modo: "periodo", inicio: "", fim: "2026-03-31" }),
    { inicio: null, fim: "2026-03-31" }
  );
});
