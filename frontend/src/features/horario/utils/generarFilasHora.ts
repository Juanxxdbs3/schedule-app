export function formatTime(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

export function generarFilasHora(unidadHoraMinutos: number): string[] {
  const result: string[] = [];
  const START = 7 * 60;
  const NOON = 12 * 60;
  const AFTERNOON = 13 * 60;
  const END = 22 * 60;

  let current = START;

  while (current < END) {
    result.push(formatTime(current));

    if (current < NOON) {
      const next = current + unidadHoraMinutos;
      if (next >= NOON) {
        result.push(formatTime(NOON));
        current = AFTERNOON;
      } else {
        current = next;
      }
    } else {
      const next = current + unidadHoraMinutos;
      if (next > END) {
        result.push(formatTime(END));
        break;
      }
      if (next === END) {
        result.push(formatTime(END));
        break;
      }
      current = next;
    }
  }

  return result;
}
