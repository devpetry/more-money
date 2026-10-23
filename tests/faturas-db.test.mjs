// Integração com Postgres real. Só roda com TEST_DATABASE_URL apontando para
// um banco DESCARTÁVEL (o nome precisa conter "test"): o schema public é recriado.
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import pg from "pg";
import {
  ErroNegocio,
  ajustarDatasFatura,
  atualizarLancamento,
  criarLancamento,
  detalharFatura,
  estornarPagamento,
  excluirLancamento,
  fecharFatura,
  registrarPagamento,
} from "../src/lib/faturas.ts";
import { consultarDashboard } from "../src/lib/dashboard.ts";
import { paraCentavos } from "../src/lib/faturas.ts";

const URL = process.env.TEST_DATABASE_URL;

describe("faturas (Postgres)", { skip: !URL && "TEST_DATABASE_URL não definida" }, () => {
  let pool;
  let seq = 0;

  const tx = async (fn) => {
    const c = await pool.connect();
    try {
      await c.query("BEGIN");
      const r = await fn(c);
      await c.query("COMMIT");
      return r;
    } catch (e) {
      await c.query("ROLLBACK");
      throw e;
    } finally {
      c.release();
    }
  };

  before(async () => {
    pool = new pg.Pool({ connectionString: URL, max: 8 });
    const { rows } = await pool.query("SELECT current_database() AS db");
    assert.match(rows[0].db, /test/i, "recusando resetar um banco que não parece de teste");
    await pool.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
    const dir = join(import.meta.dirname, "..", "db", "migrations");
    for (const f of (await readdir(dir)).filter((n) => n.endsWith(".sql")).sort()) {
      await pool.query(await readFile(join(dir, f), "utf8"));
    }
  });

  after(async () => {
    await pool?.end();
  });

  async function novoUsuario() {
    const n = ++seq;
    const u = (
      await pool.query(
        `INSERT INTO usuarios (nome, email, tipo_usuario) VALUES ($1, $2, 'PADRAO') RETURNING id`,
        [`U${n}`, `u${n}@teste.com`]
      )
    ).rows[0].id;
    const carteiras = {};
    for (const nome of ["Física", "Digital"]) {
      carteiras[nome] = (
        await pool.query(`INSERT INTO carteiras (usuario_id, nome) VALUES ($1, $2) RETURNING id`, [u, nome])
      ).rows[0].id;
    }
    const cat = async (nome, tipo = "despesa") =>
      (await pool.query(`INSERT INTO categorias (nome, tipo, usuario_id) VALUES ($1,$2,$3) RETURNING id`, [nome, tipo, u])).rows[0].id;
    const cartao = async (fech = 10, venc = 20) =>
      (await pool.query(`INSERT INTO cartoes (nome, usuario_id, dia_fechamento, dia_vencimento) VALUES ($1,$2,$3,$4) RETURNING id`, [`C${++seq}`, u, fech, venc])).rows[0].id;
    return { u, carteiras, cat, cartao };
  }

  const compra = (u, cartaoId, data, valor, categoriaId = null, extra = {}) =>
    tx((db) =>
      criarLancamento(db, u, {
        descricao: "compra",
        valor,
        tipo: "despesa",
        data,
        categoriaId,
        carteiraId: null,
        cartaoId,
        ...extra,
      })
    );

  const fatura = async (u, cartaoId, ciclo) =>
    (await detalharFatura(pool, u, cartaoId, ciclo)).fatura;

  const pagar = (u, cartaoId, ciclo, valor, carteiraId, data = "2099-02-15") =>
    tx((db) => registrarPagamento(db, u, cartaoId, ciclo, { valor, data, carteiraId }));

  const rejeitaCom = async (promessa, regex, status) => {
    await assert.rejects(promessa, (e) => {
      assert.ok(e instanceof ErroNegocio, `esperava ErroNegocio, veio ${e}`);
      assert.match(e.message, regex);
      if (status) assert.equal(e.status, status);
      return true;
    });
  };

  test("compra é atribuída à fatura pelo fechamento (dia do fechamento -> próxima)", async () => {
    const { u, cartao } = await novoUsuario();
    const c = await cartao(10, 20);
    const a = await compra(u, c, "2099-03-09", 10);
    const b = await compra(u, c, "2099-03-10", 20);
    assert.equal((await fatura(u, c, "2099-03-01")).total, 10);
    assert.equal((await fatura(u, c, "2099-04-01")).total, 20);
    assert.equal(a.lancamento.carteira_id, null);
    assert.ok(b.lancamento.fatura_id);
  });

  test("trigger da carteira padrão e constraints", async () => {
    const { u, carteiras, cartao } = await novoUsuario();
    const c = await cartao();
    // sem carteira e sem fatura: continua indo para a Digital
    const r = await pool.query(
      `INSERT INTO lancamentos (descricao, valor, tipo, data, usuario_id) VALUES ('x', 1, 'despesa', '2099-01-01', $1) RETURNING carteira_id`,
      [u]
    );
    assert.equal(r.rows[0].carteira_id, carteiras["Digital"]);
    // compra de cartão fica sem carteira
    const l = await compra(u, c, "2099-05-01", 5);
    assert.equal(l.lancamento.carteira_id, null);
    // fatura + carteira, ou receita + fatura, violam a constraint
    const f = l.lancamento.fatura_id;
    await assert.rejects(
      pool.query(`INSERT INTO lancamentos (descricao, valor, tipo, data, usuario_id, fatura_id, carteira_id) VALUES ('x',1,'despesa','2099-05-01',$1,$2,$3)`, [u, f, carteiras["Física"]]),
      { code: "23514" }
    );
    await assert.rejects(
      pool.query(`INSERT INTO lancamentos (descricao, valor, tipo, data, usuario_id, fatura_id) VALUES ('x',1,'receita','2099-05-01',$1,$2)`, [u, f]),
      { code: "23514" }
    );
  });

  test("receita não pode ir para cartão; cartão e carteira juntos são rejeitados", async () => {
    const { u, carteiras, cartao } = await novoUsuario();
    const c = await cartao();
    await rejeitaCom(compra(u, c, "2099-05-01", 5, null, { tipo: "receita" }), /Receitas/);
    await rejeitaCom(compra(u, c, "2099-05-01", 5, null, { carteiraId: carteiras["Física"] }), /não os dois/);
  });

  test("compra no cartão não altera saldos; só o pagamento (data efetiva, carteira escolhida)", async () => {
    const { u, carteiras, cat, cartao } = await novoUsuario();
    const c = await cartao(10, 20);
    const alimentacao = await cat("Alimentação");
    const lazer = await cat("Lazer");
    await pool.query(
      `INSERT INTO lancamentos (descricao, valor, tipo, data, usuario_id, carteira_id) VALUES ('salario', 1000, 'receita', '2099-01-05', $1, $2)`,
      [u, carteiras["Digital"]]
    );
    await compra(u, c, "2099-02-01", 200, alimentacao);
    await compra(u, c, "2099-02-02", 100, lazer);

    const dash = () => consultarDashboard(pool, u, "2099-01-01", "2100-01-01", "2100-01-01");
    let d = await dash();
    assert.equal(d.saldo, 1000);
    assert.equal(d.totalDespesas, 0);
    assert.equal(d.despesasPorCategoria.length, 0);

    // sem limite explícito, o saldo só conta até hoje: a receita de 2099 ainda não entrou
    const padrao = await consultarDashboard(pool, u, "2099-01-01", "2100-01-01");
    assert.equal(padrao.totalReceitas, 1000);
    assert.equal(padrao.saldo, 0);

    // fatura aberta não aceita pagamento
    await rejeitaCom(pagar(u, c, "2099-02-01", 10, carteiras["Digital"]), /fechadas/, 409);

    // fecha sem pagar: continua sem afetar saldos
    const fechada = await tx((db) => fecharFatura(db, u, c, "2099-02-01"));
    assert.equal(fechada.status, "pendente");
    assert.equal((await dash()).saldo, 1000);
    await rejeitaCom(tx((db) => fecharFatura(db, u, c, "2099-02-01")), /já está fechada/, 409);

    // pagamento parcial na Física, em março
    let f = await pagar(u, c, "2099-02-01", 100, carteiras["Física"], "2099-03-15");
    assert.equal(f.status, "parcial");
    assert.equal(f.restante, 200);
    d = await consultarDashboard(pool, u, "2099-03-01", "2099-04-01", "2100-01-01");
    assert.equal(d.totalDespesas, 100);
    // saldo considera todo o histórico, não só o período filtrado
    assert.equal(d.saldo, 900);
    assert.deepEqual(
      d.carteiras.map((x) => [x.nome, x.saldo]),
      [["Digital", 1000], ["Física", -100]]
    );
    assert.deepEqual(d.evolucaoMensal.map((m) => [m.mes, Number(m.despesa)]), [["03/2099", 100]]);
    // proporcional às categorias da fatura: 100 * 200/300 e 100 * 100/300
    const cats = Object.fromEntries(d.despesasPorCategoria.map((x) => [x.categoria, Number(x.total)]));
    assert.ok(Math.abs(cats["Alimentação"] - 66.6667) < 0.001);
    assert.ok(Math.abs(cats["Lazer"] - 33.3333) < 0.001);
    // em fevereiro nada foi descontado ainda
    d = await consultarDashboard(pool, u, "2099-02-01", "2099-03-01", "2100-01-01");
    assert.equal(d.totalDespesas, 0);
    assert.equal(d.saldo, 900);

    // pagamento acima do pendente e carteira de outro usuário
    await rejeitaCom(pagar(u, c, "2099-02-01", 200.01, carteiras["Digital"]), /exceder/, 409);
    const outro = await novoUsuario();
    await rejeitaCom(pagar(u, c, "2099-02-01", 10, outro.carteiras["Digital"]), /Carteira inválida/);

    // quitação: paga e saldo total do ano reflete só o que foi pago
    f = await pagar(u, c, "2099-02-01", 200, carteiras["Digital"], "2099-03-20");
    assert.equal(f.status, "paga");
    d = await dash();
    assert.equal(d.totalDespesas, 300);
    assert.equal(d.saldo, 700);
    assert.equal(d.saldo, d.totalReceitas - d.totalDespesas);
    await rejeitaCom(pagar(u, c, "2099-02-01", 1, carteiras["Digital"]), /pendente/, 409);
  });

  test("estorno preserva o registro e devolve o valor à carteira", async () => {
    const { u, carteiras, cartao } = await novoUsuario();
    const c = await cartao();
    await compra(u, c, "2099-02-01", 100);
    await tx((db) => fecharFatura(db, u, c, "2099-02-01"));
    await pagar(u, c, "2099-02-01", 100, carteiras["Digital"], "2099-03-01");

    const det = await detalharFatura(pool, u, c, "2099-02-01");
    const [pagamento] = det.pagamentos;
    const f = await tx((db) => estornarPagamento(db, u, c, "2099-02-01", pagamento.id));
    assert.equal(f.status, "pendente");
    const depois = await detalharFatura(pool, u, c, "2099-02-01");
    assert.equal(depois.pagamentos.length, 1);
    assert.ok(depois.pagamentos[0].estornado_em);
    // o pagamento continua valendo em 2099; o estorno entra na data do estorno (hoje)
    const em2099 = await consultarDashboard(pool, u, "2099-01-01", "2100-01-01", "2100-01-01");
    assert.equal(em2099.totalDespesas, 100);
    assert.equal(em2099.saldo, 0); // pagamento (2099) e estorno (hoje): histórico inteiro
    const ano = (await pool.query(`SELECT to_char((now() AT TIME ZONE 'America/Sao_Paulo')::date, 'YYYY') AS a`)).rows[0].a;
    const hoje = await consultarDashboard(pool, u, `${ano}-01-01`, `${Number(ano) + 1}-01-01`, "2100-01-01");
    assert.equal(hoje.totalDespesas, -100);
    assert.equal(hoje.saldo, 0);
    assert.equal(hoje.carteiras.find((x) => x.nome === "Digital").saldo, 0);
    await rejeitaCom(tx((db) => estornarPagamento(db, u, c, "2099-02-01", pagamento.id)), /já estornado/, 404);
  });

  test("pagamentos concorrentes não ultrapassam o valor da fatura", async () => {
    const { u, carteiras, cartao } = await novoUsuario();
    const c = await cartao();
    await compra(u, c, "2099-02-01", 100);
    await tx((db) => fecharFatura(db, u, c, "2099-02-01"));
    const pagamento = (db) =>
      registrarPagamento(db, u, c, "2099-02-01", {
        valor: 100, data: "2099-02-15", carteiraId: carteiras["Digital"],
      });

    // A paga e mantém a transação aberta; B tenta pagar o mesmo valor
    const a = await pool.connect();
    const b = await pool.connect();
    try {
      await a.query("BEGIN");
      await pagamento(a);
      await b.query("BEGIN");
      let bTerminou = false;
      const pb = pagamento(b).then(
        () => ((bTerminou = true), null),
        (e) => ((bTerminou = true), e)
      );
      await new Promise((r) => setTimeout(r, 300));
      assert.equal(bTerminou, false, "B deveria esperar o lock do cartão enquanto A não conclui");
      await a.query("COMMIT");
      const erroB = await pb;
      assert.ok(erroB instanceof ErroNegocio, "B deveria ser recusado após o commit de A");
      assert.match(erroB.message, /pendente/);
      await b.query("ROLLBACK");
    } finally {
      a.release();
      b.release();
    }
    const f = await fatura(u, c, "2099-02-01");
    assert.equal(f.pago, 100);
    assert.equal(f.status, "paga");

    // rajada de pagamentos simultâneos: no máximo o valor da fatura
    await compra(u, c, "2099-03-01", 100);
    await tx((db) => fecharFatura(db, u, c, "2099-03-01"));
    const rajada = await Promise.allSettled(
      Array.from({ length: 4 }, () =>
        tx((db) =>
          registrarPagamento(db, u, c, "2099-03-01", {
            valor: 100, data: "2099-03-15", carteiraId: carteiras["Digital"],
          })
        )
      )
    );
    assert.equal(rajada.filter((r) => r.status === "fulfilled").length, 1);
    assert.equal((await fatura(u, c, "2099-03-01")).pago, 100);
  });

  test("edições retroativas: fatura paga bloqueia; aberta/fechada recalcula; pago nunca supera o total", async () => {
    const { u, carteiras, cartao } = await novoUsuario();
    const c = await cartao();
    const l1 = (await compra(u, c, "2099-02-01", 100)).lancamento;
    const l2 = (await compra(u, c, "2099-02-02", 50)).lancamento;
    const editar = (id, valor, data = "2099-02-01", extra = {}) =>
      tx((db) =>
        atualizarLancamento(db, u, id, {
          descricao: "ed", valor, tipo: "despesa", data,
          categoriaId: null, carteiraId: null, cartaoId: c, ...extra,
        })
      );

    // aberta: sem aviso
    assert.equal((await editar(l1.id, 120)).aviso, null);
    assert.equal((await fatura(u, c, "2099-02-01")).total, 170);

    // fechada e não paga: permitido, com aviso
    await tx((db) => fecharFatura(db, u, c, "2099-02-01"));
    const r = await editar(l1.id, 100);
    assert.match(r.aviso, /fechada/);
    const nova = await compra(u, c, "2099-02-03", 25);
    assert.match(nova.aviso, /fechada/);
    assert.equal((await fatura(u, c, "2099-02-01")).total, 175);

    // parcialmente paga (120): reduzir o total para 110 deixaria pago > total
    await pagar(u, c, "2099-02-01", 120, carteiras["Digital"]);
    await rejeitaCom(editar(l1.id, 35), /abaixo do total já pago/, 409);
    await rejeitaCom(tx((db) => excluirLancamento(db, u, l1.id)), /abaixo do total já pago/, 409);
    assert.equal((await fatura(u, c, "2099-02-01")).total, 175); // rollback completo
    // reduzir sem passar do pago é permitido; aumentar também
    await editar(l1.id, 60);
    assert.equal((await fatura(u, c, "2099-02-01")).total, 135);
    await editar(l1.id, 200);
    assert.equal((await fatura(u, c, "2099-02-01")).total, 275);

    // quitada: bloqueia inclusão, edição e exclusão
    await pagar(u, c, "2099-02-01", 155, carteiras["Digital"]);
    assert.equal((await fatura(u, c, "2099-02-01")).status, "paga");
    await rejeitaCom(compra(u, c, "2099-02-04", 1), /está paga/, 409);
    await rejeitaCom(editar(l2.id, 51), /está paga/, 409);
    // editar somente a descrição (valor, data, categoria e cartão iguais aos atuais) também é bloqueado
    await rejeitaCom(
      tx((db) =>
        atualizarLancamento(db, u, l2.id, {
          descricao: "só a descrição mudou", valor: 50, tipo: "despesa", data: "2099-02-02",
          categoriaId: null, carteiraId: null, cartaoId: c,
        })
      ),
      /está paga/, 409
    );
    // trocar a compra de cartão para carteira também é bloqueado (e não duplica o gasto no saldo)
    await rejeitaCom(
      tx((db) =>
        atualizarLancamento(db, u, l2.id, {
          descricao: "x", valor: 50, tipo: "despesa", data: "2099-02-02",
          categoriaId: null, carteiraId: carteiras["Digital"], cartaoId: null,
        })
      ),
      /está paga/, 409
    );
    const { rows: intacto } = await pool.query(
      `SELECT descricao, valor::text AS valor, carteira_id, fatura_id IS NOT NULL AS em_fatura FROM lancamentos WHERE id = $1`,
      [l2.id]
    );
    assert.deepEqual(intacto[0], { descricao: "compra", valor: "50.00", carteira_id: null, em_fatura: true });
    await rejeitaCom(tx((db) => excluirLancamento(db, u, l2.id)), /está paga/, 409);
    // mover para outra fatura também é edição de uma fatura paga
    await rejeitaCom(editar(l2.id, 50, "2099-04-20"), /está paga/, 409);
    await rejeitaCom(
      tx((db) => ajustarDatasFatura(db, u, c, "2099-02-01", { fechamento: "2099-02-11", vencimento: "2099-02-21" })),
      /Fatura paga/, 409
    );
    // estornar libera as alterações
    const det = await detalharFatura(pool, u, c, "2099-02-01");
    for (const p of det.pagamentos) await tx((db) => estornarPagamento(db, u, c, "2099-02-01", p.id));
    await editar(l2.id, 51);
  });

  test("alternar entre cartão e carteira", async () => {
    const { u, carteiras, cartao } = await novoUsuario();
    const c = await cartao();
    const l = (await compra(u, c, "2099-02-01", 40)).lancamento;
    const paraCarteira = await tx((db) =>
      atualizarLancamento(db, u, l.id, {
        descricao: "x", valor: 40, tipo: "despesa", data: "2099-02-01",
        categoriaId: null, carteiraId: carteiras["Física"], cartaoId: null,
      })
    );
    assert.equal(paraCarteira.lancamento.fatura_id, null);
    assert.equal((await fatura(u, c, "2099-02-01")).total, 0);
    const volta = await tx((db) =>
      atualizarLancamento(db, u, l.id, {
        descricao: "x", valor: 40, tipo: "despesa", data: "2099-02-01",
        categoriaId: null, carteiraId: null, cartaoId: c,
      })
    );
    assert.equal(volta.lancamento.carteira_id, null);
    assert.equal((await fatura(u, c, "2099-02-01")).total, 40);
  });

  test("HIGH-1: fatura zerada não fecha manualmente; compra esquecida reabre ciclo encerrado", async () => {
    const { u, carteiras, cartao } = await novoUsuario();
    const c = await cartao();
    await rejeitaCom(tx((db) => fecharFatura(db, u, c, "2099-05-01")), /sem lançamentos/, 409);
    const { rows } = await pool.query(`SELECT count(*)::int AS n FROM faturas WHERE cartao_id = $1`, [c]);
    assert.equal(rows[0].n, 0, "a tentativa recusada não deixa fatura criada");

    // ciclo encerrado automaticamente e zerado: paga, sem pagamento fictício
    const vazia = await detalharFatura(pool, u, c, "2020-01-01");
    assert.equal(vazia.fatura.status, "paga");
    assert.equal(vazia.fatura.id, null);
    assert.equal(vazia.pagamentos.length, 0);

    // compra esquecida: reabre o ciclo como fechado com pagamento pendente
    const r = await compra(u, c, "2020-01-05", 70);
    assert.match(r.aviso, /fechada/);
    let f = await fatura(u, c, "2020-01-01");
    assert.equal(f.status, "pendente");
    assert.equal(f.total, 70);
    assert.equal((await pagar(u, c, "2020-01-01", 30, carteiras["Física"], "2020-02-01")).status, "parcial");
    assert.equal((await pagar(u, c, "2020-01-01", 40, carteiras["Física"], "2020-02-02")).status, "paga");
    // depois de quitada com valor, volta a bloquear
    await rejeitaCom(compra(u, c, "2020-01-06", 1), /está paga/, 409);

    // fatura zerada fechada aceita ajuste de datas (nada pago a preservar)
    const ajustada = await tx((db) =>
      ajustarDatasFatura(db, u, c, "2020-02-01", { fechamento: "2020-02-12", vencimento: "2020-02-22" })
    );
    assert.equal(ajustada.status, "paga");
    assert.equal(ajustada.total, 0);
  });

  test("fechamento automático: ciclo encerrado com saldo pendente aparece fechado e aceita pagamento", async () => {
    const { u, carteiras, cartao } = await novoUsuario();
    const c = await cartao();
    // fatura criada em ciclo aberto e depois com data de fechamento ajustada para o passado
    await compra(u, c, "2099-07-01", 80);
    await pool.query(`UPDATE faturas SET data_fechamento = '2020-01-01', data_vencimento = '2020-01-10' WHERE cartao_id = $1`, [c]);
    const f = await fatura(u, c, "2099-07-01");
    assert.equal(f.fechada, true);
    assert.equal(f.status, "pendente");
    assert.equal((await pagar(u, c, "2099-07-01", 30, carteiras["Física"], "2020-02-01")).status, "parcial");
  });

  test("ajuste de datas da fatura respeita a ordem dos ciclos e muda a atribuição futura", async () => {
    const { u, cartao } = await novoUsuario();
    const c = await cartao(10, 20);
    await rejeitaCom(
      tx((db) => ajustarDatasFatura(db, u, c, "2099-03-01", { fechamento: "2099-02-05", vencimento: "2099-03-20" })),
      /depois do fechamento/
    );
    // a mensagem traz o intervalo permitido: 10/02/2099 (anterior) e 10/04/2099 (seguinte)
    await rejeitaCom(
      tx((db) => ajustarDatasFatura(db, u, c, "2099-03-01", { fechamento: "2099-04-10", vencimento: "2099-04-20" })),
      /\(10\/02\/2099\).*\(10\/04\/2099\)/
    );
    const f = await tx((db) =>
      ajustarDatasFatura(db, u, c, "2099-03-01", { fechamento: "2099-03-15", vencimento: "2099-03-25" })
    );
    assert.equal(f.data_fechamento, "2099-03-15");
    await compra(u, c, "2099-03-12", 10); // antes do novo fechamento
    assert.equal((await fatura(u, c, "2099-03-01")).total, 10);
  });

  test("isolamento por usuário e exclusão de cartão com histórico", async () => {
    const a = await novoUsuario();
    const b = await novoUsuario();
    const ca = await a.cartao();
    const sem = await a.cartao();
    await compra(a.u, ca, "2099-02-01", 10);

    await rejeitaCom(compra(b.u, ca, "2099-02-01", 10), /Cartão não encontrado/, 404);
    await rejeitaCom(tx((db) => fecharFatura(db, b.u, ca, "2099-02-01")), /Cartão não encontrado/, 404);
    await rejeitaCom(detalharFatura(pool, b.u, ca, "2099-02-01"), /Cartão não encontrado/, 404);

    await assert.rejects(pool.query(`DELETE FROM cartoes WHERE id = $1`, [ca]), { code: "23503" });
    const del = await pool.query(`DELETE FROM cartoes WHERE id = $1 RETURNING id`, [sem]);
    assert.equal(del.rows.length, 1);
  });

  test("MEDIUM-3: ajustar o fechamento para o futuro reabre; pagamento parcial é mantido e o restante pode ser pago", async () => {
    const { u, carteiras, cartao } = await novoUsuario();
    for (const via of ["manual", "automatico"]) {
      const c = await cartao();
      await compra(u, c, "2099-07-01", 100);
      if (via === "manual") {
        await tx((db) => fecharFatura(db, u, c, "2099-07-01"));
      } else {
        // simula fatura encerrada pela data
        await pool.query(`UPDATE faturas SET data_fechamento = '2020-01-01', data_vencimento = '2020-01-02' WHERE cartao_id = $1`, [c]);
      }
      await pagar(u, c, "2099-07-01", 40, carteiras["Digital"], "2099-07-02");

      const aberta = await tx((db) =>
        ajustarDatasFatura(db, u, c, "2099-07-01", { fechamento: "2099-07-12", vencimento: "2099-07-22" })
      );
      assert.equal(aberta.status, "aberta", via);
      assert.equal(aberta.pago, 40);
      await rejeitaCom(pagar(u, c, "2099-07-01", 10, carteiras["Digital"]), /fechadas/, 409);

      const fechada = await tx((db) => fecharFatura(db, u, c, "2099-07-01"));
      assert.equal(fechada.status, "parcial", via);
      assert.equal(fechada.restante, 60);
      assert.equal((await pagar(u, c, "2099-07-01", 60, carteiras["Digital"])).status, "paga", via);
    }
  });

  test("MEDIUM-4: editar campos não financeiros não move a compra; mudar a data recalcula e valida", async () => {
    const { u, carteiras, cartao } = await novoUsuario();
    const c = await cartao(10, 20);
    const l = (await compra(u, c, "2099-03-05", 10)).lancamento;
    // fechamento do ciclo 03 antecipado direto no banco (sem reassociar)
    await pool.query(`UPDATE faturas SET data_fechamento = '2099-03-04' WHERE cartao_id = $1`, [c]);
    const editar = (data, extra = {}) =>
      tx((db) =>
        atualizarLancamento(db, u, l.id, {
          descricao: "novo texto", valor: 10, tipo: "despesa", data,
          categoriaId: null, carteiraId: null, cartaoId: c, ...extra,
        })
      );
    await editar("2099-03-05");
    await editar("2099-03-05", { valor: 12 });
    assert.equal((await fatura(u, c, "2099-03-01")).total, 12, "continua na fatura original");
    assert.equal((await fatura(u, c, "2099-04-01")).total, 0);

    // fatura 04 quitada: mudar a data para ela é recusado antes de salvar
    await compra(u, c, "2099-03-20", 25);
    await tx((db) => fecharFatura(db, u, c, "2099-04-01"));
    await pagar(u, c, "2099-04-01", 25, carteiras["Digital"]);
    await rejeitaCom(editar("2099-03-30"), /pertence à fatura 04\/2099, que está paga/, 409);
    assert.equal((await fatura(u, c, "2099-03-01")).total, 12, "nada foi alterado");

    // data que leva a uma fatura em aberto: recalcula e move
    await editar("2099-03-03");
    assert.equal((await fatura(u, c, "2099-03-01")).total, 10);
    const { rows } = await pool.query(`SELECT TO_CHAR(data, 'YYYY-MM-DD') AS d FROM lancamentos WHERE id = $1`, [l.id]);
    assert.equal(rows[0].d, "2099-03-03");
  });

  test("ajustar o fechamento recalcula as compras ainda não pagas e respeita faturas pagas", async () => {
    const { u, carteiras, cartao } = await novoUsuario();
    const datas = (fechamento) => ({ fechamento, vencimento: "2099-03-25" });

    // fechamento antecipado: a compra passa para a fatura seguinte
    let c = await cartao(10, 20);
    await compra(u, c, "2099-03-08", 10);
    const r = await tx((db) => ajustarDatasFatura(db, u, c, "2099-03-01", datas("2099-03-05")));
    assert.match(r.aviso, /1 compra\(s\) mudaram de fatura/);
    assert.equal((await fatura(u, c, "2099-03-01")).total, 0);
    assert.equal((await fatura(u, c, "2099-04-01")).total, 10);

    // fechamento adiado: compras do ciclo seguinte voltam para este
    c = await cartao(10, 20);
    await compra(u, c, "2099-03-12", 15);
    assert.equal((await fatura(u, c, "2099-04-01")).total, 15);
    await tx((db) => ajustarDatasFatura(db, u, c, "2099-03-01", datas("2099-03-15")));
    assert.equal((await fatura(u, c, "2099-03-01")).total, 15);
    assert.equal((await fatura(u, c, "2099-04-01")).total, 0);

    // fatura seguinte paga: o ajuste é recusado por inteiro
    c = await cartao(10, 20);
    await compra(u, c, "2099-03-08", 10);
    await compra(u, c, "2099-04-02", 20);
    await tx((db) => fecharFatura(db, u, c, "2099-04-01"));
    await pagar(u, c, "2099-04-01", 20, carteiras["Digital"]);
    await rejeitaCom(tx((db) => ajustarDatasFatura(db, u, c, "2099-03-01", datas("2099-03-05"))), /está paga/, 409);
    assert.equal((await fatura(u, c, "2099-03-01")).total, 10);
    assert.equal((await fatura(u, c, "2099-03-01")).data_fechamento, "2099-03-10");

    // mover compras não pode deixar o total abaixo do já pago
    c = await cartao(10, 20);
    await compra(u, c, "2099-03-02", 90);
    await compra(u, c, "2099-03-08", 10);
    await tx((db) => fecharFatura(db, u, c, "2099-03-01"));
    await pagar(u, c, "2099-03-01", 95, carteiras["Digital"]);
    await rejeitaCom(tx((db) => ajustarDatasFatura(db, u, c, "2099-03-01", datas("2099-03-05"))), /abaixo do total já pago/, 409);
    assert.equal((await fatura(u, c, "2099-03-01")).total, 100);
  });

  test("LOW-7: valores com mais de 2 casas são normalizados; total e pagamentos nunca divergem", async () => {
    const { u, carteiras, cartao } = await novoUsuario();
    const c = await cartao();
    const r = await compra(u, c, "2099-10-01", "10.006");
    assert.equal(Number(r.lancamento.valor), 10.01);
    await tx((db) => fecharFatura(db, u, c, "2099-10-01"));
    const p1 = await pagar(u, c, "2099-10-01", "5.006", carteiras["Digital"]);
    assert.equal(p1.pago, 5.01);
    const p2 = await pagar(u, c, "2099-10-01", p1.restante, carteiras["Digital"]);
    assert.equal(p2.status, "paga");
    const { rows } = await pool.query(
      `SELECT (SELECT SUM(valor) FROM lancamentos WHERE fatura_id = f.id)::text AS total,
              (SELECT SUM(valor) FROM pagamentos_fatura WHERE fatura_id = f.id)::text AS pago
       FROM faturas f WHERE cartao_id = $1`, [c]
    );
    assert.equal(rows[0].total, rows[0].pago);
    // o banco recusa valores fora de centavos mesmo sem passar pelo serviço
    await assert.rejects(
      pool.query(`INSERT INTO lancamentos (descricao, valor, tipo, data, usuario_id, fatura_id) VALUES ('x', 10.005, 'despesa', '2099-10-02', $1, $2)`, [u, r.lancamento.fatura_id]),
      { code: "23514" }
    );
    await assert.rejects(
      pool.query(`INSERT INTO pagamentos_fatura (fatura_id, usuario_id, carteira_id, valor, data) VALUES ($1, $2, $3, 0.001, '2099-10-02')`, [r.lancamento.fatura_id, u, carteiras["Digital"]]),
      { code: "23514" }
    );
  });

  test("LOW-6: compra de cartão com valor zero, negativo ou inválido é recusada; carteira não muda", async () => {
    const { u, carteiras, cartao } = await novoUsuario();
    const c = await cartao();
    for (const v of [0, "0", "-50", -1, "abc", "0.004"]) {
      await rejeitaCom(compra(u, c, "2099-08-01", v), /maior que zero/);
    }
    assert.equal((await fatura(u, c, "2099-08-01")).total, 0);
    // lançamentos de carteira seguem como antes
    const w = await tx((db) =>
      criarLancamento(db, u, {
        descricao: "x", valor: "-5", tipo: "despesa", data: "2099-08-01",
        categoriaId: null, carteiraId: carteiras["Digital"], cartaoId: null,
      })
    );
    assert.equal(Number(w.lancamento.valor), -5);
  });

  test("LOW-A: arredondamento do serviço coincide com round() do PostgreSQL", async () => {
    const valores = [];
    for (let c = 0; c <= 3000; c++) valores.push((c / 1000).toFixed(3)); // 0.000 .. 3.000
    valores.push("1.005", "2.675", "10.005", "99.995", "1234.565", "0.125");
    const { rows } = await pool.query(
      `SELECT v, (round(v::numeric, 2) * 100)::int AS c FROM unnest($1::text[]) AS v`,
      [valores]
    );
    const divergentes = rows.filter((r) => paraCentavos(r.v) !== r.c).map((r) => r.v);
    assert.deepEqual(divergentes, []);
  });

  test("LOW-A: entrada com mais de 2 casas é normalizada de forma única em compra, total e pagamento", async () => {
    const { u, carteiras, cartao } = await novoUsuario();
    const c = await cartao();
    const r = await compra(u, c, "2099-11-01", "1.005"); // antes ficava 1.00
    assert.equal(r.lancamento.valor, "1.01");
    await compra(u, c, "2099-11-02", 2.675);
    await tx((db) => fecharFatura(db, u, c, "2099-11-01"));
    let f = await fatura(u, c, "2099-11-01");
    assert.equal(f.total, 3.69);
    f = await pagar(u, c, "2099-11-01", "1.005", carteiras["Digital"]);
    assert.equal(f.pago, 1.01);
    f = await pagar(u, c, "2099-11-01", f.restante, carteiras["Digital"]);
    assert.equal(f.status, "paga");
    const { rows } = await pool.query(
      `SELECT (SELECT SUM(valor) FROM lancamentos WHERE fatura_id = f.id)::text AS total,
              (SELECT SUM(valor) FROM pagamentos_fatura WHERE fatura_id = f.id)::text AS pago
       FROM faturas f WHERE cartao_id = $1`, [c]
    );
    assert.equal(rows[0].total, "3.69");
    assert.equal(rows[0].pago, "3.69");
    await rejeitaCom(compra(u, c, "2099-11-03", "1e3"), /maior que zero/);
  });

  test("LOW-B: fatura fechada manualmente que fica zerada continua fechada, mas só é paga na data de fechamento", async () => {
    const { u, carteiras, cartao } = await novoUsuario();
    const c = await cartao();
    const l = (await compra(u, c, "2099-05-01", 10)).lancamento;
    await tx((db) => fecharFatura(db, u, c, "2099-05-01"));
    await tx((db) => excluirLancamento(db, u, l.id));

    let f = await fatura(u, c, "2099-05-01");
    assert.equal(f.fechada, true);
    assert.equal(f.total, 0);
    assert.equal(f.status, "pendente", "fechada, mas ainda não paga: a data de fechamento não chegou");
    await rejeitaCom(pagar(u, c, "2099-05-01", 1, carteiras["Digital"]), /pendente/, 409);
    const { rows } = await pool.query(`SELECT count(*)::int AS n FROM pagamentos_fatura WHERE usuario_id = $1`, [u]);
    assert.equal(rows[0].n, 0, "nenhum pagamento fictício");

    // continua aceitando a compra esquecida (reabertura) e volta a pendente com valor
    await compra(u, c, "2099-05-02", 7);
    assert.equal((await fatura(u, c, "2099-05-01")).total, 7);
    const { rows: restante } = await pool.query(`SELECT id FROM lancamentos WHERE fatura_id = (SELECT id FROM faturas WHERE cartao_id = $1)`, [c]);
    await tx((db) => excluirLancamento(db, u, restante[0].id));

    // na data de fechamento (fuso America/Sao_Paulo) passa a paga, sem pagamento
    await pool.query(`UPDATE faturas SET data_fechamento = (now() AT TIME ZONE 'America/Sao_Paulo')::date WHERE cartao_id = $1`, [c]);
    f = await fatura(u, c, "2099-05-01");
    assert.equal(f.status, "paga");
    await pool.query(`UPDATE faturas SET data_fechamento = (now() AT TIME ZONE 'America/Sao_Paulo')::date + 1 WHERE cartao_id = $1`, [c]);
    assert.equal((await fatura(u, c, "2099-05-01")).status, "pendente", "véspera da data: ainda não é paga");
  });

  test("LOW-C: a data usada para decidir a fatura é lida sob o lock (sem leitura desatualizada)", async () => {
    const { u, cartao } = await novoUsuario();
    const c = await cartao(10, 20);
    const l = (await compra(u, c, "2099-03-05", 10)).lancamento;
    // desalinha de propósito: o fechamento passa a 03-04, mas a compra de 03-05 segue na fatura 03
    await pool.query(`UPDATE faturas SET data_fechamento = '2099-03-04' WHERE cartao_id = $1`, [c]);
    const edicao = (db, data, valor) =>
      atualizarLancamento(db, u, l.id, {
        descricao: "x", valor, tipo: "despesa", data,
        categoriaId: null, carteiraId: null, cartaoId: c,
      });

    const a = await pool.connect();
    const b = await pool.connect();
    try {
      // A muda a data para 03-03 (continua na fatura 03) e mantém a transação aberta
      await a.query("BEGIN");
      await edicao(a, "2099-03-03", 10);
      // B já leu a data antiga (03-05) e espera o lock; pede 03-05 de volta
      await b.query("BEGIN");
      let terminou = false;
      const pb = edicao(b, "2099-03-05", 11).finally(() => (terminou = true));
      await new Promise((r) => setTimeout(r, 300));
      assert.equal(terminou, false, "B deveria esperar o lock do cartão");
      await a.query("COMMIT");
      await pb;
      await b.query("COMMIT");
    } catch (e) {
      await a.query("ROLLBACK").catch(() => {});
      await b.query("ROLLBACK").catch(() => {});
      throw e;
    } finally {
      a.release();
      b.release();
    }
    // Com a data atual (03-03) B vê que a data mudou para 03-05 e recalcula a fatura: 04.
    // Com a leitura desatualizada (03-05) acharia que nada mudou e manteria a 03.
    const { rows } = await pool.query(
      `SELECT TO_CHAR(f.ciclo, 'YYYY-MM-DD') AS ciclo, TO_CHAR(l.data, 'YYYY-MM-DD') AS data, l.valor::text AS valor
       FROM lancamentos l JOIN faturas f ON f.id = l.fatura_id WHERE l.id = $1`, [l.id]
    );
    assert.deepEqual(rows[0], { ciclo: "2099-04-01", data: "2099-03-05", valor: "11.00" });
  });
});

describe("migration 0005 com dados da 0004 (Postgres)", { skip: !URL && "TEST_DATABASE_URL não definida" }, () => {
  let admin;
  let n = 0;
  const dir = join(import.meta.dirname, "..", "db", "migrations");
  const migration0005 = () => readFile(join(dir, "0005_cartoes_valores.sql"), "utf8");

  before(async () => {
    admin = new pg.Pool({ connectionString: URL, max: 2 });
    const { rows } = await admin.query("SELECT current_database() AS db");
    assert.match(rows[0].db, /test/i, "recusando usar um banco que não parece de teste");
  });

  after(async () => {
    await admin?.end();
  });

  // Banco novo com as migrations 0001-0004 (estado de quem já aplicou a 0004)
  async function bancoLegado() {
    const nome = `more_money_test_mig_${process.pid}_${++n}`;
    await admin.query(`CREATE DATABASE ${nome}`);
    const url = new globalThis.URL(URL);
    url.pathname = `/${nome}`;
    const p = new pg.Pool({ connectionString: url.toString(), max: 2 });
    for (const f of (await readdir(dir)).filter((x) => x.endsWith(".sql") && x < "0005").sort()) {
      await p.query(await readFile(join(dir, f), "utf8"));
    }
    const u = (await p.query(`INSERT INTO usuarios (nome, email, tipo_usuario) VALUES ('a','a@t','PADRAO') RETURNING id`)).rows[0].id;
    const w = (await p.query(`INSERT INTO carteiras (usuario_id, nome) VALUES ($1,'Digital') RETURNING id`, [u])).rows[0].id;
    const c = (await p.query(`INSERT INTO cartoes (nome, usuario_id, dia_fechamento, dia_vencimento) VALUES ('c',$1,10,20) RETURNING id`, [u])).rows[0].id;
    const fatura = async (ciclo) =>
      (await p.query(`INSERT INTO faturas (cartao_id, usuario_id, ciclo, data_fechamento, data_vencimento) VALUES ($1,$2,$3,$3,$3) RETURNING id`, [c, u, ciclo])).rows[0].id;
    const compra = (f, valor) =>
      p.query(`INSERT INTO lancamentos (descricao, valor, tipo, data, usuario_id, fatura_id) VALUES ('x',$1,'despesa','2099-02-01',$2,$3)`, [valor, u, f]);
    const pagamento = (f, valor) =>
      p.query(`INSERT INTO pagamentos_fatura (fatura_id, usuario_id, carteira_id, valor, data) VALUES ($1,$2,$3,$4,'2099-03-01')`, [f, u, w, valor]);
    return {
      p, u, w, fatura, compra, pagamento,
      drop: async () => {
        await p.end();
        await admin.query(`DROP DATABASE ${nome}`);
      },
    };
  }

  const constraints = async (p) =>
    (await p.query(`SELECT conname FROM pg_constraint WHERE conname IN ('lancamentos_fatura_valor_check','pagamentos_fatura_valor_centavos_check') ORDER BY 1`)).rows.map((r) => r.conname);

  test("normaliza para centavos os dados da 0004 com mais de 2 casas e preserva carteira e consistência", async () => {
    const db = await bancoLegado();
    try {
      const f1 = await db.fatura("2099-02-01");
      await db.compra(f1, "10.005"); // total 10.005 -> 10.01
      await db.pagamento(f1, "10.01"); // pago 10.01 (caso G do review)
      const f2 = await db.fatura("2099-03-01");
      await db.compra(f2, "2.004"); // -> 2.00
      await db.compra(f2, "3.335"); // -> 3.34
      // fatura parcialmente paga com compras de 3 casas: normaliza sem abortar
      const f3 = await db.fatura("2099-04-01");
      for (let i = 0; i < 3; i++) await db.compra(f3, "3.335");
      await db.pagamento(f3, "5.00");
      // lançamento de carteira com 3 casas não pode ser tocado
      await db.p.query(`INSERT INTO lancamentos (descricao, valor, tipo, data, usuario_id, carteira_id) VALUES ('c', 7.777, 'despesa', '2099-02-01', $1, $2)`, [db.u, db.w]);

      await db.p.query(await migration0005());

      const valores = (await db.p.query(`SELECT valor::text AS v FROM lancamentos WHERE fatura_id IS NOT NULL ORDER BY valor`)).rows.map((r) => r.v);
      assert.deepEqual(valores, ["2.00", "3.34", "3.34", "3.34", "3.34", "10.01"]);
      assert.equal((await db.p.query(`SELECT valor::text AS v FROM pagamentos_fatura`)).rows[0].v, "10.01");
      assert.equal((await db.p.query(`SELECT valor::text AS v FROM lancamentos WHERE fatura_id IS NULL`)).rows[0].v, "7.777");
      const { rows } = await db.p.query(
        `SELECT bool_and(COALESCE((SELECT SUM(p.valor) FROM pagamentos_fatura p WHERE p.fatura_id = f.id), 0)
                      <= COALESCE((SELECT SUM(l.valor) FROM lancamentos l WHERE l.fatura_id = f.id), 0)) AS ok
         FROM faturas f`
      );
      assert.equal(rows[0].ok, true);
      assert.equal((await constraints(db.p)).length, 2);
      await assert.rejects(db.compra(f1, "1.005"), { code: "23514" });
    } finally {
      await db.drop();
    }
  });

  test("interrompe sem alterar nada quando há compra de cartão com valor zero ou negativo", async () => {
    const db = await bancoLegado();
    try {
      const f = await db.fatura("2099-02-01");
      await db.compra(f, "10.005");
      await db.compra(f, "-5");
      await assert.rejects(db.p.query(await migration0005()), /valor zero ou negativo/);
      assert.deepEqual(await constraints(db.p), []);
      const v = (await db.p.query(`SELECT valor::text AS v FROM lancamentos ORDER BY valor`)).rows.map((r) => r.v);
      assert.deepEqual(v, ["-5", "10.005"], "rollback completo: nada foi normalizado");
    } finally {
      await db.drop();
    }
  });

  test("LOW-E: interrompe sem alterar nada quando o arredondamento por compra faria uma fatura quitada voltar a ter saldo", async () => {
    const db = await bancoLegado();
    try {
      const f = await db.fatura("2099-02-01");
      for (let i = 0; i < 3; i++) await db.compra(f, "3.335"); // total 10.005 (10.01 em centavos)
      await db.pagamento(f, "10.01"); // quitada; arredondando por compra o total vira 10.02
      // outra fatura válida no mesmo banco não pode ser alterada pela migration abortada
      const g = await db.fatura("2099-03-01");
      await db.compra(g, "7.004");
      await assert.rejects(db.p.query(await migration0005()), /quitada\(s\) voltarem a ter saldo pendente/);
      assert.deepEqual(await constraints(db.p), []);
      const v = (await db.p.query(`SELECT valor::text AS v FROM lancamentos ORDER BY valor`)).rows.map((r) => r.v);
      assert.deepEqual(v, ["3.335", "3.335", "3.335", "7.004"], "rollback completo: nenhuma compra normalizada");
      assert.equal((await db.p.query(`SELECT valor::text AS v FROM pagamentos_fatura`)).rows[0].v, "10.01");
    } finally {
      await db.drop();
    }
  });

  test("interrompe sem alterar nada quando o arredondamento deixaria o pago acima do total", async () => {
    const db = await bancoLegado();
    try {
      const f = await db.fatura("2099-02-01");
      for (let i = 0; i < 3; i++) await db.compra(f, "3.334"); // total 10.002 -> 9.99
      await db.pagamento(f, "10.00"); // pago 10.00 era válido antes (> 9.99 depois)
      await assert.rejects(db.p.query(await migration0005()), /total pago acima/);
      assert.deepEqual(await constraints(db.p), []);
      const v = (await db.p.query(`SELECT DISTINCT valor::text AS v FROM lancamentos`)).rows.map((r) => r.v);
      assert.deepEqual(v, ["3.334"]);
    } finally {
      await db.drop();
    }
  });
});
