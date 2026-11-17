/* Pure draw engine shared by the interactive study and its correctness checks. */
(() => {
  const MAX_POOL = 10000;
  function randomIndex(n, next = () => crypto.getRandomValues(new Uint32Array(1))[0]) {
    if (!Number.isSafeInteger(n) || n < 1 || n > 4294967296) throw Error('Invalid pool size.');
    const ceiling = Math.floor(4294967296 / n) * n;
    let value;
    do { value = next(); } while (value >= ceiling);
    return value % n;
  }
  function entries(text) {
    const values = text.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    if (values.some(s => s.length > 100)) throw Error('Keep each entry to 100 characters or fewer.');
    return [...new Set(values)];
  }
  function pool(config) {
    let values;
    if (config.type === 'numbers' && config.numberMode === 'digits') {
      if (typeof config.digits !== 'string' || !/^[0-9,\s]+$/.test(config.digits)) throw Error('Enter allowed digits, such as 1, 2, 3.');
      const digits = [...new Set(config.digits.replace(/[,\s]/g,''))];
      const length = config.length;
      if (!digits.length || !Number.isInteger(length) || length < 1 || length > 8) throw Error('Choose 1–8 digits in each result.');
      const first = config.allowLeadingZero ? digits : digits.filter(v => v !== '0');
      const size = first.length * digits.length ** (length-1);
      if (!size) throw Error('Allow a leading zero, or add another digit.');
      if (size > MAX_POOL) throw Error('That creates over 10,000 possibilities. Use fewer allowed digits or a shorter result.');
      values = [...first];
      for (let i=1;i<length;i++) values = values.flatMap(v => digits.map(d => v+d));
    } else if (config.type === 'numbers') {
      const {min,max} = config;
      if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max) || min > max) throw Error('Enter whole numbers with From no greater than To.');
      if (max - min + 1 > MAX_POOL) throw Error('Keep the range to 10,000 numbers or fewer.');
      values = Array.from({length:max-min+1},(_,i)=>String(min+i));
    } else {
      values = entries(config.text || '');
    }
    if (values.length > MAX_POOL) throw Error('Use up to 10,000 entries.');
    const omitted = new Set(entries(config.exclude || ''));
    values = values.filter(v => !omitted.has(v));
    if (!values.length) throw Error('Nothing to pick. Add a choice or remove an exclusion.');
    return values;
  }
  function draw(config, used = [], choose = randomIndex) {
    const count = config.count;
    if (!Number.isSafeInteger(count) || count < 1 || count > 10) throw Error('Choose between 1 and 10 picks.');
    const seen = new Set(used);
    const candidates = pool(config).filter(v => config.repeat || !seen.has(v));
    if (!candidates.length) throw Error('Everyone has had a turn. Start a new round when you’re ready.');
    if (!config.repeat && count > candidates.length) throw Error(`Only ${candidates.length} left. Pick fewer or start a new round.`);
    const result = [];
    for (let i=0;i<count;i++) {
      const index = choose(candidates.length);
      result.push(candidates[index]);
      if (!config.repeat) candidates.splice(index,1);
    }
    return {result,used:config.repeat ? [...used] : [...used,...result]};
  }
  function arrange(config, choose = randomIndex) {
    if (config.type !== 'names') throw Error('Add names before making an order or teams.');
    const values = [...pool(config)];
    const teams = config.drawMode === 'teams' ? config.teamCount : 1;
    if (!Number.isInteger(teams) || teams < 1 || teams > values.length || (config.drawMode === 'teams' && teams < 2)) throw Error('Choose at least two teams, with at least one person in each.');
    for (let i=values.length-1;i>0;i--) {
      const j=choose(i+1);[values[i],values[j]]=[values[j],values[i]];
    }
    const groups=Array.from({length:teams},()=>[]);
    values.forEach((value,i)=>groups[i%teams].push(value));
    return {values,groups};
  }
  globalThis.RandomEngine = {randomIndex,entries,pool,draw,arrange};
})();
