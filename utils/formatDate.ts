export const formatDate = (dateStr: string) => {
  const [month, day, year] = dateStr.split('/');
  const shortYear = year.slice(-2);
  return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${shortYear}`;
};