import { BusStop } from '../types';

/**
 * Curated database of Singapore bus stops covering key transport interchanges,
 * MRT stations, tourist landmarks, airport terminals, and residential towns.
 */
export const SINGAPORE_BUS_STOPS: BusStop[] = [
  // Changi Airport & East (including 83139 from LTA API prompt)
  {
    code: '83139',
    roadName: 'PTB2 B/ment',
    description: 'Aft Changi Airport PTB2',
    latitude: 1.3547,
    longitude: 103.9893,
  },
  {
    code: '95029',
    roadName: 'Airport Blvd',
    description: 'Changi Airport PTB1',
    latitude: 1.3619,
    longitude: 103.9897,
  },
  {
    code: '95109',
    roadName: 'Airport Blvd',
    description: 'Changi Airport PTB3',
    latitude: 1.3564,
    longitude: 103.9868,
  },
  {
    code: '84009',
    roadName: 'Bedok Nth Dr',
    description: 'Bedok Bus Interchange',
    latitude: 1.3242,
    longitude: 103.9298,
  },
  {
    code: '84039',
    roadName: 'New Upp Changi Rd',
    description: 'Bedok Stn Exit B',
    latitude: 1.3235,
    longitude: 103.9312,
  },
  {
    code: '84031',
    roadName: 'New Upp Changi Rd',
    description: 'Bedok Stn Exit A',
    latitude: 1.3241,
    longitude: 103.9304,
  },
  {
    code: '76009',
    roadName: 'Tampines Ave 7',
    description: 'Tampines East Stn Exit B',
    latitude: 1.3562,
    longitude: 103.9554,
  },
  {
    code: '75009',
    roadName: 'Tampines Central 1',
    description: 'Tampines Bus Interchange',
    latitude: 1.3533,
    longitude: 103.9443,
  },
  {
    code: '77009',
    roadName: 'Pasir Ris Central',
    description: 'Pasir Ris Bus Interchange',
    latitude: 1.3731,
    longitude: 103.9493,
  },
  {
    code: '82009',
    roadName: 'Eunos Rd 2',
    description: 'Eunos Bus Interchange',
    latitude: 1.3197,
    longitude: 103.9031,
  },
  {
    code: '81119',
    roadName: 'Paya Lebar Rd',
    description: 'Paya Lebar Stn Exit B',
    latitude: 1.3178,
    longitude: 103.8929,
  },
  {
    code: '80059',
    roadName: 'Aljunied Rd',
    description: 'Aljunied Stn',
    latitude: 1.3164,
    longitude: 103.8828,
  },

  // Central / Orchard / Bugis / Marina Bay / Chinatown
  {
    code: '09048',
    roadName: 'Orchard Rd',
    description: 'Orchard Stn / Lucky Plaza',
    latitude: 1.3044,
    longitude: 103.8341,
  },
  {
    code: '09022',
    roadName: 'Orchard Rd',
    description: 'Orchard Stn / Tang Plaza',
    latitude: 1.3052,
    longitude: 103.8327,
  },
  {
    code: '09037',
    roadName: 'Orchard Turn',
    description: 'Opp Ngee Ann City',
    latitude: 1.3028,
    longitude: 103.8358,
  },
  {
    code: '08057',
    roadName: 'Orchard Rd',
    description: 'Dhoby Ghaut Stn Exit B',
    latitude: 1.2991,
    longitude: 103.8458,
  },
  {
    code: '01012',
    roadName: 'Bras Basah Rd',
    description: 'Hotel Rendezvous / Bencoolen',
    latitude: 1.2982,
    longitude: 103.8504,
  },
  {
    code: '01112',
    roadName: 'Victoria St',
    description: 'Bugis Stn Exit D',
    latitude: 1.3005,
    longitude: 103.8561,
  },
  {
    code: '01119',
    roadName: 'Victoria St',
    description: 'Bugis Stn Exit A',
    latitude: 1.3012,
    longitude: 103.8552,
  },
  {
    code: '03218',
    roadName: 'North Bridge Rd',
    description: 'Opp The Treasury / City Hall Stn',
    latitude: 1.2917,
    longitude: 103.8508,
  },
  {
    code: '04121',
    roadName: 'Eu Tong Sen St',
    description: 'Clarke Quay Stn Exit E',
    latitude: 1.2882,
    longitude: 103.8465,
  },
  {
    code: '05013',
    roadName: 'Eu Tong Sen St',
    description: 'Chinatown Stn Exit E',
    latitude: 1.2847,
    longitude: 103.8441,
  },
  {
    code: '03509',
    roadName: 'Bayfront Ave',
    description: 'Marina Bay Sands Theatre',
    latitude: 1.2838,
    longitude: 103.8589,
  },
  {
    code: '03511',
    roadName: 'Bayfront Ave',
    description: 'Marina Bay Sands Hotel',
    latitude: 1.2829,
    longitude: 103.8601,
  },
  {
    code: '02151',
    roadName: 'Raffles Ave',
    description: 'The Float @ Marina Bay',
    latitude: 1.2898,
    longitude: 103.8584,
  },
  {
    code: '02111',
    roadName: 'Temasek Blvd',
    description: 'Suntec Convention Ctr / Promenade',
    latitude: 1.2934,
    longitude: 103.8576,
  },
  {
    code: '03019',
    roadName: 'Collyer Quay',
    description: 'Raffles Place Stn Exit B',
    latitude: 1.2835,
    longitude: 103.8524,
  },

  // South / HarbourFront / Queenstown
  {
    code: '14141',
    roadName: 'Telok Blangah Rd',
    description: 'HarbourFront Stn / Vivocity',
    latitude: 1.2653,
    longitude: 103.8219,
  },
  {
    code: '14119',
    roadName: 'Telok Blangah Rd',
    description: 'Opp Vivocity',
    latitude: 1.2646,
    longitude: 103.8228,
  },
  {
    code: '11009',
    roadName: 'Commonwealth Ave',
    description: 'Queenstown Stn Exit A',
    latitude: 1.2946,
    longitude: 103.8059,
  },
  {
    code: '11019',
    roadName: 'Commonwealth Ave',
    description: 'Commonwealth Stn Exit B',
    latitude: 1.3023,
    longitude: 103.7981,
  },
  {
    code: '18141',
    roadName: 'North Buona Vista Rd',
    description: 'Buona Vista Stn Exit C',
    latitude: 1.3072,
    longitude: 103.7901,
  },

  // West / Jurong / Clementi / Boon Lay
  {
    code: '28009',
    roadName: 'Jurong Gateway Rd',
    description: 'Jurong East Bus Interchange',
    latitude: 1.3336,
    longitude: 103.7423,
  },
  {
    code: '28201',
    roadName: 'Jurong Gateway Rd',
    description: 'JEM / Opp Jurong East Stn',
    latitude: 1.3331,
    longitude: 103.7436,
  },
  {
    code: '17009',
    roadName: 'Clementi Ave 3',
    description: 'Clementi Bus Interchange',
    latitude: 1.3151,
    longitude: 103.7652,
  },
  {
    code: '17179',
    roadName: 'Commonwealth Ave West',
    description: 'Clementi Stn Exit A',
    latitude: 1.3155,
    longitude: 103.7663,
  },
  {
    code: '22009',
    roadName: 'Jurong West Ctrl 3',
    description: 'Boon Lay Bus Interchange',
    latitude: 1.3392,
    longitude: 103.7058,
  },
  {
    code: '44009',
    roadName: 'Bukit Batok Ctrl',
    description: 'Bukit Batok Bus Interchange',
    latitude: 1.3496,
    longitude: 103.7495,
  },

  // North & North-West / Woodlands / Yishun / Choa Chu Kang / Bukit Panjang
  {
    code: '46009',
    roadName: 'Woodlands Sq',
    description: 'Woodlands Integrated Transport Hub',
    latitude: 1.4368,
    longitude: 103.7865,
  },
  {
    code: '46279',
    roadName: 'Woodlands Ave 3',
    description: 'Marsiling Stn',
    latitude: 1.4326,
    longitude: 103.7741,
  },
  {
    code: '59009',
    roadName: 'Yishun Ave 2',
    description: 'Yishun Bus Interchange',
    latitude: 1.4294,
    longitude: 103.8351,
  },
  {
    code: '59049',
    roadName: 'Yishun Ave 2',
    description: 'Khatib Stn Exit A',
    latitude: 1.4172,
    longitude: 103.8331,
  },
  {
    code: '45009',
    roadName: 'Choa Chu Kang Loop',
    description: 'Choa Chu Kang Bus Interchange',
    latitude: 1.3853,
    longitude: 103.7444,
  },
  {
    code: '44029',
    roadName: 'Petir Rd',
    description: 'Bukit Panjang Bus Interchange / Hillion',
    latitude: 1.3787,
    longitude: 103.7628,
  },

  // Central North / Toa Payoh / Bishan / Ang Mo Kio
  {
    code: '54009',
    roadName: 'Ang Mo Kio Ave 8',
    description: 'Ang Mo Kio Bus Interchange',
    latitude: 1.3698,
    longitude: 103.8496,
  },
  {
    code: '53009',
    roadName: 'Bishan St 13',
    description: 'Bishan Bus Interchange',
    latitude: 1.3507,
    longitude: 103.8499,
  },
  {
    code: '52009',
    roadName: 'Lor 6 Toa Payoh',
    description: 'Toa Payoh Bus Interchange',
    latitude: 1.3328,
    longitude: 103.8477,
  },
  {
    code: '50038',
    roadName: 'Thomson Rd',
    description: 'Novena Stn Exit B / Velocity',
    latitude: 1.3204,
    longitude: 103.8438,
  },

  // North-East / Serangoon / Hougang / Sengkang / Punggol
  {
    code: '66009',
    roadName: 'Serangoon Ave 2',
    description: 'Serangoon Bus Interchange / NEX',
    latitude: 1.3503,
    longitude: 103.8735,
  },
  {
    code: '64009',
    roadName: 'Hougang Central',
    description: 'Hougang Central Bus Interchange',
    latitude: 1.3712,
    longitude: 103.8924,
  },
  {
    code: '67009',
    roadName: 'Sengkang Sq',
    description: 'Sengkang Bus Interchange / Compass One',
    latitude: 1.3916,
    longitude: 103.8953,
  },
  {
    code: '65009',
    roadName: 'Punggol Place',
    description: 'Punggol Temp Bus Interchange / Waterway Point',
    latitude: 1.4039,
    longitude: 103.9022,
  },
];

/**
 * Common Singapore bus services assigned to bus stops for fallback simulation
 * if the LTA DataMall API key is not configured in Vercel environment variables.
 */
export const POPULAR_BUS_SERVICES: Record<string, string[]> = {
  '83139': ['15', '24', '27', '34', '36', '53', '110', '858'],
  '95029': ['24', '27', '34', '36', '53', '110', '858'],
  '95109': ['24', '27', '34', '36', '53', '110', '858'],
  '84009': ['7', '9', '14', '16', '17', '18', '25', '26', '30', '32', '33', '35', '38', '40', '60', '66', '69', '87', '168', '196', '197', '222', '225', '228', '229'],
  '84039': ['2', '9', '24', '28', '31', '35', '67', '222'],
  '84031': ['2', '9', '24', '28', '31', '35', '67', '222'],
  '75009': ['3', '4', '8', '10', '19', '20', '21', '23', '28', '29', '31', '37', '38', '39', '46', '65', '67', '68', '69', '72', '81', '291', '292', '293'],
  '77009': ['3', '5', '6', '12', '17', '21', '89', '354', '358', '359', '403', '518'],
  '09048': ['7', '14', '16', '65', '106', '111', '123', '175', '502'],
  '09022': ['36', '77', '124', '143', '167', '174', '190', '518', '972'],
  '01012': ['7', '14', '16', '36', '77', '106', '111', '124', '147', '166', '174', '175', '190'],
  '01112': ['2', '12', '33', '130', '133', '960'],
  '03218': ['124', '145', '166', '174', '197'],
  '03509': ['97', '106', '133', '502', '518'],
  '03511': ['97', '106', '133', '502', '518'],
  '28009': ['51', '52', '66', '78', '79', '97', '98', '105', '143', '160', '183', '197', '333', '334', '335', '506'],
  '46009': ['161', '168', '169', '178', '187', '856', '900', '901', '903', '911', '912', '913', '925', '960', '961', '962', '963', '964', '965', '966', '969'],
  '54009': ['22', '24', '25', '73', '86', '130', '133', '135', '136', '138', '166', '169', '261', '262', '265', '268', '269'],
  '52009': ['8', '26', '28', '31', '73', '88', '90', '139', '141', '142', '143', '145', '155', '157', '159', '163', '231', '232', '235', '238'],
};

/**
 * Searches the local bus stops database by 5-digit code, description, or road name.
 */
export function searchBusStops(query: string): BusStop[] {
  const clean = query.trim().toLowerCase();
  if (!clean) return [];

  // Exact code match prioritized
  const exactCode = SINGAPORE_BUS_STOPS.find(s => s.code.toLowerCase() === clean);
  if (exactCode) {
    const others = SINGAPORE_BUS_STOPS.filter(s => s.code !== exactCode.code && (
      s.code.includes(clean) ||
      s.description.toLowerCase().includes(clean) ||
      s.roadName.toLowerCase().includes(clean)
    ));
    return [exactCode, ...others.slice(0, 7)];
  }

  return SINGAPORE_BUS_STOPS.filter(s =>
    s.code.toLowerCase().includes(clean) ||
    s.description.toLowerCase().includes(clean) ||
    s.roadName.toLowerCase().includes(clean)
  ).slice(0, 8);
}

/**
 * Looks up a bus stop by code. If unknown, synthesizes an entry so the app
 * can still attempt to query LTA API or demonstrate arrival times!
 */
export function getBusStopByCode(code: string): BusStop {
  const found = SINGAPORE_BUS_STOPS.find(s => s.code === code);
  if (found) return found;

  return {
    code,
    roadName: 'Singapore Transit Network',
    description: `Bus Stop ${code}`,
    latitude: 1.3521, // Central Singapore coordinates fallback
    longitude: 103.8198,
  };
}
