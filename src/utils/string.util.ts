export function isStringEmpty(str: string | null | undefined): boolean {
   return !str || str.trim().length === 0
}

export async function getRandomStringLength(length: number): Promise<string> {
   const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
   let result = ""
   for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length))
   }
   return result
}

const adjectives: string[] = ["게으른", "엉뚱한", "시니컬한", "나른한", "해맑은", "어설픈", "진지한", "자유로운", "우울한", "삐딱한", "말랑한", "동글동글", "쪼꼬만", "포근한", "하찮은", "용감한", "소심한", "심심한", "촉촉한", "뽀송한"]
const nouns: string[] = ["고양이", "강아지", "햄스터", "쿼카", "알파카", "펭귄", "곰", "오리", "병아리", "너구리", "복숭아", "레몬", "젤리", "구름", "조약돌", "먼지", "감자", "유령", "두부", "도넛"]

export async function getRandomNickname(): Promise<string> {
   const adjIndex = Math.floor(Math.random() * adjectives.length)
   const nounIndex = Math.floor(Math.random() * nouns.length)
   return `${adjectives[adjIndex]} ${nouns[nounIndex]}`
}
