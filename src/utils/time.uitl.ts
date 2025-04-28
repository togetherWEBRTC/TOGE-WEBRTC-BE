/**
 * 스트링을 밀리세컨드로 변환
 * 형식: ms, s, m, h, d, w, M, y
 * EX : '1d', '2h', '3m', '4s', '5ms'
 */
export function durationToMs(duration: string): number {
   const units: { [key: string]: number } = {
      ms: 1,
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
      w: 7 * 24 * 60 * 60 * 1000,
      M: 30 * 24 * 60 * 60 * 1000, // 30일 한달으로
      y: 365 * 24 * 60 * 60 * 1000, // 365일 일년으로
   }

   const match = duration.match(/^(\d+)([a-zA-Z]+)$/)
   if (!match) {
      throw new Error(`Invalid format: ${duration}. Expected format => number + unit (ex. '2m', '1d')`)
   }

   const [, value, unit] = match
   const multiplier = units[unit]

   if (!multiplier) {
      throw new Error(`Invalid time unit: ${unit}. Supported units are: ${Object.keys(units).join(", ")}`)
   }

   return parseInt(value, 10) * multiplier
}
