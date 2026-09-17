import { BusStop, BusRoute } from '../types';
import {
  SERVICE_10_DIR1,
  SERVICE_10_DIR2,
  SERVICE_10_STOPS_MAP,
  getAllService10BusStops,
} from './ltaBusRoutesData';

/**
 * Normalizes Singapore road, transit and landmark terms to canonical forms.
 * Solves the issue where searching "Orchard Road" didn't match "Orchard Rd",
 * or "Victoria Street" didn't match "Victoria St", or "Ang Mo Kio Avenue 3" didn't match "Ang Mo Kio Ave 3".
 */
export function normalizeSingaporeText(str: string): string {
  return str
    .toLowerCase()
    .replace(/\broad\b/g, 'rd')
    .replace(/\bstreet\b/g, 'st')
    .replace(/\bavenue\b/g, 'ave')
    .replace(/\bdrive\b/g, 'dr')
    .replace(/\bboulevard\b/g, 'blvd')
    .replace(/\bcentral\b/g, 'ctrl')
    .replace(/\bcenter\b/g, 'ctr')
    .replace(/\bcentre\b/g, 'ctr')
    .replace(/\bnorth\b/g, 'nth')
    .replace(/\bsouth\b/g, 'sth')
    .replace(/\beast\b/g, 'est')
    .replace(/\bwest\b/g, 'wst')
    .replace(/\bupper\b/g, 'upp')
    .replace(/\blower\b/g, 'lwr')
    .replace(/\bbukit\b/g, 'bt')
    .replace(/\bjalan\b/g, 'jln')
    .replace(/\blorong\b/g, 'lor')
    .replace(/\bcrescent\b/g, 'cres')
    .replace(/\bclose\b/g, 'cl')
    .replace(/\bterrace\b/g, 'ter')
    .replace(/\bplace\b/g, 'pl')
    .replace(/\blane\b/g, 'ln')
    .replace(/\bheights\b/g, 'hts')
    .replace(/\bgardens?\b/g, 'gdn')
    .replace(/\bpoint\b/g, 'pt')
    .replace(/\bexpressway\b/g, 'exp')
    .replace(/\bstation\b/g, 'stn')
    .replace(/\binterchange\b/g, 'int')
    .replace(/\bopposite\b/g, 'opp')
    .replace(/\bafter\b/g, 'aft')
    .replace(/\bbefore\b/g, 'bef')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Comprehensive database of Singapore bus stops covering key roads,
 * MRT stations, transport interchanges, and tourist/commercial corridors.
 */
const BASE_SINGAPORE_BUS_STOPS: BusStop[] = [
  // ==========================================
  // ORCHARD ROAD & CITY SHOPPING BELT
  // ==========================================
  { code: '09048', roadName: 'Orchard Rd', description: 'Orchard Stn / Lucky Plaza', latitude: 1.3044, longitude: 103.8341 },
  { code: '09022', roadName: 'Orchard Rd', description: 'Orchard Stn / Tang Plaza', latitude: 1.3052, longitude: 103.8327 },
  { code: '09037', roadName: 'Orchard Turn', description: 'Opp Ngee Ann City', latitude: 1.3028, longitude: 103.8358 },
  { code: '09047', roadName: 'Orchard Rd', description: 'Tang Plaza / Royal Thai Embassy', latitude: 1.3059, longitude: 103.8315 },
  { code: '09059', roadName: 'Orchard Rd', description: 'Delfi Orchard', latitude: 1.3068, longitude: 103.8294 },
  { code: '08057', roadName: 'Orchard Rd', description: 'Dhoby Ghaut Stn Exit B', latitude: 1.2991, longitude: 103.8458 },
  { code: '08111', roadName: 'Orchard Rd', description: 'MacDonald House / Plaza Singapura', latitude: 1.2996, longitude: 103.8451 },
  { code: '09011', roadName: 'Orchard Blvd', description: 'Opp Orchard Stn Exit 12', latitude: 1.3031, longitude: 103.8319 },
  { code: '09023', roadName: 'Orchard Blvd', description: 'Orchard Blvd Stn Exit 1', latitude: 1.3021, longitude: 103.8239 },
  { code: '09169', roadName: 'Somerset Rd', description: 'Somerset Stn', latitude: 1.3006, longitude: 103.8384 },
  { code: '09179', roadName: 'Grange Rd', description: 'National Youth Council / Somerset', latitude: 1.3009, longitude: 103.8362 },
  { code: '09219', roadName: 'Scotts Rd', description: 'Far East Plaza / Scotts Square', latitude: 1.3072, longitude: 103.8335 },
  { code: '09211', roadName: 'Scotts Rd', description: 'Thong Teck Bldg / Grand Hyatt', latitude: 1.3065, longitude: 103.8324 },

  // ==========================================
  // BUGIS, BRAS BASAH, VICTORIA ST, CITY HALL
  // ==========================================
  { code: '01012', roadName: 'Bras Basah Rd', description: 'Hotel Rendezvous / SMU / Bencoolen Stn', latitude: 1.2982, longitude: 103.8504 },
  { code: '01029', roadName: 'Bras Basah Rd', description: 'Opp SMU / Manulife Ctr', latitude: 1.2988, longitude: 103.8519 },
  { code: '04179', roadName: 'Bras Basah Rd', description: 'Aft Bras Basah Stn Exit A / SMU', latitude: 1.2969, longitude: 103.8507 },
  { code: '01039', roadName: 'Bras Basah Rd', description: 'Raffles Hotel / Bras Basah Complex', latitude: 1.2961, longitude: 103.8542 },
  { code: '01112', roadName: 'Victoria St', description: 'Bugis Stn Exit D', latitude: 1.3005, longitude: 103.8561 },
  { code: '01119', roadName: 'Victoria St', description: 'Bugis Stn Exit A / Bugis Junction', latitude: 1.3012, longitude: 103.8552 },
  { code: '01059', roadName: 'Victoria St', description: 'St. Joseph Church / SMU', latitude: 1.2974, longitude: 103.8529 },
  { code: '01211', roadName: 'Victoria St', description: 'Opp Bugis Junction / Iluma', latitude: 1.3018, longitude: 103.8568 },
  { code: '01229', roadName: 'Victoria St', description: 'All Saints Church', latitude: 1.3045, longitude: 103.8587 },
  { code: '03218', roadName: 'North Bridge Rd', description: 'Opp The Treasury / City Hall Stn', latitude: 1.2917, longitude: 103.8508 },
  { code: '03229', roadName: 'North Bridge Rd', description: 'St. Andrew Cathedral / Capitol', latitude: 1.2934, longitude: 103.8519 },
  { code: '01429', roadName: 'North Bridge Rd', description: 'Bugis Cube / Liang Seah St', latitude: 1.2995, longitude: 103.8568 },
  { code: '04159', roadName: 'North Bridge Rd', description: 'Boat Quay / Parliament House', latitude: 1.2889, longitude: 103.8496 },
  { code: '04169', roadName: 'South Bridge Rd', description: 'Opp Hong Lim Cplx', latitude: 1.2858, longitude: 103.8475 },
  { code: '05189', roadName: 'South Bridge Rd', description: 'Sri Mariamman Temple', latitude: 1.2829, longitude: 103.8453 },
  { code: '05199', roadName: 'South Bridge Rd', description: 'Maxwell Stn Exit 2', latitude: 1.2808, longitude: 103.8441 },
  { code: '04121', roadName: 'Stamford Rd', description: 'SMU (Singapore Management University)', latitude: 1.2965, longitude: 103.8499 },
  { code: '04111', roadName: 'Stamford Rd', description: 'Capitol Bldg / City Hall Stn Exit B', latitude: 1.2934, longitude: 103.8516 },
  { code: '04222', roadName: 'Eu Tong Sen St', description: 'Clarke Quay Stn Exit E / Central', latitude: 1.2882, longitude: 103.8465 },
  { code: '05013', roadName: 'Eu Tong Sen St', description: 'Chinatown Stn Exit E / People Park Ctr', latitude: 1.2847, longitude: 103.8441 },
  { code: '05022', roadName: 'Eu Tong Sen St', description: 'Apollo Ctr / Havelock', latitude: 1.2872, longitude: 103.8456 },
  { code: '05039', roadName: 'New Bridge Rd', description: 'Chinatown Stn Exit C / People Park Cplx', latitude: 1.2838, longitude: 103.8436 },
  { code: '05049', roadName: 'New Bridge Rd', description: 'Opp Clarke Quay Stn', latitude: 1.2878, longitude: 103.8461 },
  { code: '05059', roadName: 'New Bridge Rd', description: 'Aft Duxton Plain Pk', latitude: 1.2789, longitude: 103.8415 },
  { code: '01611', roadName: 'Beach Rd', description: 'Shaw Towers / South Beach', latitude: 1.2965, longitude: 103.8572 },
  { code: '01619', roadName: 'Beach Rd', description: 'Opp Shaw Towers', latitude: 1.2968, longitude: 103.8569 },
  { code: '01411', roadName: 'Beach Rd', description: 'The Gateway / Golden Landmark', latitude: 1.3005, longitude: 103.8596 },
  { code: '01419', roadName: 'Beach Rd', description: 'Opp The Gateway', latitude: 1.3009, longitude: 103.8591 },
  { code: '01511', roadName: 'Middle Rd', description: 'Aft Beach Rd', latitude: 1.2979, longitude: 103.8562 },
  { code: '08019', roadName: 'Bencoolen St', description: 'Bencoolen Stn Exit B', latitude: 1.2989, longitude: 103.8509 },

  // ==========================================
  // MARINA BAY, RAFFLES PLACE, SHENTON WAY, CBD
  // ==========================================
  { code: '03509', roadName: 'Bayfront Ave', description: 'Marina Bay Sands Theatre', latitude: 1.2838, longitude: 103.8589 },
  { code: '03511', roadName: 'Bayfront Ave', description: 'Marina Bay Sands Hotel', latitude: 1.2829, longitude: 103.8601 },
  { code: '03519', roadName: 'Bayfront Ave', description: 'Bayfront Stn Exit B', latitude: 1.2818, longitude: 103.8591 },
  { code: '03539', roadName: 'Marina Blvd', description: 'Marina Bay Financial Ctr (MBFC)', latitude: 1.2798, longitude: 103.8541 },
  { code: '03531', roadName: 'Central Blvd', description: 'Downtown Stn', latitude: 1.2792, longitude: 103.8529 },
  { code: '03019', roadName: 'Collyer Quay', description: 'Raffles Place Stn Exit B / Ocean Towers', latitude: 1.2835, longitude: 103.8524 },
  { code: '03059', roadName: 'Shenton Way', description: 'UIC Bldg / SGX Ctr', latitude: 1.2781, longitude: 103.8496 },
  { code: '03071', roadName: 'Shenton Way', description: 'Shenton House / Opp AXA Tower', latitude: 1.2764, longitude: 103.8482 },
  { code: '03111', roadName: 'Robinson Rd', description: 'Aft Capital Tower / Tanjong Pagar Stn', latitude: 1.2773, longitude: 103.8471 },
  { code: '03129', roadName: 'Robinson Rd', description: 'Opp So Sofitel Singapore', latitude: 1.2811, longitude: 103.8504 },
  { code: '03223', roadName: 'Anson Rd', description: 'Hub Synergy Pt / Tanjong Pagar', latitude: 1.2745, longitude: 103.8458 },
  { code: '02111', roadName: 'Temasek Blvd', description: 'Suntec Convention Ctr / Promenade Stn', latitude: 1.2934, longitude: 103.8576 },
  { code: '02151', roadName: 'Raffles Ave', description: 'The Float @ Marina Bay', latitude: 1.2898, longitude: 103.8584 },
  { code: '02171', roadName: 'Raffles Blvd', description: 'Marina Sq / Pan Pacific', latitude: 1.2912, longitude: 103.8571 },
  { code: '80011', roadName: 'Nicoll Highway', description: 'Nicoll Highway Stn Exit A', latitude: 1.3001, longitude: 103.8634 },

  // ==========================================
  // CHANGI AIRPORT & EAST COAST / BEDOK / TAMPINES
  // ==========================================
  { code: '83139', roadName: 'PTB2 B/ment', description: 'Aft Changi Airport PTB2', latitude: 1.3547, longitude: 103.9893 },
  { code: '95029', roadName: 'Airport Blvd', description: 'Changi Airport PTB1', latitude: 1.3619, longitude: 103.9897 },
  { code: '95109', roadName: 'Airport Blvd', description: 'Changi Airport PTB3', latitude: 1.3564, longitude: 103.9868 },
  { code: '95209', roadName: 'Airport Blvd', description: 'Changi Airport PTB4', latitude: 1.3411, longitude: 103.9832 },
  { code: '84009', roadName: 'Bedok Nth Dr', description: 'Bedok Bus Interchange', latitude: 1.3242, longitude: 103.9298 },
  { code: '84039', roadName: 'New Upp Changi Rd', description: 'Bedok Stn Exit B', latitude: 1.3235, longitude: 103.9312 },
  { code: '84031', roadName: 'New Upp Changi Rd', description: 'Bedok Stn Exit A', latitude: 1.3241, longitude: 103.9304 },
  { code: '84011', roadName: 'Bedok Nth Ave 3', description: 'Opp Bedok Stn', latitude: 1.3255, longitude: 103.9318 },
  { code: '84211', roadName: 'Bedok Nth Rd', description: 'Blk 85 Fengshan Market', latitude: 1.3315, longitude: 103.9385 },
  { code: '84219', roadName: 'Bedok Nth Rd', description: 'Opp Blk 85 Market', latitude: 1.3319, longitude: 103.9389 },
  { code: '84311', roadName: 'Bedok Sth Ave 1', description: 'Blk 172 Bedok South', latitude: 1.3205, longitude: 103.9341 },
  { code: '75009', roadName: 'Tampines Central 1', description: 'Tampines Bus Interchange', latitude: 1.3533, longitude: 103.9443 },
  { code: '76009', roadName: 'Tampines Ave 7', description: 'Tampines East Stn Exit B', latitude: 1.3562, longitude: 103.9554 },
  { code: '76111', roadName: 'Tampines Ave 4', description: 'Tampines Stn / Int Exit C', latitude: 1.3524, longitude: 103.9431 },
  { code: '76121', roadName: 'Tampines Ave 5', description: 'Our Tampines Hub (OTH)', latitude: 1.3538, longitude: 103.9405 },
  { code: '76131', roadName: 'Tampines Ave 2', description: 'Blk 285 / Tampines West Stn', latitude: 1.3468, longitude: 103.9392 },
  { code: '77009', roadName: 'Pasir Ris Central', description: 'Pasir Ris Bus Interchange', latitude: 1.3731, longitude: 103.9493 },
  { code: '77011', roadName: 'Pasir Ris Dr 1', description: 'Pasir Ris Stn Exit B', latitude: 1.3725, longitude: 103.9501 },
  { code: '77021', roadName: 'Pasir Ris Dr 3', description: 'Downtown East / Wild Wild Wet', latitude: 1.3789, longitude: 103.9542 },
  { code: '82009', roadName: 'Eunos Rd 2', description: 'Eunos Bus Interchange', latitude: 1.3197, longitude: 103.9031 },
  { code: '81119', roadName: 'Paya Lebar Rd', description: 'Paya Lebar Stn Exit B / PLQ Mall', latitude: 1.3178, longitude: 103.8929 },
  { code: '81111', roadName: 'Paya Lebar Rd', description: 'Paya Lebar Square', latitude: 1.3182, longitude: 103.8921 },
  { code: '80059', roadName: 'Aljunied Rd', description: 'Aljunied Stn', latitude: 1.3164, longitude: 103.8828 },
  { code: '82029', roadName: 'Changi Rd', description: 'Joo Chiat Cplx', latitude: 1.3181, longitude: 103.9004 },
  { code: '82011', roadName: 'Geylang Rd', description: 'City Plaza / Paya Lebar', latitude: 1.3155, longitude: 103.8938 },
  { code: '80079', roadName: 'Sims Ave', description: 'Opp Aljunied Stn', latitude: 1.3172, longitude: 103.8824 },
  { code: '92049', roadName: 'Marine Parade Rd', description: 'Parkway Parade', latitude: 1.3015, longitude: 103.9052 },
  { code: '92059', roadName: 'Marine Parade Rd', description: 'Opp Parkway Parade / Marine Parade Stn', latitude: 1.3021, longitude: 103.9048 },
  { code: '92119', roadName: 'East Coast Rd', description: 'Katong Shopping Ctr / 112 Katong', latitude: 1.3045, longitude: 103.9031 },

  // ==========================================
  // WEST: CLEMENTI, JURONG EAST, BOON LAY, BUKIT BATOK
  // ==========================================
  { code: '17009', roadName: 'Clementi Ave 3', description: 'Clementi Bus Interchange', latitude: 1.3151, longitude: 103.7652 },
  { code: '17179', roadName: 'Commonwealth Ave West', description: 'Clementi Stn Exit A', latitude: 1.3155, longitude: 103.7663 },
  { code: '17171', roadName: 'Commonwealth Ave West', description: 'Clementi Stn Exit B', latitude: 1.3149, longitude: 103.7658 },
  { code: '17091', roadName: 'Clementi Rd', description: 'National University of Singapore (NUS) Utown', latitude: 1.3048, longitude: 103.7725 },
  { code: '17099', roadName: 'Clementi Rd', description: 'Opp NUS University Town', latitude: 1.3055, longitude: 103.7731 },
  { code: '17131', roadName: 'Clementi Rd', description: 'Ngee Ann Polytechnic (NP)', latitude: 1.3325, longitude: 103.7765 },
  { code: '17139', roadName: 'Clementi Rd', description: 'Opp Ngee Ann Poly', latitude: 1.3331, longitude: 103.7771 },
  { code: '17141', roadName: 'Clementi Rd', description: 'Singapore University of Social Sciences (SUSS)', latitude: 1.3289, longitude: 103.7758 },
  { code: '28009', roadName: 'Jurong Gateway Rd', description: 'Jurong East Bus Interchange', latitude: 1.3336, longitude: 103.7423 },
  { code: '28201', roadName: 'Jurong Gateway Rd', description: 'JEM / Opp Jurong East Stn', latitude: 1.3331, longitude: 103.7436 },
  { code: '28211', roadName: 'Jurong Gateway Rd', description: 'Westgate / Jurong East Stn Exit A', latitude: 1.3341, longitude: 103.7428 },
  { code: '28231', roadName: 'Jurong Town Hall Rd', description: 'Opp Jurong Town Hall / Science Ctr', latitude: 1.3315, longitude: 103.7389 },
  { code: '22009', roadName: 'Jurong West Ctrl 3', description: 'Boon Lay Bus Interchange', latitude: 1.3392, longitude: 103.7058 },
  { code: '22111', roadName: 'Boon Lay Way', description: 'Boon Lay Stn Exit B', latitude: 1.3385, longitude: 103.7065 },
  { code: '22119', roadName: 'Boon Lay Way', description: 'Jurong Point / Boon Lay Stn', latitude: 1.3398, longitude: 103.7071 },
  { code: '44009', roadName: 'Bukit Batok Ctrl', description: 'Bukit Batok Bus Interchange', latitude: 1.3496, longitude: 103.7495 },
  { code: '43009', roadName: 'Bukit Batok East Ave 3', description: 'Bukit Batok Stn Exit A', latitude: 1.3488, longitude: 103.7501 },

  // ==========================================
  // BUKIT TIMAH, DUNEARN RD, THOMSON, NOVENA
  // ==========================================
  { code: '40019', roadName: 'Bt Timah Rd', description: 'Sixth Avenue Stn Exit A', latitude: 1.3308, longitude: 103.7968 },
  { code: '40029', roadName: 'Bt Timah Rd', description: 'King Albert Park Stn', latitude: 1.3355, longitude: 103.7834 },
  { code: '41019', roadName: 'Bt Timah Rd', description: 'Beauty World Stn Exit A', latitude: 1.3418, longitude: 103.7758 },
  { code: '42019', roadName: 'Dunearn Rd', description: 'Opp Sixth Ave Stn', latitude: 1.3312, longitude: 103.7974 },
  { code: '42029', roadName: 'Dunearn Rd', description: 'Opp King Albert Park Stn', latitude: 1.3359, longitude: 103.7839 },
  { code: '50038', roadName: 'Thomson Rd', description: 'Novena Stn Exit B / Velocity', latitude: 1.3204, longitude: 103.8438 },
  { code: '50031', roadName: 'Thomson Rd', description: 'Novena Church / United Square', latitude: 1.3178, longitude: 103.8432 },
  { code: '51019', roadName: 'Upp Thomson Rd', description: 'Upper Thomson Stn Exit 1', latitude: 1.3541, longitude: 103.8329 },
  { code: '51029', roadName: 'Upp Thomson Rd', description: 'Opp Thomson Plaza', latitude: 1.3548, longitude: 103.8315 },
  { code: '53019', roadName: 'Marymount Rd', description: 'Marymount Stn Exit A', latitude: 1.3491, longitude: 103.8398 },

  // ==========================================
  // ANG MO KIO, BISHAN, TOA PAYOH
  // ==========================================
  { code: '54009', roadName: 'Ang Mo Kio Ave 8', description: 'Ang Mo Kio Bus Interchange', latitude: 1.3698, longitude: 103.8496 },
  { code: '54261', roadName: 'Ang Mo Kio Ave 3', description: 'Ang Mo Kio Stn Exit B / AMK Hub', latitude: 1.3692, longitude: 103.8488 },
  { code: '54247', roadName: 'Ang Mo Kio Ave 3', description: 'Bef Ang Mo Kio Stn Exit C', latitude: 1.3688, longitude: 103.8475 },
  { code: '54279', roadName: 'Ang Mo Kio Ave 3', description: 'Blk 324 / AMK Central', latitude: 1.3695, longitude: 103.8458 },
  { code: '54341', roadName: 'Ang Mo Kio Ave 3', description: 'Blk 5022 / Nanyang Poly', latitude: 1.3789, longitude: 103.8561 },
  { code: '54181', roadName: 'Ang Mo Kio Ave 6', description: 'Yio Chu Kang Stn Exit A', latitude: 1.3818, longitude: 103.8449 },
  { code: '53009', roadName: 'Bishan St 13', description: 'Bishan Bus Interchange', latitude: 1.3507, longitude: 103.8499 },
  { code: '53221', roadName: 'Bishan Rd', description: 'Bishan Stn Exit A / Junction 8', latitude: 1.3512, longitude: 103.8489 },
  { code: '53231', roadName: 'Bishan Rd', description: 'Opp Bishan Stn / Bishan Stadium', latitude: 1.3524, longitude: 103.8481 },
  { code: '52009', roadName: 'Lor 6 Toa Payoh', description: 'Toa Payoh Bus Interchange', latitude: 1.3328, longitude: 103.8477 },
  { code: '52121', roadName: 'Lor 2 Toa Payoh', description: 'Toa Payoh Stn / HDB Hub', latitude: 1.3335, longitude: 103.8468 },
  { code: '52129', roadName: 'Lor 2 Toa Payoh', description: 'Opp Toa Payoh Stn', latitude: 1.3339, longitude: 103.8472 },
  { code: '52131', roadName: 'Lor 1 Toa Payoh', description: 'Braddell Stn Exit A', latitude: 1.3405, longitude: 103.8465 },

  // ==========================================
  // NORTH & NORTH-WEST: WOODLANDS, YISHUN, CHOA CHU KANG, BUKIT PANJANG
  // ==========================================
  { code: '46009', roadName: 'Woodlands Sq', description: 'Woodlands Integrated Transport Hub', latitude: 1.4368, longitude: 103.7865 },
  { code: '46279', roadName: 'Woodlands Ave 3', description: 'Marsiling Stn', latitude: 1.4326, longitude: 103.7741 },
  { code: '46289', roadName: 'Woodlands Ave 7', description: 'Admiralty Stn Exit A', latitude: 1.4412, longitude: 103.8012 },
  { code: '59009', roadName: 'Yishun Ave 2', description: 'Yishun Bus Interchange', latitude: 1.4294, longitude: 103.8351 },
  { code: '59049', roadName: 'Yishun Ave 2', description: 'Khatib Stn Exit A', latitude: 1.4172, longitude: 103.8331 },
  { code: '59059', roadName: 'Yishun Ave 2', description: 'Opp Khatib Stn', latitude: 1.4178, longitude: 103.8339 },
  { code: '59079', roadName: 'Yishun Central', description: 'Khoo Teck Puat Hospital (KTPH)', latitude: 1.4245, longitude: 103.8382 },
  { code: '45009', roadName: 'Choa Chu Kang Loop', description: 'Choa Chu Kang Bus Interchange', latitude: 1.3853, longitude: 103.7444 },
  { code: '45111', roadName: 'Choa Chu Kang Way', description: 'Opp Choa Chu Kang Stn / Lot 1', latitude: 1.3859, longitude: 103.7451 },
  { code: '44029', roadName: 'Petir Rd', description: 'Bukit Panjang Bus Interchange / Hillion', latitude: 1.3787, longitude: 103.7628 },
  { code: '44031', roadName: 'Upper Bukit Timah Rd', description: 'Bukit Panjang Stn Exit A / Junction 10', latitude: 1.3795, longitude: 103.7615 },

  // ==========================================
  // NORTH-EAST: SERANGOON, HOUGANG, SENGKANG, PUNGGOL
  // ==========================================
  { code: '66009', roadName: 'Serangoon Ave 2', description: 'Serangoon Bus Interchange / NEX', latitude: 1.3503, longitude: 103.8735 },
  { code: '66111', roadName: 'Upp Serangoon Rd', description: 'Serangoon Stn Exit C / NEX', latitude: 1.3496, longitude: 103.8741 },
  { code: '66121', roadName: 'Boundary Rd', description: 'Blk 233 Serangoon Central', latitude: 1.3532, longitude: 103.8718 },
  { code: '64009', roadName: 'Hougang Central', description: 'Hougang Central Bus Interchange', latitude: 1.3712, longitude: 103.8924 },
  { code: '64111', roadName: 'Hougang Central', description: 'Hougang Stn Exit A / Hougang Mall', latitude: 1.3718, longitude: 103.8931 },
  { code: '64121', roadName: 'Hougang Ave 8', description: 'Blk 434 Hougang', latitude: 1.3745, longitude: 103.8905 },
  { code: '67009', roadName: 'Sengkang Sq', description: 'Sengkang Bus Interchange / Compass One', latitude: 1.3916, longitude: 103.8953 },
  { code: '67111', roadName: 'Sengkang East Way', description: 'Sengkang Stn Exit C', latitude: 1.3922, longitude: 103.8961 },
  { code: '65009', roadName: 'Punggol Place', description: 'Punggol Temp Bus Interchange / Waterway Point', latitude: 1.4039, longitude: 103.9022 },
  { code: '65111', roadName: 'Punggol Central', description: 'Punggol Stn / Waterway Point', latitude: 1.4048, longitude: 103.9031 },

  // ==========================================
  // SOUTH: HARBOURFRONT, QUEENSTOWN, BUONA VISTA
  // ==========================================
  { code: '14141', roadName: 'Telok Blangah Rd', description: 'HarbourFront Stn / Vivocity', latitude: 1.2653, longitude: 103.8219 },
  { code: '14119', roadName: 'Telok Blangah Rd', description: 'Opp Vivocity / HarbourFront Int', latitude: 1.2646, longitude: 103.8228 },
  { code: '11009', roadName: 'Commonwealth Ave', description: 'Queenstown Stn Exit A', latitude: 1.2946, longitude: 103.8059 },
  { code: '11019', roadName: 'Commonwealth Ave', description: 'Commonwealth Stn Exit B', latitude: 1.3023, longitude: 103.7981 },
  { code: '18141', roadName: 'North Buona Vista Rd', description: 'Buona Vista Stn Exit C / Star Vista', latitude: 1.3072, longitude: 103.7901 },
  { code: '18149', roadName: 'North Buona Vista Rd', description: 'Opp Buona Vista Stn Exit D', latitude: 1.3078, longitude: 103.7895 },
  { code: '10041', roadName: 'Tiong Bahru Rd', description: 'Tiong Bahru Plaza / Stn Exit A', latitude: 1.2865, longitude: 103.8272 },
  { code: '10049', roadName: 'Tiong Bahru Rd', description: 'Opp Tiong Bahru Plaza', latitude: 1.2868, longitude: 103.8279 },
];

const SERVICE_10_EXTRA_STOPS = getAllService10BusStops();
export const SINGAPORE_BUS_STOPS: BusStop[] = [
  ...BASE_SINGAPORE_BUS_STOPS,
  ...SERVICE_10_EXTRA_STOPS.filter(
    (s) => !BASE_SINGAPORE_BUS_STOPS.some((b) => b.code === s.code)
  ),
];

/**
 * Common Singapore bus services assigned to bus stops for fallback simulation
 * if the LTA DataMall API key is not configured in Vercel environment variables.
 */
export const POPULAR_BUS_SERVICES: Record<string, string[]> = {
  '83139': ['15', '24', '27', '34', '36', '53', '110', '858'],
  '95029': ['24', '27', '34', '36', '53', '110', '858'],
  '95109': ['24', '27', '34', '36', '53', '110', '858'],
  '95209': ['24', '34', '36', '110', '858'],
  '84009': ['7', '9', '14', '16', '17', '18', '25', '26', '30', '32', '33', '35', '38', '40', '60', '66', '69', '87', '168', '196', '197', '222', '225', '228', '229'],
  '84039': ['2', '9', '24', '28', '31', '35', '67', '222'],
  '84031': ['2', '9', '24', '28', '31', '35', '67', '222'],
  '75009': ['3', '4', '8', '10', '19', '20', '21', '23', '28', '29', '31', '37', '38', '39', '46', '65', '67', '68', '69', '72', '81', '291', '292', '293'],
  '77009': ['3', '5', '6', '12', '17', '21', '89', '354', '358', '359', '403', '518'],
  '09048': ['7', '14', '16', '65', '106', '111', '123', '175', '502'],
  '09022': ['36', '77', '124', '143', '167', '174', '190', '518', '972'],
  '09037': ['7', '14', '16', '65', '106', '111', '123', '175', '502'],
  '09047': ['7', '14', '16', '36', '65', '77', '106', '111', '123', '174', '175'],
  '09059': ['7', '36', '77', '105', '106', '111', '123', '132', '174'],
  '09011': ['7', '36', '105', '106', '111', '123', '174'],
  '09023': ['7', '36', '105', '106', '111', '123', '174'],
  '09169': ['7', '14', '16', '36', '65', '77', '106', '111', '123', '174', '175'],
  '08057': ['7', '14', '16', '36', '65', '77', '106', '111', '124', '162', '167', '174', '190'],
  '04121': [
    '7',
    '7A',
    '12',
    '12e',
    '14',
    '14A',
    '14e',
    '16',
    '16M',
    '36',
    '36A',
    '36B',
    '51',
    '77',
    '106',
    '111',
    '124',
    '131',
    '131A',
    '147',
    '147A',
    '162',
    '166',
    '167',
    '174',
    '174e',
    '175',
    '190',
    '652',
    '656',
    '660',
    '663',
    '665',
    '850E',
    '857',
    '857B',
    '951E',
  ],
  '04111': ['7', '14', '16', '36', '77', '106', '111', '124', '131', '147', '162', '166', '167', '174', '175', '190', '857'],
  '04179': ['7', '14', '16', '36', '77', '106', '111', '131', '162', '167', '175', '502', '518', '857'],
  '01012': ['7', '14', '16', '36', '77', '106', '111', '124', '147', '166', '174', '175', '190'],
  '01029': ['7', '14', '16', '36', '77', '106', '111', '131', '147', '162', '166', '167', '174', '175', '502', '857'],
  '01112': ['2', '12', '33', '130', '133', '960'],
  '01119': ['2', '12', '33', '130', '133', '960'],
  '02111': ['36', '70', '97', '106', '111', '133', '162', '502', '518', '700', '857'],
  '03218': ['124', '145', '166', '174', '197'],
  '03509': ['97', '106', '133', '502', '518'],
  '03511': ['97', '106', '133', '502', '518'],
  '03531': ['97', '106', '133', '502', '518'],
  '03019': ['10', '70', '100', '107', '130', '131', '167', '196'],
  '03059': ['10', '57', '70', '97', '100', '106', '130', '131', '167', '196'],
  '04222': ['2', '12', '33', '51', '54', '61', '63', '80', '124', '145', '147', '166', '174', '190', '197', '851', '961'],
  '28009': ['51', '52', '66', '78', '79', '97', '98', '105', '143', '160', '183', '197', '333', '334', '335', '506'],
  '44009': ['61', '66', '77', '106', '157', '173', '174', '176', '177', '178', '187', '188', '189', '852', '941', '945', '947', '990', '991'],
  '43009': ['61', '66', '106', '157', '174', '178', '852', '991'],
  '17009': ['14', '52', '78', '96', '99', '106', '147', '156', '165', '166', '173', '175', '196', '282', '284', '285'],
  '17091': ['33', '96', '151', '183', '188', '196'],
  '18141': ['14', '74', '91', '92', '95', '100', '105', '106', '111', '147', '185', '191', '196', '198', '200'],
  '11019': ['32', '100', '105', '106', '111', '145', '147', '196', '198', '970'],
  '11009': ['51', '106', '111', '145', '186', '195', '970'],
  '46009': ['161', '168', '169', '178', '187', '856', '900', '901', '903', '911', '912', '913', '925', '960', '961', '962', '963', '964', '965', '966', '969'],
  '54009': ['22', '24', '25', '73', '86', '130', '133', '135', '136', '138', '166', '169', '261', '262', '265', '268', '269'],
  '53009': ['50', '52', '53', '54', '55', '56', '57', '58', '59', '410G', '410W'],
  '52009': ['8', '26', '28', '31', '73', '88', '90', '139', '141', '142', '143', '145', '155', '157', '159', '163', '231', '232', '235', '238'],
  '66009': ['100', '101', '103', '105', '109', '158', '315', '317'],
  '64009': ['51', '74', '87', '89', '107', '112', '113', '132', '147', '151', '153', '161', '165'],
  '67009': ['80', '83', '85', '86', '87', '371', '372'],
  '65009': ['34', '43', '62', '82', '83', '84', '85', '117', '118', '119', '381', '382', '384', '386'],
  '14141': ['10', '30', '57', '61', '65', '80', '97', '100', '123', '131', '143', '145', '166'],
};

/**
 * Key Singapore Bus Routes (busrouter.sg inspired)
 * Allows users to inspect routes and render polylines along actual Singapore paths.
 */
export const SINGAPORE_BUS_ROUTES: BusRoute[] = [
  SERVICE_10_DIR1,
  SERVICE_10_DIR2,
  {
    serviceNo: '106',
    name: 'Bukit Batok ⇄ Shenton Way (via SMU)',
    direction: 1,
    origin: 'Bukit Batok Bus Interchange',
    destination: 'Shenton Way Terminal',
    stops: [
      '44009',
      '43009',
      '17009',
      '18141',
      '11019',
      '11009',
      '09023',
      '09011',
      '09048',
      '09037',
      '09169',
      '08057',
      '04121',
      '02111',
      '03509',
      '03511',
      '03531',
      '03059',
    ],
    color: '#06B6D4',
  },
  {
    serviceNo: '143',
    name: 'Toa Payoh ⇄ Jurong East',
    direction: 1,
    origin: 'Toa Payoh Int',
    destination: 'Jurong East Int',
    stops: ['52009', '50038', '09219', '09022', '09169', '04222', '05013', '14141', '17179', '28009'],
    color: '#10B981',
  },
  {
    serviceNo: '65',
    name: 'Tampines ⇄ HarbourFront',
    direction: 1,
    origin: 'Tampines Int',
    destination: 'HarbourFront Stn',
    stops: ['75009', '76009', '84009', '82009', '01112', '08057', '09048', '09037', '14141'],
    color: '#0EA5E9',
  },
  {
    serviceNo: '190',
    name: 'Choa Chu Kang ⇄ Kampong Bahru',
    direction: 1,
    origin: 'Choa Chu Kang Int',
    destination: 'Kampong Bahru Ter',
    stops: ['45009', '44029', '40019', '09219', '09022', '08057', '04121', '05059'],
    color: '#F59E0B',
  },
  {
    serviceNo: '36',
    name: 'Changi Airport ⟲ Orchard Rd / SMU',
    direction: 1,
    origin: 'Changi Airport PTB2',
    destination: 'Orchard Rd (Loop)',
    stops: ['83139', '95029', '95109', '92049', '02111', '08057', '09048', '09059', '04121', '01012', '83139'],
    color: '#8B5CF6',
  },
  {
    serviceNo: '24',
    name: 'Ang Mo Kio ⇄ Changi Airport',
    direction: 1,
    origin: 'Ang Mo Kio Int',
    destination: 'Changi Airport PTB2',
    stops: ['54009', '54261', '53009', '81119', '84009', '84039', '83139', '95029', '95109'],
    color: '#EC4899',
  },
  {
    serviceNo: '147',
    name: 'Hougang ⇄ Clementi',
    direction: 1,
    origin: 'Hougang Central Int',
    destination: 'Clementi Int',
    stops: ['64009', '66009', '01112', '04121', '05013', '10041', '11009', '11019', '17009'],
    color: '#14B8A6',
  },
  {
    serviceNo: '7',
    name: 'Bedok ⇄ Clementi (via SMU)',
    direction: 1,
    origin: 'Bedok Interchange',
    destination: 'Clementi Interchange',
    stops: ['84009', '82009', '81119', '01112', '08057', '04121', '09048', '09059', '18141', '17009'],
    color: '#F97316',
  },
  {
    serviceNo: '14',
    name: 'Bedok ⇄ Clementi (via Marine Parade & SMU)',
    direction: 1,
    origin: 'Bedok Interchange',
    destination: 'Clementi Interchange',
    stops: ['84009', '92049', '92119', '01039', '08057', '04121', '09048', '11009', '17009'],
    color: '#E11D48',
  },
  {
    serviceNo: '16',
    name: 'Bukit Merah ⇄ Bedok (via SMU)',
    direction: 1,
    origin: 'Bukit Merah Interchange',
    destination: 'Bedok Interchange',
    stops: ['10041', '05013', '04121', '01012', '08057', '09048', '84009'],
    color: '#06B6D4',
  },
  {
    serviceNo: '77',
    name: 'Bukit Batok ⇄ Marina Centre (via SMU)',
    direction: 1,
    origin: 'Bukit Batok Interchange',
    destination: 'Marina Centre Terminal',
    stops: ['43009', '17009', '11009', '09048', '08057', '04121', '02111', '03509'],
    color: '#3B82F6',
  },
  {
    serviceNo: '111',
    name: 'Ghim Moh ⟲ Marina Centre (via SMU)',
    direction: 1,
    origin: 'Ghim Moh Bus Terminal',
    destination: 'Marina Centre (Loop)',
    stops: ['11009', '09023', '09048', '08057', '04121', '02111', '03509', '11009'],
    color: '#A855F7',
  },
  {
    serviceNo: '124',
    name: 'St. Michael\'s ⟲ Telok Blangah (via SMU)',
    direction: 1,
    origin: 'Saint Michael\'s Terminal',
    destination: 'Telok Blangah (Loop)',
    stops: ['01112', '04121', '04222', '05013', '14141'],
    color: '#10B981',
  },
  {
    serviceNo: '131',
    name: 'Saint Michael\'s ⇄ Bukit Merah (via SMU)',
    direction: 1,
    origin: 'Saint Michael\'s Terminal',
    destination: 'Bukit Merah Interchange',
    stops: ['01112', '04121', '03218', '03019', '10041'],
    color: '#F43F5E',
  },
  {
    serviceNo: '166',
    name: 'Ang Mo Kio ⇄ Clementi (via SMU)',
    direction: 1,
    origin: 'Ang Mo Kio Interchange',
    destination: 'Clementi Interchange',
    stops: ['54009', '01112', '04121', '04222', '05013', '17009'],
    color: '#EAB308',
  },
  {
    serviceNo: '167',
    name: 'Sembawang ⇄ Bukit Merah (via SMU)',
    direction: 1,
    origin: 'Sembawang Interchange',
    destination: 'Bukit Merah Interchange',
    stops: ['59009', '09022', '08057', '04121', '03019', '10041'],
    color: '#64748B',
  },
  {
    serviceNo: '174',
    name: 'Boon Lay ⇄ Kampong Bahru (via SMU)',
    direction: 1,
    origin: 'Boon Lay Interchange',
    destination: 'Kampong Bahru Terminal',
    stops: ['28009', '17179', '09022', '08057', '04121', '04222', '05059'],
    color: '#D97706',
  },
  {
    serviceNo: '175',
    name: 'Clementi ⇄ Lorong 1 Geylang (via SMU)',
    direction: 1,
    origin: 'Clementi Interchange',
    destination: 'Lorong 1 Geylang Terminal',
    stops: ['17009', '11009', '09048', '08057', '04121', '01112', '81119'],
    color: '#059669',
  },
  {
    serviceNo: '857',
    name: 'Yishun ⟲ Suntec / Temasek Blvd (via SMU)',
    direction: 1,
    origin: 'Yishun Interchange',
    destination: 'Suntec City (Loop)',
    stops: ['59009', '01112', '04121', '02111', '03509', '59009'],
    color: '#2563EB',
  },
  {
    serviceNo: '51',
    name: 'Hougang ⇄ Jurong East',
    direction: 1,
    origin: 'Hougang Central Int',
    destination: 'Jurong East Int',
    stops: ['64009', '81119', '01112', '04121', '05013', '10041', '14141', '28009'],
    color: '#6366F1',
  },
  {
    serviceNo: '858',
    name: 'Woodlands ⟲ Changi Airport',
    direction: 1,
    origin: 'Woodlands Int',
    destination: 'Changi Airport (Loop)',
    stops: ['46009', '59009', '59049', '83139', '95029', '95109', '95209', '46009'],
    color: '#0284C7',
  },
  {
    serviceNo: '12',
    name: 'Pasir Ris ⇄ Kampong Bahru',
    direction: 1,
    origin: 'Pasir Ris Int',
    destination: 'Kampong Bahru Ter',
    stops: ['77009', '75009', '84009', '01112', '04121', '05039', '05059'],
    color: '#84CC16',
  },
];

/**
 * Searches bus stops with smart Singapore text normalization and relevance scoring.
 * Correctly matches:
 * - "Orchard Road" -> "Orchard Rd"
 * - "Victoria Street" -> "Victoria St"
 * - "Bras Basah Road" -> "Bras Basah Rd"
 * - "Clementi Road" -> "Clementi Rd"
 * - "Bukit Timah" -> "Bt Timah Rd"
 * - 5-digit bus stop codes like "83139", "09048"
 * - Landmark keywords like "Lucky Plaza", "Bugis", "Vivocity", "Changi Airport"
 */
export function searchBusStops(query: string): BusStop[] {
  const rawClean = query.trim();
  if (!rawClean) return [];

  const lowerRaw = rawClean.toLowerCase();
  const normalizedQuery = normalizeSingaporeText(rawClean);
  const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);

  // Exact 5-digit code match prioritised
  const exactCode = SINGAPORE_BUS_STOPS.find((s) => s.code.toLowerCase() === lowerRaw);
  if (exactCode) {
    const others = SINGAPORE_BUS_STOPS.filter(
      (s) => s.code !== exactCode.code && s.code.includes(lowerRaw)
    );
    return [exactCode, ...others.slice(0, 9)];
  }

  // Score each stop against user query
  interface ScoredStop {
    stop: BusStop;
    score: number;
  }

  const scored: ScoredStop[] = [];

  for (const stop of SINGAPORE_BUS_STOPS) {
    const normRoad = normalizeSingaporeText(stop.roadName);
    const normDesc = normalizeSingaporeText(stop.description);
    const lowerCode = stop.code.toLowerCase();

    let score = 0;

    // Direct code substring
    if (lowerCode.includes(lowerRaw)) {
      score += 100;
      if (lowerCode.startsWith(lowerRaw)) score += 50;
    }

    // Exact road name match (normalized)
    if (normRoad === normalizedQuery) {
      score += 150;
    } else if (normRoad.startsWith(normalizedQuery)) {
      score += 100;
    } else if (normRoad.includes(normalizedQuery)) {
      score += 70;
    }

    // Exact description match (normalized)
    if (normDesc.includes(normalizedQuery)) {
      score += 60;
    }

    // Multi-token match across roadName and description
    // e.g. query "orchard road lucky plaza" matches road "Orchard Rd" and desc "Lucky Plaza"
    if (queryTokens.length > 0) {
      const combined = `${normRoad} ${normDesc} ${lowerCode}`;
      const allTokensMatch = queryTokens.every((token) => combined.includes(token));
      if (allTokensMatch) {
        score += 80 + queryTokens.length * 10;
      } else {
        const matchingTokens = queryTokens.filter((token) => combined.includes(token));
        if (matchingTokens.length > 0) {
          score += matchingTokens.length * 20;
        }
      }
    }

    if (score > 0) {
      scored.push({ stop, score });
    }
  }

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, 12).map((item) => item.stop);
}

/**
 * Aggregates all unique roads in Singapore bus stop database matching query.
 * Useful for busrouter.sg style "Browse stops by Road Name".
 */
export function searchRoads(
  query: string
): { roadName: string; stopCount: number; stops: BusStop[] }[] {
  const normQuery = normalizeSingaporeText(query);
  if (!normQuery) return [];

  const roadMap: Record<string, BusStop[]> = {};

  for (const stop of SINGAPORE_BUS_STOPS) {
    const normRoad = normalizeSingaporeText(stop.roadName);
    if (normRoad.includes(normQuery)) {
      if (!roadMap[stop.roadName]) {
        roadMap[stop.roadName] = [];
      }
      roadMap[stop.roadName].push(stop);
    }
  }

  return Object.entries(roadMap).map(([roadName, stops]) => ({
    roadName,
    stopCount: stops.length,
    stops,
  }));
}

/**
 * Searches bus service routes by service number (e.g. "143", "65", "190").
 */
export function searchBusServices(query: string): BusRoute[] {
  const clean = query.trim().toLowerCase();
  if (!clean) return [];

  const direct = SINGAPORE_BUS_ROUTES.filter(
    (route) =>
      route.serviceNo.toLowerCase() === clean ||
      route.serviceNo.toLowerCase().startsWith(clean) ||
      route.name.toLowerCase().includes(clean)
  );

  // If exact query not in predefined routes, check POPULAR_BUS_SERVICES across stops
  if (direct.length === 0 || !direct.some((r) => r.serviceNo.toLowerCase() === clean)) {
    const servingStops = SINGAPORE_BUS_STOPS.filter((stop) => {
      const services = POPULAR_BUS_SERVICES[stop.code] || [];
      return services.some((s) => s.toLowerCase() === clean);
    });

    if (servingStops.length > 0) {
      const dynamicRoute: BusRoute = {
        serviceNo: query.trim().toUpperCase(),
        name: `Service ${query.trim().toUpperCase()} (${servingStops.length} stops)`,
        direction: 1,
        origin: servingStops[0].description,
        destination: servingStops[servingStops.length - 1].description,
        stops: servingStops.map((s) => s.code),
        color: '#10B981',
      };
      direct.push(dynamicRoute);
    }
  }

  return direct;
}

/**
 * Searches bus stops strictly by bus-stop code (e.g. "09048", "83139").
 */
export function searchBusStopsByCode(codeQuery: string): BusStop[] {
  const clean = codeQuery.trim().toLowerCase();
  if (!clean) return [];

  const matched = SINGAPORE_BUS_STOPS.filter((s) => s.code.toLowerCase().includes(clean));

  // Prioritize exact or prefix matches
  matched.sort((a, b) => {
    const aExact = a.code.toLowerCase() === clean ? 1 : 0;
    const bExact = b.code.toLowerCase() === clean ? 1 : 0;
    if (aExact !== bExact) return bExact - aExact;

    const aStarts = a.code.toLowerCase().startsWith(clean) ? 1 : 0;
    const bStarts = b.code.toLowerCase().startsWith(clean) ? 1 : 0;
    return bStarts - aStarts;
  });

  // If user entered a valid 5-digit number not in local database, synthesize it
  if (/^\d{5}$/.test(clean) && !matched.some((s) => s.code === clean)) {
    matched.unshift({
      code: clean,
      roadName: 'Singapore Transit Network',
      description: `Bus Stop ${clean}`,
      latitude: 1.3521,
      longitude: 103.8198,
    });
  }

  return matched.slice(0, 10);
}

/**
 * Looks up a bus stop by code. If unknown, synthesizes an entry so the app
 * can still attempt to query LTA API or demonstrate arrival times.
 */
export function getBusStopByCode(code: string): BusStop {
  const found = SINGAPORE_BUS_STOPS.find((s) => s.code === code);
  if (found) return found;

  const s10 = SERVICE_10_STOPS_MAP[code];
  if (s10) {
    return {
      code,
      roadName: s10.roadName,
      description: s10.description,
      latitude: s10.lat,
      longitude: s10.lng,
    };
  }

  return {
    code,
    roadName: 'Singapore Transit Network',
    description: `Bus Stop ${code}`,
    latitude: 1.3521, // Central Singapore coordinates fallback
    longitude: 103.8198,
  };
}
