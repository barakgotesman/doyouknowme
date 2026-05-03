const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'

export function generateRoomCode(): string {
  return Array.from(
    { length: 4 },
    () => ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)]
  ).join('')
}
