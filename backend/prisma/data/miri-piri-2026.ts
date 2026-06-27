/**
 * Miri Piri 2026 schedule — parsed from official tournament PDFs.
 * Source: MIRI PIRI TOURNAMENT 2026.pdf, MIRI PIRI MINI 2026.xlsx.pdf
 */
import type { Gender } from '@prisma/client';
import {
  collectTeams,
  inferAgeGroup,
  inferGender,
  isScheduleOnly,
  parseMatchLine,
  slugifyDivision,
  validateDivision,
  type CupDay,
  type ParsedMatch,
  type RawMatchLine,
  type ValidationIssue,
} from './schedule-utils';

type MatchTuple = [string, string, string, string, CupDay, string, string, string?];

function m(
  num: string,
  division: string,
  home: string,
  away: string,
  day: CupDay,
  time: string,
  field: string,
  matchType?: string,
): MatchTuple {
  return [num, division, home, away, day, time, field, matchType];
}

/** Main tournament (July 3–5) — open & U13+ divisions */
const MAIN_MATCHES: MatchTuple[] = [
  // ── Men's Premier ──────────────────────────────────────────────────────────
  m('1', 'Mens Premier', 'BCT Punjab FC', 'Van City Pro', 'FRIDAY', '8PM', 'NAP 1'),
  m('2', 'Mens Premier', 'Juba FC', 'BCT Hurricanes', 'FRIDAY', '9:30PM', 'NAP 1'),
  m('3', 'Mens Premier', 'Strive Academy', 'Joyous FC', 'FRIDAY', '7:30PM', 'NAP 2'),
  m('4', 'Mens Premier', 'BB5', 'FC Faly Burundi', 'FRIDAY', '9PM', 'NAP 5'),
  m('5', 'Mens Premier', 'Temple United Pegasus', 'Strathcona Primo FC', 'FRIDAY', '9PM', 'NAP 2'),
  m('6', 'Mens Premier', 'Van City Pro', 'Juba FC', 'SATURDAY', '12PM', 'NAP 6'),
  m('7', 'Mens Premier', 'BCT Hurricanes', 'Strive Academy', 'SATURDAY', '10:30AM', 'NAP 1'),
  m('8', 'Mens Premier', 'Joyous FC', 'BB5', 'SATURDAY', '12PM', 'NAP 2'),
  m('9', 'Mens Premier', 'FC Faly Burundi', 'Temple United Pegasus', 'SATURDAY', '12PM', 'NAP 5'),
  m('10', 'Mens Premier', 'Strathcona Primo FC', 'BCT Punjab FC', 'SATURDAY', '12PM', 'NAP 1'),
  m('11', 'Mens Premier', 'Quarter Finals 1', 'Quarter Finals 2', 'SATURDAY', '6PM', 'NAP 1', 'Quarter-final'),
  m('12', 'Mens Premier', 'Quarter Finals 3', 'Quarter Finals 4', 'SATURDAY', '6PM', 'NAP 2', 'Quarter-final'),
  m('13', 'Mens Premier', 'Quarter Finals 5', 'Quarter Finals 6', 'SATURDAY', '7:30PM', 'NAP 1', 'Quarter-final'),
  m('14', 'Mens Premier', 'Quarter Finals 7', 'Quarter Finals 8', 'SATURDAY', '7:30PM', 'NAP 2', 'Quarter-final'),
  m('15', 'Mens Premier', 'Winner of Match 11', 'Winner of Match 12', 'SUNDAY', '10:30AM', 'NAP 1', 'Semi-final'),
  m('16', 'Mens Premier', 'Winner of Match 13', 'Winner of Match 14', 'SUNDAY', '12PM', 'NAP 1', 'Semi-final'),
  m('17', 'Mens Premier', 'Winner of Match 15', 'Winner of Match 16', 'SUNDAY', '7PM', 'NAP 1', 'Final'),

  // ── Men's Gold Div 1 ─────────────────────────────────────────────────────
  m('18', 'Mens Gold Div 1', 'BC Tigers Hurricanes', 'SFC Royals', 'FRIDAY', '9PM', 'NAP 6', 'Pool A'),
  m('19', 'Mens Gold Div 1', 'Joyous FC', 'AUSC', 'FRIDAY', '7:30PM', 'NAP 10', 'Pool A'),
  m('20', 'Mens Gold Div 1', 'Winner of Match 18', 'Loser of Match 19', 'SATURDAY', '10:30AM', 'Bear Creek', 'Pool A'),
  m('21', 'Mens Gold Div 1', 'Winner of Match 19', 'Loser of Match 18', 'SATURDAY', '10:30AM', 'NAP 6', 'Pool A'),
  m('22', 'Mens Gold Div 1', 'United Punjab SC Winnipeg', 'BCT Somali', 'FRIDAY', '6PM', 'NAP 2', 'Pool B'),
  m('23', 'Mens Gold Div 1', 'BCT Supra', 'Temple United', 'FRIDAY', '7:30PM', 'NAP 5', 'Pool B'),
  m('24', 'Mens Gold Div 1', 'Winner of Match 22', 'Loser of Match 23', 'SATURDAY', '10:30AM', 'NAP 5', 'Pool B'),
  m('25', 'Mens Gold Div 1', 'Winner of Match 23', 'Loser of Match 22', 'SATURDAY', '10:30AM', 'NAP 7', 'Pool B'),
  m('26', 'Mens Gold Div 1', 'BCT Mahilpur United', 'Ares AFA', 'FRIDAY', '7:30PM', 'NAP 6', 'Pool C'),
  m('27', 'Mens Gold Div 1', 'Akal FC', 'GN Sporting', 'FRIDAY', '9PM', 'NAP 4', 'Pool C'),
  m('28', 'Mens Gold Div 1', 'Winner of Match 26', 'Loser of Match 27', 'SATURDAY', '10:30AM', 'NAP 4', 'Pool C'),
  m('29', 'Mens Gold Div 1', 'Winner of Match 27', 'Loser of Match 26', 'SATURDAY', '10:30AM', 'NAP 8', 'Pool C'),
  m('30', 'Mens Gold Div 1', 'BCT Elite', 'Unicorn Richmond', 'FRIDAY', '7:30PM', 'NAP 4', 'Pool D'),
  m('31', 'Mens Gold Div 1', 'Punjab Warriors Edmonton', 'White Eagles FC', 'FRIDAY', '7:30PM', 'Hjorth 1', 'Pool D'),
  m('32', 'Mens Gold Div 1', 'Winner of Match 30', 'Loser of Match 31', 'SATURDAY', '10:30AM', 'Hjorth 2', 'Pool D'),
  m('33', 'Mens Gold Div 1', 'Winner of Match 31', 'Loser of Match 30', 'SATURDAY', '10:30AM', 'NAP 2', 'Pool D'),
  m('34', 'Mens Gold Div 1', 'Pool A 1st', 'Pool B 2nd', 'SATURDAY', '4:30PM', 'NAP 1', 'Quarter-final'),
  m('35', 'Mens Gold Div 1', 'Pool B 1st', 'Pool A 2nd', 'SATURDAY', '4:30PM', 'NAP 2', 'Quarter-final'),
  m('36', 'Mens Gold Div 1', 'Pool C 1st', 'Pool D 2nd', 'SATURDAY', '4:30PM', 'NAP 5', 'Quarter-final'),
  m('37', 'Mens Gold Div 1', 'Pool D 1st', 'Pool C 2nd', 'SATURDAY', '4:30PM', 'NAP 6', 'Quarter-final'),
  m('38', 'Mens Gold Div 1', 'Winner of Match 34', 'Winner of Match 35', 'SUNDAY', '9AM', 'NAP 1', 'Semi-final'),
  m('39', 'Mens Gold Div 1', 'Winner of Match 36', 'Winner of Match 37', 'SUNDAY', '9AM', 'NAP 2', 'Semi-final'),
  m('40', 'Mens Gold Div 1', 'Winner of Match 38', 'Winner of Match 39', 'SUNDAY', '3:30PM', 'NAP 1', 'Final'),

  // ── Men's Silver Div 2 ───────────────────────────────────────────────────
  m('41', 'Mens Silver Div 2', 'Temple FC', 'AC Richmond', 'FRIDAY', '6PM', 'NAP 7', 'Pool A'),
  m('42', 'Mens Silver Div 2', 'GVU Lightning (U19)', 'Roomi FC', 'FRIDAY', '7:30PM', 'NAP 7', 'Pool A'),
  m('43', 'Mens Silver Div 2', 'Winner of Match 41', 'Loser of Match 42', 'SATURDAY', '12PM', 'Strawberry Hill', 'Pool A'),
  m('44', 'Mens Silver Div 2', 'Winner of Match 42', 'Loser of Match 41', 'SATURDAY', '10:30AM', 'Hjorth 1', 'Pool A'),
  m('45', 'Mens Silver Div 2', 'Akal FC', 'BC Tigers FC (U19)', 'FRIDAY', '6PM', 'NAP 5', 'Pool B'),
  m('46', 'Mens Silver Div 2', 'GVU Punjab', 'Skyview FC Calgary', 'FRIDAY', '7:30PM', 'NAP 8', 'Pool B'),
  m('47', 'Mens Silver Div 2', 'Winner of Match 45', 'Loser of Match 46', 'SATURDAY', '10:30AM', 'NAP 9', 'Pool B'),
  m('48', 'Mens Silver Div 2', 'Winner of Match 46', 'Loser of Match 45', 'SATURDAY', '10:30AM', 'NAP 10', 'Pool B'),
  m('49', 'Mens Silver Div 2', 'Brampton United', 'BCT Westside', 'FRIDAY', '6:30PM', 'NAP 1', 'Pool C'),
  m('50', 'Mens Silver Div 2', 'Rho FC', 'Naita FC Fiji', 'FRIDAY', '6PM', 'NAP 8', 'Pool C'),
  m('51', 'Mens Silver Div 2', 'Winner of Match 49', 'Loser of Match 50', 'SATURDAY', '12PM', 'NAP 7', 'Pool C'),
  m('52', 'Mens Silver Div 2', 'Winner of Match 50', 'Loser of Match 49', 'SATURDAY', '12PM', 'NAP 8', 'Pool C'),
  m('53', 'Mens Silver Div 2', 'SFC Elite', 'BCT Punjab FC', 'FRIDAY', '6PM', 'NAP 6', 'Pool D'),
  m('54', 'Mens Silver Div 2', 'GVU Phoenix', 'AUSC', 'FRIDAY', '7:30PM', 'NAP 9', 'Pool D'),
  m('55', 'Mens Silver Div 2', 'Winner of Match 53', 'Loser of Match 54', 'SATURDAY', '12PM', 'NAP 9', 'Pool D'),
  m('56', 'Mens Silver Div 2', 'Winner of Match 54', 'Loser of Match 53', 'SATURDAY', '12PM', 'NAP 10', 'Pool D'),
  m('57', 'Mens Silver Div 2', 'Pool A 1st', 'Pool B 2nd', 'SATURDAY', '7:30PM', 'NAP 7', 'Quarter-final'),
  m('58', 'Mens Silver Div 2', 'Pool B 1st', 'Pool A 2nd', 'SATURDAY', '7:30PM', 'NAP 8', 'Quarter-final'),
  m('59', 'Mens Silver Div 2', 'Pool C 1st', 'Pool D 2nd', 'SATURDAY', '7:30PM', 'NAP 9', 'Quarter-final'),
  m('60', 'Mens Silver Div 2', 'Pool D 1st', 'Pool C 2nd', 'SATURDAY', '7:30PM', 'NAP 10', 'Quarter-final'),
  m('61', 'Mens Silver Div 2', 'Winner of Match 57', 'Winner of Match 58', 'SUNDAY', '9AM', 'NAP 7', 'Semi-final'),
  m('62', 'Mens Silver Div 2', 'Winner of Match 59', 'Winner of Match 60', 'SUNDAY', '9AM', 'NAP 8', 'Semi-final'),
  m('63', 'Mens Silver Div 2', 'Winner of Match 61', 'Winner of Match 62', 'SUNDAY', '2PM', 'NAP 1', 'Final'),

  // ── Men's Bronze Div 3 ───────────────────────────────────────────────────
  m('66', 'Mens Bronze Div 3', 'Luxe FC', 'Panthers FC', 'SATURDAY', '9AM', 'NAP 7', 'Pool A'),
  m('67', 'Mens Bronze Div 3', 'Dasmesh United', 'GVU', 'SATURDAY', '1:30PM', 'Hjorth 1', 'Pool A'),
  m('68', 'Mens Bronze Div 3', 'Winner of Match 66', 'Loser of Match 67', 'SATURDAY', '6PM', 'NAP 7', 'Pool A'),
  m('68A', 'Mens Bronze Div 3', 'Winner of Match 67', 'Loser of Match 66', 'SATURDAY', '7:30PM', 'Strawberry Hill', 'Pool A'),
  m('69', 'Mens Bronze Div 3', 'North Surrey Mustangs', 'Rise Football Academy', 'SATURDAY', '9AM', 'NAP 8', 'Pool B'),
  m('70', 'Mens Bronze Div 3', 'West Hounds FC', 'Loser of Match 69', 'SATURDAY', '1:30PM', 'Strawberry Hill', 'Pool B'),
  m('71', 'Mens Bronze Div 3', 'West Hounds FC', 'Winner of Match 69', 'SATURDAY', '6PM', 'NAP 8', 'Pool B'),
  m('72', 'Mens Bronze Div 3', 'Winner of Pool A', 'Winner of Pool B', 'SUNDAY', '3:30PM', 'NAP 7', 'Final'),

  // ── Men's Recreational ─────────────────────────────────────────────────────
  m('73', 'Mens Recreational', 'GN Sikh Temple', 'Family Soccer FC', 'FRIDAY', '7:30PM', 'NAP Mini Turf 1'),
  m('74', 'Mens Recreational', 'Rick Hensen FC', 'Loser of Match 73', 'SUNDAY', '10AM', 'NAP Mini Turf 1'),
  m('75', 'Mens Recreational', 'Rick Hensen FC', 'Winner of Match 73', 'SUNDAY', '2PM', 'NAP Mini Turf 1'),

  // ── Men's Over 40 ────────────────────────────────────────────────────────
  m('76', 'Mens Over 40', 'BC Tigers Waka', 'Akal FC', 'FRIDAY', '6PM', 'NAP 4A', 'Pool A'),
  m('77', 'Mens Over 40', 'Vancouver United', 'Vancouver Stars', 'FRIDAY', '7:30PM', 'NAP 4A', 'Pool A'),
  m('78', 'Mens Over 40', 'Winner of Match 76', 'Loser of Match 77', 'SATURDAY', '6PM', 'NAP 5A', 'Pool A'),
  m('79', 'Mens Over 40', 'Winner of Match 77', 'Loser of Match 76', 'SATURDAY', '7:30PM', 'NAP 4A', 'Pool A'),
  m('80', 'Mens Over 40', 'BC Tigers FC', 'Newton FC', 'FRIDAY', '7:30PM', 'NAP 5A', 'Pool B'),
  m('81', 'Mens Over 40', 'America All Stars', 'Newton FC', 'SATURDAY', '2PM', 'NAP 5A', 'Pool B'),
  m('82', 'Mens Over 40', 'America All Stars', 'BC Tigers FC', 'SATURDAY', '7:30PM', 'NAP 5A', 'Pool B'),
  m('83', 'Mens Over 40', 'Pool A 1st', 'Pool B 2nd', 'SUNDAY', '9AM', 'NAP 5 N', 'Semi-final'),
  m('84', 'Mens Over 40', 'Pool B 1st', 'Pool A 2nd', 'SUNDAY', '9AM', 'NAP 5A', 'Semi-final'),
  m('85', 'Mens Over 40', 'Winner of Pool A', 'Winner of Pool B', 'SUNDAY', '5PM', 'NAP 5A', 'Final'),

  // ── Men's Over 45 ────────────────────────────────────────────────────────
  m('86', 'Mens Over 45', 'Cloverdale FC', 'GVU A', 'FRIDAY', '6PM', 'NAP 5A'),
  m('87', 'Mens Over 45', 'GVU B', 'Loser of Match 84', 'SATURDAY', '4:30PM', 'NAP 5A'),
  m('88', 'Mens Over 45', 'GVU B', 'Winner of Match 84', 'SUNDAY', '3:30PM', 'NAP 5A'),

  // ── Boys U17 Div 1 ───────────────────────────────────────────────────────
  m('91', 'Boys U17 Div 1', 'AUSC', 'WCSC 2010', 'FRIDAY', '7:30PM', 'NAP 3', 'Pool A'),
  m('92', 'Boys U17 Div 1', 'AUSC TY', 'Surrey FC Corinthians 09', 'SATURDAY', '1:30PM', 'NAP 10', 'Pool A'),
  m('93', 'Boys U17 Div 1', 'Winner of Match 91', 'Loser of Match 92', 'SATURDAY', '6PM', 'Hjorth 1', 'Pool A'),
  m('94A', 'Boys U17 Div 1', 'Winner of Match 92', 'Loser of Match 91', 'SATURDAY', '6PM', 'Hjorth 2', 'Pool A'),
  m('94', 'Boys U17 Div 1', 'Akal', 'South Pacific', 'SATURDAY', '9AM', 'Hjorth 2', 'Pool B'),
  m('95', 'Boys U17 Div 1', 'AUSC Tommy', 'Loser of Match 94', 'SATURDAY', '1:30PM', 'NAP 9', 'Pool B'),
  m('96', 'Boys U17 Div 1', 'AUSC Tommy', 'Winner of Match 94', 'SATURDAY', '7:30PM', 'Hjorth 1', 'Pool B'),
  m('97', 'Boys U17 Div 1', 'Winner of Pool A', 'Winner of Pool B', 'SUNDAY', '12PM', 'NAP 7', 'Final'),

  // ── Boys U17 Div 2 ───────────────────────────────────────────────────────
  m('98', 'Boys U17 Div 2', 'SFC Eagles 09', 'FANCA', 'FRIDAY', '6PM', 'NAP 3', 'Pool A'),
  m('99', 'Boys U17 Div 2', 'BCT Lions 2009', 'Loser of Match 98', 'SATURDAY', '1:30PM', 'NAP 7', 'Pool A'),
  m('100', 'Boys U17 Div 2', 'BCT Lions 2009', 'Winner of Match 98', 'SATURDAY', '6PM', 'NAP 9', 'Pool A'),
  m('101', 'Boys U17 Div 2', 'Akal', 'NDFC', 'FRIDAY', '6PM', 'NAP 9', 'Pool B'),
  m('102', 'Boys U17 Div 2', 'BCT Kidsplay 2009', 'Loser of Match 101', 'SATURDAY', '3PM', 'NAP 6', 'Pool B'),
  m('103', 'Boys U17 Div 2', 'BCT Kidsplay 2009', 'Winner of Match 101', 'SATURDAY', '7:30PM', 'NAP 4', 'Pool B'),
  m('104', 'Boys U17 Div 2', 'Winner of Pool A', 'Winner of Pool B', 'SUNDAY', '12PM', 'NAP 8', 'Final'),

  // ── Boys U16 Div 2 ───────────────────────────────────────────────────────
  m('105', 'Boys U16 Div 2', 'SFC Raptors 10', 'BC Tigers 2010', 'FRIDAY', '6PM', 'NAP 4', 'Pool A'),
  m('106', 'Boys U16 Div 2', 'AUSC CMAC', 'Loser of Match 105', 'SATURDAY', '3PM', 'NAP 7', 'Pool A'),
  m('107', 'Boys U16 Div 2', 'AUSC CMAC', 'Winner of Match 105', 'SATURDAY', '7:30PM', 'NAP 6', 'Pool A'),
  m('109', 'Boys U16 Div 2', 'NDFC Blue 10', 'Coastal FC Thornton', 'SATURDAY', '9AM', 'NAP 3', 'Pool B'),
  m('110', 'Boys U16 Div 2', 'Akal', 'Loser of Match 109', 'SATURDAY', '1:30PM', 'NAP 2', 'Pool B'),
  m('111', 'Boys U16 Div 2', 'Akal', 'Winner of Match 109', 'SATURDAY', '6PM', 'NAP 6', 'Pool B'),
  m('112', 'Boys U16 Div 2', 'Winner of Pool A', 'Winner of Pool B', 'SUNDAY', '12PM', 'NAP 9', 'Final'),

  // ── Boys U15 Div 1 ───────────────────────────────────────────────────────
  m('113', 'Boys U15 Div 1', 'SFC Pegasus 11', 'WCSC 2011', 'SATURDAY', '9AM', 'NAP 9'),
  m('114', 'Boys U15 Div 1', 'BC Tigers 2011', 'GVU 2011', 'SATURDAY', '9AM', 'NAP 2'),
  m('115', 'Boys U15 Div 1', 'Winner of Match 113', 'Loser of Match 114', 'SATURDAY', '3PM', 'NAP 9'),
  m('116', 'Boys U15 Div 1', 'Winner of Match 114', 'Loser of Match 113', 'SATURDAY', '3PM', 'NAP 10'),
  m('117', 'Boys U15 Div 1', '1st Place', '2nd Place', 'SUNDAY', '2PM', 'NAP 2', 'Final'),

  // ── Boys U15 Div 2 ───────────────────────────────────────────────────────
  m('118', 'Boys U15 Div 2', 'BCT Lions 2011', 'SFC Flash 11', 'SATURDAY', '1:30PM', 'NAP 5'),
  m('119', 'Boys U15 Div 2', 'AUSC Bikram', 'Loser of Match 118', 'SUNDAY', '10:30AM', 'NAP 8'),
  m('120', 'Boys U15 Div 2', 'AUSC Bikram', 'Winner of Match 118', 'SUNDAY', '3:30PM', 'NAP 8'),

  // ── Boys U15 Div 3 ───────────────────────────────────────────────────────
  m('121', 'Boys U15 Div 3', 'Akal', 'SFC Ace 11', 'SATURDAY', '12PM', 'Hjorth 1'),
  m('122', 'Boys U15 Div 3', 'AUSC Avtar', 'BCT Jaguars 2011', 'SATURDAY', '12PM', 'NAP 3'),
  m('123', 'Boys U15 Div 3', 'Winner of Match 121', 'Loser of Match 122', 'SATURDAY', '4:30PM', 'NAP 9'),
  m('124', 'Boys U15 Div 3', 'Winner of Match 122', 'Loser of Match 121', 'SATURDAY', '4:30PM', 'NAP 10'),
  m('125', 'Boys U15 Div 3', '1st Place', '2nd Place', 'SUNDAY', '2PM', 'NAP 8', 'Final'),

  // ── Boys U14 Div 1/2 ─────────────────────────────────────────────────────
  m('131', 'Boys U14 Div 1/2', 'China (Kalme)', 'BC Tigers 2012', 'SATURDAY', '9AM', 'NAP 5', 'Pool A'),
  m('132', 'Boys U14 Div 1/2', 'SFC ACBC', 'Loser of Match 131', 'SATURDAY', '1:30PM', 'NAP 3', 'Pool A'),
  m('133', 'Boys U14 Div 1/2', 'SFC ACBC', 'Winner of Match 131', 'SATURDAY', '6PM', 'NAP 3', 'Pool A'),
  m('134', 'Boys U14 Div 1/2', 'SFC Elite 12', 'SUSC Inter', 'SATURDAY', '9AM', 'Hjorth 1', 'Pool B'),
  m('135', 'Boys U14 Div 1/2', 'BCT Pumas 2012', 'Loser of Match 134', 'SATURDAY', '1:30PM', 'NAP 4', 'Pool B'),
  m('136', 'Boys U14 Div 1/2', 'BCT Pumas 2012', 'Winner of Match 134', 'SATURDAY', '6PM', 'NAP 10', 'Pool B'),
  m('137', 'Boys U14 Div 1/2', 'Winner of Pool A', 'Winner of Pool B', 'SUNDAY', '2PM', 'NAP 7', 'Final'),

  // ── Boys U14 Div 3 ───────────────────────────────────────────────────────
  m('138', 'Boys U14 Div 3', 'SFC Whitecaps 12', 'Akal', 'FRIDAY', '6PM', 'NAP 10'),
  m('139', 'Boys U14 Div 3', 'SFC Fire 12', 'Sportify FC Power', 'SATURDAY', '10:30AM', 'NAP 3'),
  m('140', 'Boys U14 Div 3', 'Burnaby FC', 'SFC Whitecaps 12', 'SATURDAY', '3PM', 'NAP 3'),
  m('141', 'Boys U14 Div 3', 'Akal', 'SFC Fire 12', 'SATURDAY', '6PM', 'Strawberry Hill'),
  m('142', 'Boys U14 Div 3', 'Sportify FC Power', 'Burnaby FC', 'SUNDAY', '9AM', 'NAP 10'),
  m('142A', 'Boys U14 Div 3', '1st Place', '2nd Place', 'SUNDAY', '2PM', 'NAP 9', 'Final'),

  // ── Boys U13 Div 1 ───────────────────────────────────────────────────────
  m('143', 'Boys U13 Div 1', 'Sparkle FC', 'WCSC 2013', 'SATURDAY', '9AM', 'Strawberry Hill'),
  m('144', 'Boys U13 Div 1', 'CFC Galaxy', 'BC Tigers 2013', 'SATURDAY', '9AM', 'NAP 1'),
  m('145', 'Boys U13 Div 1', 'AUSC CMAC', 'Sparkle FC', 'SATURDAY', '1:30PM', 'NAP 6'),
  m('146', 'Boys U13 Div 1', 'WCSC 2013', 'CFC Galaxy', 'SATURDAY', '4:30PM', 'NAP 8'),
  m('147', 'Boys U13 Div 1', 'BC Tigers 2013', 'AUSC CMAC', 'SATURDAY', '6PM', 'NAP 5'),
  m('148', 'Boys U13 Div 1', '1st Place', '2nd Place', 'SUNDAY', '3:30PM', 'NAP 2', 'Final'),

  // ── Boys U13 Div 2 ───────────────────────────────────────────────────────
  m('149', 'Boys U13 Div 2', 'BCT Lions 2013', 'Akal', 'SATURDAY', '12PM', 'NAP 4'),
  m('150', 'Boys U13 Div 2', 'ASA', 'BCT Pumas 2013', 'SATURDAY', '4:30PM', 'NAP 7'),
  m('151', 'Boys U13 Div 2', 'Winner of Match 149', 'Loser of Match 150', 'SUNDAY', '10:30AM', 'NAP 10'),
  m('152', 'Boys U13 Div 2', 'Winner of Match 150', 'Loser of Match 149', 'SUNDAY', '9AM', 'NAP 3'),
  m('153', 'Boys U13 Div 2', '1st Place', '2nd Place', 'SUNDAY', '3:30PM', 'NAP 9', 'Final'),

  // ── Boys U13 Div 3 ───────────────────────────────────────────────────────
  m('154', 'Boys U13 Div 3', 'BCT Cheetahs 2013', 'Rise Academy', 'SATURDAY', '9AM', 'NAP 6'),
  m('155', 'Boys U13 Div 3', 'SFC Speed 13', 'BCT Panthers 2013', 'SATURDAY', '9AM', 'NAP 4'),
  m('156', 'Boys U13 Div 3', 'Surrey United Roma', 'BCT Cheetahs 2013', 'SATURDAY', '1:30PM', 'NAP 8'),
  m('157', 'Boys U13 Div 3', 'Rise Academy', 'SFC Speed 13', 'SATURDAY', '3PM', 'Strawberry Hill'),
  m('158', 'Boys U13 Div 3', 'BCT Panthers 2013', 'Surrey United Roma', 'SATURDAY', '6PM', 'NAP 4'),
  m('159', 'Boys U13 Div 3', '1st Place', '2nd Place', 'SUNDAY', '3:30PM', 'NAP 10', 'Final'),

  // ── Womens Open ──────────────────────────────────────────────────────────
  m('166', 'Womens Open', 'BCT Supra', 'SFC', 'SATURDAY', '1:30PM', 'NAP 1'),
  m('167', 'Womens Open', 'GVU', 'AUSC', 'SATURDAY', '3PM', 'NAP 4'),
  m('168', 'Womens Open', 'BC Tigers', 'BCT Supra', 'SATURDAY', '7:30PM', 'NAP 3'),
  m('169', 'Womens Open', 'SFC', 'GVU', 'SUNDAY', '10:30AM', 'NAP 2'),
  m('169A', 'Womens Open', 'AUSC', 'BC Tigers', 'SUNDAY', '10:30AM', 'NAP 3'),
  m('170', 'Womens Open', '1st Place', '2nd Place', 'SUNDAY', '3:30PM', 'NAP 1', 'Final'),

  // ── Girls U18 Div 1 ──────────────────────────────────────────────────────
  m('171', 'Girls U18 Div 1', 'North Surrey FC Elites', 'BC Tigers 2008', 'SATURDAY', '9AM', 'NAP 10'),
  m('172', 'Girls U18 Div 1', 'SFC Rangers 09', 'GVU 2009', 'SATURDAY', '10:30AM', 'Strawberry Hill'),
  m('173', 'Girls U18 Div 1', 'BC Tigers 2010', 'North Surrey FC Elites', 'SATURDAY', '3PM', 'NAP 5'),
  m('174', 'Girls U18 Div 1', 'BC Tigers 2008', 'SFC Rangers 09', 'SATURDAY', '3PM', 'NAP 1'),
  m('175', 'Girls U18 Div 1', 'GVU 2009', 'BC Tigers 2010', 'SATURDAY', '7:30PM', 'NAP 5'),
  m('176', 'Girls U18 Div 1', '1st Place', '2nd Place', 'SUNDAY', '12PM', 'NAP 2', 'Final'),

  // ── Girls U15 Div 1 ──────────────────────────────────────────────────────
  m('177', 'Girls U15 Div 1', 'SFC Phoenix 12', 'BC Tigers 2012', 'SATURDAY', '4:30PM', 'NAP 4'),
  m('178', 'Girls U15 Div 1', 'BC Tigers 2011', 'Loser of Match 177', 'SUNDAY', '9AM', 'NAP 9'),
  m('179', 'Girls U15 Div 1', 'BC Tigers 2011', 'Winner of Match 177', 'SUNDAY', '2PM', 'NAP 10'),

  // ── Girls U14 Div 2 ──────────────────────────────────────────────────────
  m('180', 'Girls U14 Div 2', 'RUFC Dynamite', 'GVU 2012', 'SATURDAY', '3PM', 'Hjorth 1'),
  m('181', 'Girls U14 Div 2', 'SUSC Brighton', 'BC Tigers 2013', 'SATURDAY', '3PM', 'NAP 2'),
  m('182', 'Girls U14 Div 2', 'Ross Street Raiders 2014', 'RUFC Dynamite', 'SATURDAY', '7:30PM', 'Hjorth 2'),
  m('183', 'Girls U14 Div 2', 'GVU 2012', 'SUSC Brighton', 'SUNDAY', '12PM', 'NAP 3'),
  m('184', 'Girls U14 Div 2', 'BC Tigers 2013', 'Ross Street Raiders 2014', 'SUNDAY', '12PM', 'NAP 10'),
  m('185', 'Girls U14 Div 2', '1st Place', '2nd Place', 'SUNDAY', '5PM', 'NAP 2', 'Final'),
];

/** Mini tournament (U5–U12) — July 4–5 */
const MINI_MATCHES: MatchTuple[] = [
  // U7 Boys
  m('1', 'U7 Boys', 'AUSC Vash', 'BC Tigers 2019', 'SUNDAY', '2PM', 'NAP 5 N1'),
  m('2', 'U7 Boys', 'Ross St. Raiders 2020', 'Akal', 'SUNDAY', '2PM', 'NAP 5 N2'),
  m('3', 'U7 Boys', 'GVU 2019', 'Rise Academy', 'SUNDAY', '2PM', 'NAP 5 N3'),
  m('4', 'U7 Boys', 'BCT Lions 2019', 'Rise Academy', 'SUNDAY', '4PM', 'NAP 5 N1'),
  m('5', 'U7 Boys', 'AUSC Vash', 'Ross St. Raiders 2020', 'SUNDAY', '5PM', 'NAP 5 N1'),
  m('6', 'U7 Boys', 'GVU 2019', 'BC Tigers 2019', 'SUNDAY', '5PM', 'NAP 5 N2'),
  m('6A', 'U7 Boys', 'BCT Lions 2019', 'Akal', 'SUNDAY', '6PM', 'NAP 5 N1'),

  // U8 Boys Div 1/2
  m('7', 'U8 Boys Div 1/2', 'BC Tigers 2018', 'AUSC Karandeep', 'SUNDAY', '10AM', 'NAP 3A'),
  m('8', 'U8 Boys Div 1/2', 'Rise Academy', 'GVU 2018', 'SUNDAY', '11AM', 'NAP 3A'),
  m('9', 'U8 Boys Div 1/2', 'GVU 2018', 'BC Tigers 2018', 'SUNDAY', '2PM', 'NAP 3A'),
  m('10', 'U8 Boys Div 1/2', 'AUSC Karandeep', 'Rise Academy', 'SUNDAY', '3PM', 'NAP 3A'),

  // U8 Boys Div 3
  m('11', 'U8 Boys Div 3', 'Akal', 'BCT Lions 2018', 'SUNDAY', '9AM', 'NAP 3A'),
  m('12', 'U8 Boys Div 3', 'Rise Academy', 'BCT Jaguars 2018', 'SUNDAY', '12PM', 'NAP 3A'),
  m('13', 'U8 Boys Div 3', 'AUSC Bal', 'Akal', 'SUNDAY', '1PM', 'NAP 3A'),
  m('14', 'U8 Boys Div 3', 'BCT Lions 2018', 'Rise Academy', 'SUNDAY', '4PM', 'NAP 3A'),
  m('15', 'U8 Boys Div 3', 'BCT Jaguars 2018', 'AUSC Bal', 'SUNDAY', '5PM', 'NAP 3A'),

  // U9 Boys Div 2
  m('21', 'U9 Boys Div 2', 'GVU 2017', 'Rise Academy', 'SUNDAY', '9AM', 'NAP 4 N'),
  m('22', 'U9 Boys Div 2', 'AUSC Brady', 'BC Tigers 2017', 'SUNDAY', '9AM', 'NAP 4 S'),
  m('23', 'U9 Boys Div 2', 'Rise Academy', 'AUSC Brady', 'SUNDAY', '12PM', 'NAP 5A'),
  m('24', 'U9 Boys Div 2', 'BC Tigers 2017', 'GVU 2017', 'SUNDAY', '3PM', 'NAP 5 S'),

  // U9 Boys Div 3
  m('25', 'U9 Boys Div 3', 'BCT Lions 2017', 'AUSC Gary', 'SATURDAY', '12PM', 'NAP 4A'),
  m('26', 'U9 Boys Div 3', 'Akal', 'BCT Jaguars 2017', 'SATURDAY', '1PM', 'NAP 4A'),
  m('27', 'U9 Boys Div 3', 'AUSC Gary', 'BCT Jaguars 2017', 'SATURDAY', '4PM', 'NAP 4A'),
  m('28', 'U9 Boys Div 3', 'BCT Lions 2017', 'Akal', 'SATURDAY', '5PM', 'NAP 4A'),

  // U10 Boys Div 1
  m('31', 'U10 Boys Div 1', 'SFC United 2016', 'WCSC 2016', 'SATURDAY', '10AM', 'NAP Mini Turf 1'),
  m('32', 'U10 Boys Div 1', 'AUSC Gurdeep', 'BC Tigers 2016', 'SATURDAY', '11AM', 'NAP Mini Turf 1'),
  m('33', 'U10 Boys Div 1', 'WCSC 2016', 'BC Tigers 2016', 'SATURDAY', '4PM', 'NAP Mini Turf 1'),
  m('34', 'U10 Boys Div 1', 'SFC United 2016', 'AUSC Gurdeep', 'SATURDAY', '2PM', 'NAP Mini Turf 1'),

  // U10 Boys Div 2
  m('35', 'U10 Boys Div 2', 'GVU 2016', 'BCT Lions 2016', 'SATURDAY', '12PM', 'NAP Mini Turf 1'),
  m('36', 'U10 Boys Div 2', 'BCT Jaguars 2016', 'GVU 2016', 'SATURDAY', '3PM', 'NAP Mini Turf 1'),
  m('37', 'U10 Boys Div 2', 'BCT Lions 2016', 'BCT Jaguars 2016', 'SATURDAY', '6PM', 'NAP Mini Turf 1'),

  // U10 Boys Div 3
  m('38', 'U10 Boys Div 3', 'BCT Pumas 2016', 'SFC Panthers 16', 'SUNDAY', '9AM', 'NAP Mini Turf 1'),
  m('39', 'U10 Boys Div 3', 'Akal', 'BCT Cheetahs 2016', 'SUNDAY', '11AM', 'NAP Mini Turf 1'),
  m('40', 'U10 Boys Div 3', 'SFC Black', 'BCT Panthers 2016', 'SUNDAY', '12PM', 'NAP Mini Turf 1'),
  m('41', 'U10 Boys Div 3', 'SFC Panthers 16', 'BCT Cheetahs 2016', 'SUNDAY', '1PM', 'NAP Mini Turf 1'),
  m('42', 'U10 Boys Div 3', 'BCT Panthers 2016', 'Akal', 'SUNDAY', '3PM', 'NAP Mini Turf 1'),
  m('43', 'U10 Boys Div 3', 'SFC Black', 'BCT Pumas 2016', 'SUNDAY', '4PM', 'NAP Mini Turf 1'),

  // U11 Boys Div 1
  m('51', 'U11 Boys Div 1', 'Evolve 2015', 'SFC Amar 2016', 'SUNDAY', '11AM', 'NAP 5 S'),
  m('52', 'U11 Boys Div 1', 'BFC Golden Eagles', 'Rise Academy', 'SUNDAY', '12PM', 'NAP 4 S'),
  m('53', 'U11 Boys Div 1', 'SFC Pegasus 15', 'WCSC 2015', 'SUNDAY', '12PM', 'NAP 4 N'),
  m('54', 'U11 Boys Div 1', 'BC Tigers 2015', 'AUSC Vash', 'SUNDAY', '12PM', 'NAP 4A'),
  m('55', 'U11 Boys Div 1', 'AUSC Vash', 'BFC Golden Eagles', 'SUNDAY', '3PM', 'NAP 4 S'),
  m('56', 'U11 Boys Div 1', 'Rise Academy', 'SFC Pegasus 15', 'SUNDAY', '3PM', 'NAP 4 N'),
  m('56A', 'U11 Boys Div 1', 'WCSC 2015', 'SFC Amar 2016', 'SUNDAY', '3PM', 'NAP 4A'),
  m('56B', 'U11 Boys Div 1', 'BC Tigers 2015', 'Evolve 2015', 'SUNDAY', '5PM', 'NAP 4 N'),

  // U11 Boys Div 2
  m('57', 'U11 Boys Div 2', 'RUFC Dynamite', 'AUSC Brady', 'SUNDAY', '10AM', 'NAP 4 S'),
  m('58', 'U11 Boys Div 2', 'SUSC Rangers', 'BCT Cheetahs 2015', 'SUNDAY', '10AM', 'NAP 4 N'),
  m('59', 'U11 Boys Div 2', 'BN Sports', 'AUSC Vickey', 'SUNDAY', '10AM', 'NAP 4A'),
  m('60', 'U11 Boys Div 2', 'N.Westminster Crushers', 'SFC Knights 15', 'SUNDAY', '10AM', 'NAP 5 S'),
  m('61', 'U11 Boys Div 2', 'SFC Knights 15', 'AUSC Brady', 'SUNDAY', '1PM', 'NAP 4 S'),
  m('62', 'U11 Boys Div 2', 'BCT Cheetahs 2015', 'RUFC Dynamite', 'SUNDAY', '1PM', 'NAP 4 N'),
  m('63', 'U11 Boys Div 2', 'SUSC Rangers', 'BN Sports', 'SUNDAY', '1PM', 'NAP 4A'),
  m('63A', 'U11 Boys Div 2', 'AUSC Vickey', 'N.Westminster Crushers', 'SUNDAY', '4PM', 'NAP 4 S'),

  // U11 Boys Div 3
  m('64', 'U11 Boys Div 3', 'Surrey United Sporting', 'BCT Jaguars 2015', 'SUNDAY', '11AM', 'NAP 4 S'),
  m('65', 'U11 Boys Div 3', 'AUSC Sher', 'BCT Lions 2015', 'SUNDAY', '11AM', 'NAP 4 N'),
  m('66', 'U11 Boys Div 3', 'GVU 2015', 'SFC Royal 15', 'SUNDAY', '11AM', 'NAP 4A'),
  m('67', 'U11 Boys Div 3', 'Akal', 'BCT Pumas 2015', 'SUNDAY', '11AM', 'NAP 5A'),
  m('68', 'U11 Boys Div 3', 'Surrey United Sporting', 'BCT Lions 2015', 'SUNDAY', '2PM', 'NAP 4 S'),
  m('69', 'U11 Boys Div 3', 'SFC Royal 15', 'AUSC Sher', 'SUNDAY', '2PM', 'NAP 4 N'),
  m('70', 'U11 Boys Div 3', 'BCT Jaguars 2015', 'Akal', 'SUNDAY', '2PM', 'NAP 4A'),
  m('71', 'U11 Boys Div 3', 'BCT Pumas 2015', 'GVU 2015', 'SUNDAY', '2PM', 'NAP 5A'),

  // U12 Boys Div 1
  m('76', 'U12 Boys Div 1', 'WCSC 2014', 'Evolve FA', 'SUNDAY', '10AM', 'NAP 6 S'),
  m('77', 'U12 Boys Div 1', 'BC Tigers 2014', 'NVFC A.S.H', 'SUNDAY', '1PM', 'NAP 5 S'),
  m('78', 'U12 Boys Div 1', 'AUSC Joelen', 'Evolve FA', 'SUNDAY', '1PM', 'NAP 5 N'),
  m('79', 'U12 Boys Div 1', 'BC Tigers 2014', 'WCSC 2014', 'SUNDAY', '4PM', 'NAP 5 S'),
  m('80', 'U12 Boys Div 1', 'AUSC Joelen', 'NVFC A.S.H', 'SUNDAY', '5PM', 'NAP 5 S'),

  // U12 Boys Div 2
  m('80A', 'U12 Boys Div 2', 'GVU 2014', 'SFC United 14', 'SUNDAY', '9AM', 'NAP 5 S'),
  m('81', 'U12 Boys Div 2', 'SFC Liverpool', 'BCT Lions 2014', 'SUNDAY', '9AM', 'NAP 5 N'),
  m('82', 'U12 Boys Div 2', 'BCT Jaguars 2014', 'AUSC Sahij', 'SUNDAY', '12PM', 'NAP 5 S'),
  m('83', 'U12 Boys Div 2', 'BCT Panthers 2014', 'GVU 2014', 'SUNDAY', '12PM', 'NAP 5 N'),
  m('84', 'U12 Boys Div 2', 'SFC United 14', 'BCT Lions 2014', 'SUNDAY', '2PM', 'NAP 5 S'),
  m('85', 'U12 Boys Div 2', 'BCT Jaguars 2014', 'SFC Liverpool', 'SUNDAY', '4PM', 'NAP 4A'),
  m('86', 'U12 Boys Div 2', 'AUSC Sahij', 'BCT Panthers 2014', 'SUNDAY', '4PM', 'NAP 4 N'),

  // U12 Boys Div 3
  m('87', 'U12 Boys Div 3', 'Sportify FC Raptors', 'SFC Rangers 14', 'SUNDAY', '11AM', 'NAP 6 N'),
  m('88', 'U12 Boys Div 3', 'BCT Cheetahs 2014', 'Akal', 'SUNDAY', '11AM', 'NAP 6 S'),
  m('89', 'U12 Boys Div 3', 'SFC Rangers 14', 'Akal', 'SUNDAY', '2PM', 'NAP 6 N'),
  m('90', 'U12 Boys Div 3', 'BCT Cheetahs 2014', 'Sportify FC Raptors', 'SUNDAY', '2PM', 'NAP 6 S'),

  // U9 Girls Div 3
  m('101', 'U9 Girls Div 3', 'Burnaby FC', 'Albion Sunsets', 'SUNDAY', '12PM', 'NAP 6 N'),
  m('102', 'U9 Girls Div 3', 'BC Tigers 2017', 'Burnaby FC', 'SUNDAY', '3PM', 'NAP 6 N'),
  m('103', 'U9 Girls Div 3', 'Albion Sunsets', 'BC Tigers 2017', 'SUNDAY', '5PM', 'NAP 6 N'),

  // U10 Girls Div 2/3
  m('104', 'U10 Girls Div 2/3', 'SFC Pegasus 16', 'Rise Academy 2016', 'SUNDAY', '10AM', 'NAP 6 N'),
  m('105', 'U10 Girls Div 2/3', 'Ross Street Raiders 2017', 'SFC Pegasus 16', 'SUNDAY', '1PM', 'NAP 6 N'),
  m('106', 'U10 Girls Div 2/3', 'Rise Academy 2016', 'Ross Street Raiders 2017', 'SUNDAY', '4PM', 'NAP 6 N'),

  // U11/12 Girls Div 2/3
  m('107', 'U11/12 Girls Div 2/3', 'Akal', 'BC Tigers 2015', 'SUNDAY', '12PM', 'NAP 6 S'),
  m('108', 'U11/12 Girls Div 2/3', 'BC Tigers 2014', 'Langley United Eagles', 'SUNDAY', '1PM', 'NAP 6 S'),
  m('109', 'U11/12 Girls Div 2/3', 'GVU 2014', 'BC Tigers 2015', 'SUNDAY', '3PM', 'NAP 6 S'),
  m('110', 'U11/12 Girls Div 2/3', 'Langley United Eagles', 'Akal', 'SUNDAY', '4PM', 'NAP 6 S'),
  m('111', 'U11/12 Girls Div 2/3', 'BC Tigers 2014', 'GVU 2014', 'SUNDAY', '5PM', 'NAP 6 S'),
];

const PRIZE_NOTES: Record<string, string> = {
  'Mens Premier': '1st $15,000 · 2nd $7,000 + trophies & medals',
  'Mens Gold Div 1': '1st $5,000 · 2nd $3,000 + trophies & medals',
  'Mens Silver Div 2': '1st $2,000 · 2nd $1,000 + trophies & medals',
  'Mens Bronze Div 3': '1st $750 · 2nd $400 + trophies & medals',
  'Mens Recreational': 'Medals — winners & finalists',
  'Mens Over 40': 'Trophy & medals — winners & finalists',
  'Mens Over 45': 'Trophy & medals — winners & finalists',
};

const FORMAT_NOTES: Record<string, string> = {
  'Mens Premier': '11-a-side · Round Robin + Knockout',
  'Mens Gold Div 1': '11-a-side · Pool play + Knockout',
  'Mens Silver Div 2': '11-a-side · Pool play + Knockout',
  'Mens Bronze Div 3': '11-a-side · Pool play + Final',
  'Mens Recreational': '6-a-side recreational',
  'Mens Over 40': '8-a-side masters',
  'Mens Over 45': '8-a-side masters · 25-minute halves',
};

function tuplesToRaw(tuples: MatchTuple[]): RawMatchLine[] {
  return tuples.map(([num, division, home, away, day, time, field, matchType]) => ({
    num,
    division,
    home,
    away,
    day,
    time,
    field,
    matchType,
  }));
}

function groupByDivision(tuples: MatchTuple[]): Map<string, ParsedMatch[]> {
  const groups = new Map<string, ParsedMatch[]>();
  for (const raw of tuplesToRaw(tuples)) {
    const parsed = parseMatchLine(raw);
    const list = groups.get(raw.division) ?? [];
    list.push(parsed);
    groups.set(raw.division, list);
  }
  return groups;
}

export interface MiriPiriDivisionSeed {
  name: string;
  slug: string;
  age_group: string;
  gender: Gender;
  format: string;
  prize_note: string;
  teams: string[];
  matches: ParsedMatch[];
  schedule_only: boolean;
  seedMatches: boolean;
  usesUsfaScoring: boolean;
}

function buildDivisionSeed(name: string, matches: ParsedMatch[]): MiriPiriDivisionSeed {
  const teams = collectTeams(matches);
  const ageGroup = inferAgeGroup(name);
  const isMini = /\bU\d+\b/.test(name) && !name.includes('U13') && !name.includes('U14') && !name.includes('U15') && !name.includes('U16') && !name.includes('U17') && !name.includes('U18');
  const isYouthGirls = name.includes('Girls');
  const isAdultCompetitive = ['Mens Premier', 'Mens Gold Div 1', 'Mens Silver Div 2'].includes(name);
  const isU13Plus = /\bU1[3-8]\b/.test(name) && name.includes('Boys');

  return {
    name,
    slug: slugifyDivision(name),
    age_group: ageGroup,
    gender: inferGender(name) as Gender,
    format: FORMAT_NOTES[name] ?? (isMini || isYouthGirls ? 'Mini soccer · round robin' : 'Tournament format'),
    prize_note:
      PRIZE_NOTES[name] ??
      (isMini || isYouthGirls || ageGroup.startsWith('U')
        ? 'Participation medals for all players'
        : 'Tournament placement'),
    teams,
    matches,
    schedule_only: isScheduleOnly(name) || isMini || isYouthGirls,
    seedMatches: true,
    usesUsfaScoring: isAdultCompetitive || isU13Plus,
  };
}

function buildAllDivisions(): MiriPiriDivisionSeed[] {
  const allGroups = new Map<string, ParsedMatch[]>();

  for (const [name, matches] of groupByDivision(MAIN_MATCHES)) {
    allGroups.set(name, matches);
  }
  for (const [name, matches] of groupByDivision(MINI_MATCHES)) {
    const existing = allGroups.get(name) ?? [];
    allGroups.set(name, [...existing, ...matches]);
  }

  return [...allGroups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, matches]) => buildDivisionSeed(name, matches));
}

export const MIRI_PIRI_2026_DIVISIONS: MiriPiriDivisionSeed[] = buildAllDivisions();

export const MIRI_PIRI_2026_FIELDS = [
  'NAP 1',
  'NAP 2',
  'NAP 3',
  'NAP 4',
  'NAP 5',
  'NAP 6',
  'NAP 7',
  'NAP 8',
  'NAP 9',
  'NAP 10',
  'NAP 3A',
  'NAP 4A',
  'NAP 4 N',
  'NAP 4 S',
  'NAP 4A',
  'NAP 5 N',
  'NAP 5 S',
  'NAP 5 N1',
  'NAP 5 N2',
  'NAP 5 N3',
  'NAP 5A',
  'NAP 6 S',
  'NAP 6 N',
  'NAP Mini Turf 1',
  'Bear Creek',
  'Strawberry Hill',
  'Hjorth 1',
  'Hjorth 2',
] as const;

export function validateMiriPiri2026Data(): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const div of MIRI_PIRI_2026_DIVISIONS) {
    issues.push(...validateDivision(div.slug, div.teams, div.matches));

    if (div.matches.length === 0) {
      issues.push({ level: 'error', message: `${div.name}: no matches` });
    }

    const realTeams = div.teams.filter(
      (t) =>
        !/^(winner|loser|pool|quarter|1st|2nd|\d+(st|nd))/i.test(t) &&
        !t.includes('Place') &&
        !t.includes('Finalist'),
    );
    if (realTeams.length > 16) {
      issues.push({
        level: 'warn',
        message: `${div.name}: ${realTeams.length} registered teams exceeds 16-team cap`,
      });
    }
  }

  return issues;
}

export function assertValidMiriPiri2026Data(): void {
  const issues = validateMiriPiri2026Data();
  const errors = issues.filter((i) => i.level === 'error');
  const warnings = issues.filter((i) => i.level === 'warn');

  if (warnings.length) {
    console.warn(`  Schedule validation: ${warnings.length} warning(s)`);
    for (const w of warnings) console.warn(`    ⚠ ${w.message}`);
  }

  if (errors.length) {
    console.error(`  Schedule validation FAILED: ${errors.length} error(s)`);
    for (const e of errors) console.error(`    ✗ ${e.message}`);
    throw new Error(`Miri Piri 2026 seed data validation failed (${errors.length} errors)`);
  }

  console.log(
    `  Schedule validation passed: ${MIRI_PIRI_2026_DIVISIONS.length} divisions, ` +
      `${MIRI_PIRI_2026_DIVISIONS.reduce((n, d) => n + d.matches.length, 0)} matches, ` +
      `${new Set(MIRI_PIRI_2026_DIVISIONS.flatMap((d) => d.teams)).size} unique teams`,
  );
}
