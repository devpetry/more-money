import { test } from "node:test";
import assert from "node:assert/strict";
import {
  cicloDaCompra,
  cicloDeParametro,
  dataNoMes,
  dataValida,
  fechamentoPadrao,
  paraCentavos,
  somarMeses,
  statusFatura,
  validarAjuste,
  vencimentoPadrao,
} from "../src/lib/faturas.ts";

const padrao = (dia) => (ciclo) => fechamentoPadrao(ciclo, dia);

test("compra no dia do fechamento pertence ao próximo ciclo", () => {
  const f = padrao(10);
  assert.equal(cicloDaCompra("2025-03-09", f), "2025-03-01");
  assert.equal(cicloDaCompra("2025-03-10", f), "2025-04-01");
  assert.equal(cicloDaCompra("2025-03-11", f), "2025-04-01");
  assert.equal(cicloDaCompra("2025-03-01", f), "2025-03-01");
});

test("virada de ano", () => {
  const f = padrao(10);
  assert.equal(cicloDaCompra("2025-12-10", f), "2026-01-01");
  assert.equal(cicloDaCompra("2025-12-31", f), "2026-01-01");
  assert.equal(cicloDaCompra("2026-01-05", f), "2026-01-01");
  assert.equal(somarMeses("2025-12-01", 1), "2026-01-01");
  assert.equal(somarMeses("2026-01-01", -1), "2025-12-01");
});

test("meses curtos: dia 31 vira o último dia do mês", () => {
  assert.equal(dataNoMes("2025-02-01", 31), "2025-02-28");
  assert.equal(dataNoMes("2024-02-01", 31), "2024-02-29");
  assert.equal(dataNoMes("2025-04-01", 31), "2025-04-30");
  const f = padrao(31);
  assert.equal(cicloDaCompra("2025-02-27", f), "2025-02-01");
  assert.equal(cicloDaCompra("2025-02-28", f), "2025-03-01");
  assert.equal(cicloDaCompra("2025-03-30", f), "2025-03-01");
  assert.equal(cicloDaCompra("2025-03-31", f), "2025-04-01");
});

test("vencimento: mesmo mês se o dia é posterior ao fechamento, senão o seguinte", () => {
  assert.equal(vencimentoPadrao("2025-03-01", 10, 20), "2025-03-20");
  assert.equal(vencimentoPadrao("2025-03-01", 25, 5), "2025-04-05");
  assert.equal(vencimentoPadrao("2025-12-01", 25, 5), "2026-01-05");
  assert.equal(vencimentoPadrao("2025-01-01", 20, 31), "2025-01-31");
  assert.equal(vencimentoPadrao("2025-02-01", 10, 31), "2025-02-28");
  // primeiro vencimento posterior ao fechamento: se o dia limitado coincide
  // com o fechamento, vai para o mês seguinte
  assert.equal(vencimentoPadrao("2025-02-01", 30, 31), "2025-03-31");
  assert.equal(vencimentoPadrao("2025-01-01", 31, 31), "2025-02-28");
  assert.equal(vencimentoPadrao("2025-01-01", 15, 15), "2025-02-15");
});

test("fechamento ajustado altera a fronteira das próximas compras", () => {
  const ajustado = (ciclo) =>
    ciclo === "2025-03-01" ? "2025-03-12" : fechamentoPadrao(ciclo, 10);
  assert.equal(cicloDaCompra("2025-03-11", ajustado), "2025-03-01");
  assert.equal(cicloDaCompra("2025-03-12", ajustado), "2025-04-01");
  // fatura do mês anterior ajustada para depois do início do mês seguinte
  const adiado = (ciclo) =>
    ciclo === "2025-02-01" ? "2025-03-03" : fechamentoPadrao(ciclo, 10);
  assert.equal(cicloDaCompra("2025-03-02", adiado), "2025-02-01");
});

test("estados derivados da fatura", () => {
  const s = (fechada, total, pago, fechadaPorData = fechada) =>
    statusFatura({ fechada, fechadaPorData, totalCentavos: total, pagoCentavos: pago });
  assert.equal(s(false, 1000, 0), "aberta");
  assert.equal(s(false, 0, 0), "aberta");
  assert.equal(s(true, 1000, 0), "pendente");
  assert.equal(s(true, 1000, 400), "parcial");
  assert.equal(s(true, 1000, 1000), "paga");
  assert.equal(s(true, 0, 0), "paga"); // fatura zerada na data de fechamento: paga sem pagamento
});

test("LOW-B: fatura zerada fechada manualmente só é paga a partir da data de fechamento", () => {
  const s = (fechada, fechadaPorData, total = 0, pago = 0) =>
    statusFatura({ fechada, fechadaPorData, totalCentavos: total, pagoCentavos: pago });
  assert.equal(s(true, false), "pendente"); // fechada manualmente, data ainda não chegou
  assert.equal(s(true, true), "paga"); // data alcançada
  assert.equal(s(false, false), "aberta");
  // com valor, a data não muda a regra
  assert.equal(s(true, false, 1000, 1000), "paga");
  assert.equal(s(true, false, 1000, 0), "pendente");
});

test("LOW-A: centavos exatos, arredondando meio-para-longe-do-zero como o PostgreSQL", () => {
  const casos = [
    ["1.005", 101], [1.005, 101], ["2.675", 268], [2.675, 268], ["0.125", 13],
    ["10.005", 1001], ["10.004", 1000], ["10.006", 1001], ["0.994", 99], ["0.995", 100],
    ["-0.125", -13], ["-1.005", -101], ["10", 1000], ["10.1", 1010], [".5", 50], ["5.", 500],
    [0.1 + 0.2, 30], [19.99, 1999], [1e-7, 0], ["0", 0], [0, 0], [null, 0],
  ];
  for (const [entrada, esperado] of casos) {
    assert.equal(paraCentavos(entrada), esperado, `paraCentavos(${JSON.stringify(entrada)})`);
  }
  for (const invalido of ["abc", "1e3", "", "  ", "1,5", "10abc", NaN, Infinity]) {
    assert.ok(Number.isNaN(paraCentavos(invalido)), `inválido: ${String(invalido)}`);
  }
});


test("validação de datas e ciclos", () => {
  assert.ok(dataValida("2024-02-29"));
  assert.ok(!dataValida("2025-02-29"));
  assert.ok(!dataValida("2025-13-01"));
  assert.ok(!dataValida("25-01-01"));
  assert.ok(!dataValida(null));
  assert.equal(cicloDeParametro("2025-03"), "2025-03-01");
  assert.equal(cicloDeParametro("2025-13"), null);
  assert.equal(cicloDeParametro("2025-03-01"), null);
});

test("LOW: ajuste fora do intervalo informa as datas-limite no padrão dd/mm/aaaa", () => {
  const base = { fechamentoAnterior: "2025-02-10", fechamentoProximo: "2025-04-10", vencimento: "2025-05-01" };
  const msg = "O fechamento deve ficar depois do fechamento da fatura anterior (10/02/2025) e antes do fechamento da fatura seguinte (10/04/2025).";
  assert.equal(validarAjuste({ ...base, fechamento: "2025-02-10" }), msg); // igual ao anterior
  assert.equal(validarAjuste({ ...base, fechamento: "2025-01-31" }), msg); // antes
  assert.equal(validarAjuste({ ...base, fechamento: "2025-04-10" }), msg); // igual ao seguinte
  assert.equal(validarAjuste({ ...base, fechamento: "2025-04-11" }), msg); // depois
  // a ordem entre os ciclos continua exigida; as bordas livres seguem aceitas
  assert.equal(validarAjuste({ ...base, fechamento: "2025-02-11" }), null);
  assert.equal(validarAjuste({ ...base, fechamento: "2025-04-09" }), null);
});

test("ajuste de datas da fatura", () => {
  const base = { fechamentoAnterior: "2025-02-10", fechamentoProximo: "2025-04-10" };
  const ok = validarAjuste({ ...base, fechamento: "2025-03-12", vencimento: "2025-03-22" });
  assert.equal(ok, null);
  assert.match(validarAjuste({ ...base, fechamento: "2025-02-10", vencimento: "2025-03-22" }), /depois do fechamento/);
  assert.match(validarAjuste({ ...base, fechamento: "2025-04-10", vencimento: "2025-04-20" }), /antes do/);
  assert.match(validarAjuste({ ...base, fechamento: "2025-03-12", vencimento: "2025-03-11" }), /vencimento/);
  assert.match(validarAjuste({ ...base, fechamento: "x", vencimento: "2025-03-11" }), /válidas/);
});

test("regressão MEDIUM-2: fechamento antecipado nunca devolve fatura já fechada", () => {
  const f = (c) => (c === "2025-03-01" ? "2025-02-20" : fechamentoPadrao(c, 10));
  assert.equal(cicloDaCompra("2025-02-19", f), "2025-03-01");
  assert.equal(cicloDaCompra("2025-02-20", f), "2025-04-01");
  assert.equal(cicloDaCompra("2025-02-25", f), "2025-04-01"); // antes caía em 2025-03 (fechada em 02-20)
});

test("limites de mês/ano com fechamentos ajustados", () => {
  const f = (c) => (c === "2026-01-01" ? "2025-12-28" : fechamentoPadrao(c, 10));
  assert.equal(cicloDaCompra("2025-12-09", f), "2025-12-01");
  assert.equal(cicloDaCompra("2025-12-10", f), "2026-01-01");
  assert.equal(cicloDaCompra("2025-12-27", f), "2026-01-01");
  assert.equal(cicloDaCompra("2025-12-28", f), "2026-02-01");
  assert.equal(cicloDaCompra("2025-12-30", f), "2026-02-01");
  assert.equal(cicloDaCompra("2026-01-31", f), "2026-02-01");
});

test("sem ciclo coerente na janela devolve null, sem atribuição silenciosa", () => {
  assert.equal(cicloDaCompra("2025-06-15", () => "2020-01-01"), null);
  assert.equal(cicloDaCompra("2025-06-15", () => "2100-01-01"), null);
});
