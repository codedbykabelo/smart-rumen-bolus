// Pin readings to South African Standard Time regardless of browser timezone.
const sastTime = new Intl.DateTimeFormat('en-ZA', {
  timeZone: 'Africa/Johannesburg', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
});
export function formatSouthAfricanTime(date: Date): string { return sastTime.format(date); }
