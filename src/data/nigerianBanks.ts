export interface NigerianBank {
  id: string;
  name: string;
  code: string;
  category: 'fintech' | 'commercial' | 'microfinance';
  popular?: boolean;
  color?: string;
  logoInitial: string;
}

export const NIGERIAN_BANKS: NigerianBank[] = [
  // Top Fintechs & Digital Banks (Highly popular with students and campus sellers)
  {
    id: 'opay',
    name: 'OPay (PayCom)',
    code: '999992',
    category: 'fintech',
    popular: true,
    color: '#00B875',
    logoInitial: 'OP'
  },
  {
    id: 'palmpay',
    name: 'PalmPay',
    code: '999991',
    category: 'fintech',
    popular: true,
    color: '#6523EB',
    logoInitial: 'PP'
  },
  {
    id: 'moniepoint',
    name: 'Moniepoint Microfinance Bank',
    code: '50515',
    category: 'fintech',
    popular: true,
    color: '#0366D6',
    logoInitial: 'MP'
  },
  {
    id: 'kuda',
    name: 'Kuda Bank',
    code: '50211',
    category: 'fintech',
    popular: true,
    color: '#40196D',
    logoInitial: 'KD'
  },
  {
    id: 'fairmoney',
    name: 'FairMoney Microfinance Bank',
    code: '51318',
    category: 'fintech',
    popular: true,
    color: '#0052FF',
    logoInitial: 'FM'
  },
  {
    id: 'vfd',
    name: 'VFD Microfinance Bank (VBank)',
    code: '566',
    category: 'fintech',
    popular: false,
    color: '#E60000',
    logoInitial: 'VF'
  },
  {
    id: 'carbon',
    name: 'Carbon',
    code: '565',
    category: 'fintech',
    popular: false,
    color: '#4A154B',
    logoInitial: 'CB'
  },

  // Major Commercial Banks in Nigeria
  {
    id: 'access',
    name: 'Access Bank',
    code: '044',
    category: 'commercial',
    popular: true,
    color: '#F47920',
    logoInitial: 'AC'
  },
  {
    id: 'gtbank',
    name: 'Guaranty Trust Bank (GTBank / GTCO)',
    code: '058',
    category: 'commercial',
    popular: true,
    color: '#E03C00',
    logoInitial: 'GT'
  },
  {
    id: 'zenith',
    name: 'Zenith Bank',
    code: '057',
    category: 'commercial',
    popular: true,
    color: '#CC0000',
    logoInitial: 'ZB'
  },
  {
    id: 'firstbank',
    name: 'First Bank of Nigeria',
    code: '011',
    category: 'commercial',
    popular: true,
    color: '#133968',
    logoInitial: 'FB'
  },
  {
    id: 'uba',
    name: 'United Bank for Africa (UBA)',
    code: '033',
    category: 'commercial',
    popular: true,
    color: '#D4141E',
    logoInitial: 'UB'
  },
  {
    id: 'fcmb',
    name: 'First City Monument Bank (FCMB)',
    code: '214',
    category: 'commercial',
    popular: true,
    color: '#5C2D91',
    logoInitial: 'FC'
  },
  {
    id: 'stanbic',
    name: 'Stanbic IBTC Bank',
    code: '221',
    category: 'commercial',
    popular: true,
    color: '#0033A0',
    logoInitial: 'SB'
  },
  {
    id: 'fidelity',
    name: 'Fidelity Bank',
    code: '070',
    category: 'commercial',
    popular: false,
    color: '#1A337E',
    logoInitial: 'FD'
  },
  {
    id: 'sterling',
    name: 'Sterling Bank',
    code: '232',
    category: 'commercial',
    popular: false,
    color: '#9C1A1C',
    logoInitial: 'ST'
  },
  {
    id: 'union',
    name: 'Union Bank of Nigeria',
    code: '032',
    category: 'commercial',
    popular: false,
    color: '#0099DA',
    logoInitial: 'UN'
  },
  {
    id: 'wema',
    name: 'Wema Bank (ALAT)',
    code: '035',
    category: 'commercial',
    popular: true,
    color: '#931B58',
    logoInitial: 'WM'
  },
  {
    id: 'polaris',
    name: 'Polaris Bank',
    code: '076',
    category: 'commercial',
    popular: false,
    color: '#652D90',
    logoInitial: 'PL'
  },
  {
    id: 'keystone',
    name: 'Keystone Bank',
    code: '082',
    category: 'commercial',
    popular: false,
    color: '#004B87',
    logoInitial: 'KS'
  },
  {
    id: 'providus',
    name: 'Providus Bank',
    code: '101',
    category: 'commercial',
    popular: false,
    color: '#FDB913',
    logoInitial: 'PV'
  },
  {
    id: 'ecobank',
    name: 'Ecobank Nigeria',
    code: '050',
    category: 'commercial',
    popular: false,
    color: '#005DAB',
    logoInitial: 'EB'
  },
  {
    id: 'jaiz',
    name: 'Jaiz Bank',
    code: '301',
    category: 'commercial',
    popular: false,
    color: '#008752',
    logoInitial: 'JZ'
  },
  {
    id: 'taj',
    name: 'TAJ Bank',
    code: '302',
    category: 'commercial',
    popular: false,
    color: '#B71C1C',
    logoInitial: 'TJ'
  },
  {
    id: 'lotus',
    name: 'Lotus Bank',
    code: '303',
    category: 'commercial',
    popular: false,
    color: '#2E7D32',
    logoInitial: 'LT'
  },
  {
    id: 'unity',
    name: 'Unity Bank',
    code: '215',
    category: 'commercial',
    popular: false,
    color: '#EF7D00',
    logoInitial: 'UT'
  },
  {
    id: 'titan',
    name: 'Titan Trust Bank',
    code: '102',
    category: 'commercial',
    popular: false,
    color: '#003A70',
    logoInitial: 'TT'
  },
  {
    id: 'premiumtrust',
    name: 'Premium Trust Bank',
    code: '105',
    category: 'commercial',
    popular: false,
    color: '#D4AF37',
    logoInitial: 'PT'
  },
  {
    id: 'optimus',
    name: 'Optimus Bank',
    code: '107',
    category: 'commercial',
    popular: false,
    color: '#1B5E20',
    logoInitial: 'OP'
  }
];

export function searchNigerianBanks(query: string): NigerianBank[] {
  if (!query.trim()) return NIGERIAN_BANKS;
  const q = query.toLowerCase().trim();
  return NIGERIAN_BANKS.filter(
    (b) =>
      b.name.toLowerCase().includes(q) ||
      b.code.includes(q) ||
      b.id.toLowerCase().includes(q)
  );
}
