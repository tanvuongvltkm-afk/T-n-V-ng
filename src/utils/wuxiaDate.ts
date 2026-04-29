export function getWuxiaDate() {
  const d = new Date();
  const dtz = new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
  const hour = dtz.getHours();
  const day = dtz.getDate();
  const month = dtz.getMonth() + 1;
  const year = dtz.getFullYear();

  const chiIndex = Math.floor((hour + 1) / 2) % 12;
  const chiList = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
  const chi = chiList[chiIndex];

  const canYearIndex = (year + 6) % 10;
  const chiYearIndex = (year + 8) % 12;
  const canList = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
  const nameYear = `${canList[canYearIndex]} ${chiList[chiYearIndex]}`;

  return `Giờ ${chi} / ${day.toString().padStart(2, '0')} / ${month.toString().padStart(2, '0')} / ${nameYear}`;
}
