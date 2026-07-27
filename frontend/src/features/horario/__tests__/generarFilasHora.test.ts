import { describe, it, expect } from "vitest";
import { generarFilasHora } from "../utils/generarFilasHora";

describe("generarFilasHora", () => {
  it("unidad=70 produce la secuencia de referencia", () => {
    const result = generarFilasHora(70);
    expect(result).toEqual([
      "07:00", "08:10", "09:20", "10:30", "11:40",
      "12:00", "13:00",
      "14:10", "15:20", "16:30", "17:40", "18:50",
      "20:00", "21:10", "22:00",
    ]);
  });

  it("unidad=50 produce la secuencia de referencia", () => {
    const result = generarFilasHora(50);
    expect(result).toEqual([
      "07:00", "07:50", "08:40", "09:30", "10:20", "11:10",
      "12:00", "13:00",
      "13:50", "14:40", "15:30", "16:20", "17:10",
      "18:00", "18:50", "19:40", "20:30", "21:20", "22:00",
    ]);
  });

  it("unidad=30 produce la secuencia de referencia", () => {
    const result = generarFilasHora(30);
    expect(result).toEqual([
      "07:00", "07:30", "08:00", "08:30", "09:00", "09:30",
      "10:00", "10:30", "11:00", "11:30",
      "12:00", "13:00",
      "13:30", "14:00", "14:30", "15:00", "15:30",
      "16:00", "16:30", "17:00", "17:30", "18:00", "18:30",
      "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00",
    ]);
  });

  it("primer elemento es siempre 07:00", () => {
    for (const u of [10, 30, 45, 50, 60, 70, 90, 120]) {
      expect(generarFilasHora(u)[0]).toBe("07:00");
    }
  });

  it("último elemento es siempre 22:00", () => {
    for (const u of [10, 30, 45, 50, 60, 70, 90, 120]) {
      const result = generarFilasHora(u);
      expect(result[result.length - 1]).toBe("22:00");
    }
  });

  it("12:00 está presente exactamente una vez", () => {
    for (const u of [10, 30, 45, 50, 60, 70, 90, 120]) {
      const result = generarFilasHora(u);
      const count = result.filter((t) => t === "12:00").length;
      expect(count).toBe(1);
    }
  });

  it("13:00 está presente exactamente una vez", () => {
    for (const u of [10, 30, 45, 50, 60, 70, 90, 120]) {
      const result = generarFilasHora(u);
      const count = result.filter((t) => t === "13:00").length;
      expect(count).toBe(1);
    }
  });

  it("13:00 aparece inmediatamente después de 12:00", () => {
    for (const u of [10, 30, 45, 50, 60, 70, 90, 120]) {
      const result = generarFilasHora(u);
      const idx12 = result.indexOf("12:00");
      expect(result[idx12 + 1]).toBe("13:00");
    }
  });
});
