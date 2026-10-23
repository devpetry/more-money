import { test } from "node:test";
import assert from "node:assert/strict";
import {
  AjusteDatasFaturaSchema,
  CartaoSchema,
  PagamentoFaturaSchema,
} from "../src/schemas/auth.ts";

const mensagens = (r) =>
  r.success ? {} : Object.fromEntries(r.error.issues.map((i) => [i.path[0], i.message]));
const cartao = (extra = {}) =>
  CartaoSchema.safeParse({ nome: "Visa", dia_fechamento: "10", dia_vencimento: "20", ...extra });

test("CartaoSchema aceita dados válidos e os limites 1 e 31", () => {
  assert.ok(cartao().success);
  assert.ok(cartao({ dia_fechamento: "1", dia_vencimento: "31" }).success);
  assert.equal(cartao({ nome: "  Visa  " }).data.nome, "Visa", "nome é aparado");
});

test("CartaoSchema: nome vazio ou só espaços", () => {
  assert.equal(mensagens(cartao({ nome: "" })).nome, "O nome é obrigatório.");
  assert.equal(mensagens(cartao({ nome: "   " })).nome, "O nome é obrigatório.");
});

test("CartaoSchema: dia vazio é obrigatório (uma única mensagem por campo)", () => {
  const r = cartao({ dia_fechamento: "", dia_vencimento: "" });
  assert.deepEqual(mensagens(r), {
    dia_fechamento: "O dia de fechamento é obrigatório.",
    dia_vencimento: "O dia de vencimento é obrigatório.",
  });
  assert.equal(r.error.issues.length, 2);
});

test("CartaoSchema: 0, 32, decimal, negativo e texto são recusados", () => {
  for (const v of ["0", "32", "1.5", "10,5", "-1", "abc", "1e1", "100"]) {
    const m = mensagens(cartao({ dia_fechamento: v }));
    assert.equal(m.dia_fechamento, "O dia de fechamento deve ser um número inteiro de 1 a 31.", `valor ${v}`);
  }
  assert.equal(
    mensagens(cartao({ dia_vencimento: "32" })).dia_vencimento,
    "O dia de vencimento deve ser um número inteiro de 1 a 31."
  );
});

test("PagamentoFaturaSchema: valor, data e carteira", () => {
  const ok = { valor: 10.5, data: "2099-01-01", carteira_id: "x" };
  assert.ok(PagamentoFaturaSchema.safeParse(ok).success);
  assert.equal(mensagens(PagamentoFaturaSchema.safeParse({ ...ok, valor: undefined })).valor, "O valor é obrigatório.");
  assert.equal(mensagens(PagamentoFaturaSchema.safeParse({ ...ok, valor: 0 })).valor, "O valor deve ser maior que zero.");
  assert.equal(mensagens(PagamentoFaturaSchema.safeParse({ ...ok, data: "" })).data, "A data efetiva do pagamento é obrigatória.");
  assert.equal(mensagens(PagamentoFaturaSchema.safeParse({ ...ok, carteira_id: "" })).carteira_id, "A carteira é obrigatória.");
});

test("AjusteDatasFaturaSchema: datas obrigatórias", () => {
  assert.ok(AjusteDatasFaturaSchema.safeParse({ data_fechamento: "2099-01-01", data_vencimento: "2099-01-10" }).success);
  assert.deepEqual(mensagens(AjusteDatasFaturaSchema.safeParse({ data_fechamento: "", data_vencimento: "" })), {
    data_fechamento: "A data de fechamento é obrigatória.",
    data_vencimento: "A data de vencimento é obrigatória.",
  });
});
