import { describe, expect, it } from "vitest";
import { affiliateSummary, attribute, buildCycle, commissionOf, payoutSaturday, statement, type Payout, type Sale } from "../src/index";

const sale = (o: Partial<Sale> = {}): Sale => ({
  id: "v1", affiliateId: "af1", product: "Doc", createdAt: "2026-11-01T12:00:00Z",
  grossCents: 10000, discountCents: 0, feeCents: 400, otherDeductions: [], status: "liquidada", settledAt: "2026-11-02T12:00:00Z", ...o,
});
const now = new Date("2026-11-12T12:00:00Z");

describe("statement (D-41)", () => {
  it("exemplo oficial: 100 − 4 de taxa = 96 líquido → 48 de comissão", () => {
    expect(statement(sale())).toMatchObject({ paidCents: 10000, netCents: 9600, commissionCents: 4800, platformCents: 4800 });
  });
  it("cupom reduz o valor pago antes da comissão", () => {
    expect(statement(sale({ discountCents: 2000, feeCents: 320 })).commissionCents).toBe(3840);
  });
  it("sem afiliado não há comissão; meio centavo arredonda para cima", () => {
    expect(statement(sale({ affiliateId: null })).commissionCents).toBe(0);
    expect(statement(sale({ grossCents: 10001, feeCents: 0 })).commissionCents).toBe(5001);
  });
});

describe("commissionOf", () => {
  it("pendente sem liquidação; liberada após a carência; paga com pagamento confirmado; estornada após reembolso", () => {
    expect(commissionOf(sale({ status: "pendente", settledAt: undefined }), now, 7, [])?.status).toBe("pendente");
    expect(commissionOf(sale({ settledAt: "2026-11-10T12:00:00Z" }), now, 7, [])?.status).toBe("pendente");
    expect(commissionOf(sale(), now, 7, [])?.status).toBe("liberada");
    const p: Payout = { id: "p1", affiliateId: "af1", cycle: "2026-11-14", saleIds: ["v1"], cents: 4800, paidAt: "x", reference: "pix" };
    expect(commissionOf(sale(), now, 7, [p])?.status).toBe("paga");
    expect(commissionOf(sale({ status: "reembolsada" }), now, 7, [])?.status).toBe("estornada");
  });
});

describe("ciclo de sábado (D-42)", () => {
  it("corte na sexta 23:59 de Brasília", () => {
    expect(payoutSaturday(new Date("2026-11-13T12:00:00Z"))).toBe("2026-11-14");
    expect(payoutSaturday(new Date("2026-11-14T02:30:00Z"))).toBe("2026-11-14"); // sexta 23:30 BRT
    expect(payoutSaturday(new Date("2026-11-14T03:30:00Z"))).toBe("2026-11-21"); // sábado 00:30 BRT
  });
  it("agrupa liberadas por afiliado, ignora duplicadas, pagas e não liberadas, e aponta divergência", () => {
    const sales = [sale(), sale(), sale({ id: "v2", affiliateId: "af2", grossCents: 5000, feeCents: 0 }),
      sale({ id: "v3", settledAt: "2026-11-13T12:00:00Z" }), sale({ id: "v4", status: "chargeback" })];
    const paid: Payout = { id: "p0", affiliateId: "af1", cycle: "2026-11-07", saleIds: ["v4"], cents: 4800, paidAt: "x", reference: "pix" };
    const c = buildCycle(sales, "2026-11-14", 7, [paid]);
    expect(c.lines).toEqual([{ affiliateId: "af1", cents: 4800, saleIds: ["v1"] }, { affiliateId: "af2", cents: 2500, saleIds: ["v2"] }]);
    expect(c.totalCents).toBe(7300);
    expect(c.divergences.map((d) => d.saleId)).toEqual(["v4"]);
  });
  it("resumo do afiliado separa as situações", () => {
    const s = affiliateSummary([sale(), sale({ id: "v2", status: "pendente", settledAt: undefined }), sale({ id: "v3", status: "reembolsada" })], "af1", now, 7, []);
    expect(s).toMatchObject({ salesCount: 2, liberada: 4800, pendente: 4800, estornada: 4800, accruedCents: 9600 });
  });
});

describe("atribuição vitalícia", () => {
  const affs = [{ id: "af1", userId: "u9", code: "ABCD2345", status: "ativo" as const }, { id: "af2", userId: "u8", code: "ZZZZ2222", status: "suspenso" as const }];
  const acc = { id: "u1", createdAt: "x", referredBy: null };
  it("vincula uma única vez e bloqueia autoindicação e afiliado inativo", () => {
    expect(attribute(acc, "abcd2345", affs)).toEqual({ ok: true, affiliateId: "af1" });
    expect(attribute({ ...acc, referredBy: "af1" }, "ABCD2345", affs)).toMatchObject({ reason: "ja-atribuido" });
    expect(attribute({ ...acc, id: "u9" }, "ABCD2345", affs)).toMatchObject({ reason: "autoindicacao" });
    expect(attribute(acc, "ZZZZ2222", affs)).toMatchObject({ reason: "afiliado-inativo" });
    expect(attribute(acc, "NADA", affs)).toMatchObject({ reason: "codigo-invalido" });
  });
});
