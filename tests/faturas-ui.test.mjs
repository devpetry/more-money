import { test } from "node:test";
import assert from "node:assert/strict";
import {
  avisarFaturaFechadaNaoPaga,
  descreverStatusFatura,
  semValorAPagar,
} from "../src/lib/faturas-ui.ts";

const f = (status, total, fechada = status !== "aberta") => ({ status, total, fechada });

test("selo da fatura fechada, pendente e zerada: 'sem valor a pagar'", () => {
  const zerada = f("pendente", 0);
  assert.ok(semValorAPagar(zerada));
  assert.deepEqual(descreverStatusFatura(zerada), {
    rotulo: "Fechada · sem valor a pagar",
    variante: "neutral",
  });
});

test("demais estados mantêm os selos de sempre", () => {
  assert.equal(descreverStatusFatura(f("aberta", 0)).rotulo, "Aberta");
  assert.equal(descreverStatusFatura(f("aberta", 50)).rotulo, "Aberta");
  assert.equal(descreverStatusFatura(f("pendente", 100)).rotulo, "Fechada · pagamento pendente");
  assert.equal(descreverStatusFatura(f("parcial", 100)).rotulo, "Parcialmente paga");
  assert.equal(descreverStatusFatura(f("paga", 100)).rotulo, "Paga");
  // fechada de total zero na data de fechamento: paga
  assert.equal(descreverStatusFatura(f("paga", 0)).rotulo, "Paga");
});

test("alerta de fatura fechada e não paga: some para fatura zerada", () => {
  assert.equal(avisarFaturaFechadaNaoPaga(f("pendente", 100)), true);
  assert.equal(avisarFaturaFechadaNaoPaga(f("parcial", 100)), true);
  assert.equal(avisarFaturaFechadaNaoPaga(f("pendente", 0)), false, "zerada: nada pendente");
  assert.equal(avisarFaturaFechadaNaoPaga(f("paga", 100)), false);
  assert.equal(avisarFaturaFechadaNaoPaga(f("paga", 0)), false);
  assert.equal(avisarFaturaFechadaNaoPaga(f("aberta", 100)), false);
});
