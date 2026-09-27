/*
 * Offline city list: name, country, latitude, longitude (east positive), IANA time zone.
 * The time zone is used with Intl to find the historical UTC offset for the birth date.
 */
(function (root) {
  'use strict';
  const RAW = `Nairobi|Kenya|-1.2864|36.8172|Africa/Nairobi
Mombasa|Kenya|-4.0435|39.6682|Africa/Nairobi
Kisumu|Kenya|-0.0917|34.7680|Africa/Nairobi
Nakuru|Kenya|-0.3031|36.0800|Africa/Nairobi
Eldoret|Kenya|0.5143|35.2698|Africa/Nairobi
Kampala|Uganda|0.3476|32.5825|Africa/Kampala
Dar es Salaam|Tanzania|-6.7924|39.2083|Africa/Dar_es_Salaam
Arusha|Tanzania|-3.3869|36.6830|Africa/Dar_es_Salaam
Kigali|Rwanda|-1.9441|30.0619|Africa/Kigali
Addis Ababa|Ethiopia|8.9806|38.7578|Africa/Addis_Ababa
Kinshasa|DR Congo|-4.4419|15.2663|Africa/Kinshasa
Lagos|Nigeria|6.5244|3.3792|Africa/Lagos
Abuja|Nigeria|9.0765|7.3986|Africa/Lagos
Accra|Ghana|5.6037|-0.1870|Africa/Accra
Dakar|Senegal|14.7167|-17.4677|Africa/Dakar
Cairo|Egypt|30.0444|31.2357|Africa/Cairo
Casablanca|Morocco|33.5731|-7.5898|Africa/Casablanca
Johannesburg|South Africa|-26.2041|28.0473|Africa/Johannesburg
Cape Town|South Africa|-33.9249|18.4241|Africa/Johannesburg
Harare|Zimbabwe|-17.8252|31.0335|Africa/Harare
Lusaka|Zambia|-15.3875|28.3228|Africa/Lusaka
Luanda|Angola|-8.8390|13.2894|Africa/Luanda
Berlin|Germany|52.5200|13.4050|Europe/Berlin
Hamburg|Germany|53.5511|9.9937|Europe/Berlin
Munich|Germany|48.1351|11.5820|Europe/Berlin
Cologne|Germany|50.9375|6.9603|Europe/Berlin
Frankfurt|Germany|50.1109|8.6821|Europe/Berlin
Stuttgart|Germany|48.7758|9.1829|Europe/Berlin
Düsseldorf|Germany|51.2277|6.7735|Europe/Berlin
Leipzig|Germany|51.3397|12.3731|Europe/Berlin
Dresden|Germany|51.0504|13.7373|Europe/Berlin
Hanover|Germany|52.3759|9.7320|Europe/Berlin
Nuremberg|Germany|49.4521|11.0767|Europe/Berlin
Bremen|Germany|53.0793|8.8017|Europe/Berlin
Essen|Germany|51.4556|7.0116|Europe/Berlin
Dortmund|Germany|51.5136|7.4653|Europe/Berlin
Vienna|Austria|48.2082|16.3738|Europe/Vienna
Zurich|Switzerland|47.3769|8.5417|Europe/Zurich
Amsterdam|Netherlands|52.3676|4.9041|Europe/Amsterdam
Brussels|Belgium|50.8503|4.3517|Europe/Brussels
Paris|France|48.8566|2.3522|Europe/Paris
Lyon|France|45.7640|4.8357|Europe/Paris
Marseille|France|43.2965|5.3698|Europe/Paris
London|United Kingdom|51.5074|-0.1278|Europe/London
Manchester|United Kingdom|53.4808|-2.2426|Europe/London
Birmingham|United Kingdom|52.4862|-1.8904|Europe/London
Edinburgh|United Kingdom|55.9533|-3.1883|Europe/London
Dublin|Ireland|53.3498|-6.2603|Europe/Dublin
Madrid|Spain|40.4168|-3.7038|Europe/Madrid
Barcelona|Spain|41.3874|2.1686|Europe/Madrid
Lisbon|Portugal|38.7223|-9.1393|Europe/Lisbon
Rome|Italy|41.9028|12.4964|Europe/Rome
Milan|Italy|45.4642|9.1900|Europe/Rome
Athens|Greece|37.9838|23.7275|Europe/Athens
Istanbul|Türkiye|41.0082|28.9784|Europe/Istanbul
Warsaw|Poland|52.2297|21.0122|Europe/Warsaw
Prague|Czechia|50.0755|14.4378|Europe/Prague
Budapest|Hungary|47.4979|19.0402|Europe/Budapest
Copenhagen|Denmark|55.6761|12.5683|Europe/Copenhagen
Stockholm|Sweden|59.3293|18.0686|Europe/Stockholm
Oslo|Norway|59.9139|10.7522|Europe/Oslo
Helsinki|Finland|60.1699|24.9384|Europe/Helsinki
Kyiv|Ukraine|50.4501|30.5234|Europe/Kyiv
Moscow|Russia|55.7558|37.6173|Europe/Moscow
Bucharest|Romania|44.4268|26.1025|Europe/Bucharest
New York|United States|40.7128|-74.0060|America/New_York
Washington|United States|38.9072|-77.0369|America/New_York
Boston|United States|42.3601|-71.0589|America/New_York
Atlanta|United States|33.7490|-84.3880|America/New_York
Miami|United States|25.7617|-80.1918|America/New_York
Chicago|United States|41.8781|-87.6298|America/Chicago
Houston|United States|29.7604|-95.3698|America/Chicago
Dallas|United States|32.7767|-96.7970|America/Chicago
Denver|United States|39.7392|-104.9903|America/Denver
Phoenix|United States|33.4484|-112.0740|America/Phoenix
Los Angeles|United States|34.0522|-118.2437|America/Los_Angeles
San Francisco|United States|37.7749|-122.4194|America/Los_Angeles
Seattle|United States|47.6062|-122.3321|America/Los_Angeles
Toronto|Canada|43.6532|-79.3832|America/Toronto
Montreal|Canada|45.5017|-73.5673|America/Toronto
Vancouver|Canada|49.2827|-123.1207|America/Vancouver
Mexico City|Mexico|19.4326|-99.1332|America/Mexico_City
Bogotá|Colombia|4.7110|-74.0721|America/Bogota
Lima|Peru|-12.0464|-77.0428|America/Lima
Santiago|Chile|-33.4489|-70.6693|America/Santiago
Buenos Aires|Argentina|-34.6037|-58.3816|America/Argentina/Buenos_Aires
São Paulo|Brazil|-23.5505|-46.6333|America/Sao_Paulo
Rio de Janeiro|Brazil|-22.9068|-43.1729|America/Sao_Paulo
Kingston|Jamaica|17.9712|-76.7936|America/Jamaica
Port of Spain|Trinidad and Tobago|10.6549|-61.5019|America/Port_of_Spain
Dubai|United Arab Emirates|25.2048|55.2708|Asia/Dubai
Riyadh|Saudi Arabia|24.7136|46.6753|Asia/Riyadh
Tehran|Iran|35.6892|51.3890|Asia/Tehran
Karachi|Pakistan|24.8607|67.0011|Asia/Karachi
Delhi|India|28.7041|77.1025|Asia/Kolkata
Mumbai|India|19.0760|72.8777|Asia/Kolkata
Bengaluru|India|12.9716|77.5946|Asia/Kolkata
Dhaka|Bangladesh|23.8103|90.4125|Asia/Dhaka
Bangkok|Thailand|13.7563|100.5018|Asia/Bangkok
Singapore|Singapore|1.3521|103.8198|Asia/Singapore
Jakarta|Indonesia|-6.2088|106.8456|Asia/Jakarta
Manila|Philippines|14.5995|120.9842|Asia/Manila
Hong Kong|China|22.3193|114.1694|Asia/Hong_Kong
Shanghai|China|31.2304|121.4737|Asia/Shanghai
Beijing|China|39.9042|116.4074|Asia/Shanghai
Seoul|South Korea|37.5665|126.9780|Asia/Seoul
Tokyo|Japan|35.6762|139.6503|Asia/Tokyo
Sydney|Australia|-33.8688|151.2093|Australia/Sydney
Melbourne|Australia|-37.8136|144.9631|Australia/Melbourne
Perth|Australia|-31.9505|115.8605|Australia/Perth
Auckland|New Zealand|-36.8485|174.7633|Pacific/Auckland`;

  const CITIES = RAW.split('\n').map(line => {
    const [name, country, lat, lon, tz] = line.split('|');
    return { name, country, lat: +lat, lon: +lon, tz };
  });

  // UTC offset (hours) that a time zone used at a given local date and time.
  function utcOffsetFor(tz, dateStr, timeStr) {
    try {
      const [y, mo, d] = dateStr.split('-').map(Number);
      const [h, mi] = (timeStr || '12:00').split(':').map(Number);
      // Guess the UTC instant, then correct by the zone's offset at that instant (two passes handle DST edges).
      let guess = Date.UTC(y, mo - 1, d, h, mi);
      let offset = 0;
      for (let k = 0; k < 2; k++) {
        const parts = new Intl.DateTimeFormat('en-US', {
          timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
        }).formatToParts(new Date(guess - offset * 3600e3));
        const get = t => +parts.find(p => p.type === t).value;
        const local = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'));
        offset = (local - (guess - offset * 3600e3)) / 3600e3;
      }
      return offset;
    } catch (e) {
      return null;
    }
  }

  function searchCities(q) {
    q = q.trim().toLowerCase();
    if (!q) return [];
    return CITIES.filter(c => c.name.toLowerCase().startsWith(q) || c.country.toLowerCase().startsWith(q) || c.name.toLowerCase().includes(q)).slice(0, 8);
  }

  // Worldwide search through the free Open-Meteo geocoding service (no key needed).
  // Returns [] on any failure, so the offline list keeps working without a connection.
  async function searchOnline(q, signal) {
    q = q.trim();
    if (q.length < 3 || typeof fetch !== 'function') return [];
    try {
      const url = 'https://geocoding-api.open-meteo.com/v1/search?count=8&language=en&format=json&name=' + encodeURIComponent(q);
      const res = await fetch(url, { signal });
      if (!res.ok) return [];
      const json = await res.json();
      return (json.results || []).filter(r => r.timezone).map(r => ({
        name: r.name, country: r.country || '', region: r.admin1 || '', lat: +r.latitude.toFixed(4), lon: +r.longitude.toFixed(4), tz: r.timezone, online: true
      }));
    } catch (e) {
      return [];
    }
  }

  root.ChartCities = { CITIES, utcOffsetFor, searchCities, searchOnline };
})(typeof window !== 'undefined' ? window : globalThis);
