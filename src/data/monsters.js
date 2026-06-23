const monsters = [
  {
    id: 'basic_minion',
    name: 'Minion',
    baseHp: 30,
    baseDamage: 12,
    speed: 140,
    color: 0xef4444, // Red
    strokeColor: 0xfecaca
  },
  {
    id: 'fast_runner',
    name: 'Runner',
    baseHp: 18,
    baseDamage: 8,
    speed: 195,
    color: 0x3b82f6, // Blue
    strokeColor: 0xbfdbfe
  },
  {
    id: 'tank_brute',
    name: 'Brute',
    baseHp: 85,
    baseDamage: 24,
    speed: 85,
    color: 0xeab308, // Yellow/Amber
    strokeColor: 0xfef08a
  }
];

export function getRandomMonsterType(allowedIds) {
  let pool = monsters;
  
  // Jika stage membatasi monster tertentu
  if (allowedIds && allowedIds.length > 0) {
    pool = monsters.filter(m => allowedIds.includes(m.id));
    if (pool.length === 0) pool = monsters; // fallback jika typo
  }

  // Jika tidak ada pembatasan (global random)
  if (pool === monsters) {
    const rand = Math.random();
    // 60% chance for Minion, 25% for Runner, 15% for Brute
    if (rand < 0.60) return monsters[0];
    if (rand < 0.85) return monsters[1];
    return monsters[2];
  }

  // Jika ada pembatasan, pilih acak secara merata dari yang dibolehkan
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

export default monsters;
